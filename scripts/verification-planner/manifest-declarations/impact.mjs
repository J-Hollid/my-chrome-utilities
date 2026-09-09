import {manifestDeclarationEvidence} from './repository.mjs';
import {sharedBoundaryDeclarations} from '../../verification-shared-boundaries.mjs';
import {declarationImpact} from '../architecture-declarations/impact.mjs';

export function manifestDeclarationImpact(registry,changedPath,changeSet) {
  if(changedPath!=='manifest.json'||!manifestDeclarationEvidence(changeSet,registry))return null;
  const matches=sharedBoundaryDeclarations(registry).filter(item=>
    item.id==='devtools_manifest_declaration'&&item.owner==='shell'&&
    item.prefixes.length===1&&item.prefixes[0]==='manifest.json');
  if(matches.length!==1)return null;
  const boundary=matches[0];
  return {semantic:[boundary.owner,...boundary.consumers],exactSemantic:[],verificationConsumers:[],
    boundary:boundary.id,propagateDependants:false,sharedBoundaryTargets:boundary.qaTargets,
    terminalFullObligation:boundary.terminalFullObligation};
}

export function verifiedDeclarationImpact(registry,changedPath,changeSet,affectedFor,basePacks) {
  return manifestDeclarationImpact(registry,changedPath,changeSet)??
    declarationImpact(registry,changedPath,changeSet,affectedFor,basePacks);
}

export function manifestDeclarationSlice(registry,changedPath,changeSet) {
  if(!manifestDeclarationImpact(registry,changedPath,changeSet))return null;
  const matches=registry.find(pack=>pack.id==='shell')?.verificationSlices?.filter(slice=>
    slice.id==='devtools_manifest_registration'&&slice.consumerOnly===true)??[];
  return matches.length===1?matches[0]:null;
}
