#!/usr/bin/env node
import {readFile,rename,writeFile} from "node:fs/promises";

import {createCompactConservation} from
  "./verification-registry/compact-conservation.mjs";
import {compactGeneratorIdentity,legacyConservationSummary} from
  "./verification-registry/compact-conservation-identity.mjs";
import {verificationContractSourceState} from
  "./verification-registry/contract-conservation.mjs";
import {verificationProcessCompatibilitySuccessors} from
  "./verification-policy/contracts.mjs";

const outputPath="test/fixtures/verification-process-compact-conservation.json";
const legacyPath="test/fixtures/verification-process-contract-conservation.json";
const generatorPaths=["scripts/verification-registry/contract-conservation.mjs",
  "scripts/verification-registry/compact-conservation-identity.mjs",
  "scripts/verification-registry/compact-conservation.mjs",
  "scripts/generate-compact-conservation.mjs"];
const [legacy,...loaded]=await Promise.all([
  readFile(legacyPath,"utf8").then(JSON.parse),
  ...generatorPaths.map((entry)=>readFile(entry,"utf8")),
  ...verificationProcessCompatibilitySuccessors.map((owner)=>readFile(owner,"utf8")),
]);
const generatorSources=loaded.slice(0,generatorPaths.length);
const sources=loaded.slice(generatorPaths.length);
const compatibility={transitions:legacy.transitions,ownerTransitions:legacy.ownerTransitions};
const state=verificationContractSourceState(Object.fromEntries(
  verificationProcessCompatibilitySuccessors.map((owner,index)=>[owner,sources[index]])));
const document=createCompactConservation({state,
  generator:compactGeneratorIdentity(Object.fromEntries(generatorPaths
    .map((entry,index)=>[entry,generatorSources[index]]))),
  compatibility,legacyBaseline:legacyConservationSummary(legacy),
});
const stage=`${outputPath}.${process.pid}.tmp`;
await writeFile(stage,`${JSON.stringify(document,null,2)}\n`,{flag:"wx"});
await rename(stage,outputPath);
console.log(`${outputPath} ${document.records.length} records`);
