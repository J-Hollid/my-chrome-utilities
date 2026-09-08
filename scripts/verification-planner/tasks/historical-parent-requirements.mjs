import {ownerOf} from '../../verification-registry/validation.mjs';
import {verificationSliceMapping,verificationSliceDeclaration} from './slice-declarations.mjs';
import {parentFallbackSemanticClosure} from './parent-fallback-closure.mjs';

function historicalSlices(registry,path,quarantined) {
  const owner=ownerOf(registry,path), sliced=new Set(), parents=new Set(), visited=new Set();
  const visit=(packId,sliceId)=>{
    const identity=`${packId}:${sliceId}`;
    if(visited.has(identity))return;
    visited.add(identity);
    const pack=registry.find(({id})=>id===packId);
    const slice=pack?.verificationSlices?.find(({id})=>id===sliceId);
    if(!slice||quarantined.has(sliceId)||verificationSliceDeclaration(registry,pack,slice).length){
      parents.add(packId);return;
    }
    sliced.add(packId);
    for(const consumer of slice.consumers){
      if(consumer.sliceId)visit(consumer.packId,consumer.sliceId);
      else parents.add(consumer.packId);
    }
  };
  if(owner){
    const mapping=verificationSliceMapping(registry,owner,path);
    if(mapping.kind==='slice')visit(owner.id,mapping.slice.id);
    else parents.add(owner.id);
  }
  return {sliced,parents};
}

export function historicalParentRequirements(registry,path,affected,quarantined=new Set()) {
  const {sliced,parents}=historicalSlices(registry,path,quarantined);
  const selected=parentFallbackSemanticClosure({affected,changedPath:path,
    parentFallbacks:parents,registries:[registry]});
  for(const id of [...selected,...(affected.exactSemantic??[]),...affected.verificationConsumers]){
    if(!sliced.has(id))parents.add(id);
  }
  return parents;
}
