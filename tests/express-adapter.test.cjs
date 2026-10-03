const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { adaptWebHandler } = require("../backend/dist/utils/adapt-web-handler.js");
const { handleRepositoryManagement } = require("../backend/dist/services/repository-management.js");
const previousOrigin = process.env.FRONTEND_URL;
afterEach(() => {
  if (previousOrigin === undefined) delete process.env.FRONTEND_URL;
  else process.env.FRONTEND_URL = previousOrigin;
});
function responseRecorder() {
  return {
    code: 0, headers: {}, body: "",
    status(value) { this.code = value; return this; },
    setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
    send(value) { this.body = value; },
  };
}
test("proxy uses configured public origin and preserves both auth cookies", async () => {
  process.env.FRONTEND_URL = "https://app.example";
  const handler = adaptWebHandler(async (request) => {
    assert.equal(request.url, "https://app.example/api/auth/github/callback?code=test");
    const headers = new Headers();
    headers.append("Set-Cookie", "github_token=test; HttpOnly");
    headers.append("Set-Cookie", "github_oauth_state=; Max-Age=0");
    return new Response("ok", { headers });
  });
  const res = responseRecorder();
  await handler({ protocol: "http", method: "GET", headers: { host: "localhost:3001", "x-forwarded-host": "attacker.example" }, originalUrl: "/api/auth/github/callback?code=test" }, res);
  assert.equal(res.code, 200);
  assert.equal(res.headers["set-cookie"].length, 2);
});
test("proxied mutations accept the public origin but still reject other origins", async () => {
  process.env.FRONTEND_URL = "http://localhost:8080";
  for (const [origin, expected] of [["http://localhost:8080", 401], ["https://attacker.example", 403]]) {
    const res = responseRecorder();
    await adaptWebHandler(handleRepositoryManagement)({ protocol: "http", method: "POST", originalUrl: "/api/manage-repository", headers: { host: "localhost:3001", origin, "content-type": "application/json" }, body: {} }, res);
    // A correct-origin request proceeds to authentication; other origins do not.
    assert.equal(res.code, expected);
  }
});
