import path from "node:path";
import {pathToFileURL} from "node:url";
import {spawn} from "node:child_process";
import {main as optionalTool} from "../../toolchain/cli.mjs";
import {codexSettings} from "./config.mjs";
function run(command,args,options) {
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{...options,stdio:"inherit"});
    child.once("error",reject);child.once("exit",code=>resolve(code??1));
    for(const signal of ["SIGINT","SIGTERM"])process.once(signal,()=>child.kill(signal));
  });
}
export async function launchRole(root,command,{inspect=()=>optionalTool(["inspect","serena"],{repositoryRoot:root}),
  run:execute=run,warn=message=>console.error(message)}={}) {
  if(!path.isAbsolute(root)||!command.length)throw new Error("Serena role launcher needs an absolute worktree and a command");
  let status;try {status=await inspect();}catch(error){status={available:false,reason:error.message};}
  if(!status.available)warn(`Serena unavailable: ${status.reason}; use ordinary tools.`);
  return execute(command[0],[...(status.available?codexSettings(root):[]),...command.slice(1)],{cwd:root});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const args=process.argv.slice(2),separator=args.indexOf("--");
  if(args[0]!=="--worktree"||separator!==2)throw new Error("Use --worktree <absolute-path> -- codex <args>");
  launchRole(args[1],args.slice(3)).then(code=>{process.exitCode=code;}).catch(error=>{console.error(error.message);process.exitCode=1;});
}
