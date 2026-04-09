/**
 * Next.js instrumentation hook. Runs once on server startup (and once
 * on the edge runtime when edge routes execute). Wires Sentry into
 * the Node and Edge runtimes. The browser side is wired separately in
 * `instrumentation-client.ts`.
 *
 * See https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
