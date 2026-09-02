import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import path from "node:path";
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
import {compactGeneratorPaths,runCompactConservationCommand} from
  "../../scripts/verification-registry/compact-conservation-command.mjs";
import {changedCompactRecordOwners} from
  "../../scripts/verification-registry/compact-conservation-projection.mjs";
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
const shellManifest=JSON.parse(await readFile("verification/manifests/shell.json","utf8"));
assert.ok(!shellManifest.pack.verificationHelpers.some(({path:helperPath})=>
  helperPath==="test/support/verification-contract-conservation.mjs"),
"compact retirement removes the stale legacy helper declaration");
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
  replacementCount:18,
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
for(const [name,mutate] of [
  ["truncation",(registry)=>registry.authorities.pop()],
  ["removal",(registry)=>registry.authorities.splice(1,1)],
  ["replacement",(registry)=>{registry.authorities[1].sha256="0".repeat(64);}],
  ["reorder",(registry)=>{[registry.authorities[1],registry.authorities[2]]=
    [registry.authorities[2],registry.authorities[1]];}],
]){
  const altered=structuredClone(authorityRegistry);
  mutate(altered);
  assert.throws(()=>loadCompactConservationAuthority(altered),
    /accepted prefix|accepted head|chain|fixture digest|previous projection/u,
    `authority ${name} fails closed`);
}
const sameBytesCommitReplacement=structuredClone(authorityRegistry);
sameBytesCommitReplacement.authorities[1].commit=
  "894ef1eacb82ed32afacc7eae2db3df814234f41";
assert.throws(()=>loadCompactConservationAuthority(sameBytesCommitReplacement),
  /accepted prefix/u,
  "the accepted prefix binds an intermediate commit even when fixture bytes match");
const selfAuthorizedParent=structuredClone(authorityRegistry);
selfAuthorizedParent.authorities.push({...selfAuthorizedParent.authorities.at(-1),
  commit:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),
  projectionDigest:"f".repeat(64)});
assert.throws(()=>loadCompactConservationAuthority(selfAuthorizedParent),
  /accepted prefix|accepted head/u,
  "a candidate-authored parent cannot authorize a new semantic projection");
assert.throws(()=>compactConservationParity(compact,{}),/not authenticated/u,
  "callers cannot supply an arbitrary projection authority");

for(let index=1;index<authorityRegistry.authorities.length;index+=1){
  const previous=JSON.parse(execFileSync("git",["show",
    `${authorityRegistry.authorities[index-1].commit}:${authorityRegistry.authorities[index-1].path}`]));
  const current=JSON.parse(execFileSync("git",["show",
    `${authorityRegistry.authorities[index].commit}:${authorityRegistry.authorities[index].path}`]));
  assert.deepEqual(authorityRegistry.authorities[index].changedOwners,
    changedCompactRecordOwners(previous,current),
    "authority changed owners bind complete record bytes and declared inputs");
}

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

const commandTarget=path.resolve("test/fixtures/verification-process-compact-conservation.json");
const changedCommandOwner="test/verification-contracts/reliability-succession-contract-test.mjs";
let commandFixture=`${JSON.stringify(compactFixture,null,2)}\n`,writes=0;
const commandRead=async(file,encoding)=>{
  const resolved=path.resolve(file);
  if(resolved===commandTarget)return commandFixture;
  const source=await readFile(file,encoding);
  return resolved===path.resolve(changedCommandOwner)?`${source}\n// identity-only change\n`:source;
};
const commandWrite=async(target,bytes)=>{
  assert.equal(path.resolve(target),commandTarget);
  commandFixture=bytes;writes+=1;
};
const staleCommandFixture=structuredClone(compactFixture);
staleCommandFixture.records[0].normalizedOutputDigest="0".repeat(64);
await assert.rejects(()=>runCompactConservationCommand(["check"],{
  read:async(file,encoding)=>path.resolve(file)===commandTarget?
    `${JSON.stringify(staleCommandFixture,null,2)}\n`:readFile(file,encoding),
}),/unexplained record drift/u,"command check rejects undeclared record drift");
const missingCommandFixture=structuredClone(compactFixture);
missingCommandFixture.records.shift();
await assert.rejects(()=>runCompactConservationCommand(["check"],{
  read:async(file,encoding)=>path.resolve(file)===commandTarget?
    `${JSON.stringify(missingCommandFixture,null,2)}\n`:readFile(file,encoding),
}),/missing.*boundary/u,"command check rejects a missing record");
await assert.rejects(()=>runCompactConservationCommand(["check"],{read:commandRead}),
  /stale/u,"command check rejects a record that is stale for its source input");
assert.deepEqual(await runCompactConservationCommand(["refresh"],{
  read:commandRead,write:commandWrite}),{changed:true,recordCount:compact.records.length});
assert.equal(writes,1,"authorized refresh writes one compact document");
const refreshedCommandFixture=JSON.parse(commandFixture);
assert.deepEqual(changedCompactRecordOwners(compactFixture,refreshedCommandFixture),
  [changedCommandOwner],"authorized refresh changes exactly one complete record");
assert.deepEqual(await runCompactConservationCommand(["refresh"],{
  read:commandRead,write:commandWrite}),{changed:false,recordCount:compact.records.length});
assert.equal(writes,1,"an unchanged refresh does not write again");
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
