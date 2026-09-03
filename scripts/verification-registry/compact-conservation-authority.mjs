import {execFileSync} from "node:child_process";

import {digestValue,sha256} from "./compact-conservation-identity.mjs";
import {changedCompactRecordOwners} from "./compact-conservation-projection.mjs";

export const compactAuthorityRoot=Object.freeze({
  commit:"b7b71a0253b8dcb5dd9be12243815749b1aea0fc",
  path:"test/fixtures/verification-process-compact-conservation.json",
  sha256:"e2358bfe8723ce5061e9f1389e150967546a1ce8ced55064cb233b6ea4588899",
  projectionDigest:"78277d946f30b8f3d3d95b6074653555dc95d609b50600f0fbd94f50407a49ef",
});
export const compactAuthorityAcceptedHead=Object.freeze({
  commit:"f16bbe4a7f15f64342b655e4a47c027482172847",
  path:"test/fixtures/verification-process-compact-conservation.json",
  sha256:"e07a5bd2527f8c9780c8d79c2d861b9ef24bf1fd81e5a0998bf5bce1f4bf6477",
  projectionDigest:"4c8050f63238cf00f4b4a0ddcf2c61fb365a532210a57e23b0eacd7395ac4ed3",
  previousProjectionDigest:"7b72b4022bd1147a0afd81bc400fa04935cd38cbb89076b5af955ea67294d5c2",
  changedOwners:[
    "test/verification-contracts/dependency-expansion-contract-test.mjs",
    "test/verification-contracts/evidence-promotion-blocked-aggregate-contract-test.mjs",
    "test/verification-contracts/evidence-promotion-conservation-contract-test.mjs",
    "test/verification-contracts/evidence-promotion-receipt-contract-test.mjs",
    "test/verification-contracts/execution-attempt-store-contract-test.mjs",
    "test/verification-contracts/execution-binding-contract-test.mjs",
    "test/verification-contracts/execution-cli-contention-contract-test.mjs",
    "test/verification-contracts/execution-coordinator-contract-test.mjs",
    "test/verification-contracts/execution-prerequisite-contract-test.mjs",
    "test/verification-contracts/execution-resume-contract-test.mjs",
    "test/verification-contracts/execution-runner-integration-contract-test.mjs",
    "test/verification-contracts/historical-planning-contract-test.mjs",
    "test/verification-contracts/ownership-capture-contract-test.mjs",
    "test/verification-contracts/ownership-core-contract-test.mjs",
    "test/verification-contracts/ownership-event-library-contract-test.mjs",
    "test/verification-contracts/ownership-priority-contract-test.mjs",
    "test/verification-contracts/ownership-schemas-contract-test.mjs",
    "test/verification-contracts/ownership-shell-contract-test.mjs",
    "test/verification-contracts/registry-browser-routing-contract-test.mjs",
    "test/verification-contracts/registry-core-contract-test.mjs",
    "test/verification-contracts/registry-durable-repository-contract-test.mjs",
    "test/verification-contracts/registry-editor-assets-contract-test.mjs",
    "test/verification-contracts/registry-project-management-contract-test.mjs",
    "test/verification-contracts/registry-reachability-contract-test.mjs",
    "test/verification-contracts/registry-style-boundary-contract-test.mjs",
    "test/verification-contracts/reliability-admission-contract-test.mjs",
    "test/verification-contracts/reliability-artifact-lock-contract-test.mjs",
    "test/verification-contracts/reliability-blocked-aggregate-contract-test.mjs",
    "test/verification-contracts/reliability-calibration-contract-test.mjs",
    "test/verification-contracts/reliability-capture-schema-contract-test.mjs",
    "test/verification-contracts/reliability-durable-event-contract-test.mjs",
    "test/verification-contracts/reliability-incident-store-contract-test.mjs",
    "test/verification-contracts/reliability-observation-contract-test.mjs",
    "test/verification-contracts/reliability-planner-contract-test.mjs",
    "test/verification-contracts/reliability-prerequisite-contract-test.mjs",
    "test/verification-contracts/reliability-project-contract-test.mjs",
    "test/verification-contracts/reliability-regression-routing-contract-test.mjs",
    "test/verification-contracts/reliability-shell-bootstrap-contract-test.mjs",
    "test/verification-contracts/reliability-succession-contract-test.mjs",
    "test/verification-contracts/reliability-terminal-policy-contract-test.mjs",
    "test/verification-contracts/task-batching-contract-test.mjs",
    "test/verification-contracts/timing-budget-contract-test.mjs",
    "test/verification-contracts/timing-calibration-contract-test.mjs",
    "test/verification-contracts/timing-ledger-contract-test.mjs",
    "test/verification-contracts/timing-scorecard-contract-test.mjs",
  ],
});
export const compactAuthorityAcceptedPrefixDigest=
  "8c2959fbad5d7d6743b080c25e10175bab405ea1e510fd380a48fa33f4acaec9";

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
  if(digestValue(registry.authorities)!==compactAuthorityAcceptedPrefixDigest){
    throw new Error("Compact authority registry accepted prefix mismatch");
  }
  if(!same(registry.authorities.at(-1),compactAuthorityAcceptedHead)){
    throw new Error("Compact authority registry accepted head mismatch");
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
      changedCompactRecordOwners(previousDocument,document):[];
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
