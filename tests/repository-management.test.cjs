const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,"utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { handleRepositoryManagement: handle } = require("../src/lib/repository-management.ts");
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const payload = { action: "create", name: "team-project", private: true, members: ["alice", "bob"] };
function request(body=payload, extra={}) { return new Request("http://localhost:8080/api/manage-repository", {method:"POST", headers:{ origin:"http://localhost:8080", "Content-Type":"application/json", cookie:"github_token=test-token", ...extra }, body:JSON.stringify(body) }); }
const repo = { name:"team-project", full_name:"manager/team-project", html_url:"https://github.com/manager/team-project", owner:{login:"manager"} };
test("rejects unauthenticated and cross-origin mutations without GitHub calls", async()=>{
 global.fetch=async()=>assert.fail("No network expected");
 assert.equal((await handle(request(payload,{cookie:""}))).status,401);
 assert.equal((await handle(request(payload,{origin:"https://other.example"}))).status,403);
 assert.equal((await handle(new Request("http://localhost:8080/api/manage-repository"))).status,405);
});
test("validates names, types, and team size before network calls",async()=>{
 global.fetch=async()=>assert.fail("No network expected");
 for(const body of [{...payload,name:"../bad"},{...payload,private:"false"},{...payload,members:["person@example.com"]},{...payload,members:Array(21).fill("alice")}]) assert.equal((await handle(request(body))).status,400);
});
test("creates private repo, deduplicates usernames and preserves partial success",async()=>{
 const calls=[];
 global.fetch=async(url,options)=>{ calls.push([url,options]); if(url.endsWith("/user"))return Response.json({login:"manager"}); if(url.endsWith("/user/repos")){assert.equal(JSON.parse(options.body).private,true);return Response.json(repo,{status:201});} return url.endsWith("/alice")?Response.json({id:1},{status:201}):Response.json({}, {status:404}); };
 const response=await handle(request({...payload,members:["Alice","alice","bob"]}));
 assert.equal(response.status,201);const result=await response.json();assert.deepEqual(result.invitations.map(i=>i.status),["invited","failed"]);assert.equal(calls.length,4);
});
test("retry only invites and never creates another repo",async()=>{
 global.fetch=async(url,options)=>{assert.notEqual(options.method,"POST"); if(url.endsWith("/user"))return Response.json({login:"manager"}); if(url.endsWith("/team-project"))return Response.json(repo); return new Response(null,{status:204});};
 const response=await handle(request({action:"invite",name:"team-project",members:["bob"]}));assert.equal(response.status,200);assert.equal((await response.json()).invitations[0].status,"member");
});
test("self invitations and non-owner retries are rejected",async()=>{
 global.fetch=async(url)=>url.endsWith("/user")?Response.json({login:"manager"}):Response.json({...repo,owner:{login:"someone-else"}});
 assert.equal((await handle(request({...payload,members:["manager"]}))).status,400);
 assert.equal((await handle(request({action:"invite",name:"team-project",members:["alice"]}))).status,403);
});
test("duplicate names do not trigger invitations",async()=>{
 global.fetch=async(url)=>{if(url.endsWith("/user"))return Response.json({login:"manager"});assert.ok(url.endsWith("/user/repos"));return Response.json({}, {status:422});};
 assert.equal((await handle(request())).status,409);
});
test("invitation timeout keeps created repository and exposes no exception",async()=>{
 global.fetch=async(url)=>{if(url.endsWith("/user"))return Response.json({login:"manager"});if(url.endsWith("/user/repos"))return Response.json(repo);throw new Error("private-detail");};
 const response=await handle(request());assert.equal(response.status,201);const body=await response.json();assert.equal(body.invitations.length,2);assert.ok(body.invitations.every(i=>i.status==="failed"));assert.doesNotMatch(JSON.stringify(body),/private-detail/);
});
