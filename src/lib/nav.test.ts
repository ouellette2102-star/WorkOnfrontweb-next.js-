// @vitest-environment node
/**
 * Route-exists guard for the centralized navigation contract.
 *
 * Walks src/app/** and asserts every href in `ALL_NAV_ITEMS` resolves
 * to a real Next.js page file. Catches the bug class where someone
 * adds a hamburger entry pointing at /foo without ever creating
 * src/app/foo/page.tsx — exactly the kind of orphan-link drift the
 * Phase 0 audit catalogued under pattern E.
 *
 * Resolution rules mirror the App Router:
 *   /a/b   → src/app/(<group>)?/a/b/page.tsx (groups are transparent)
 *   /a/[x] → src/app/(<group>)?/a/[x]/page.tsx — but the contract only
 *            ships static hrefs, so dynamic segments aren't expected here.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { ALL_NAV_ITEMS } from "./nav";

const APP_ROOT = resolve(__dirname, "../app");

/** Recursively list all page.tsx routes, normalizing route-group `(name)` away. */
function listRoutes(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) {
      // Route groups `(group)` are transparent in App Router URLs.
      const segment = entry.startsWith("(") && entry.endsWith(")")
        ? ""
        : `/${entry}`;
      out.push(...listRoutes(abs, prefix + segment));
    } else if (entry === "page.tsx" || entry === "page.ts") {
      out.push(prefix || "/");
    }
  }
  return out;
}

const FOUND_ROUTES = new Set(listRoutes(APP_ROOT));

function routeExists(href: string): boolean {
  // Static href = direct lookup.
  if (FOUND_ROUTES.has(href)) return true;
  // Some pages live behind a [param] — match by replacing the dynamic
  // segment in the catalogue. The contract today only ships static
  // hrefs, so this branch is a safety net.
  const dynamicMatch = Array.from(FOUND_ROUTES).find((r) => {
    const a = href.split("/").filter(Boolean);
    const b = r.split("/").filter(Boolean);
    if (a.length !== b.length) return false;
    return a.every((seg, i) => b[i] === seg || b[i].startsWith("["));
  });
  return Boolean(dynamicMatch);
}

describe("nav contract — every NAV_ITEM has a page", () => {
  for (const item of ALL_NAV_ITEMS) {
    it(`${item.id} → ${item.href} exists`, () => {
      expect(
        routeExists(item.href),
        `Nav item "${item.id}" points at ${item.href} but no page.tsx was found in src/app/. Either create the route or remove the nav entry.`,
      ).toBe(true);
    });
  }
});

describe("nav contract — sanity checks", () => {
  it("every item has a non-empty label and intent", () => {
    for (const item of ALL_NAV_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.intent.length).toBeGreaterThan(0);
    }
  });

  it("ids are unique across the contract", () => {
    const ids = ALL_NAV_ITEMS.map((i) => i.id);
    const dedup = new Set(ids);
    expect(dedup.size, `duplicate id(s): ${ids.join(", ")}`).toBe(ids.length);
  });
});
