#!/usr/bin/env node
import {execFileSync} from "node:child_process";
import {readFile,rename,writeFile} from "node:fs/promises";

import {createCompactConservation} from
  "./verification-registry/compact-conservation.mjs";
import {compactGeneratorIdentity,compactGitBlobIdentity,legacyConservationSummary} from
  "./verification-registry/compact-conservation-identity.mjs";
import {compactProjectionAuthority,createLegacyToCompactProjection,
  verifyCompactProjectionAuthority} from
  "./verification-registry/compact-conservation-projection.mjs";
import {verificationContractSourceState} from
  "./verification-registry/contract-conservation.mjs";
import {verificationProcessCompatibilitySuccessors} from
  "./verification-policy/contracts.mjs";

const outputPath="test/fixtures/verification-process-compact-conservation.json";
const legacyPath="test/fixtures/verification-process-contract-conservation.json";
const generatorPaths=["scripts/verification-registry/contract-conservation.mjs",
  "scripts/verification-registry/compact-conservation-identity.mjs",
  "scripts/verification-registry/compact-conservation.mjs",
  "scripts/verification-registry/compact-conservation-projection.mjs",
  "scripts/generate-compact-conservation.mjs"];
const [legacy,...loaded]=await Promise.all([
  readFile(legacyPath,"utf8").then(JSON.parse),
  ...generatorPaths.map((entry)=>readFile(entry,"utf8")),
  ...verificationProcessCompatibilitySuccessors.map((owner)=>readFile(owner,"utf8")),
]);
const generatorSources=loaded.slice(0,generatorPaths.length);
const sources=loaded.slice(generatorPaths.length);
const compatibility={transitions:legacy.transitions,ownerTransitions:legacy.ownerTransitions};
const sourcesByOwner=Object.fromEntries(verificationProcessCompatibilitySuccessors
  .map((owner,index)=>[owner,sources[index]]));
const state={...verificationContractSourceState(sourcesByOwner),
  sourceObjects:Object.fromEntries(Object.entries(sourcesByOwner)
    .map(([owner,source])=>[owner,compactGitBlobIdentity(source)]))};
const authorityBytes=execFileSync("git",["show",
  `${compactProjectionAuthority.commit}:${compactProjectionAuthority.path}`],{encoding:null});
const authorizedCompact=verifyCompactProjectionAuthority(authorityBytes);
const semanticProjection=createLegacyToCompactProjection(legacy,authorizedCompact);
const document=createCompactConservation({state,
  generator:compactGeneratorIdentity(Object.fromEntries(generatorPaths
    .map((entry,index)=>[entry,generatorSources[index]]))),
  compatibility,legacyBaseline:legacyConservationSummary(legacy),semanticProjection,
});
const stage=`${outputPath}.${process.pid}.tmp`;
await writeFile(stage,`${JSON.stringify(document,null,2)}\n`,{flag:"wx"});
await rename(stage,outputPath);
console.log(`${outputPath} ${document.records.length} records`);
