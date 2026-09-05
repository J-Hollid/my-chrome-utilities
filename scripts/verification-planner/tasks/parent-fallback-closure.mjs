import {ownerOf} from "../../verification-registry/validation.mjs";
import {expandVerificationDependantsAcross} from "../dependencies/expand.mjs";

export function parentFallbackSemanticClosure({
  affected, changedPath, parentFallbacks, registries,
}) {
  const fallbackOwners=[...new Set(registries.map((registry)=>
    ownerOf(registry,changedPath)?.id).filter((id)=>id&&parentFallbacks.has(id)))];
  const propagateFallback=affected.fallbackPropagateDependants&&fallbackOwners.length>0;
  const seeds=[...new Set([...affected.semantic,...(propagateFallback?fallbackOwners:[])])];
  return affected.propagateDependants===false&&!propagateFallback
    ?seeds:expandVerificationDependantsAcross(registries,seeds);
}
