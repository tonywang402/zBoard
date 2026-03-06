/**
 * @jest-environment node
 *
 * `needSitePassword` in middleware.ts is a module-level constant evaluated once
 * at require time. We therefore avoid a static top-level import and instead load
 * the middleware fresh in each describe block via `jest.resetModules()` +
 * `jest.doMock()` + `require()` in `beforeAll`.
 */

import { NextRequest } from 'next/server';

const makeRequest = (pathname: string, cookieValue?: string): NextRequest => {
  const req = new NextRequest(new URL(`http://localhost${pathname}`));
  if (cookieValue) req.cookies.set('site_password', cookieValue);
  return req;
};

// ---------------------------------------------------------------------------
// Suite 1 — password protection enabled
// ---------------------------------------------------------------------------
describe('middleware — password enabled', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mw: (req: NextRequest) => any;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock('../../config/site.config', () => ({
      siteConfig: { enableSitePassword: true, sitePassword: 'secret123' },
    }));
    mw = require('../middleware').middleware;
  });

  it('redirects unauthenticated page request to /login', () => {
    const res = mw(makeRequest('/dashboard'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('returns 401 JSON for unauthenticated /api/* request', () => {
    const res = mw(makeRequest('/api/build_status'));
    expect(res.status).toBe(401);
  });

  it('allows authenticated request through', () => {
    const res = mw(makeRequest('/dashboard', 'secret123'));
    expect(res.status).toBe(200);
  });

  it('redirects authenticated user away from /login to /', () => {
    const res = mw(makeRequest('/login', 'secret123'));
    expect(res.status).toBe(307);
    // NextResponse.redirect produces an absolute URL; assert the path ends with /
    expect(res.headers.get('location')).toMatch(/\/$/);
  });

  it('allows unauthenticated user to access /login page (200)', () => {
    const res = mw(makeRequest('/login'));
    expect(res.status).toBe(200);
  });

  it('treats a wrong cookie value as unauthenticated → redirect to /login', () => {
    const res = mw(makeRequest('/dashboard', 'wrong-password'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('returns 401 when wrong cookie is used on /api/* path', () => {
    const res = mw(makeRequest('/api/build_status', 'wrong-password'));
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — password protection disabled
// ---------------------------------------------------------------------------
describe('middleware — password disabled', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mw: (req: NextRequest) => any;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock('../../config/site.config', () => ({
      siteConfig: { enableSitePassword: false, sitePassword: '' },
    }));
    mw = require('../middleware').middleware;
  });

  it('allows any page request through without a cookie', () => {
    const res = mw(makeRequest('/dashboard'));
    expect(res.status).toBe(200);
  });

  it('redirects /login to home even without a cookie (no login page needed)', () => {
    // When !needSitePassword is true the /login branch immediately calls toHomePage()
    const res = mw(makeRequest('/login'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toMatch(/\/$/);
  });
});
