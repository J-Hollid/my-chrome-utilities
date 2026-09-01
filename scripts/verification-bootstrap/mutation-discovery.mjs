#!/usr/bin/env node
import {execFile} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {parseMutationDiscovery} from "./mutation.mjs";

const root=fileURLToPath(new URL("../../",import.meta.url));

export function discoverMutationSites(source,targetKey,{run=execFile}={}) {
  return new Promise((resolve,reject)=>run("swarmforge/scripts/clj-mutate",[source,"--scan"],
    {cwd:root,maxBuffer:1024*1024},(error,stdout,stderr)=>{
      if (error) return reject(new Error(stderr||stdout||error.message));
      resolve({status:"passed",source,targetKey,...parseMutationDiscovery(stdout),output:stdout});
    }));
}

if (process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])) {
  const [source,targetKey]=process.argv.slice(2);
  if (!source||!targetKey) {
    console.error("Use mutation-discovery.mjs <source> <target-task-key>");process.exitCode=1;
  } else discoverMutationSites(source,targetKey)
    .then((result)=>process.stdout.write(`${JSON.stringify({bootstrapMutationDiscovery:result})}\n`))
    .catch((error)=>{console.error(error.message);process.exitCode=1;});
}
