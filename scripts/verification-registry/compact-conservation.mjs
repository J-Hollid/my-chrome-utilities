import {createHash} from "node:crypto";

import {canonicalVerificationContractGeneration} from "./contract-conservation.mjs";

const sha256=(value)=>createHash("sha256").update(value).digest("hex");
const canonicalValue=(value)=>Array.isArray(value)?value.map(canonicalValue):
  value&&typeof value==="object"?Object.fromEntries(Object.entries(value)
    .sort(([left],[right])=>left.localeCompare(right))
    .map(([key,nested])=>[key,canonicalValue(nested)])):value;
const digestValue=(value)=>sha256(JSON.stringify(canonicalValue(value)));
const itemCount=(leaves)=>Object.values(leaves)
  .reduce((count,items)=>count+items.length,0);

function recordFor(owner,state,{sourceCommit,generatorDigest}){
  const sourceDigest=state.sourceSha256.find((entry)=>entry.owner===owner)?.sha256;
  const leaves=state.leavesByOwner[owner];
  if(!sourceDigest||!leaves)throw new Error(`Compact conservation missing boundary ${owner}`);
  return {
    schema:"verification-contract-boundary-v1",
    source:{commit:sourceCommit},
    inputDigests:[{path:owner,sha256:sourceDigest}],
    generatorDigest,
    boundaryIdentity:{kind:"verification-contract-owner",owner},
    normalizedOutputDigest:digestValue(leaves),
    itemCount:itemCount(leaves),
  };
}

export function createCompactConservation({state,sourceCommit,generator,compatibility}){
  const owners=Object.keys(state?.leavesByOwner??{}).sort();
  if(!/^[a-f0-9]{40}$/u.test(sourceCommit??"")||
      typeof generator?.path!=="string"||!/^[a-f0-9]{64}$/u.test(generator?.digest??"")){
    throw new Error("Compact conservation identity is incomplete");
  }
  const generation=canonicalVerificationContractGeneration(state,{commit:sourceCommit},"compact");
  return {
    schema:"verification-contract-conservation-v1",
    source:{commit:sourceCommit},
    generator:structuredClone(generator),
    compatibility:structuredClone(compatibility),
    compatibilityDigest:digestValue(compatibility),
    records:owners.map((owner)=>recordFor(owner,state,{sourceCommit,
      generatorDigest:generator.digest})),
    normalizedOutputDigest:digestValue(generation.inventory),
    itemCount:Object.values(generation.inventory)
      .reduce((count,items)=>count+items.length,0),
  };
}

export function compactConservationParity(document,generation){
  const normalizedOutputDigest=digestValue(generation.inventory);
  const count=Object.values(generation.inventory)
    .reduce((total,items)=>total+items.length,0);
  if(document?.normalizedOutputDigest!==normalizedOutputDigest||document?.itemCount!==count){
    throw new Error("Compact conservation legacy parity mismatch");
  }
  return {normalizedOutputDigest,itemCount:count};
}

export function validateCompactConservation(document,state,{
  sourceCommit,generatorDigest,baseDocument,changedInputs=[],
}={}){
  if(document?.schema!=="verification-contract-conservation-v1"||
      document.source?.commit!==sourceCommit){
    throw new Error("Compact conservation source identity mismatch");
  }
  if(document.generator?.digest!==generatorDigest||
      document.records?.some((record)=>record.generatorDigest!==generatorDigest)){
    throw new Error("Compact conservation generator mismatch");
  }
  if(document.compatibilityDigest!==digestValue(document.compatibility)){
    throw new Error("Compact conservation compatibility mismatch");
  }
  const expected=createCompactConservation({state,sourceCommit,
    generator:{path:document.generator.path,digest:generatorDigest},
    compatibility:document.compatibility});
  const byOwner=new Map((document.records??[])
    .map((record)=>[record.boundaryIdentity?.owner,record]));
  for(const expectedRecord of expected.records){
    const owner=expectedRecord.boundaryIdentity.owner,actual=byOwner.get(owner);
    if(!actual)throw new Error(`Compact conservation missing boundary ${owner}`);
    if(actual.inputDigests?.[0]?.sha256!==expectedRecord.inputDigests[0].sha256){
      throw new Error(`Compact conservation stale boundary ${owner}`);
    }
    if(actual.normalizedOutputDigest!==expectedRecord.normalizedOutputDigest||
        actual.itemCount!==expectedRecord.itemCount){
      throw new Error(`Compact conservation output mismatch ${owner}`);
    }
  }
  if(byOwner.size!==expected.records.length||
      document.normalizedOutputDigest!==expected.normalizedOutputDigest||
      document.itemCount!==expected.itemCount){
    throw new Error("Compact conservation output mismatch");
  }
  if(baseDocument){
    const changed=new Set(changedInputs),prior=new Map(baseDocument.records
      .map((record)=>[record.boundaryIdentity.owner,record]));
    for(const record of document.records){
      const owner=record.boundaryIdentity.owner;
      if(JSON.stringify(record)!==JSON.stringify(prior.get(owner))&&!changed.has(owner)){
        throw new Error(`Compact conservation unexplained record drift ${owner}`);
      }
    }
  }
  return true;
}

export function refreshCompactConservation(document,state,{changedInputs,sourceCommit,generator}){
  const next=createCompactConservation({state,sourceCommit,generator,
    compatibility:document.compatibility});
  validateCompactConservation(next,state,{sourceCommit,generatorDigest:generator.digest,
    baseDocument:document,changedInputs});
  return next;
}

export function validateCompactHistoricalOwnership(document,changes,currentOwners){
  const current=new Set(currentOwners),transitions=document?.compatibility?.ownerTransitions??[];
  return changes.map(({status,from,to})=>{
    if(!["R","C","D"].includes(status)||typeof from!=="string"){
      throw new Error("Compact conservation historical change is invalid");
    }
    const transition=transitions.find(({fromOwner})=>fromOwner===from);
    const formerKnown=transition||document.records.some(({boundaryIdentity})=>
      boundaryIdentity.owner===from);
    if(!formerKnown)throw new Error(`Compact conservation unresolved historical owner ${from}`);
    const currentOwner=to&&current.has(to)?to:null;
    const requiredCompatibilityClosure=transition?.toOwners??[from];
    if(to&&!currentOwner&&!requiredCompatibilityClosure.includes(to)){
      throw new Error(`Compact conservation unresolved historical owner ${to}`);
    }
    return {status,formerOwner:from,currentOwner,requiredCompatibilityClosure};
  });
}
