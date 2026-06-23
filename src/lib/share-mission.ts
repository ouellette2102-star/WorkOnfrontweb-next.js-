/**
 * Share a mission — native share sheet on mobile (Web Share API), with a
 * copy-link fallback on desktop. Ported in spirit from the legacy Flutter
 * app's `pr-f12-share-mission`.
 */

export function buildMissionShareUrl(id: string): string {
  const base =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "https://workonapp.vercel.app";
  return `${base}/missions/${id}`;
}

export type ShareResult = "shared" | "copied" | "failed";

/**
 * Try the native share sheet first; fall back to copying the link to the
 * clipboard. Returns what happened so the caller can show the right toast.
 * A user-cancelled share sheet counts as "shared" (no error, no fallback).
 */
export async function shareMission(input: {
  id: string;
  title?: string;
}): Promise<ShareResult> {
  const url = buildMissionShareUrl(input.id);
  const title = input.title ? `WorkOn — ${input.title}` : "WorkOn — Mission";

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text: title, url });
      return "shared";
    } catch (err) {
      // Share sheet dismissed by the user — treat as done, don't fall back.
      if (err instanceof DOMException && err.name === "AbortError") {
        return "shared";
      }
      // Any other failure -> try the clipboard fallback below.
    }
  }

  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText
    ) {
      await navigator.clipboard.writeText(url);
      return "copied";
    }
  } catch {
    /* fall through to "failed" */
  }

  return "failed";
}
