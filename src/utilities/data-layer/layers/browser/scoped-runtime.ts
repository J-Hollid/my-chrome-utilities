import type { UtilityMountHost } from "../../../../platform/utility-contract.js";

export function mountScopedDataLayerAdapter(root:UtilityMountHost,panelIds:readonly string[]):()=>void {
  const cleanups:(()=>void)[]=[];
  const bind=(selector:string,listener:()=>void):void=>{const element=root.querySelector<HTMLElement>(selector);if(!element)return;element.addEventListener("click",listener);cleanups.push(()=>element.removeEventListener("click",listener));};
  if(panelIds.includes("data-layer-panel-library"))bind("#add-new-event",()=>{const editor=root.querySelector<HTMLElement>("#event-property-editor");if(editor)editor.hidden=false;root.querySelector<HTMLInputElement>("#event-template-name")?.focus();});
  if(panelIds.includes("data-layer-panel-schemas"))bind("#create-schema",()=>{const editor=root.querySelector<HTMLElement>("#schema-editor");if(editor)editor.hidden=false;root.querySelector<HTMLInputElement>("#schema-editor-name")?.focus();});
  return ()=>{for(const cleanup of cleanups)cleanup();};
}
