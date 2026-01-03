# Security Policy — WorkOn Frontend

## Current Security Status

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | 0 | ✅ Clear |
| 🟠 HIGH | 1 | ⚠️ Accepted (see below) |
| 🟡 MODERATE | 6 | ⚠️ Accepted (devDeps) |

**Last audit**: PR-09 (January 2026)  
**Build status**: PASSING  

---

## Accepted Vulnerabilities (Non-Blocking)

### 1. `qs` — HIGH (GHSA-6rw7-vpxm-498p)

**Issue**: arrayLimit bypass allows DoS via memory exhaustion  
**Impact**: LOW — Requires malicious crafted input  
**Why not fixed**:  
- Peer dependency conflict with `next-intl@3.x`
- `next-intl` does not yet support Next.js 16.x
- Forcing update would break the build

**Mitigation**:
- Input validation at API boundaries
- Rate limiting on backend
- Monitor for `next-intl@4.x` release

**Resolution ETA**: When `next-intl` supports Next.js 16.x

---

### 2. `esbuild` — MODERATE (GHSA-67mh-4wv8-2f99)

**Issue**: Dev server can be accessed by any website  
**Impact**: NONE in production — Development dependency only  
**Why not fixed**:
- Requires `vitest@4.x` (breaking change)
- Only affects local development

**Mitigation**:
- Do not expose dev server to public networks
- Use `--host 127.0.0.1` for local dev

---

### 3. `vite` / `vite-node` / `@vitest/mocker` — MODERATE

**Issue**: Depends on vulnerable `esbuild`  
**Impact**: NONE in production — Development dependencies only  
**Why not fixed**: Same as esbuild (vitest upgrade required)

---

### 4. `js-yaml` — MODERATE (GHSA-mh29-5h37-fv8m)

**Issue**: Prototype pollution in merge (`<<`)  
**Impact**: LOW — Requires YAML parsing of untrusted input  
**Why not fixed**: Indirect dependency, peer-dep conflict

**Mitigation**:
- Do not parse untrusted YAML files
- Input validation for any user-provided config

---

## Security Scripts

```bash
# Check for CRITICAL vulnerabilities only (CI gate)
npm run audit:critical

# Check production dependencies only
npm run audit:prod

# Full audit report
npm audit
```

---

## CI Integration

The following check is recommended in CI:

```yaml
- name: Security Audit (Critical)
  run: npm audit --audit-level=critical
```

This ensures **0 CRITICAL** before any merge to `main`.

---

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it to:
- Email: security@workon.app (placeholder)
- Do NOT open a public issue

---

## Changelog

| Date | PR | Changes |
|------|-----|---------|
| 2026-01 | PR-09 | Fixed Next.js RCE (CRITICAL → 0) |
| 2026-01 | PR-10 | Documented remaining vulnerabilities |

