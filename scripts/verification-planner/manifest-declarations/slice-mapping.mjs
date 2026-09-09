import {manifestDeclarationSlice} from "./impact.mjs";
import {ownerOf} from "../../verification-registry/validation.mjs";
import {verificationSliceMapping} from "../tasks/slice-declarations.mjs";
import {exactVerificationHelperConsumers} from "../ownership/impact.mjs";

export function createSliceMappingRecorder({terminalFull,canonicalRunnableSelection,hasFocusedFeatureBoundary,focusedPolicyPath,
    registryChanged,modularRegistrySlices,basePacks,packs,changeSet,parentPackSliceFallbacks,
    verificationSliceDiagnostics,activateSlice}) {
  return (changedPath, registries) => {
    if (terminalFull || canonicalRunnableSelection) return;
    if (hasFocusedFeatureBoundary && registries.some((registry) => focusedPolicyPath(registry, changedPath))) return;
    if (registryChanged && !modularRegistrySlices) {
      for (const registry of registries) {
        const pack = ownerOf(registry, changedPath);
        if (pack && verificationSliceMapping(registry, pack, changedPath).kind === "slice") {
          parentPackSliceFallbacks.add(pack.id);
          verificationSliceDiagnostics.push("Verification slices cannot narrow the same registry-change evidence range");
        }
      }
      return;
    }
    for (const registry of registries) {
      const declarationSlice=manifestDeclarationSlice(registry,changedPath,changeSet);
      if(declarationSlice) {
        activateSlice(registry,"shell",declarationSlice.id);
        continue;
      }
      const pack = ownerOf(registry, changedPath);
      if (!pack) continue;
      const retiredExactHelper=registry===basePacks&&
        exactVerificationHelperConsumers(basePacks,changedPath).length>0&&
        exactVerificationHelperConsumers(packs,changedPath).length===0;
      if(retiredExactHelper)continue;
      const mapping = verificationSliceMapping(registry, pack, changedPath);
      const currentSuccessor=registry===basePacks&&mapping.kind==="slice"&&
        packs.find(({id})=>id===pack.id)?.verificationSlices
          ?.some(({id})=>id===mapping.slice.id);
      if(currentSuccessor){
        activateSlice(packs,pack.id,mapping.slice.id);
        continue;
      }
      if (mapping.kind === "slice") activateSlice(registry, pack.id, mapping.slice.id);
      else {
        parentPackSliceFallbacks.add(pack.id);
        if ((pack.verificationSlices ?? []).length) {
          verificationSliceDiagnostics.push(mapping.diagnostic);
        }
      }
    }
  };
}
