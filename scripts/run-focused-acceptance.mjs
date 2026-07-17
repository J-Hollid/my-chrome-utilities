import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { executeAcceptancePlan, loadVerificationPacks, planVerification, validateVerificationPacks } from "./verification-packs.mjs";

export function focusedAcceptanceOptions(args){
  const options={packIds:[],changedPaths:[],terminalFull:false};
  for(let index=0;index<args.length;index+=1){
    const argument=args[index];
    if(argument==="--full")options.terminalFull=true;
    else if(argument==="--pack"&&args[index+1])options.packIds.push(args[++index]);
    else if(argument==="--changed"&&args[index+1])options.changedPaths.push(args[++index]);
    else throw new Error(`Use --pack <id>, --changed <path>, or --full: ${argument}`);
  }
  if(!options.terminalFull&&!options.packIds.length&&!options.changedPaths.length)throw new Error("Select --pack <id>, --changed <path>, or --full");
  return options;
}

function runCommand(command){
  return new Promise((resolve,reject)=>{
    const child=spawn(command,{cwd:fileURLToPath(new URL("../",import.meta.url)),shell:true,stdio:"inherit"});
    child.once("error",reject);
    child.once("exit",(code,signal)=>code===0?resolve():reject(new Error(`Acceptance command failed (${signal??code}): ${command}`)));
  });
}

export async function runFocusedAcceptance(args,{commandRunner=runCommand}={}){
  const packs=await loadVerificationPacks();
  await validateVerificationPacks(packs);
  const plan=planVerification(packs,focusedAcceptanceOptions(args));
  await executeAcceptancePlan(plan,{runCommand:commandRunner});
  return plan;
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===fileURLToPath(new URL(`file://${process.argv[1]}`)))
  runFocusedAcceptance(process.argv.slice(2)).catch((error)=>{console.error(error.message);process.exitCode=1;});
