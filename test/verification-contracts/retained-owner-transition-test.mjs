import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFile} from "node:fs/promises";
import {verificationPolicyContracts} from "../../scripts/verification-policy/contracts.mjs";
import {verificationContractSyntaxLeaves} from "../../scripts/verification-registry/contract-conservation.mjs";
import {retainedChildDispatchTransition,validateRetainedOwnerTransition} from "../../scripts/verification-registry/retained-owner-transition.mjs";
const declaration=structuredClone(retainedChildDispatchTransition);
const source=execFileSync("git",["cat-file","blob",declaration.sourceBlob],{encoding:"utf8"});
const start=source.indexOf("let childDispatchRepairEvidence;");
const end=source.indexOf("const changeRepository =",start);
const child=verificationContractSyntaxLeaves(source.slice(start,end),declaration.toOwner);
const parent=verificationContractSyntaxLeaves(source.slice(0,start)+source.slice(end),declaration.fromOwner);
const document={compatibility:{retainedOwnerTransitions:[declaration]}};
const state={leavesByOwner:{[declaration.fromOwner]:parent,[declaration.toOwner]:child}};
assert.equal(validateRetainedOwnerTransition(document,state),true);
assert.deepEqual(Object.fromEntries(Object.entries(child).map(([k,v])=>[k,v.length])),
  {assertions:8,fixtures:1,evidence:0});
for(const owner of [declaration.fromOwner,declaration.toOwner]){
 const lost=structuredClone(state);lost.leavesByOwner[owner].assertions.pop();
 assert.throws(()=>validateRetainedOwnerTransition(document,lost),/population/u);
}
const wrong=structuredClone(document);wrong.compatibility.retainedOwnerTransitions[0].authority.commit="0".repeat(40);
assert.throws(()=>validateRetainedOwnerTransition(wrong,state),/authority/u);
assert.throws(()=>validateRetainedOwnerTransition({compatibility:{}},state),/missing/u);
const duplicate=structuredClone(document);duplicate.compatibility.retainedOwnerTransitions.push(declaration);
assert.throws(()=>validateRetainedOwnerTransition(duplicate,state),/authority/u);
const contract=verificationPolicyContracts.find(({id})=>id==="historical_planning");
assert.equal(contract.retainsParent,true);
assert.deepEqual([...contract.testPaths],[declaration.fromOwner,declaration.toOwner]);
const packs=JSON.parse(await readFile("verification/packs.json","utf8"));
const slice=packs.find(({id})=>id==="verification_process").verificationSlices
  .find(({id})=>id==="historical_planning");
for(const owner of contract.testPaths){
  assert(slice.sourcePaths.includes(owner));
  assert(slice.tasks.includes(`unit:${owner}`));
}
console.log(JSON.stringify({retainedOwnerTransition:{authorized:true,parentRetained:true,childAssertions:8,childFixtures:1,lossRejected:true,wrongAuthorityRejected:true}}));
