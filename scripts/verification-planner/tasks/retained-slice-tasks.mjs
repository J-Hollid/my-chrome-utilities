import {ownerOf} from '../../verification-registry/validation.mjs';
import {verificationPackTaskKeys,verificationSliceDeclaration,verificationSliceMapping} from './slice-declarations.mjs';

// A modified path cannot discard base observations that still exist in its
// owner's current execution catalogue. Retired tasks and owner moves retain
// their separate governed successor rules.
export function retainedSliceTasks(basePacks,packs,path) {
  const before=ownerOf(basePacks,path),after=ownerOf(packs,path);
  if(!before||before.id!==after?.id)return [];
  const mapping=verificationSliceMapping(basePacks,before,path);
  if(mapping.kind!=='slice')return [];
  const retained=[],visited=new Set();
  const visit=(packId,sliceId)=>{
    const identity=`${packId}:${sliceId}`;
    if(visited.has(identity))return;
    visited.add(identity);
    const pack=basePacks.find(pack=>pack.id===packId);
    const slice=pack?.verificationSlices?.find(slice=>slice.id===sliceId);
    const current=packs.find(pack=>pack.id===packId);
    if(!slice||!current||verificationSliceDeclaration(basePacks,pack,slice).length)return;
    const available=verificationPackTaskKeys(current);
    const keys=[...slice.tasks,...slice.prerequisites].filter(key=>available.has(key));
    if(keys.length)retained.push({packId,sliceId,keys});
    for(const consumer of slice.consumers)
      if(consumer.sliceId)visit(consumer.packId,consumer.sliceId);
  };
  visit(before.id,mapping.slice.id);
  return retained;
}

export function recordRetainedSliceTasks(basePacks,packs,path,{selected,slices,taskKeys}) {
  for(const retained of retainedSliceTasks(basePacks,packs,path)) {
    const keys=taskKeys.get(retained.packId)??new Set();
    for(const key of retained.keys)keys.add(key);
    taskKeys.set(retained.packId,keys);
    const ids=slices.get(retained.packId)??new Set();
    ids.add(retained.sliceId);
    slices.set(retained.packId,ids);
    selected.add(retained.packId);
  }
}
