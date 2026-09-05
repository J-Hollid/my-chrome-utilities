import {stat} from "node:fs/promises";
import path from "node:path";
import {queryContext,git} from "./context.mjs";
import {explainPlan,ownershipFor} from "./explain.mjs";
import {planVerification,canonicalVerificationChangeSet,verificationPacksAtCommit} from "../verification-packs.mjs";
import {isRepositoryPath} from "../verification-ownership-paths.mjs";
import {exactOwnershipReadiness} from "../verification-ownership-readiness-core.mjs";
import {granularityDispositionsAtCommit} from "../verification-granularity-dispositions.mjs";
async function historicalContext(context,commit) {
  const packs=await verificationPacksAtCommit(commit,{repositoryRoot:context.root,historicalRegistryFallback:true});
  const names=(await git(context.root,"ls-tree","-r","--name-only",commit,"--","verification")).split("\n");
  const provenance={};
  for(const [index,p] of packs.entries()) {
    const manifest=`verification/manifests/${p.id}.json`;
    provenance[p.id]=names.includes(manifest)?{path:manifest,pointer:"/pack"}:
      {path:names.includes("verification/packs.base.json")?"verification/packs.base.json":"verification/packs.json",pointer:`/${index}`};
  }
  return {...context,packs,provenance,head:commit};
}
export async function ownershipQuery(options,{cwd=process.cwd()}={}) {
  const ctx=await queryContext(cwd);
  const common={version:1,advisory:true,mode:options.mode,worktree:ctx.root,head:ctx.head,
    registryIdentity:ctx.registryIdentity,dirty:ctx.dirty,registryDirty:ctx.registryDirty};
  if(options.mode==="path") {
    if(!isRepositoryPath(options.path)||/^[A-Za-z]:/u.test(options.path))throw new Error("Invalid repository path");
    const ownership=ownershipFor(ctx,options.path);
    try {ownership.exists=(await stat(path.join(ctx.root,options.path))).isFile();}
    catch(error){if(error.code!=="ENOENT")throw error;ownership.exists=false;}
    const plan=ownership.kind==="unowned"?{tasks:[],packIds:[]}:planVerification(ctx.packs,
      {changedPaths:[options.path],includeProperties:true,quarantinedSliceIds:ctx.quarantine});
    return {...common,ownership,...explainPlan(ctx,plan,[options.path])};
  }
  if(options.mode!=="changes")throw new Error("Use path <path> or changes --base <commit> --task <task> --pack <id>");
  if(!options.base||options.base.startsWith("-"))throw new Error("Invalid changes base");
  if(ctx.registryDirty)throw new Error("Current registry inputs differ from HEAD; commit them before a changes query");
  const changeSet=await canonicalVerificationChangeSet({base:options.base,repositoryRoot:ctx.root});
  const history=await historicalContext(ctx,changeSet.baseCommit);
  const granularityDispositions=await granularityDispositionsAtCommit(ctx.head,{repositoryRoot:ctx.root});
  const plan=planVerification(ctx.packs,{changedPaths:changeSet.paths,changeSet,basePacks:history.packs,
    includeProperties:true,quarantinedSliceIds:ctx.quarantine});
  const intent={version:1,baseCommit:changeSet.baseCommit,task:options.task,
    approvedPackIds:options.packs??[],likelyPaths:[],proposedPrefixes:[]};
  const readiness=await exactOwnershipReadiness({intent,packs:ctx.packs,changeSet,basePacks:history.packs,
    plan:()=>plan,granularityDispositions,quarantinedSliceIds:ctx.quarantine});
  return {...common,base:changeSet.baseCommit,changeSet,workingTreeExcluded:true,
    workingTreeNotice:"Only committed changes are covered; uncommitted source changes are excluded",
    readiness,dispositions:granularityDispositions.dispositions.filter(d=>d.task===options.task),
    ...explainPlan(ctx,plan,changeSet.paths,history)};
}
