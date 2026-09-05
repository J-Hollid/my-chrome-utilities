import assert from "node:assert/strict";
import path from "node:path";
import {launchRole} from "../swarmforge/scripts/serena/launch-role.mjs";
import {tools,projectConfig,symbolRoute} from "../swarmforge/scripts/serena/config.mjs";
const calls=[],warnings=[];
for(const role of ["specifier","coder","refactorer","architect"]) {
  const root=role==="specifier"?"/repo":`/repo/.worktrees/${role}`;
  await launchRole(root,["codex","--sandbox","workspace-write"],{
    inspect:async()=>({available:true}),run:async(command,args,options)=>calls.push({command,args,options}),warn:x=>warnings.push(x)});
  const c=calls.at(-1);assert.equal(c.command,"codex");assert.equal(c.options.cwd,root);
  assert.ok(c.args.includes(`mcp_servers.serena.cwd=${JSON.stringify(root)}`));
  assert.ok(c.args.includes("mcp_servers.serena.required=false"));
  assert.ok(c.args.includes(JSON.stringify([path.join(root,"swarmforge/scripts/serena/server.mjs"),"--worktree",root]).replace(/^/,"mcp_servers.serena.args=")));
}
for(const reason of ["missing tool","server failure","timeout"]) {
  await launchRole("/repo",["codex"],{inspect:async()=>({available:false,reason}),run:async(c,a)=>calls.push({command:c,args:a}),warn:x=>warnings.push(x)});
  assert.deepEqual(calls.at(-1).args,[]);assert.ok(warnings.at(-1).includes(reason));
}
assert.deepEqual(projectConfig().fixed_tools,[...tools]);assert.equal(projectConfig().read_only,true);
for(const name of ["activate_project","execute_shell_command","read_file","replace_symbol_body","write_memory","onboarding"])
  assert.ok(!tools.includes(name));
for(const f of ["src/example.ts","scripts/example.mjs","test/example.mjs","swarmforge/scripts/example.mjs"])assert.equal(symbolRoute(f),"typescript");
assert.equal(symbolRoute("x.bb"),"ordinary");assert.equal(symbolRoute("x.clj"),"ordinary");
assert.equal(symbolRoute("x.clj",{clojureProvisioned:true}),"clojure");
console.log(JSON.stringify({serenaLaunch:{roles:4,worktreeBound:true,optional:true,fallback:true,tools:[...tools],languages:true}}));
