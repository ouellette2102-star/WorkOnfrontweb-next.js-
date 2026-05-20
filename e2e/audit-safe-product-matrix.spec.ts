import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "https://workonapp.vercel.app";
const API_BASE =
  process.env.API_BASE ??
  "https://workon-backend-production-8908.up.railway.app/api/v1";
const PASSWORD = "Test1234!";

test.setTimeout(180_000);

type AuditRole = "worker" | "employer" | "residential_client" | "admin";

interface AuditUser {
  id: string;
  email: string;
  password: string;
  token: string;
  refreshToken?: string;
  role: AuditRole;
}

interface MissionRecord {
  id: string;
  title: string;
  category?: string;
  status: string;
  createdByUserId: string;
  assignedToUserId: string | null;
}

type ThreadResponse =
  | Array<{ content?: string; senderId?: string }>
  | { messages?: Array<{ content?: string; senderId?: string }> };

const createdUsers: AuditUser[] = [];

function bearer(user: AuditUser) {
  return { Authorization: `Bearer ${user.token}` };
}

function auditEmail(label: string) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `audit-e2e-${label}-${suffix}@workon.test`;
}

async function registerAuditUser(page: Page, role: AuditRole, label: string): Promise<AuditUser> {
  const email = auditEmail(label);
  const response = await page.request.post(`${API_BASE}/auth/register`, {
    data: {
      email,
      password: PASSWORD,
      firstName: `Audit${label}`,
      lastName: "E2E",
      role,
      city: "Montreal",
      acceptTerms: true,
    },
  });

  expect(response.status(), `register ${label}`).toBeLessThan(300);
  const body = await response.json();
  const user: AuditUser = {
    id: body.user.id,
    email,
    password: PASSWORD,
    token: body.accessToken,
    refreshToken: body.refreshToken,
    role,
  };

  createdUsers.push(user);

  const consent = await page.request.get(`${API_BASE}/compliance/status`, {
    headers: bearer(user),
  });
  expect(consent.ok(), `consent status ${label}`).toBe(true);
  expect((await consent.json()).isComplete).toBe(true);

  return user;
}

async function loginBrowser(page: Page, user: AuditUser, mode: "client" | "pro") {
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.removeItem("workon_access_token");
    localStorage.removeItem("workon_refresh_token");
    localStorage.removeItem("workon_user");
  });
  const cookieAccept = page.getByRole("button", { name: /Accepter/i });
  await cookieAccept.first().click({ timeout: 5_000 }).catch(() => undefined);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Mot de passe").fill(user.password);
  await page.getByRole("button", { name: /Se connecter/i }).click();
  await page.waitForURL(/\/home/, { timeout: 30_000 });

  await page.evaluate(
    ({ nextMode }) => {
      localStorage.setItem("workon_mode", nextMode);
      localStorage.setItem("cookie-consent", "accepted");
    },
    {
      nextMode: mode,
    },
  );
}

async function apiGet<T>(request: APIRequestContext, path: string, user: AuditUser): Promise<T> {
  const response = await request.get(`${API_BASE}${path}`, { headers: bearer(user) });
  expect(response.ok(), `GET ${path}`).toBe(true);
  return response.json() as Promise<T>;
}

async function apiPost<T>(
  request: APIRequestContext,
  path: string,
  user: AuditUser,
  data?: unknown,
): Promise<T> {
  const response = await request.post(`${API_BASE}${path}`, {
    headers: bearer(user),
    data,
  });
  expect(response.ok(), `POST ${path}`).toBe(true);
  return response.json() as Promise<T>;
}

async function cleanupUsers(request: APIRequestContext) {
  for (const user of [...createdUsers].reverse()) {
    await request
      .delete(`${API_BASE}/auth/account`, {
        headers: bearer(user),
        data: { confirm: "DELETE" },
      })
      .catch(() => undefined);
  }
}

async function bridgeBackendCorsWhenNeeded(page: Page, request: APIRequestContext) {
  const frontendHost = new URL(BASE_URL).hostname;
  const shouldBridge =
    process.env.BRIDGE_BACKEND_CORS === "true" ||
    frontendHost === "127.0.0.1" ||
    frontendHost === "localhost";

  if (!shouldBridge) return;

  const frontendOrigin = new URL(BASE_URL).origin;
  const corsHeaders = {
    "access-control-allow-origin": frontendOrigin,
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  };

  await page.route(`${API_BASE.replace(/\/$/, "")}/**`, async (route) => {
    const proxiedRequest = route.request();

    if (proxiedRequest.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          ...corsHeaders,
          "access-control-allow-headers":
            proxiedRequest.headers()["access-control-request-headers"] ??
            "authorization,content-type",
        },
      });
      return;
    }

    const headers = { ...proxiedRequest.headers() };
    delete headers.host;
    delete headers.origin;
    delete headers["content-length"];

    try {
      const response = await request.fetch(proxiedRequest.url(), {
        method: proxiedRequest.method(),
        headers,
        data: proxiedRequest.postDataBuffer() ?? undefined,
        failOnStatusCode: false,
      });

      await route.fulfill({
        status: response.status(),
        headers: {
          ...response.headers(),
          ...corsHeaders,
        },
        body: await response.body(),
      });
    } catch {
      await route.abort("failed").catch(() => undefined);
    }
  });
}

test.describe.serial("audit-safe product matrix", () => {
  test.afterAll(async ({ request }) => {
    await cleanupUsers(request);
  });

  test("audit core: client mission -> worker start -> chat round-trip", async ({ page, request }) => {
    await bridgeBackendCorsWhenNeeded(page, request);

    const client = await registerAuditUser(page, "residential_client", "client");
    const worker = await registerAuditUser(page, "worker", "worker");
    const title = `Audit mission ${Date.now()}`;
    const message = "merci svp";

    await loginBrowser(page, client, "client");
    await page.goto(`${BASE_URL}/missions/new`, { waitUntil: "domcontentloaded" });

    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toBeVisible({ timeout: 15_000 });
    await titleInput.fill(title);
    await page.locator('textarea[name="description"]').fill(
      "Audit-safe mission created by Playwright to prove the release matrix.",
    );

    const form = page.locator("form").first();
    const categoryInput = form.locator('input[name="category"]').first();
    if (await categoryInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await categoryInput.fill("Autre");
    } else {
      const categoryButton = form.locator('button[type="button"]').first();
      await expect(categoryButton).toBeVisible({ timeout: 10_000 });
      await categoryButton.click();
    }

    await page.locator('input[name="price"]').fill("72");
    await page.locator('input[name="city"]').fill("Montreal");
    await page.locator('input[name="address"]').fill("123 Audit Street");

    const createMissionResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/missions-local") &&
        response.request().method() === "POST",
      { timeout: 30_000 },
    );
    await page.getByRole("button", { name: /Publier la mission/i }).click();
    const createdMission = await createMissionResponse;
    expect(createdMission.ok(), "POST /missions-local from UI").toBe(true);
    expect(createdMission.request().postDataJSON()).toMatchObject({
      category: "cleaning",
    });
    const mission = (await createdMission.json()) as MissionRecord;
    expect(mission.title).toBe(title);
    expect(mission.category).toBe("cleaning");
    expect(mission.createdByUserId).toBe(client.id);

    const missionAfterCreate = await apiGet<MissionRecord>(
      request,
      `/missions-local/${mission.id}`,
      client,
    );
    expect(missionAfterCreate.status).toBe("open");
    expect(missionAfterCreate.category).toBe("cleaning");
    await page.waitForURL(new RegExp(`/missions/${mission.id}`), { timeout: 20_000 });
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });

    const accepted = await apiPost<MissionRecord>(
      request,
      `/missions-local/${mission.id}/accept`,
      worker,
    );
    expect(accepted.status).toBe("assigned");
    expect(accepted.assignedToUserId).toBe(worker.id);

    await loginBrowser(page, worker, "pro");
    await page.goto(`${BASE_URL}/missions/${mission.id}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });

    const startMissionResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/v1/missions-local/${mission.id}/start`) &&
        response.request().method() === "POST",
      { timeout: 20_000 },
    );
    await page.getByRole("button", { name: /Demarrer|D.marrer/i }).click();
    const startedMission = await startMissionResponse;
    expect(startedMission.ok(), "POST /missions-local/:id/start from UI").toBe(true);
    const missionAfterStart = await apiGet<MissionRecord>(
      request,
      `/missions-local/${mission.id}`,
      worker,
    );
    expect(missionAfterStart.status).toBe("in_progress");

    await page.goto(`${BASE_URL}/messages/${mission.id}`, { waitUntil: "domcontentloaded" });
    const composer = page.getByRole("textbox", { name: /message/i });
    await expect(composer).toBeVisible({ timeout: 10_000 });
    await composer.fill(message);

    const sendMessageResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/messages-local") &&
        response.request().method() === "POST",
      { timeout: 20_000 },
    );
    await page.getByRole("button", { name: /Envoyer le message/i }).click();
    const sentMessage = await sendMessageResponse;
    expect(sentMessage.ok(), "POST /messages-local from UI").toBe(true);
    const sentMessageBody = (await sentMessage.json()) as {
      content: string;
      missionId: string;
      senderId: string;
    };
    expect(sentMessageBody.content).toBe(message);
    expect(sentMessageBody.missionId).toBe(mission.id);
    expect(sentMessageBody.senderId).toBe(worker.id);

    await expect
      .poll(async () => {
        const thread = await apiGet<ThreadResponse>(
          request,
          `/messages-local/thread/${mission.id}`,
          worker,
        );
        const threadMessages = Array.isArray(thread) ? thread : (thread.messages ?? []);
        return threadMessages.some((item) => item.content === message);
      }, { timeout: 10_000 })
      .toBe(true);
    await expect(page.getByText(message)).toBeVisible({ timeout: 10_000 });

    await loginBrowser(page, client, "client");
    await page.goto(`${BASE_URL}/messages/${mission.id}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(message)).toBeVisible({ timeout: 10_000 });
  });
});
