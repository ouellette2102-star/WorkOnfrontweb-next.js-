/**
 * Next.js client-side instrumentation. Runs once in the browser before
 * the app mounts. Next.js auto-discovers this file at src/ root.
 *
 * See https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import "../sentry.client.config";

export { captureRouterTransitionStart as onRouterTransitionStart } from "@sentry/nextjs";
