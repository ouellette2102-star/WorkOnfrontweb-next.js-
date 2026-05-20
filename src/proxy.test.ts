// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  CANONICAL_WORKON_HOST,
  getCanonicalWorkOnUrl,
  shouldRedirectToCanonicalHost,
} from "./proxy";

describe("getCanonicalWorkOnUrl", () => {
  it("allows the canonical production hostname", () => {
    expect(
      getCanonicalWorkOnUrl(
        new URL("https://workonapp.vercel.app/home"),
        "production",
      ),
    ).toBeNull();
  });

  it("redirects the git-main branch alias to canonical production", () => {
    const url = getCanonicalWorkOnUrl(
      new URL(
        "https://workonapp-git-main-mathieu-ouellettes-projects.vercel.app/home?tab=matches",
      ),
      "production",
    );

    expect(url?.toString()).toBe(
      "https://workonapp.vercel.app/home?tab=matches",
    );
  });

  it("redirects unique Vercel deployment hostnames and preserves path/query", () => {
    const url = getCanonicalWorkOnUrl(
      new URL(
        "https://workonapp-qy5iea480-mathieu-ouellettes-projects.vercel.app/matches?created=1",
      ),
      "production",
    );

    expect(url?.hostname).toBe(CANONICAL_WORKON_HOST);
    expect(url?.pathname).toBe("/matches");
    expect(url?.search).toBe("?created=1");
  });

  it("does not redirect localhost or unrelated Vercel apps", () => {
    expect(
      getCanonicalWorkOnUrl(
        new URL("http://localhost:3000/home"),
        "production",
      ),
    ).toBeNull();
    expect(
      getCanonicalWorkOnUrl(
        new URL("https://other-app.vercel.app/home"),
        "production",
      ),
    ).toBeNull();
  });

  it("does not redirect Vercel preview aliases", () => {
    expect(
      getCanonicalWorkOnUrl(
        new URL(
          "https://workonapp-git-codex-pr1-cons-bae8f7-mathieu-ouellettes-projects.vercel.app/register",
        ),
        "preview",
      ),
    ).toBeNull();
  });
});

describe("shouldRedirectToCanonicalHost", () => {
  it("redirects only in Vercel production", () => {
    expect(shouldRedirectToCanonicalHost("production")).toBe(true);
    expect(shouldRedirectToCanonicalHost("preview")).toBe(false);
    expect(shouldRedirectToCanonicalHost("development")).toBe(false);
    expect(shouldRedirectToCanonicalHost(undefined)).toBe(false);
  });
});
