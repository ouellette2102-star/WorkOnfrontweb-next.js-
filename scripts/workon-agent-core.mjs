#!/usr/bin/env node

import { mkdir, appendFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const logsDir = path.join(rootDir, ".workon-agent", "logs");
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const logPath = path.join(logsDir, `${runId}.jsonl`);
const commandTimeoutMs = Number.parseInt(process.env.WORKON_AGENT_TIMEOUT_MS ?? "180000", 10);

const LIVE_ACTION_PATTERNS = [
  /\bdeploy\b/i,
  /\bproduction\b/i,
  /\bprod\b/i,
  /\blive\b/i,
  /\bmessage(s|r|d)?\b/i,
  /\bemail(s|ed|ing)?\b/i,
  /\bsms\b/i,
  /\bad(s|vert|vertising)?\b/i,
  /\bcampaign\b/i,
  /\bpayment(s)?\b/i,
  /\bcharge(s|d)?\b/i,
  /\bstripe\b/i,
  /\brefund(s|ed)?\b/i,
  /\bseed(:|s)?prod\b/i,
  /\bmigrate(:|s)?prod\b/i,
];

const ROLES = {
  master: {
    summary: "Local orchestration agent for repo health checks.",
    commands: ["typecheck"],
  },
  frontend: {
    summary: "Local frontend validation agent.",
    commands: ["typecheck"],
  },
  backend: {
    summary: "Local backend validation agent.",
    commands: ["typecheck"],
  },
  product: {
    summary: "Local product smoke validation agent.",
    commands: ["typecheck"],
  },
  growth: {
    summary: "Local growth-surface validation agent. No ads, campaigns, or outbound messages.",
    commands: ["typecheck", "lint"],
  },
  "openclaw-lite": {
    summary: "Local lightweight code-quality agent.",
    commands: ["typecheck", "test"],
    extraArgs: {
      test: ["--run"],
    },
  },
  "hermes-dispatcher": {
    summary: "Local-only router. Dispatches to a named safe role; never sends messages.",
    commands: [],
    routerOnly: true,
  },
};

function usage() {
  return [
    "WorkOn Agent Core",
    "",
    "Usage:",
    "  node scripts/workon-agent-core.mjs list",
    "  node scripts/workon-agent-core.mjs run <role>",
    "  node scripts/workon-agent-core.mjs dispatch <role>",
    "",
    "Safe roles:",
    ...Object.entries(ROLES).map(([name, role]) => `  ${name.padEnd(18)} ${role.summary}`),
    "",
    "This CLI only runs existing local npm validation scripts and refuses live actions.",
  ].join("\n");
}

async function logEvent(event) {
  await mkdir(logsDir, { recursive: true });
  await appendFile(logPath, `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`);
}

function assertSafeIntent(args) {
  const joined = args.join(" ");
  const match = LIVE_ACTION_PATTERNS.find((pattern) => pattern.test(joined));
  if (match) {
    throw new Error(`Refusing live or external-effect action: matched ${match}`);
  }
}

function npmInvocation(scriptName, args) {
  const npmArgs = ["run", scriptName, ...(args.length ? ["--", ...args] : [])];
  if (process.platform !== "win32") {
    return { command: "npm", args: npmArgs };
  }

  return {
    command: process.env.ComSpec ?? "cmd.exe",
    args: ["/d", "/s", "/c", ["npm", ...npmArgs].join(" ")],
  };
}

async function runNpmScript(scriptName, args = []) {
  await logEvent({ type: "command:start", scriptName, args });
  console.log(`\n> npm run ${scriptName}${args.length ? ` -- ${args.join(" ")}` : ""}`);

  const invocation = npmInvocation(scriptName, args);
  const child = spawn(invocation.command, invocation.args, {
    cwd: rootDir,
    env: {
      ...process.env,
      CI: process.env.CI ?? "true",
      NEXT_TELEMETRY_DISABLED: "1",
      SENTRY_TELEMETRY_DISABLED: "1",
      WORKON_AGENT_CORE: "1",
      WORKON_AGENT_LIVE_ACTIONS: "disabled",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    stopProcessTree(child.pid);
  }, commandTimeoutMs);

  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  clearTimeout(timeout);

  await logEvent({ type: "command:finish", scriptName, args, exitCode, timedOut });
  if (timedOut) {
    throw new Error(`npm run ${scriptName} timed out after ${commandTimeoutMs}ms`);
  }
  if (exitCode !== 0) {
    throw new Error(`npm run ${scriptName} exited with ${exitCode}`);
  }
}

function stopProcessTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // The process may already have exited.
  }
}

async function listRoles() {
  console.log(usage());
  await logEvent({ type: "list", roles: Object.keys(ROLES) });
}

async function runRole(roleName) {
  const role = ROLES[roleName];
  if (!role) {
    throw new Error(`Unknown role "${roleName}". Run "npm run agent:list" to see safe roles.`);
  }

  if (role.routerOnly) {
    console.log(`${roleName} is local-router only. Use "dispatch <role>" with a concrete role.`);
    await logEvent({ type: "router-only", roleName });
    return;
  }

  await logEvent({
    type: "role:start",
    roleName,
    summary: role.summary,
    commands: role.commands,
  });

  console.log(`WorkOn Agent Core role: ${roleName}`);
  console.log(role.summary);
  console.log(`Log: ${logPath}`);
  console.log("Live actions: refused");

  for (const command of role.commands) {
    await runNpmScript(command, role.extraArgs?.[command] ?? []);
  }

  await logEvent({ type: "role:finish", roleName, status: "ok" });
  console.log(`\n${roleName} finished local validation.`);
}

async function main() {
  const [action = "list", roleName, ...rest] = process.argv.slice(2);
  assertSafeIntent(process.argv.slice(2));
  await mkdir(logsDir, { recursive: true });
  await writeFile(logPath, "", { flag: "wx" }).catch(() => undefined);

  if (rest.length > 0) {
    throw new Error(`Unexpected extra arguments: ${rest.join(" ")}`);
  }

  if (action === "list") {
    await listRoles();
    return;
  }

  if (action === "run") {
    if (!roleName) throw new Error("Missing role name.");
    await runRole(roleName);
    return;
  }

  if (action === "dispatch") {
    if (!roleName) throw new Error("Missing role name.");
    if (roleName === "hermes-dispatcher") {
      await runRole(roleName);
      return;
    }
    await logEvent({ type: "dispatch", from: "hermes-dispatcher", to: roleName });
    await runRole(roleName);
    return;
  }

  throw new Error(`Unknown action "${action}".\n\n${usage()}`);
}

main().catch(async (error) => {
  await logEvent({ type: "error", message: error.message }).catch(() => undefined);
  console.error(`\nWorkOn Agent Core refused or failed: ${error.message}`);
  process.exitCode = 1;
});
