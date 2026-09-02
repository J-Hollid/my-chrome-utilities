#!/usr/bin/env node
import {createHash} from "node:crypto";
import {readFile,rename,writeFile} from "node:fs/promises";
import path from "node:path";

import {createCompactConservation} from
  "./verification-registry/compact-conservation.mjs";
import {verificationContractSourceState} from
  "./verification-registry/contract-conservation.mjs";
import {verificationProcessCompatibilitySuccessors} from
  "./verification-policy/contracts.mjs";

const sourceCommit=process.argv[2];
if(!/^[a-f0-9]{40}$/u.test(sourceCommit??"")){
  throw new Error("Use generate-compact-conservation.mjs <source-commit>");
}
const outputPath="test/fixtures/verification-process-compact-conservation.json";
const legacyPath="test/fixtures/verification-process-contract-conservation.json";
const generatorPath="scripts/verification-registry/contract-conservation.mjs";
const [generatorSource,...sources]=await Promise.all([
  readFile(generatorPath,"utf8"),
  ...verificationProcessCompatibilitySuccessors.map((owner)=>readFile(owner,"utf8")),
]);
let compatibility;
try{
  const current=JSON.parse(await readFile(outputPath,"utf8"));
  compatibility=current.compatibility;
}catch{
  const legacy=JSON.parse(await readFile(legacyPath,"utf8"));
  compatibility={transitions:legacy.transitions,ownerTransitions:legacy.ownerTransitions};
}
const state=verificationContractSourceState(Object.fromEntries(
  verificationProcessCompatibilitySuccessors.map((owner,index)=>[owner,sources[index]])));
const document=createCompactConservation({state,sourceCommit,
  generator:{path:generatorPath,digest:createHash("sha256").update(generatorSource).digest("hex")},
  compatibility,
});
const stage=`${outputPath}.${process.pid}.tmp`;
await writeFile(stage,`${JSON.stringify(document,null,2)}\n`,{flag:"wx"});
await rename(stage,outputPath);
console.log(`${outputPath} ${document.records.length} records`);
