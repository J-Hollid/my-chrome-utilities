import {spawn} from "node:child_process";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {main as optionalTool} from "../../toolchain/cli.mjs";
import {installationPaths} from "./provider.mjs";
import {refreshConfiguration} from "./refresh.mjs";
export function upstreamCommand(root,executable) {
  return {command:executable,args:["start-mcp-server","--project",root,"--context","codex","--transport","stdio",
    "--enable-web-dashboard","false","--open-web-dashboard","false","--enable-gui-log-window","false","--log-level","WARNING"],
    options:{cwd:root,env:{...process.env,SERENA_HOME:installationPaths(root).home,SERENA_USAGE_REPORTING:"false",UV_OFFLINE:"true",
      PIP_NO_INDEX:"1",npm_config_offline:"true",PYTHONDONTWRITEBYTECODE:"1"}}};
}
export async function startServer(root,{inspect=()=>optionalTool(["inspect","serena"],{repositoryRoot:root}),
  input=process.stdin,output=process.stdout,warn=message=>console.error(message),timeoutMs=25000,
  refresh=refreshConfiguration,commandFor=upstreamCommand}={}) {
  if(!path.isAbsolute(root))throw new Error("Serena requires an absolute worktree");
  const status=await inspect();
  if(!status.available){warn(`Serena unavailable: ${status.reason}; use ordinary tools.`);return 1;}
  try {await refresh(root);}catch(error){warn(`Serena unavailable: configuration refresh failed: ${error.message}; use ordinary tools.`);return 1;}
  const spec=commandFor(root,status.executable);
  return new Promise(resolve=>{
    const child=spawn(spec.command,spec.args,{...spec.options,stdio:["pipe","pipe","pipe"]});
    let ready=false,reported=false,buffer="";
    const report=reason=>{if(!reported){reported=true;warn(`Serena unavailable: ${reason}; use ordinary tools.`);}};
    const timer=setTimeout(()=>{report("MCP startup timeout");child.kill("SIGTERM");},timeoutMs);
    child.stdout.on("data",chunk=>{
      output.write(chunk);buffer+=chunk.toString();
      const lines=buffer.split("\n");buffer=lines.pop();
      for(const line of lines)try {const message=JSON.parse(line);if(message.result?.protocolVersion){ready=true;clearTimeout(timer);}}catch{}
    });
    child.stderr.on("data",()=>{}); // MCP diagnostics stay bounded; one fallback reason replaces full server logs.
    input.pipe(child.stdin);child.stdin.on("error",()=>{});
    child.once("error",error=>{clearTimeout(timer);report(error.message);resolve(1);});
    child.once("exit",code=>{clearTimeout(timer);input.unpipe(child.stdin);if(!ready||code)report("server failure");resolve(code??1);});
    input.once("end",()=>child.stdin.end());
    for(const signal of ["SIGINT","SIGTERM"])process.once(signal,()=>child.kill(signal));
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const args=process.argv.slice(2);
  if(args.length!==2||args[0]!=="--worktree")throw new Error("Use --worktree <absolute-worktree>");
  startServer(args[1]).then(code=>{process.exitCode=code;}).catch(error=>{console.error(`Serena unavailable: ${error.message}; use ordinary tools.`);process.exitCode=1;});
}
