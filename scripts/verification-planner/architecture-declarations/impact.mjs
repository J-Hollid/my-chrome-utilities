import {architectureDeclarationEvidence} from './repository.mjs';
import {declarationPath} from './delta.mjs';
import {verificationOwnerForPath} from '../ownership/resolve.mjs';

export function declarationImpact(registry,changedPath,changeSet,affectedFor,basePacks) {
 if(changedPath!==declarationPath)return null;
 const evidence=architectureDeclarationEvidence(changeSet);
 if(!evidence)return null;
 if(evidence.invalid)throw new Error('Invalid architecture module declaration blocks verification');
 const ids=new Set([verificationOwnerForPath(registry,changedPath)?.id]);
 for(const file of evidence.delta.paths) {
  if(!verificationOwnerForPath(registry,file)) {
   // A deleted or added file can have an owner only on its own side. Its other
   // side is handled by the ordinary current/base union in the caller.
   const side=registry===basePacks?0:1;
   if(evidence.snapshots[side].sources.has(file))throw new Error(`Unresolved architecture consumer: ${file}`);
   continue;
  }
  const affected=affectedFor(registry,file);
  for(const id of [...affected.semantic,...affected.exactSemantic,...affected.verificationConsumers])ids.add(id);
 }
 if(ids.has(undefined))throw new Error('Architecture validation has no verification owner');
 return {semantic:[...ids],exactSemantic:[],verificationConsumers:[],
  boundary:'architecture-module-declarations'};
}
