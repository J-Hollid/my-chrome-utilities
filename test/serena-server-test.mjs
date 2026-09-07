import assert from "node:assert/strict";
import {PassThrough} from "node:stream";
import {startServer,upstreamCommand} from "../swarmforge/scripts/serena/server.mjs";
import {assessSequence} from "../swarmforge/scripts/serena/sequence.mjs";
import {tools,projectConfig,globalConfig} from "../swarmforge/scripts/serena/config.mjs";
import {execFileSync} from "node:child_process";
import {runInNewContext} from "node:vm";
import {timeoutIncidentDigest} from "../scripts/verification-reliability-values.mjs";
import {registeredAcceptanceSessionExternalPrerequisiteKeys} from "../scripts/verification-acceptance-session-prerequisites.mjs";
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
const serenaServer={conditions,optionalFailure:true,noDownloads:true,usageReporting:false};
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
const serenaInstructionSequence={conditions:sequenceResults,dependencyRejected:true,ordered:true,scopeChecked:true};
const published={serenaServer,serenaInstructionSequence};
assert.ok(registeredAcceptanceSessionExternalPrerequisiteKeys("shell").includes("browser:test/twatility-projects-browser-test.mjs"));
const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
if(context?.causalCategory==="other:Serena acceptance evidence closure") {
  const previous=execFileSync("git",["show","3b3a15c5:scripts/verification-acceptance-session-prerequisites.mjs"],
    {encoding:"utf8",timeout:5000,maxBuffer:1024*1024});
  const old=await import(`data:text/javascript;base64,${Buffer.from(previous).toString("base64")}`);
  const oldSource=execFileSync("git",["show","3b3a15c5:test/serena-server-test.mjs"],
    {encoding:"utf8",timeout:5000,maxBuffer:1024*1024});
  const statement=oldSource.split("\n").filter(line=>line.startsWith("console.log(JSON.stringify(")).at(-1);
  assert.ok(statement);let oldOutput;
  runInNewContext(statement,{sequenceResults,console:{log:value=>{oldOutput=value;}}},{timeout:1000});
  const before={priorObservation:JSON.parse(oldOutput).serenaServer!==undefined,
    browserPrerequisite:old.registeredAcceptanceSessionExternalPrerequisiteKeys("shell").includes("browser:test/twatility-projects-browser-test.mjs")};
  const after={priorObservation:JSON.parse(JSON.stringify(published)).serenaServer!==undefined,
    browserPrerequisite:registeredAcceptanceSessionExternalPrerequisiteKeys("shell").includes("browser:test/twatility-projects-browser-test.mjs")};
  assert.deepEqual(before,{priorObservation:false,browserPrerequisite:false});
  assert.deepEqual(after,{priorObservation:true,browserPrerequisite:true});
  const fixture={id:"serena-acceptance-evidence-closure-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    expectedPreRepairFailure:before,expectedRepairResult:after};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,preRepairResult:{status:"failed",fixtureDigest,observed:before},
    repairResult:{status:"passed",fixtureDigest,observed:after}}}));
}
console.log(JSON.stringify(published));
