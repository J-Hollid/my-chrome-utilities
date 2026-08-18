import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";

import {canonicalVerificationChangeSet,verificationPacksAtCommit} from "./verification-changes.mjs";
import {granularityDispositionsAtCommit} from "./verification-granularity-dispositions.mjs";
import {loadVerificationPacks} from "./verification-packs.mjs";
import {activeVerificationSliceQuarantineIds} from "./verification-slice-quarantine.mjs";
import {routeCampsiteReadiness} from "./stacked-campsite-control.mjs";
import {exactOwnershipReadiness,intentOwnershipReadiness} from
  "./verification-ownership-readiness-core.mjs";

export {validateOwnershipIntent,validateWithinPackMateriality} from
  "./verification-ownership-intent.mjs";
export {classifyOwnershipReadiness,exactOwnershipReadiness,intentOwnershipReadiness} from
  "./verification-ownership-readiness-core.mjs";

function parseJsonOption(option,value) {
  try { return JSON.parse(value); }
  catch { throw new Error(`${option} requires valid JSON`); }
}

export async function applyCampsiteReadiness(answer,config,{repositoryRoot=process.cwd()}={}) {
  return routeCampsiteReadiness(repositoryRoot,answer,config);
}

function parseOptions(args) {
  const output={mode:args[0],packs:[],paths:[],prefixes:[]};
  const handlers={
    "--base":(value)=>{output.base=value;},
    "--task":(value)=>{output.task=value;},
    "--pack":(value)=>{output.packs.push(value);},
    "--path":(value)=>{output.paths.push(value);},
    "--prefix":(value)=>{output.prefixes.push(value);},
    "--prefix-proposal":(value)=>{output.prefixes.push(parseJsonOption("--prefix-proposal",value));},
    "--within-pack":(value)=>{output.withinPack=parseJsonOption("--within-pack",value);},
    "--changed-since":(value)=>{output.changedSince=value;},
    "--campsite-config":(value)=>{output.campsiteConfig=value;},
  };
  for (let index=1;index<args.length;index+=1) {
    const option=args[index],value=args[index+1];
    index+=1;
    const handler=handlers[option];
    if (!handler) throw new Error(`Unknown ownership-readiness option: ${option}`);
    handler(value);
  }
  return output;
}

async function intentAnswer(options,packs,granularityDispositions) {
  const quarantinedSliceIds=await activeVerificationSliceQuarantineIds(
    options.base,{repositoryRoot:process.cwd()});
  return intentOwnershipReadiness({intent:options.intent,packs,quarantinedSliceIds,
    withinPack:options.withinPack,granularityDispositions});
}

async function exactAnswer(options,packs,granularityDispositions) {
  if (!options.changedSince) throw new Error("Exact ownership readiness requires --changed-since");
  const changeSet=await canonicalVerificationChangeSet({base:options.changedSince,
    repositoryRoot:process.cwd()});
  const basePacks=await verificationPacksAtCommit(changeSet.baseCommit,{repositoryRoot:process.cwd()});
  const quarantinedSliceIds=await activeVerificationSliceQuarantineIds(
    changeSet.commit,{repositoryRoot:process.cwd()});
  return exactOwnershipReadiness({intent:options.intent,packs,changeSet,basePacks,quarantinedSliceIds,
    withinPack:options.withinPack,granularityDispositions});
}

async function main() {
  const options=parseOptions(process.argv.slice(2));
  const packs=await loadVerificationPacks();
  const granularityDispositions=await granularityDispositionsAtCommit(options.base);
  options.intent={version:1,baseCommit:options.base,task:options.task,
    approvedPackIds:options.packs,likelyPaths:options.paths,proposedPrefixes:options.prefixes};
  let answer;
  if (options.mode==="intent") answer=await intentAnswer(options,packs,granularityDispositions);
  else if (options.mode==="exact") answer=await exactAnswer(options,packs,granularityDispositions);
  else throw new Error("Use ownership readiness mode intent or exact");
  if (options.campsiteConfig) {
    const input=parseJsonOption("--campsite-config",await readFile(options.campsiteConfig,"utf8"));
    answer={...answer,campsite:await applyCampsiteReadiness(answer,input)};
  }
  process.stdout.write(`${JSON.stringify(answer,null,2)}\n`);
}

if (process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]) {
  main().catch((error)=>{console.error(error.message);process.exitCode=1;});
}
