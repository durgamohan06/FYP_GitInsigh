// Run with: node --test tests/oauth.test.cjs
const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
// Exercise the compiled backend without a live GitHub connection (Node 22.12+).

process.env.GITHUB_CLIENT_ID = "";
process.env.GITHUB_CLIENT_SECRET = "";
process.env.GITHUB_CALLBACK_URL = "";
const {
  handleGitHubLogin,
  handleGitHubCallback,
  nodeAuthRouter,
} = require("../backend/dist/services/github-oauth.js");
const originalFetch = global.fetch;
const base = "http://localhost:8080";
const loginRequest = () => new Request(`${base}/api/auth/github`);
function configure() {
  process.env.GITHUB_CLIENT_ID = "test-client";
  process.env.GITHUB_CLIENT_SECRET = "test-secret";
}
function callbackRequest(params = "code=test-code", cookie = "github_oauth_state=test-state") {
  return new Request(`${base}/api/auth/github/callback?state=test-state&${params}`, {
    headers: { Cookie: cookie },
  });
}
async function expectHelp(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers.get("Content-Type"), /text\/html/);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const html = await response.text();
  assert.match(html, /Return home/);
  assert.match(html, /href="\/#preview"/);
  assert.doesNotMatch(html, /test-secret/);
  return html;
}
beforeEach(() => {
  process.env.GITHUB_CLIENT_ID = "";
  process.env.GITHUB_CLIENT_SECRET = "";
  process.env.GITHUB_CALLBACK_URL = "";
  global.fetch = async () => {
    throw new Error("Unexpected network call");
  };
});
afterEach(() => {
  global.fetch = originalFetch;
});
test("missing credentials: login and callback both explain setup", async () => {
  for (const response of [
    handleGitHubLogin(loginRequest()),
    await handleGitHubCallback(callbackRequest()),
    await handleGitHubCallback(new Request(`${base}/api/auth/github/callback`)),
  ]) {
    const html = await expectHelp(response, 503);
    assert.match(html, /\.env.example/);
    assert.match(html, /GITHUB_CLIENT_SECRET/);
  }
});
test("missing secret blocks login before redirecting", async () => {
  process.env.GITHUB_CLIENT_ID = "test-client";
  await expectHelp(handleGitHubLogin(loginRequest()), 503);
});
test("template and whitespace credentials are not configuration", async () => {
  configure();
  for (const value of ["your_github_oauth_client_secret_here", "   "]) {
    process.env.GITHUB_CLIENT_SECRET = value;
    await expectHelp(handleGitHubLogin(loginRequest()), 503);
  }
});
test("malformed and mismatched callback configuration is handled", async () => {
  configure();
  for (const value of [
    "http://[",
    "https://other.example/api/auth/github/callback",
    "javascript:alert(1)",
  ]) {
    process.env.GITHUB_CALLBACK_URL = value;
    await expectHelp(handleGitHubLogin(loginRequest()), 503);
  }
});
test("login uses unique cryptographic state and never exposes secret", () => {
  configure();
  const response = handleGitHubLogin(loginRequest());
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("Location"));
  const state = location.searchParams.get("state");
  assert.match(state, /^[a-f0-9]{64}$/);
  assert.equal(location.searchParams.get("client_id"), "test-client");
  assert.equal(location.searchParams.get("client_secret"), null);
  assert.match(response.headers.get("Set-Cookie"), /HttpOnly; SameSite=Lax; Max-Age=600/);
  assert.notEqual(
    state,
    new URL(handleGitHubLogin(loginRequest()).headers.get("Location")).searchParams.get("state"),
  );
});
test("absent, mismatched, malformed state cookies cannot exchange a code", async () => {
  configure();
  for (const cookie of ["", "github_oauth_state=wrong", "github_oauth_state=%ZZ"]) {
    const response = await handleGitHubCallback(callbackRequest("code=test-code", cookie));
    assert.match(response.headers.get("Set-Cookie"), /Max-Age=0/);
    await expectHelp(response, 400);
  }
});
test("provider denial and missing code return friendly HTML", async () => {
  configure();
  for (const params of ["error=access_denied&error_description=%3Cscript%3Ebad%3C/script%3E", ""]) {
    const html = await expectHelp(await handleGitHubCallback(callbackRequest(params)), 400);
    assert.doesNotMatch(html, /<script>bad/);
  }
});
test("network errors never disclose raw exception details", async () => {
  configure();
  global.fetch = async () => {
    throw new Error("private-provider-detail");
  };
  const html = await expectHelp(await handleGitHubCallback(callbackRequest()), 502);
  assert.doesNotMatch(html, /private-provider-detail/);
});
test("invalid token responses are handled", async () => {
  configure();
  for (const payload of [
    null,
    {},
    { access_token: 123 },
    { error: "bad", error_description: "private-provider-detail" },
  ]) {
    global.fetch = async () => Response.json(payload);
    await expectHelp(await handleGitHubCallback(callbackRequest()), 502);
  }
});
test("invalid profile and non-JSON responses are handled", async () => {
  configure();
  global.fetch = async (url) =>
    url.includes("access_token")
      ? Response.json({ access_token: "test-token" })
      : Response.json({ id: 1, login: "dev" });
  await expectHelp(await handleGitHubCallback(callbackRequest()), 502);
  global.fetch = async () => new Response("upstream unavailable", { status: 502 });
  await expectHelp(await handleGitHubCallback(callbackRequest()), 502);
});
test("successful callback sets HttpOnly token, clears state, safely serializes profile", async () => {
  configure();
  global.fetch = async (url, options) => {
    if (url.includes("access_token")) {
      const body = JSON.parse(options.body);
      assert.equal(body.client_secret, "test-secret");
      assert.equal(body.redirect_uri, `${base}/api/auth/github/callback`);
      return Response.json({ access_token: "test-token" });
    }
    return Response.json({
      id: 1,
      login: "dev",
      name: "</script><script>alert(1)</script>",
      avatar_url: "https://example.com/avatar",
      html_url: "https://github.com/dev",
      email: null,
      bio: null,
      public_repos: 1,
      followers: 0,
      following: 0,
    });
  };
  const response = await handleGitHubCallback(callbackRequest());
  assert.equal(response.status, 200);
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.match(cookies[0], /github_token=test-token; Path=\/; HttpOnly/);
  assert.match(cookies[1], /Max-Age=0/);
  const html = await response.text();
  assert.doesNotMatch(html, /test-token|<script>alert/);
  assert.match(html, /window.location.href = "http:\/\/localhost:8080\/dashboard"/);
});
test("HTTPS state cookie is secure", () => {
  configure();
  assert.match(
    handleGitHubLogin(new Request("https://app.example/api/auth/github")).headers.get("Set-Cookie"),
    /; Secure/,
  );
});
test("development adapter preserves separate Set-Cookie headers", async () => {
  configure();
  global.fetch = async (url) =>
    url.includes("access_token")
      ? Response.json({ access_token: "test-token" })
      : Response.json({
          id: 1,
          login: "dev",
          name: null,
          avatar_url: "https://example.com/avatar",
          html_url: "https://github.com/dev",
          email: null,
          bio: null,
          public_repos: 0,
          followers: 0,
          following: 0,
        });
  const headers = new Map();
  const res = { statusCode: 0, setHeader: (key, value) => headers.set(key, value), end: () => {} };
  await nodeAuthRouter(
    {
      socket: {},
      headers: { host: "localhost:8080", cookie: "github_oauth_state=test-state" },
      method: "GET",
      originalUrl: "/api/auth/github/callback?code=test-code&state=test-state",
    },
    res,
    () => assert.fail("Auth route should be handled"),
  );
  assert.equal(res.statusCode, 200);
  assert.equal(headers.get("Set-Cookie").length, 2);
});
