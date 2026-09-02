import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

import {
  compactConservationParity,
  createCompactConservation,
  refreshCompactConservation,
  validateCompactHistoricalOwnership,
  validateCompactConservation,
} from "../../scripts/verification-registry/compact-conservation.mjs";
import {compactGeneratorIdentity,legacyConservationSummary} from
  "../../scripts/verification-registry/compact-conservation-identity.mjs";
import {
  verificationContractSourceState,
} from "../../scripts/verification-registry/contract-conservation.mjs";
import {verificationProcessCompatibilitySuccessors} from
  "../../scripts/verification-policy/contracts.mjs";

const generatorPaths=["scripts/verification-registry/contract-conservation.mjs",
  "scripts/verification-registry/compact-conservation-identity.mjs",
  "scripts/verification-registry/compact-conservation.mjs",
  "scripts/generate-compact-conservation.mjs"];
const [legacy,compactFixture,...loaded]=await Promise.all([
  readFile("test/fixtures/verification-process-contract-conservation.json","utf8").then(JSON.parse),
  readFile("test/fixtures/verification-process-compact-conservation.json","utf8").then(JSON.parse),
  ...generatorPaths.map((entry)=>readFile(entry,"utf8")),
  ...verificationProcessCompatibilitySuccessors.map((owner)=>readFile(owner,"utf8")),
]);
const generatorSources=loaded.slice(0,generatorPaths.length);
const sources=loaded.slice(generatorPaths.length);
const sourcesByOwner=Object.fromEntries(verificationProcessCompatibilitySuccessors
  .map((owner,index)=>[owner,sources[index]]));
const state=verificationContractSourceState(sourcesByOwner);
const generator=compactGeneratorIdentity(Object.fromEntries(generatorPaths
  .map((entry,index)=>[entry,generatorSources[index]])));
const compatibility={transitions:legacy.transitions,ownerTransitions:legacy.ownerTransitions};
const legacyBaseline=legacyConservationSummary(legacy);
const compact=createCompactConservation({state,generator,compatibility,legacyBaseline});

assert.deepEqual(compactConservationParity(compact,legacy),{
  legacyDocumentDigest:legacyBaseline.documentDigest,
  generationCount:legacy.generations.length,
  compatibilityDigest:compact.compatibilityDigest,
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
  assert.deepEqual(record.source,{tree:record.inputDigests[0].sha256});
  assert.equal(record.generatorDigest,generator.digest);
  assert.equal(record.inputDigests.length,1);
}
for(const forbidden of ["inventory","generations","owners","provenance","totals"]){
  assert.equal(Object.hasOwn(compact,forbidden),false,
    "compact conservation contains no second complete registry snapshot");
}
assert.equal(validateCompactConservation(compact,state,{generator,legacyDocument:legacy}),true);

const withoutFirst={...compact,records:compact.records.slice(1)};
assert.throws(()=>validateCompactConservation(withoutFirst,state,{generator,
  legacyDocument:legacy}),/missing or unordered boundary/u);
const staleInput=structuredClone(compact);
staleInput.records[0].inputDigests[0].sha256="0".repeat(64);
assert.throws(()=>validateCompactConservation(staleInput,state,{generator,
  legacyDocument:legacy}),/record identity mismatch/u);
const wrongOutput=structuredClone(compact);
wrongOutput.records[0].normalizedOutputDigest="0".repeat(64);
assert.throws(()=>validateCompactConservation(wrongOutput,state,{generator,
  legacyDocument:legacy}),/output mismatch/u);
const selfAccepted=structuredClone(compact);
selfAccepted.generator.digest="0".repeat(64);
selfAccepted.records.forEach((record)=>{record.generatorDigest=selfAccepted.generator.digest;});
assert.throws(()=>validateCompactConservation(selfAccepted,state,{generator,
  legacyDocument:legacy}),/generator mismatch/u,
"a changed generator cannot accept its output by changing the expected digest");
assert.deepEqual(generator.inputs.map(({path})=>path),generatorPaths.slice().sort(),
  "the generator identity covers all compact generation logic");
for(const generatorPath of generatorPaths){
  const changedSources=Object.fromEntries(generatorPaths.map((entry,index)=>
    [entry,`${generatorSources[index]}${entry===generatorPath?"\n// changed\n":""}`]));
  assert.notEqual(compactGeneratorIdentity(changedSources).digest,generator.digest,
    `${generatorPath} changes the compact generator identity`);
}

for(const mutate of [
  (record)=>{record.schema="verification-contract-boundary-v2";},
  (record)=>{record.source.digest="0".repeat(64);},
  (record)=>{record.inputDigests[0].path="test/verification-contracts/other.mjs";},
]){
  const altered=structuredClone(compact);
  mutate(altered.records[0]);
  assert.throws(()=>validateCompactConservation(altered,state,{generator,
    legacyDocument:legacy}),/record identity mismatch/u,
  "altered record identity fails closed");
}
const duplicate=structuredClone(compact);
duplicate.records.push(structuredClone(duplicate.records[0]));
assert.throws(()=>validateCompactConservation(duplicate,state,{generator,
  legacyDocument:legacy}),/duplicate boundary/u,"duplicate owners fail closed");
const replacedCompatibility=createCompactConservation({state,generator,legacyBaseline,
  compatibility:{transitions:[],ownerTransitions:[]}});
assert.throws(()=>compactConservationParity(replacedCompatibility,legacy),/legacy parity mismatch/u,
  "candidate-authored compatibility cannot replace legacy authority");
assert.throws(()=>validateCompactConservation(replacedCompatibility,state,{generator,
  legacyDocument:legacy}),/legacy parity mismatch/u);
for(const section of ["owners","provenance","totals","inventory","transitions",
  "generations","ownerTransitions"]){
  const alteredLegacy=structuredClone(legacy);
  if(section==="generations")alteredLegacy.generations[0].id+="-probe";
  else if(Array.isArray(alteredLegacy[section]))
    alteredLegacy[section].push(structuredClone(alteredLegacy[section][0]));
  else alteredLegacy[section]={...alteredLegacy[section],probe:true};
  assert.notEqual(legacyConservationSummary(alteredLegacy).documentDigest,
    legacyBaseline.documentDigest,`${section} participates in legacy parity`);
}

const changedOwner=compact.records[0].boundaryIdentity.owner;
const changedState=verificationContractSourceState({...sourcesByOwner,
  [changedOwner]:`${sourcesByOwner[changedOwner]}\nassert.equal(true,true,"compact delta");\n`,
});
const refreshed=refreshCompactConservation(compact,changedState,{
  changedInputs:[changedOwner],generator,
});
for(const prior of compact.records){
  const current=refreshed.records.find(({boundaryIdentity})=>
    boundaryIdentity.owner===prior.boundaryIdentity.owner);
  assert.equal(JSON.stringify(current)===JSON.stringify(prior),
    prior.boundaryIdentity.owner!==changedOwner,
  "only the changed input record is replaced");
}
assert.equal(Object.hasOwn(refreshed,"source"),false,
  "candidate commits do not rewrite unchanged compact records");
assert.throws(()=>validateCompactConservation(refreshed,changedState,{generator,
  legacyDocument:legacy,baseDocument:compact,changedInputs:[]}),
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
