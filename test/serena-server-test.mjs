import assert from "node:assert/strict";
import {PassThrough} from "node:stream";
import {startServer,upstreamCommand} from "../swarmforge/scripts/serena/server.mjs";
import {assessSequence} from "../swarmforge/scripts/serena/sequence.mjs";
import {tools,projectConfig,globalConfig} from "../swarmforge/scripts/serena/config.mjs";
const conditions=[];
for(const condition of ["ready","server failure","timeout","missing tool"]) {
  const input=new PassThrough(),output=new PassThrough(),messages=[];let text="";
  output.on("data",c=>text+=c);
  const source=condition==="ready"?'console.log(JSON.stringify({jsonrpc:"2.0",id:1,result:{protocolVersion:"2024-11-05"}}))':
    condition==="timeout"?'setInterval(()=>{},1000)':'process.exit(2)';
  const code=await startServer("/repo",{input,output,warn:m=>messages.push(m),timeoutMs:150,
    refresh:async()=>{},
    inspect:async()=>({available:condition!=="missing tool",executable:process.execPath,reason:"missing tool"}),
    commandFor:()=>({command:process.execPath,args:["-e",source],options:{}})});
  if(condition==="ready"){assert.equal(code,0);assert.match(text,/protocolVersion/);assert.equal(messages.length,0);}
  else {assert.notEqual(code,0);assert.equal(messages.length,1);assert.match(messages[0],/ordinary tools/);}
  input.destroy();output.destroy();conditions.push(condition);
}
const spec=upstreamCommand("/repo/.worktrees/coder","/installed/serena");
assert.equal(spec.options.cwd,"/repo/.worktrees/coder");
assert.equal(spec.options.env.SERENA_USAGE_REPORTING,"false");
assert.equal(spec.options.env.npm_config_offline,"true");
assert.deepEqual(spec.args.slice(0,7),["start-mcp-server","--project","/repo/.worktrees/coder","--context","codex","--transport","stdio"]);
console.log(JSON.stringify({serenaServer:{conditions,optionalFailure:true,noDownloads:true,usageReporting:false}}));
const sequenceResults={};
for(const condition of ["ready","server filter","project filter","client filter","unavailable pinned server","catalogue","instruction failure","wrong worktree"]) {
  const calls=[],project=projectConfig(),global=globalConfig("/repo"),client=[...tools];
  if(condition==="server filter")global.fixed_tools=global.fixed_tools.filter(t=>t!=="initial_instructions");
  if(condition==="project filter")project.fixed_tools=project.fixed_tools.filter(t=>t!=="initial_instructions");
  if(condition==="client filter")client.splice(client.indexOf("initial_instructions"),1);
  const result=await assessSequence({root:"/repo",project,global,client,connect:async()=>{
    calls.push("initialize");if(condition==="unavailable pinned server")throw new Error("unavailable pinned server");
    return {initialized:{protocolVersion:"2024-11-05"},close:()=>calls.push("close"),
      call:async()=>({tools:tools.filter(t=>condition!=="catalogue"||t!=="initial_instructions").map(name=>({name}))}),
      tool:async(name)=>{calls.push(name);if(name==="initial_instructions"){
        if(condition==="instruction failure")throw new Error("instruction failure");return "Serena instructions";}
        return JSON.stringify([{name:"renderProjectLibraryPresentation",relative_path:condition==="wrong worktree"?"../other/src/wrong.ts":"src/data-layer-project-library-presentation-ui.ts"}]);}};
  }});
  assert.equal(result.usable,condition==="ready");
  if(condition==="ready")assert.deepEqual(calls,["initialize","initial_instructions","find_symbol","close"]);
  else {assert.match(result.reason,/ordinary tools/);assert.ok(!result.symbol);}
  if(["server filter","project filter","client filter"].includes(condition))assert.deepEqual(calls,[]);
  if(["catalogue","instruction failure"].includes(condition))assert.ok(!calls.includes("find_symbol"));
  sequenceResults[condition]={usable:result.usable,step:result.step};
}
console.log(JSON.stringify({serenaInstructionSequence:{conditions:sequenceResults,dependencyRejected:true,ordered:true,scopeChecked:true}}));
