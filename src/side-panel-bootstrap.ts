import { isolateUtilityDomFromSearch, utilityDomScopeFromSearch } from "./platform/utility-dom-isolation.js";
import { scopedUtilityModulePath } from "./platform/utility-bootstrap.js";
import type { UtilityModuleEntry } from "./platform/utility-contract.js";
import { createUtilityStorage } from "./platform/utility-storage.js";

const scope=utilityDomScopeFromSearch(globalThis.location.search);
if(!scope){
  await import("./side-panel.js");
}else{
  isolateUtilityDomFromSearch(document,globalThis.location.search);
  const module=await import(scopedUtilityModulePath(scope)) as Record<string,unknown>;
  const utility=(scope.utilityId==="command-palette"?module.commandPaletteUtility:scope.utilityId==="hotkeys"?module.hotkeysUtility:module.dataLayerUtility) as UtilityModuleEntry;
  const root=document.querySelector<HTMLElement>("#side-panel-root");
  if(!root)throw new Error("Scoped utility host is missing");
  utility.lifecycle.mount(root,window);
  if(scope.utilityId==="data-layer"){
    const {mountScopedDataLayerAdapter}=await import("./utilities/data-layer/layers/browser/scoped-runtime.js");
    mountScopedDataLayerAdapter(root,scope.panelIds,createUtilityStorage(localStorage,utility.storage));
  }
  root.dataset.utilityShellReady="true";
}
