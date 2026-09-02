import {execFileSync} from "node:child_process";

import {digestValue,sha256} from "./compact-conservation-identity.mjs";
import {changedCompactProjectionOwners} from "./compact-conservation-projection.mjs";

export const compactAuthorityRoot=Object.freeze({
  commit:"b7b71a0253b8dcb5dd9be12243815749b1aea0fc",
  path:"test/fixtures/verification-process-compact-conservation.json",
  sha256:"e2358bfe8723ce5061e9f1389e150967546a1ce8ced55064cb233b6ea4588899",
  projectionDigest:"78277d946f30b8f3d3d95b6074653555dc95d609b50600f0fbd94f50407a49ef",
});

const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);
const sha40=/^[a-f0-9]{40}$/u,sha64=/^[a-f0-9]{64}$/u;
const authenticatedAuthorities=new WeakSet();

function git(root,...args){return execFileSync("git",args,{cwd:root,encoding:null});}

export function loadCompactConservationAuthority(registry,{root=process.cwd()}={}){
  if(registry?.schema!=="verification-contract-compact-authorities-v1"||
      !Array.isArray(registry.authorities)||!registry.authorities.length){
    throw new Error("Compact authority registry is incomplete");
  }
  const first=registry.authorities[0];
  if(!same(first,{...compactAuthorityRoot,previousProjectionDigest:null,changedOwners:[]})){
    throw new Error("Compact authority registry root mismatch");
  }
  let previousDocument,previousProjectionDigest=null;
  const seen=new Set();
  for(const entry of registry.authorities){
    if(!sha40.test(entry.commit??"")||!sha64.test(entry.sha256??"")||
        !sha64.test(entry.projectionDigest??"")||seen.has(entry.commit)||
        entry.path!==compactAuthorityRoot.path||
        entry.previousProjectionDigest!==previousProjectionDigest||
        !Array.isArray(entry.changedOwners)||
        !same(entry.changedOwners,[...new Set(entry.changedOwners)].sort())){
      throw new Error("Compact authority registry chain is invalid");
    }
    try{git(root,"merge-base","--is-ancestor",entry.commit,"HEAD");}
    catch{throw new Error("Compact authority registry commit is not ancestral");}
    const bytes=git(root,"show",`${entry.commit}:${entry.path}`);
    if(sha256(bytes)!==entry.sha256)throw new Error("Compact authority fixture digest mismatch");
    const document=JSON.parse(bytes);
    if(digestValue(document.semanticProjection)!==entry.projectionDigest){
      throw new Error("Compact authority projection digest mismatch");
    }
    const changedOwners=previousDocument?
      changedCompactProjectionOwners(previousDocument,document):[];
    if(!same(changedOwners,entry.changedOwners)){
      throw new Error("Compact authority changed-owner declaration mismatch");
    }
    seen.add(entry.commit);previousDocument=document;
    previousProjectionDigest=entry.projectionDigest;
  }
  const result=Object.freeze({authority:registry.authorities.at(-1),document:previousDocument});
  authenticatedAuthorities.add(result);
  return result;
}

export function compactAuthorityDocument(authority){
  if(!authenticatedAuthorities.has(authority)){
    throw new Error("Compact conservation authority is not authenticated");
  }
  return authority.document;
}
