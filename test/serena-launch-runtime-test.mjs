import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,readFile,rm,chmod} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import path from "node:path";
import {installationPaths} from "../swarmforge/scripts/serena/provider.mjs";
const root=await mkdtemp(path.resolve("tmp/serena-launch-runtime-"));
const launch=path.resolve("swarmforge/scripts/serena/launch-role.mjs");
const roleSettings={};
const write=async(file,value)=>{await mkdir(path.dirname(file),{recursive:true});await writeFile(file,value);};
try {
  const bin=path.join(root,"bin");await write(path.join(bin,"codex"),`#!${process.execPath}\nconsole.log(JSON.stringify({args:process.argv.slice(2),cwd:process.cwd(),tasks:"available"}));\n`);await chmod(path.join(bin,"codex"),0o755);
  const pin={provider:"serena",revision:"a".repeat(40),sha256:"b".repeat(64)};
  for(const role of ["specifier","coder","refactorer","architect"]){
    const worktree=role==="specifier"?path.join(root,"repo"):path.join(root,"repo/.worktrees",role);
    await write(path.join(worktree,"swarmforge/toolchain.lock.json"),JSON.stringify({version:1,tools:{}}));
    await write(path.join(worktree,"swarmforge/toolchain/optional-tools.lock.json"),JSON.stringify({version:1,tools:{serena:pin}}));
    const run=()=>JSON.parse(execFileSync(process.execPath,[launch,"--worktree",worktree,"--","codex","--sandbox","workspace-write","task instruction"],
      {cwd:worktree,env:{...process.env,PATH:`${bin}:${process.env.PATH}`},timeout:5000,maxBuffer:1024*1024,encoding:"utf8",stdio:["ignore","pipe","pipe"]}));
    const absent=run();assert.deepEqual(absent.args,["--sandbox","workspace-write","task instruction"]);assert.equal(absent.tasks,"available");
    const p=installationPaths(worktree);await write(path.join(p.local,"installed.json"),JSON.stringify({pin}));await write(p.executable,"stub");
    await write(path.join(p.languageServer,"node_modules/.bin/typescript-language-server"),"stub");
    await write(path.join(p.languageServer,"node_modules/typescript/lib/tsserver.js"),"stub");
    for(const [name,version] of [["typescript","5.9.3"],["typescript-language-server","5.1.3"]])await write(path.join(p.languageServer,`node_modules/${name}/package.json`),JSON.stringify({version}));
    const oldTools=["get_symbols_overview","find_symbol","find_referencing_symbols","find_declaration","get_current_config"];
    const project=path.join(worktree,".serena/project.yml"),global=path.join(p.home,"serena_config.yml");
    await write(project,`fixed_tools: ${JSON.stringify(oldTools)}\nread_only: true\nproject_note: keep me\n`);
    await write(global,`fixed_tools: ${JSON.stringify(oldTools)}\ntool_timeout: 42\n`);
    const pinBefore=await readFile(path.join(p.local,"installed.json"));
    const ready=run();assert.equal(ready.cwd,worktree);assert.equal(ready.tasks,"available");
    const first=await Promise.all([project,global].map(f=>readFile(f,"utf8")));
    const configs=first.map(JSON.parse);
    for(const config of configs)assert.ok(config.fixed_tools.includes("initial_instructions"));
    assert.equal(configs[0].project_note,"keep me");assert.equal(configs[0].read_only,true);
    assert.equal(configs[1].tool_timeout,42);
    run();assert.deepEqual(await Promise.all([project,global].map(f=>readFile(f,"utf8"))),first);
    assert.deepEqual(await readFile(path.join(p.local,"installed.json")),pinBefore);
    assert.equal(await readFile(p.executable,"utf8"),"stub");
    assert.equal(await readFile(path.join(p.languageServer,"node_modules/typescript/lib/tsserver.js"),"utf8"),"stub");
    assert.ok(JSON.parse(ready.args.find(a=>a.startsWith("mcp_servers.serena.enabled_tools=")).split("=")[1]).includes("initial_instructions"));
    roleSettings[role]={root:ready.cwd,project:configs[0],global:configs[1],
      client:JSON.parse(ready.args.find(a=>a.startsWith("mcp_servers.serena.enabled_tools=")).split("=")[1])};
    assert.ok(ready.args.includes(`mcp_servers.serena.cwd=${JSON.stringify(worktree)}`));
    assert.ok(ready.args.includes("mcp_servers.serena.required=false"));assert.equal(ready.args.at(-1),"task instruction");
  }
  console.log(JSON.stringify({serenaLaunchRuntime:{roles:4,realSpawn:true,taskDelivery:true,offlineFallback:true,configBinding:true,initialInstructions:true,refreshIdempotent:true,unrelatedPreserved:true,roleSettings}}));
}finally{await rm(root,{recursive:true,force:true});}
