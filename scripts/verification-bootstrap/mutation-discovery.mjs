#!/usr/bin/env node
import {execFile} from "node:child_process";
import {readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {parseMutationDiscovery} from "./mutation.mjs";
import {fixedBootstrapRegistry} from "./fixed-registry.mjs";

const root=fileURLToPath(new URL("../../",import.meta.url));

function command(executable,args,{run=execFile}={}) {
  return new Promise((resolve,reject)=>run(executable,args,{cwd:root,maxBuffer:4*1024*1024},
    (error,stdout,stderr)=>error?reject(new Error(stderr||stdout||error.message)):
      resolve({stdout,stderr})));
}

export function validateMutationExecution(output,expectedPopulation) {
  const matches=[...output.matchAll(/(\d+)\/(\d+) mutants killed/gu)];
  const result=matches.at(-1);
  if (!result) throw new Error("Bootstrap mutation execution result is invalid");
  const killed=Number(result[1]),total=Number(result[2]);
  if (total!==expectedPopulation) throw new Error("Bootstrap mutation executable population changed");
  if (killed!==total) throw new Error("Bootstrap mutation survived the target-specific command");
  return {killed,total};
}

function targetCommand(task) {
  const args=task.args.map((value)=>value.startsWith("build/")?path.join(root,value):value);
  const values=[task.executable,...args];
  if (values.some((value)=>/\s/u.test(value))) {
    throw new Error("Bootstrap mutation target command cannot contain whitespace arguments");
  }
  return values.join(" ");
}

export async function discoverMutationSites(source,targetKey,{run=execFile,
  registry=fixedBootstrapRegistry(),read=readFile,write=writeFile}={}) {
  const target=registry.tasks.find(({key})=>key===targetKey);
  if (!target) throw new Error("Bootstrap mutation target command is not fixed in the registry");
  const scan=await command("swarmforge/scripts/clj-mutate",[source,"--scan"],{run});
  const discovery=parseMutationDiscovery(scan.stdout);
  if (discovery.changed===0) return {status:"passed",source,targetKey,...discovery,
    executableMutants:0,output:scan.stdout,mutationOutput:""};
  const sourcePath=path.join(root,source),original=await read(sourcePath);
  let mutation;
  try {
    mutation=await command("swarmforge/scripts/clj-mutate",
      [source,"--since-last-run","--test-command",targetCommand(target)],{run});
  } finally {
    await write(sourcePath,original);
  }
  const execution=validateMutationExecution(mutation.stdout,discovery.changed);
  return {status:"passed",source,targetKey,...discovery,executableMutants:execution.total,
    output:scan.stdout,mutationOutput:mutation.stdout};
}

if (process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])) {
  const [source,targetKey]=process.argv.slice(2);
  if (!source||!targetKey) {
    console.error("Use mutation-discovery.mjs <source> <target-task-key>");process.exitCode=1;
  } else discoverMutationSites(source,targetKey)
    .then((result)=>process.stdout.write(`${JSON.stringify({bootstrapMutationDiscovery:result})}\n`))
    .catch((error)=>{console.error(error.message);process.exitCode=1;});
}
