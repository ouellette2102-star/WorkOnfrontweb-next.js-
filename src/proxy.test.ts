// @vitest-environment node

import { describe, expect, it } from "vitest";
import { CANONICAL_WORKON_HOST, getCanonicalWorkOnUrl } from "./proxy";

describe("getCanonicalWorkOnUrl", () => {
  it("allows the canonical production hostname", () => {
    expect(
      getCanonicalWorkOnUrl(new URL("https://workonapp.vercel.app/home")),
    ).toBeNull();
  });

  it("redirects the git-main branch alias to canonical production", () => {
    const url = getCanonicalWorkOnUrl(
      new URL(
        "https://workonapp-git-main-mathieu-ouellettes-projects.vercel.app/home?tab=matches",
      ),
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
    );

    expect(url?.hostname).toBe(CANONICAL_WORKON_HOST);
    expect(url?.pathname).toBe("/matches");
    expect(url?.search).toBe("?created=1");
  });

  it("does not redirect localhost or unrelated Vercel apps", () => {
    expect(
      getCanonicalWorkOnUrl(new URL("http://localhost:3000/home")),
    ).toBeNull();
    expect(
      getCanonicalWorkOnUrl(new URL("https://other-app.vercel.app/home")),
    ).toBeNull();
  });
});
