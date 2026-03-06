---
name: "Middleware Tests"
description: "Middleware test boilerplate and test case guide for zBoard auth gate branches."
applyTo: "**/tests/**"
---

# Middleware Tests

## Purpose

These tests verify all six decision branches in `src/middleware.ts` — the auth gate that runs before every request. The branches to cover are: password disabled, unauthenticated page request, unauthenticated API request, authenticated page request, authenticated user visiting `/login`, and unauthenticated user visiting `/login`.

---

## Boilerplate

**`src/__tests__/middleware.test.ts`**

```ts
import { middleware } from '../middleware';
import { NextRequest } from 'next/server';

jest.mock('../../config/site.config', () => ({
  siteConfig: { enableSitePassword: true, sitePassword: 'secret123' },
}));

const makeRequest = (pathname: string, cookieValue?: string): NextRequest => {
  const req = new NextRequest(new URL(`http://localhost${pathname}`));
  if (cookieValue) req.cookies.set('site_password', cookieValue);
  return req;
};

describe('middleware', () => {
  it('allows through when sitePassword is disabled', () => {
    jest.resetModules();
    jest.mock('../../config/site.config', () => ({
      siteConfig: { enableSitePassword: false, sitePassword: '' },
    }));
    const res = middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(200);
  });

  it('redirects unauthenticated request to /login', () => {
    const res = middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('returns 401 for unauthenticated /api/* requests', () => {
    const res = middleware(makeRequest('/api/build_status'));
    expect(res.status).toBe(401);
  });

  it('allows authenticated request through', () => {
    const res = middleware(makeRequest('/dashboard', 'secret123'));
    expect(res.status).toBe(200);
  });

  it('redirects authenticated user away from /login to /', () => {
    const res = middleware(makeRequest('/login', 'secret123'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/');
  });

  it('allows unauthenticated user to access /login page', () => {
    const res = middleware(makeRequest('/login'));
    expect(res.status).toBe(200);
  });
});
```

---

## Test Case Guide

**`middleware` — middleware.ts**
- [ ] `enableSitePassword=false` (or `sitePassword` unset) → all requests pass through regardless of cookie
- [ ] No cookie, path is non-API (e.g. `/dashboard`) → 307 redirect to `/login`
- [ ] No cookie, path starts with `/api/` → 401 JSON response `{ success: false, message: 'authentication failed' }`
- [ ] Cookie value matches `siteConfig.sitePassword`, any non-login path → 200 pass through
- [ ] Cookie value matches, path is `/login` → 307 redirect to `/`
- [ ] No cookie, path is `/login` → 200 pass through (render login page)
- [ ] Cookie value is wrong/mismatched → treated as unauthenticated (redirect or 401 depending on path)
