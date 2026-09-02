#!/usr/bin/env node
import {execFile} from "node:child_process";
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

export async function discoverMutationSites(source,targetKey,{run=execFile,
  registry=fixedBootstrapRegistry()}={}) {
  const target=registry.tasks.find(({key})=>key===targetKey);
  if (!target) throw new Error("Bootstrap mutation target command is not fixed in the registry");
  const scan=await command("swarmforge/scripts/clj-mutate",[source,"--scan"],{run});
  const discovery=parseMutationDiscovery(scan.stdout);
  return {status:"passed",source,targetKey,...discovery,scanOnly:true,output:scan.stdout};
}

if (process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])) {
  const [source,targetKey]=process.argv.slice(2);
  if (!source||!targetKey) {
    console.error("Use mutation-discovery.mjs <source> <target-task-key>");process.exitCode=1;
  } else discoverMutationSites(source,targetKey)
    .then((result)=>process.stdout.write(`${JSON.stringify({bootstrapMutationDiscovery:result})}\n`))
    .catch((error)=>{console.error(error.message);process.exitCode=1;});
}
