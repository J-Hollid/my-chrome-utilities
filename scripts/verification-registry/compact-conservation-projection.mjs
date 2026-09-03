import {digestValue} from "./compact-conservation-identity.mjs";

const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);
const recordsByOwner=(document)=>new Map((document?.records??[]).map((record)=>[
  record?.boundaryIdentity?.owner,record,
]));

export function compactProjectionOutputs(document){
  return Object.fromEntries((document?.records??[]).map((record)=>[
    record.boundaryIdentity?.owner,
    {normalizedOutputDigest:record.normalizedOutputDigest,itemCount:record.itemCount},
  ]));
}

export function changedCompactProjectionOwners(previousDocument,nextDocument){
  const previous=compactProjectionOutputs(previousDocument),next=compactProjectionOutputs(nextDocument);
  return [...new Set([...Object.keys(previous),...Object.keys(next)])].sort()
    .filter((owner)=>!same(previous[owner],next[owner]));
}

export function changedCompactRecordOwners(previousDocument,nextDocument){
  const previous=recordsByOwner(previousDocument),next=recordsByOwner(nextDocument);
  return [...new Set([...previous.keys(),...next.keys()])].sort()
    .filter((owner)=>!same(previous.get(owner),next.get(owner)));
}

export function changedCompactDeclaredInputOwners(previousDocument,nextDocument){
  const previous=recordsByOwner(previousDocument),next=recordsByOwner(nextDocument);
  const owners=[...new Set([...previous.keys(),...next.keys()])].sort();
  return owners.filter((owner)=>{
    const before=previous.get(owner),after=next.get(owner);
    return !before||!after||!same(before.source,after.source)||
      !same(before.inputDigests,after.inputDigests);
  });
}

export function validateCompactRecordDrift(document,baseDocument,changedInputs=[]){
  const current=recordsByOwner(document),base=recordsByOwner(baseDocument);
  const currentOwners=[...current.keys()],baseOwners=[...base.keys()];
  const missing=baseOwners.find((owner)=>!current.has(owner));
  if(missing)throw new Error(`Compact conservation missing boundary ${missing}`);
  const added=currentOwners.find((owner)=>!base.has(owner));
  if(added)throw new Error(`Compact conservation unexpected boundary ${added}`);
  const changed=new Set(changedInputs);
  const generatorChanged=document?.generator?.digest!==baseDocument?.generator?.digest;
  const driftRecord=(record)=>generatorChanged&&record?
    Object.fromEntries(Object.entries(record).filter(([key])=>key!=="generatorDigest")):record;
  for(const owner of currentOwners){
    if(!same(driftRecord(current.get(owner)),driftRecord(base.get(owner)))&&!changed.has(owner)){
      throw new Error(`Compact conservation unexplained record drift ${owner}`);
    }
  }
  return true;
}

export function validateCompactSemanticProjection(document,authorityDocument){
  const projection=authorityDocument?.semanticProjection;
  if(!projection||!same(document?.semanticProjection,projection)){
    throw new Error("Compact semantic projection authority mismatch");
  }
  const baseline=new Map(projection.baselineRecords?.map((entry)=>[entry.owner,entry])??[]);
  const replacements=new Map(projection.replacements?.map((entry)=>[entry.owner,entry])??[]);
  if(baseline.size!==projection.baselineRecords?.length||
      replacements.size!==projection.replacements?.length){
    throw new Error("Compact semantic projection duplicate owner");
  }
  const records=new Map(document.records.map((record)=>[record.boundaryIdentity.owner,record]));
  for(const [owner,{owner:declaredOwner,...from}] of baseline){
    if(owner!==declaredOwner)throw new Error(`Compact semantic projection baseline mismatch ${owner}`);
    const replacement=replacements.get(owner);
    if(replacement&&!same(replacement.from,from)){
      throw new Error(`Compact semantic projection baseline mismatch ${owner}`);
    }
    const expected=replacement?.to??from,record=records.get(owner);
    if(!record||record.normalizedOutputDigest!==expected.normalizedOutputDigest||
        record.itemCount!==expected.itemCount){
      throw new Error(`Compact semantic projection output mismatch ${owner}`);
    }
  }
  if(records.size!==baseline.size||[...replacements.keys()].some((owner)=>!baseline.has(owner))||
      document.normalizedOutputDigest!==projection.projectedNormalizedOutputDigest||
      document.itemCount!==projection.projectedItemCount){
    throw new Error("Compact semantic projection aggregate mismatch");
  }
  return {projectionDigest:digestValue(projection),replacementCount:replacements.size};
}
