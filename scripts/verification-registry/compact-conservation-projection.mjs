import {digestValue} from "./compact-conservation-identity.mjs";

const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);

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
