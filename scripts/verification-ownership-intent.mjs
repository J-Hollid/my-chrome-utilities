import {canonicalValues,isRepositoryPath,normalizeProposedPrefix} from
  "./verification-ownership-paths.mjs";
export {validateWithinPackMateriality} from "./verification-ownership-within-pack.mjs";

function validateCommitIdentity(intent) {
  if (typeof intent.baseCommit!=="string") {
    throw new Error("Ownership intent requires a canonical base commit");
  }
  if (!/^[a-f0-9]{40,64}$/u.test(intent.baseCommit)) {
    throw new Error("Ownership intent requires a canonical base commit");
  }
}

function validateTaskIdentity(intent) {
  if (typeof intent.task!=="string") {
    throw new Error("Ownership intent requires a stable task identity");
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/u.test(intent.task)) {
    throw new Error("Ownership intent requires a stable task identity");
  }
}

function validateIdentity(intent) {
  if (!intent||intent.version!==1) throw new Error("Ownership intent requires version 1");
  validateCommitIdentity(intent);
  validateTaskIdentity(intent);
}

function validateUniqueFields(intent) {
  for (const key of ["approvedPackIds","likelyPaths","proposedPrefixes"]) {
    if (!Array.isArray(intent[key])||new Set(intent[key]).size!==intent[key].length) {
      throw new Error(`Ownership intent requires unique ${key}`);
    }
  }
}

export function validateOwnershipIntent(intent,packs) {
  validateIdentity(intent);
  validateUniqueFields(intent);
  const knownPackIds=new Set((packs??[]).map(({id})=>id));
  if (!intent.approvedPackIds.length||intent.approvedPackIds.some((id)=>!knownPackIds.has(id))) {
    throw new Error("Ownership intent names an unknown pack");
  }
  if (intent.likelyPaths.some((value)=>!isRepositoryPath(value))) {
    throw new Error("Ownership intent names an unavailable or malformed path");
  }
  const proposedPrefixes=intent.proposedPrefixes.map((value)=>normalizeProposedPrefix(value,packs));
  if (new Set(proposedPrefixes.map(({prefix})=>prefix)).size!==proposedPrefixes.length) {
    throw new Error("Ownership intent requires unique proposedPrefixes");
  }
  return {...intent,approvedPackIds:canonicalValues(intent.approvedPackIds),
    likelyPaths:canonicalValues(intent.likelyPaths),
    proposedPrefixes:proposedPrefixes.sort((left,right)=>left.prefix.localeCompare(right.prefix))};
}
