import {readFile,rename,writeFile} from "node:fs/promises";
import path from "node:path";

import {createCompactConservation} from "./compact-conservation.mjs";
import {compactAuthorityDocument,loadCompactConservationAuthority} from
  "./compact-conservation-authority.mjs";
import {compactGeneratorIdentity,compactGitBlobIdentity} from
  "./compact-conservation-identity.mjs";
import {verificationContractSourceState} from "./contract-conservation.mjs";
import {verificationProcessCompatibilitySuccessors} from
  "../verification-policy/contracts.mjs";

export const compactGeneratorPaths=Object.freeze([
  "scripts/verification-registry/contract-conservation.mjs",
  "scripts/verification-registry/compact-conservation-authority.mjs",
  "scripts/verification-registry/compact-conservation-command.mjs",
  "scripts/verification-registry/compact-conservation-identity.mjs",
  "scripts/verification-registry/compact-conservation.mjs",
  "scripts/verification-registry/compact-conservation-projection.mjs",
  "scripts/generate-compact-conservation.mjs",
]);

const outputPath="test/fixtures/verification-process-compact-conservation.json";
const authorityPath="verification/compact-conservation-authorities.json";

async function compactDocument(root){
  const [authorityRegistry,...loaded]=await Promise.all([
    readFile(path.join(root,authorityPath),"utf8").then(JSON.parse),
    ...compactGeneratorPaths.map((entry)=>readFile(path.join(root,entry),"utf8")),
    ...verificationProcessCompatibilitySuccessors
      .map((owner)=>readFile(path.join(root,owner),"utf8")),
  ]);
  const generatorSources=loaded.slice(0,compactGeneratorPaths.length);
  const sources=loaded.slice(compactGeneratorPaths.length);
  const sourcesByOwner=Object.fromEntries(verificationProcessCompatibilitySuccessors
    .map((owner,index)=>[owner,sources[index]]));
  const state={...verificationContractSourceState(sourcesByOwner),
    sourceObjects:Object.fromEntries(Object.entries(sourcesByOwner)
      .map(([owner,source])=>[owner,compactGitBlobIdentity(source)]))};
  const authority=loadCompactConservationAuthority(authorityRegistry,{root});
  const authorized=compactAuthorityDocument(authority);
  return createCompactConservation({state,
    generator:compactGeneratorIdentity(Object.fromEntries(compactGeneratorPaths
      .map((entry,index)=>[entry,generatorSources[index]]))),
    compatibility:authorized.compatibility,legacyBaseline:authorized.legacyBaseline,
    semanticProjection:authorized.semanticProjection});
}

export async function runCompactConservationCommand(args,{root=process.cwd()}={}){
  if(!Array.isArray(args)||args.length!==1||!["check","refresh"].includes(args[0])){
    throw new Error("Use generate-compact-conservation.mjs check|refresh");
  }
  const document=await compactDocument(root),target=path.join(root,outputPath);
  const bytes=`${JSON.stringify(document,null,2)}\n`;
  if(args[0]==="check"){
    const current=await readFile(target,"utf8");
    return {changed:current!==bytes,recordCount:document.records.length};
  }
  const stage=`${target}.${process.pid}.tmp`;
  await writeFile(stage,bytes,{flag:"wx"});
  await rename(stage,target);
  return {changed:false,recordCount:document.records.length};
}
