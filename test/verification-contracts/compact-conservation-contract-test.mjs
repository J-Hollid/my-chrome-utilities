import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFile} from "node:fs/promises";

import {
  compactConservationParity,
  createCompactConservation,
  refreshCompactConservation,
  validateCompactHistoricalOwnership,
  validateCompactConservation,
} from "../../scripts/verification-registry/compact-conservation.mjs";
import {compactGeneratorIdentity,compactGitBlobIdentity} from
  "../../scripts/verification-registry/compact-conservation-identity.mjs";
import {compactAuthorityDocument,loadCompactConservationAuthority} from
  "../../scripts/verification-registry/compact-conservation-authority.mjs";
import {compactGeneratorPaths} from
  "../../scripts/verification-registry/compact-conservation-command.mjs";
import {
  verificationContractSourceState,
} from "../../scripts/verification-registry/contract-conservation.mjs";
import {verificationProcessCompatibilitySuccessors} from
  "../../scripts/verification-policy/contracts.mjs";

const [authorityRegistry,compactFixture,...loaded]=await Promise.all([
  readFile("verification/compact-conservation-authorities.json","utf8").then(JSON.parse),
  readFile("test/fixtures/verification-process-compact-conservation.json","utf8").then(JSON.parse),
  ...compactGeneratorPaths.map((entry)=>readFile(entry,"utf8")),
  ...verificationProcessCompatibilitySuccessors.map((owner)=>readFile(owner,"utf8")),
]);
const generatorSources=loaded.slice(0,compactGeneratorPaths.length);
const sources=loaded.slice(compactGeneratorPaths.length);
const sourcesByOwner=Object.fromEntries(verificationProcessCompatibilitySuccessors
  .map((owner,index)=>[owner,sources[index]]));
const state={...verificationContractSourceState(sourcesByOwner),
  sourceObjects:Object.fromEntries(Object.entries(sourcesByOwner)
    .map(([owner,source])=>[owner,compactGitBlobIdentity(source)]))};
const generator=compactGeneratorIdentity(Object.fromEntries(compactGeneratorPaths
  .map((entry,index)=>[entry,generatorSources[index]])));
const authority=loadCompactConservationAuthority(authorityRegistry);
const authorizedCompact=compactAuthorityDocument(authority);
const compact=createCompactConservation({state,generator,
  compatibility:authorizedCompact.compatibility,
  legacyBaseline:authorizedCompact.legacyBaseline,
  semanticProjection:authorizedCompact.semanticProjection});

const parity=compactConservationParity(compact,authority);
assert.deepEqual(parity,{
  legacyDocumentDigest:compact.legacyBaseline.documentDigest,
  generationCount:compact.legacyBaseline.generations.length,
  compatibilityDigest:compact.compatibilityDigest,
  projectionDigest:parity.projectionDigest,
  replacementCount:17,
},"compact baseline includes every legacy conservation section");
assert.deepEqual(compactFixture,compact,"the checked-in compact records are canonical");
assert.equal(compact.records.length,Object.keys(sourcesByOwner).length);
assert.deepEqual(compact.records.map(({boundaryIdentity:{owner}})=>owner),
  Object.keys(sourcesByOwner).sort(),"compact records have deterministic owner order");
for(const record of compact.records){
  assert.deepEqual(Object.keys(record).sort(),[
    "boundaryIdentity","generatorDigest","inputDigests","itemCount",
    "normalizedOutputDigest","schema","source",
  ]);
  assert.deepEqual(record.source,compactGitBlobIdentity(sourcesByOwner[record.boundaryIdentity.owner]));
  assert.equal(record.source.blob,execFileSync("git",["hash-object",
    record.boundaryIdentity.owner],{encoding:"utf8"}).trim(),
  "record source is a real Git blob identity");
  assert.equal(record.generatorDigest,generator.digest);
  assert.equal(record.inputDigests.length,1);
}
for(const forbidden of ["inventory","generations","owners","provenance","totals"]){
  assert.equal(Object.hasOwn(compact,forbidden),false,
    "compact conservation contains no second complete registry snapshot");
}
assert.equal(validateCompactConservation(compact,state,{generator,authority}),true);

const withoutFirst={...compact,records:compact.records.slice(1)};
assert.throws(()=>validateCompactConservation(withoutFirst,state,{generator,
  authority}),/semantic projection|missing or unordered boundary/u);
const staleInput=structuredClone(compact);
staleInput.records[0].inputDigests[0].sha256="0".repeat(64);
assert.throws(()=>validateCompactConservation(staleInput,state,{generator,
  authority}),/record identity mismatch/u);
const wrongOutput=structuredClone(compact);
wrongOutput.records[0].normalizedOutputDigest="0".repeat(64);
assert.throws(()=>validateCompactConservation(wrongOutput,state,{generator,
  authority}),/semantic projection output mismatch/u);
const selfAccepted=structuredClone(compact);
selfAccepted.generator.digest="0".repeat(64);
selfAccepted.records.forEach((record)=>{record.generatorDigest=selfAccepted.generator.digest;});
assert.throws(()=>validateCompactConservation(selfAccepted,state,{generator,
  authority}),/generator mismatch/u,
"a changed generator cannot accept its output by changing the expected digest");
assert.deepEqual(generator.inputs.map(({path})=>path),compactGeneratorPaths.slice().sort(),
  "the generator identity covers all compact generation logic");
for(const generatorPath of compactGeneratorPaths){
  const changedSources=Object.fromEntries(compactGeneratorPaths.map((entry,index)=>
    [entry,`${generatorSources[index]}${entry===generatorPath?"\n// changed\n":""}`]));
  assert.notEqual(compactGeneratorIdentity(changedSources).digest,generator.digest,
    `${generatorPath} changes the compact generator identity`);
}

for(const mutate of [
  (record)=>{record.schema="verification-contract-boundary-v2";},
  (record)=>{record.source.blob="0".repeat(40);},
  (record)=>{record.inputDigests[0].path="test/verification-contracts/other.mjs";},
]){
  const altered=structuredClone(compact);
  mutate(altered.records[0]);
  assert.throws(()=>validateCompactConservation(altered,state,{generator,
    authority}),/record identity mismatch/u,
  "altered record identity fails closed");
}
const duplicate=structuredClone(compact);
duplicate.records.push(structuredClone(duplicate.records[0]));
assert.throws(()=>validateCompactConservation(duplicate,state,{generator,
  authority}),/semantic projection|duplicate boundary/u,
"duplicate owners fail closed");
const replacedCompatibility=createCompactConservation({state,generator,
  legacyBaseline:authorizedCompact.legacyBaseline,
  semanticProjection:authorizedCompact.semanticProjection,
  compatibility:{transitions:[],ownerTransitions:[]}});
assert.throws(()=>compactConservationParity(replacedCompatibility,authority),
  /legacy parity mismatch/u,
  "candidate-authored compatibility cannot replace legacy authority");
assert.throws(()=>validateCompactConservation(replacedCompatibility,state,{generator,
  authority}),/legacy parity mismatch/u);
const alteredAuthorityRegistry=structuredClone(authorityRegistry);
alteredAuthorityRegistry.authorities[0].sha256="0".repeat(64);
assert.throws(()=>loadCompactConservationAuthority(alteredAuthorityRegistry),
  /root mismatch|fixture digest/u,"authority history fails closed");
assert.throws(()=>compactConservationParity(compact,{}),/not authenticated/u,
  "callers cannot supply an arbitrary projection authority");

const changedOwner=compact.records[0].boundaryIdentity.owner;
const changedSourcesByOwner={...sourcesByOwner,
  [changedOwner]:`${sourcesByOwner[changedOwner]}\nassert.equal(true,true,"compact delta");\n`};
const changedState={...verificationContractSourceState(changedSourcesByOwner),
  sourceObjects:Object.fromEntries(Object.entries(changedSourcesByOwner)
    .map(([owner,source])=>[owner,compactGitBlobIdentity(source)]))};
const changedCandidate=createCompactConservation({state:changedState,generator,
  compatibility:authorizedCompact.compatibility,
  legacyBaseline:authorizedCompact.legacyBaseline,
  semanticProjection:authorizedCompact.semanticProjection});
for(const prior of compact.records){
  const current=changedCandidate.records.find(({boundaryIdentity})=>
    boundaryIdentity.owner===prior.boundaryIdentity.owner);
  assert.equal(JSON.stringify(current)===JSON.stringify(prior),
    prior.boundaryIdentity.owner!==changedOwner,
  "only the changed input record is replaced");
}
assert.equal(Object.hasOwn(changedCandidate,"source"),false,
  "candidate commits do not rewrite unchanged compact records");
assert.throws(()=>refreshCompactConservation(compact,changedState,{
  changedInputs:[changedOwner],generator,authority,
}),/semantic projection output mismatch/u,
"one-owner refresh requires a new ancestral authority entry");
assert.throws(()=>compactConservationParity(changedCandidate,authority),
  /semantic projection output mismatch/u,
"a self-consistent changed owner cannot bypass the authorized semantic projection");
assert.throws(()=>validateCompactConservation(changedCandidate,changedState,{generator,
  authority}),/semantic projection output mismatch/u);
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
