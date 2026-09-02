import {execFile} from "node:child_process";
import {constants} from "node:fs";
import {access} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";

const exec=promisify(execFile);
const wrapper="swarmforge/scripts/clj-mutate";
const tool="clj-mutate";

export function validateMutationCapabilityPlan(plan) {
  const mutationIndex=plan.tasks.findIndex(({stage})=>stage==="mutation-discovery");
  const checkpointIndex=plan.tasks.findIndex(({args})=>args?.join(" ")===
    "scripts/check-swarmforge-toolchain.mjs --require clj-mutate");
  if (mutationIndex<0||checkpointIndex<0||checkpointIndex>=mutationIndex) {
    throw new Error("Bootstrap locked tool checkpoint must run before mutation discovery");
  }
  const declaration=plan.tasks[mutationIndex].nestedCapabilities;
  if (JSON.stringify(declaration)!==JSON.stringify([{
    wrapper,tool,localRoot:"tmp/tools/clj-mutate",
  }])||!plan.tasks[mutationIndex].requiredCapabilities.includes("clj-mutate:locked")) {
    throw new Error("Bootstrap mutation nested capability declaration is invalid");
  }
  return {checkpointKey:plan.tasks[checkpointIndex].key,mutationKey:plan.tasks[mutationIndex].key};
}

async function defaultWrapperAvailable(root) {
  try { await access(path.join(root,wrapper),constants.X_OK);return true; }
  catch { return false; }
}

async function defaultRun(args,root) {
  const {stdout}=await exec("node",args,{cwd:root,maxBuffer:4*1024*1024});
  return stdout;
}

export async function prepareMutationCapability({root,
  wrapperAvailable=()=>defaultWrapperAvailable(root),run=(args)=>defaultRun(args,root)}) {
  if (!await wrapperAvailable()) throw new Error("Bootstrap mutation wrapper is not executable");
  const requireArgs=["scripts/check-swarmforge-toolchain.mjs","--require",tool];
  try { await run(requireArgs); }
  catch (error) { throw new Error(`Bootstrap mutation tool is unavailable; run node ${
    requireArgs[0]} --provision ${tool} (${error.message})`); }
  return {available:true,capability:"clj-mutate:locked",wrapper,tool};
}
