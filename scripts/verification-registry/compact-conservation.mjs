import {canonicalVerificationContractGeneration} from "./contract-conservation.mjs";
import {digestValue,legacyConservationSummary} from
  "./compact-conservation-identity.mjs";
import {validateLegacyToCompactProjection} from "./compact-conservation-projection.mjs";
const itemCount=(leaves)=>Object.values(leaves)
  .reduce((count,items)=>count+items.length,0);

const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);
const exactKeys=(value,keys)=>value&&typeof value==="object"&&!Array.isArray(value)&&
  same(Object.keys(value).sort(),[...keys].sort());

function recordFor(owner,state,{generatorDigest}){
  const sourceDigest=state.sourceSha256.find((entry)=>entry.owner===owner)?.sha256;
  const source=state.sourceObjects?.[owner];
  const leaves=state.leavesByOwner[owner];
  if(!sourceDigest||!source||!leaves)throw new Error(`Compact conservation missing boundary ${owner}`);
  return {
    schema:"verification-contract-boundary-v1",
    source:structuredClone(source),
    inputDigests:[{path:owner,sha256:sourceDigest}],
    generatorDigest,
    boundaryIdentity:{kind:"verification-contract-owner",owner},
    normalizedOutputDigest:digestValue(leaves),
    itemCount:itemCount(leaves),
  };
}

export function createCompactConservation({state,generator,compatibility,legacyBaseline,
  semanticProjection}){
  const owners=Object.keys(state?.leavesByOwner??{}).sort();
  if(generator?.schema!=="verification-contract-compact-generator-v1"||
      !Array.isArray(generator.inputs)||!/^[a-f0-9]{64}$/u.test(generator?.digest??"")||
      legacyBaseline?.schema!=="verification-contract-legacy-baseline-v1"){
    throw new Error("Compact conservation identity is incomplete");
  }
  const generation=canonicalVerificationContractGeneration(state,{kind:"compact"},"compact");
  return {
    schema:"verification-contract-conservation-v1",
    generator:structuredClone(generator),
    legacyBaseline:structuredClone(legacyBaseline),
    semanticProjection:structuredClone(semanticProjection),
    compatibility:structuredClone(compatibility),
    compatibilityDigest:digestValue(compatibility),
    records:owners.map((owner)=>recordFor(owner,state,{generatorDigest:generator.digest})),
    normalizedOutputDigest:digestValue(generation.inventory),
    itemCount:Object.values(generation.inventory)
      .reduce((count,items)=>count+items.length,0),
  };
}

export function compactConservationParity(document,legacyDocument,semanticProjection){
  const baseline=legacyConservationSummary(legacyDocument);
  const compatibility={transitions:legacyDocument.transitions,
    ownerTransitions:legacyDocument.ownerTransitions};
  if(!same(document?.legacyBaseline,baseline)||!same(document?.compatibility,compatibility)||
      document?.compatibilityDigest!==digestValue(compatibility)){
    throw new Error("Compact conservation legacy parity mismatch");
  }
  const projection=validateLegacyToCompactProjection(document,legacyDocument,semanticProjection);
  return {legacyDocumentDigest:baseline.documentDigest,
    generationCount:baseline.generations.length,
    compatibilityDigest:document.compatibilityDigest,...projection};
}

export function validateCompactConservation(document,state,{
  generator,legacyDocument,semanticProjection,baseDocument,changedInputs=[],
}={}){
  const documentKeys=["schema","generator","legacyBaseline","semanticProjection","compatibility",
    "compatibilityDigest","records","normalizedOutputDigest","itemCount"];
  if(document?.schema!=="verification-contract-conservation-v1"||
      !exactKeys(document,documentKeys)||!Array.isArray(document.records)){
    throw new Error("Compact conservation document shape mismatch");
  }
  if(!same(document.generator,generator)||
      document.records.some((record)=>record.generatorDigest!==generator?.digest)){
    throw new Error("Compact conservation generator mismatch");
  }
  if(legacyDocument)compactConservationParity(document,legacyDocument,semanticProjection);
  if(document.compatibilityDigest!==digestValue(document.compatibility)){
    throw new Error("Compact conservation compatibility mismatch");
  }
  const expected=createCompactConservation({state,generator,
    compatibility:document.compatibility,legacyBaseline:document.legacyBaseline,
    semanticProjection:document.semanticProjection});
  const recordKeys=["schema","source","inputDigests","generatorDigest","boundaryIdentity",
    "normalizedOutputDigest","itemCount"];
  const owners=document.records.map((record)=>record?.boundaryIdentity?.owner);
  if(new Set(owners).size!==owners.length)throw new Error("Compact conservation duplicate boundary");
  for(let index=0;index<expected.records.length;index+=1){
    const actual=document.records[index],expectedRecord=expected.records[index];
    const owner=expectedRecord.boundaryIdentity.owner;
    if(!actual||actual.boundaryIdentity?.owner!==owner)
      throw new Error(`Compact conservation missing or unordered boundary ${owner}`);
    if(!exactKeys(actual,recordKeys)||actual.schema!==expectedRecord.schema||
        !same(actual.source,expectedRecord.source)||
        !same(actual.inputDigests,expectedRecord.inputDigests)||
        !same(actual.boundaryIdentity,expectedRecord.boundaryIdentity))
      throw new Error(`Compact conservation record identity mismatch ${owner}`);
    if(!same(actual,expectedRecord))throw new Error(`Compact conservation output mismatch ${owner}`);
  }
  if(document.records.length!==expected.records.length||
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

export function refreshCompactConservation(document,state,{changedInputs,generator,semanticProjection}){
  const next=createCompactConservation({state,generator,
    compatibility:document.compatibility,legacyBaseline:document.legacyBaseline,
    semanticProjection});
  validateCompactConservation(next,state,{generator,
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
