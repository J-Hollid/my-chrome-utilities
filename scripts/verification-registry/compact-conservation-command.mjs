import {readFile,rename,writeFile} from "node:fs/promises";
import path from "node:path";

import {createCompactConservation,validateCompactConservation} from
  "./compact-conservation.mjs";
import {compactAuthorityDocument,loadCompactConservationAuthority} from
  "./compact-conservation-authority.mjs";
import {compactGeneratorIdentity,compactGitBlobIdentity} from
  "./compact-conservation-identity.mjs";
import {verificationContractSourceState} from "./contract-conservation.mjs";
import {changedCompactDeclaredInputOwners,validateCompactRecordDrift} from
  "./compact-conservation-projection.mjs";
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

async function compactContext(root,read){
  const target=path.join(root,outputPath);
  const [authorityRegistry,currentBytes,...loaded]=await Promise.all([
    read(path.join(root,authorityPath),"utf8").then(JSON.parse),
    read(target,"utf8"),
    ...compactGeneratorPaths.map((entry)=>read(path.join(root,entry),"utf8")),
    ...verificationProcessCompatibilitySuccessors
      .map((owner)=>read(path.join(root,owner),"utf8")),
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
  const generator=compactGeneratorIdentity(Object.fromEntries(compactGeneratorPaths
    .map((entry,index)=>[entry,generatorSources[index]])));
  const next=createCompactConservation({state,
    generator,
    compatibility:authorized.compatibility,legacyBaseline:authorized.legacyBaseline,
    semanticProjection:authorized.semanticProjection});
  const changedInputs=changedCompactDeclaredInputOwners(authorized,next);
  validateCompactRecordDrift(JSON.parse(currentBytes),authorized,changedInputs);
  validateCompactConservation(next,state,{generator,authority,
    baseDocument:authorized,changedInputs});
  return {authority,authorized,changedInputs,currentBytes,generator,next,state,target};
}

async function writeAtomic(target,bytes){
  const stage=`${target}.${process.pid}.tmp`;
  await writeFile(stage,bytes,{flag:"wx"});
  await rename(stage,target);
}

export async function runCompactConservationCommand(args,{
  root=process.cwd(),read=readFile,write=writeAtomic,
}={}){
  if(!Array.isArray(args)||args.length!==1||!["check","refresh"].includes(args[0])){
    throw new Error("Use generate-compact-conservation.mjs check|refresh");
  }
  const context=await compactContext(root,read);
  const {authority,changedInputs,currentBytes,generator,next,state,target}=context;
  const bytes=`${JSON.stringify(next,null,2)}\n`,changed=currentBytes!==bytes;
  if(args[0]==="check"){
    try{validateCompactConservation(JSON.parse(currentBytes),state,{generator,authority,
      baseDocument:context.authorized,changedInputs});}
    catch(error){
      if(/identity mismatch|generator mismatch/u.test(error.message)){
        throw new Error(`Compact conservation record is stale: ${error.message}`);
      }
      if(/output mismatch|semantic projection/u.test(error.message)){
        throw new Error(`Compact conservation output mismatch: ${error.message}`);
      }
      throw error;
    }
    if(changed)throw new Error("Compact conservation file is stale");
    return {changed:false,recordCount:next.records.length};
  }
  if(changed)await write(target,bytes);
  return {changed,recordCount:next.records.length};
}
