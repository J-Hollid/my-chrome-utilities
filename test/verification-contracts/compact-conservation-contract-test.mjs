import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";

import {
  compactConservationParity,
  createCompactConservation,
  refreshCompactConservation,
  validateCompactHistoricalOwnership,
  validateCompactConservation,
} from "../../scripts/verification-registry/compact-conservation.mjs";
import {
  canonicalVerificationContractGeneration,
  verificationContractSourceState,
} from "../../scripts/verification-registry/contract-conservation.mjs";
import {verificationProcessCompatibilitySuccessors} from
  "../../scripts/verification-policy/contracts.mjs";

const digest=(value)=>createHash("sha256").update(value).digest("hex");
const sourceCommit="4aea38cdf4899dc0a606215cc106ab743533c2fa";
const generatorPath="scripts/verification-registry/contract-conservation.mjs";
const [legacy,compactFixture,generatorSource,...sources]=await Promise.all([
  readFile("test/fixtures/verification-process-contract-conservation.json","utf8").then(JSON.parse),
  readFile("test/fixtures/verification-process-compact-conservation.json","utf8").then(JSON.parse),
  readFile(generatorPath,"utf8"),
  ...verificationProcessCompatibilitySuccessors.map((owner)=>readFile(owner,"utf8")),
]);
const sourcesByOwner=Object.fromEntries(verificationProcessCompatibilitySuccessors
  .map((owner,index)=>[owner,sources[index]]));
const state=verificationContractSourceState(sourcesByOwner);
const generator={path:generatorPath,digest:digest(generatorSource)};
const compatibility={transitions:legacy.transitions,ownerTransitions:legacy.ownerTransitions};
const compact=createCompactConservation({state,sourceCommit,generator,compatibility});
const generation=canonicalVerificationContractGeneration(state,{commit:sourceCommit},"parity");

assert.deepEqual(compactConservationParity(compact,generation),{
  normalizedOutputDigest:compact.normalizedOutputDigest,itemCount:compact.itemCount,
},"compact and legacy generation forms have exact normalized parity");
assert.deepEqual(compactFixture,compact,"the checked-in compact records are canonical");
assert.equal(compact.records.length,Object.keys(sourcesByOwner).length);
assert.deepEqual(compact.records.map(({boundaryIdentity:{owner}})=>owner),
  Object.keys(sourcesByOwner).sort(),"compact records have deterministic owner order");
for(const record of compact.records){
  assert.deepEqual(Object.keys(record).sort(),[
    "boundaryIdentity","generatorDigest","inputDigests","itemCount",
    "normalizedOutputDigest","schema","source",
  ]);
  assert.equal(record.source.commit,sourceCommit);
  assert.equal(record.generatorDigest,generator.digest);
  assert.equal(record.inputDigests.length,1);
}
for(const forbidden of ["inventory","generations","owners","provenance","totals"]){
  assert.equal(Object.hasOwn(compact,forbidden),false,
    "compact conservation contains no second complete registry snapshot");
}
assert.equal(validateCompactConservation(compact,state,{sourceCommit,generatorDigest:generator.digest}),true);

const withoutFirst={...compact,records:compact.records.slice(1)};
assert.throws(()=>validateCompactConservation(withoutFirst,state,{sourceCommit,
  generatorDigest:generator.digest}),/missing boundary/u);
const staleInput=structuredClone(compact);
staleInput.records[0].inputDigests[0].sha256="0".repeat(64);
assert.throws(()=>validateCompactConservation(staleInput,state,{sourceCommit,
  generatorDigest:generator.digest}),/stale boundary/u);
const wrongOutput=structuredClone(compact);
wrongOutput.records[0].normalizedOutputDigest="0".repeat(64);
assert.throws(()=>validateCompactConservation(wrongOutput,state,{sourceCommit,
  generatorDigest:generator.digest}),/output mismatch/u);
const selfAccepted=structuredClone(compact);
selfAccepted.generator.digest="0".repeat(64);
selfAccepted.records.forEach((record)=>{record.generatorDigest=selfAccepted.generator.digest;});
assert.throws(()=>validateCompactConservation(selfAccepted,state,{sourceCommit,
  generatorDigest:generator.digest}),/generator mismatch/u,
"a changed generator cannot accept its output by changing the expected digest");

const changedOwner=compact.records[0].boundaryIdentity.owner;
const changedState=verificationContractSourceState({...sourcesByOwner,
  [changedOwner]:`${sourcesByOwner[changedOwner]}\nassert.equal(true,true,"compact delta");\n`,
});
const refreshed=refreshCompactConservation(compact,changedState,{
  changedInputs:[changedOwner],sourceCommit,generator,
});
for(const prior of compact.records){
  const current=refreshed.records.find(({boundaryIdentity})=>
    boundaryIdentity.owner===prior.boundaryIdentity.owner);
  assert.equal(JSON.stringify(current)===JSON.stringify(prior),
    prior.boundaryIdentity.owner!==changedOwner,
  "only the changed input record is replaced");
}
assert.throws(()=>validateCompactConservation(refreshed,changedState,{sourceCommit,
  generatorDigest:generator.digest,baseDocument:compact,changedInputs:[]}),
  /unexplained record drift/u);
const ownerTransition=compact.compatibility.ownerTransitions[0];
const historical=validateCompactHistoricalOwnership(compact,[
  {status:"R",from:ownerTransition.fromOwner,to:ownerTransition.toOwners[0]},
  {status:"D",from:ownerTransition.fromOwner},
],Object.keys(sourcesByOwner));
assert.deepEqual(historical.map(({formerOwner,currentOwner})=>({formerOwner,currentOwner})),[
  {formerOwner:ownerTransition.fromOwner,currentOwner:ownerTransition.toOwners[0]},
  {formerOwner:ownerTransition.fromOwner,currentOwner:null},
]);
assert(historical.every(({requiredCompatibilityClosure})=>
  requiredCompatibilityClosure.length===ownerTransition.toOwners.length));
assert.throws(()=>validateCompactHistoricalOwnership(compact,[{
  status:"D",from:"test/verification-contracts/unknown-owner.mjs",
}],Object.keys(sourcesByOwner)),/unresolved historical owner/u);

console.log(JSON.stringify({verificationProcessCompactConservation:{
  exactParity:true,recordCount:compact.records.length,deterministic:true,
  noSnapshot:true,changedRecordCount:1,failClosed:true,
}}));
