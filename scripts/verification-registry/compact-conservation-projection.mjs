import {digestValue,sha256} from "./compact-conservation-identity.mjs";

export const compactProjectionAuthority=Object.freeze({
  commit:"767c100083ab1ac6a015cb6e8fad3de80cf1d76f",
  path:"test/fixtures/verification-process-compact-conservation.json",
  sha256:"7eefc8f2df82183af1765748149c183fa9cc11e3cc8d683f5ec73c06837f5dbc",
});

const kinds=["assertions","fixtures","evidence"];
const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);
const count=(leaves)=>Object.values(leaves).reduce((total,items)=>total+items.length,0);

function generationLeavesByOwner(generation){
  const owners=generation.ownerSources.map(({owner})=>owner).sort();
  return Object.fromEntries(owners.map((owner)=>[owner,Object.fromEntries(kinds.map((kind)=>[
    kind,generation.inventory[kind].filter((entry)=>entry.owner===owner)
      .sort((left,right)=>left.occurrence-right.occurrence).map(({leaf})=>leaf),
  ]))]));
}

export function verifyCompactProjectionAuthority(bytes){
  if(sha256(bytes)!==compactProjectionAuthority.sha256){
    throw new Error("Compact semantic projection authority mismatch");
  }
  return JSON.parse(bytes);
}

export function createLegacyToCompactProjection(legacyDocument,authorizedCompactDocument){
  const generation=legacyDocument?.generations?.at(-1);
  if(!generation||!Array.isArray(authorizedCompactDocument?.records)){
    throw new Error("Compact semantic projection source is incomplete");
  }
  const baseline=generationLeavesByOwner(generation);
  const records=new Map(authorizedCompactDocument.records.map((record)=>
    [record.boundaryIdentity?.owner,record]));
  const owners=Object.keys(baseline).sort();
  if(records.size!==owners.length||owners.some((owner)=>!records.has(owner))){
    throw new Error("Compact semantic projection owner set mismatch");
  }
  const replacements=owners.flatMap((owner)=>{
    const from={normalizedOutputDigest:digestValue(baseline[owner]),itemCount:count(baseline[owner])};
    const record=records.get(owner);
    const to={normalizedOutputDigest:record.normalizedOutputDigest,itemCount:record.itemCount};
    return same(from,to)?[]:[{owner,from,to}];
  });
  return {
    schema:"verification-contract-legacy-to-compact-projection-v1",
    authority:structuredClone(compactProjectionAuthority),
    sourceGeneration:{id:generation.id,inventoryDigest:digestValue(generation.inventory),
      ownerSourcesDigest:digestValue(generation.ownerSources)},
    ownerTransitionsDigest:digestValue(legacyDocument.ownerTransitions),
    baselineRecords:owners.map((owner)=>({owner,
      normalizedOutputDigest:digestValue(baseline[owner]),itemCount:count(baseline[owner])})),
    replacements,
    projectedNormalizedOutputDigest:authorizedCompactDocument.normalizedOutputDigest,
    projectedItemCount:authorizedCompactDocument.itemCount,
  };
}

export function validateLegacyToCompactProjection(document,legacyDocument,authorizedProjection){
  if(!same(document?.semanticProjection,authorizedProjection)){
    throw new Error("Compact semantic projection authority mismatch");
  }
  const generation=legacyDocument?.generations?.at(-1);
  const baseline=generationLeavesByOwner(generation);
  if(authorizedProjection.sourceGeneration.id!==generation.id||
      authorizedProjection.sourceGeneration.inventoryDigest!==digestValue(generation.inventory)||
      authorizedProjection.sourceGeneration.ownerSourcesDigest!==digestValue(generation.ownerSources)||
      authorizedProjection.ownerTransitionsDigest!==digestValue(legacyDocument.ownerTransitions)){
    throw new Error("Compact semantic projection legacy source mismatch");
  }
  const replacements=new Map(authorizedProjection.replacements.map((entry)=>[entry.owner,entry]));
  if(replacements.size!==authorizedProjection.replacements.length){
    throw new Error("Compact semantic projection duplicate owner");
  }
  const records=new Map(document.records.map((record)=>[record.boundaryIdentity.owner,record]));
  const declaredBaseline=new Map(authorizedProjection.baselineRecords.map((entry)=>[entry.owner,entry]));
  if(declaredBaseline.size!==authorizedProjection.baselineRecords.length){
    throw new Error("Compact semantic projection duplicate baseline owner");
  }
  for(const owner of Object.keys(baseline).sort()){
    const from={normalizedOutputDigest:digestValue(baseline[owner]),itemCount:count(baseline[owner])};
    if(!same(declaredBaseline.get(owner),{owner,...from})){
      throw new Error(`Compact semantic projection baseline mismatch ${owner}`);
    }
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
  if(records.size!==Object.keys(baseline).length||
      document.normalizedOutputDigest!==authorizedProjection.projectedNormalizedOutputDigest||
      document.itemCount!==authorizedProjection.projectedItemCount){
    throw new Error("Compact semantic projection aggregate mismatch");
  }
  return {projectionDigest:digestValue(authorizedProjection),
    replacementCount:authorizedProjection.replacements.length};
}
