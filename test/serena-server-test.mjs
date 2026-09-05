import assert from "node:assert/strict";
import {PassThrough} from "node:stream";
import {startServer,upstreamCommand} from "../swarmforge/scripts/serena/server.mjs";
const conditions=[];
for(const condition of ["ready","server failure","timeout","missing tool"]) {
  const input=new PassThrough(),output=new PassThrough(),messages=[];let text="";
  output.on("data",c=>text+=c);
  const source=condition==="ready"?'console.log(JSON.stringify({jsonrpc:"2.0",id:1,result:{protocolVersion:"2024-11-05"}}))':
    condition==="timeout"?'setInterval(()=>{},1000)':'process.exit(2)';
  const code=await startServer("/repo",{input,output,warn:m=>messages.push(m),timeoutMs:150,
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
