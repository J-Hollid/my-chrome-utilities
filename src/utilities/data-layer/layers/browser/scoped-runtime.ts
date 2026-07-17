import type { UtilityMountHost } from "../../../../platform/utility-contract.js";
import { createSchema, createSchemaLibraryExport, SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary, validateWithSchema } from "../../schemas.js";
import { addDefect, createMissingEventDefect, DEFECT_LIBRARY_STORAGE_KEY, restoreDefectLibrary, serializeDefectLibrary } from "../../defect-reporting.js";

async function copyText(text:string):Promise<boolean>{
  try{if(typeof navigator.clipboard?.writeText==="function"){await navigator.clipboard.writeText(text);return true;}}catch{}
  return false;
}

export function mountScopedDataLayerAdapter(root:UtilityMountHost,panelIds:readonly string[],storage?:Storage):()=>void {
  const cleanups:(()=>void)[]=[];
  const bind=(selector:string,listener:()=>void):void=>{const element=root.querySelector<HTMLElement>(selector);if(!element)return;element.addEventListener("click",listener);cleanups.push(()=>element.removeEventListener("click",listener));};
  if(panelIds.includes("data-layer-panel-library"))bind("#add-new-event",()=>{const editor=root.querySelector<HTMLElement>("#event-property-editor");if(editor)editor.hidden=false;root.querySelector<HTMLInputElement>("#event-template-name")?.focus();});
  if(panelIds.includes("data-layer-panel-schemas"))bind("#create-schema",()=>{const editor=root.querySelector<HTMLElement>("#schema-editor");if(editor)editor.hidden=false;root.querySelector<HTMLInputElement>("#schema-editor-name")?.focus();});
  if(panelIds.includes("data-layer-panel-schemas")){
    const schema=createSchema("Scoped checkout",1,{type:"object",properties:{event:{type:"string"}},required:["event"]});
    storage?.setItem(SCHEMA_LIBRARY_STORAGE_KEY,serializeSchemaLibrary([schema]));
    bind("#recheck-schema-validation",()=>{const validation=validateWithSchema({sourceId:"scoped",eventName:"checkout",payload:{},rawInput:{}},schema,[schema]);const result=root.querySelector<HTMLElement>("#schema-result");if(result){result.dataset.validationState=validation.state;result.textContent=`Validation complete: ${validation.state}`;}});
    bind("#export-schema",()=>{const archive=createSchemaLibraryExport([schema],[]),serialized=JSON.stringify(archive);const result=root.querySelector<HTMLElement>("#schema-result");if(result){result.dataset.transferBytes=String(serialized.length);result.textContent=`Schema Library exported (${serialized.length} bytes)`;}});
  }
  if(panelIds.includes("data-layer-panel-defects")){
    const panel=root.querySelector<HTMLElement>("#defect-library-master");
    const ownerDocument=panel?.ownerDocument;
    if(panel&&ownerDocument){
      const save=ownerDocument.createElement("button"),copy=ownerDocument.createElement("button"),status=ownerDocument.createElement("output");
      save.id="scoped-save-defect";save.textContent="Save defect";copy.id="scoped-copy-defect";copy.textContent="Copy for Jira";status.id="scoped-defect-status";
      panel.append(save,copy,status);
      const report={summary:"Missing checkout event",description:"The checkout event was not observed.",expectedEvent:"checkout"};
      const defect=createMissingEventDefect({id:"scoped-defect",now:new Date(0).toISOString(),report});
      const onSave=():void=>{const library=restoreDefectLibrary(storage?.getItem(DEFECT_LIBRARY_STORAGE_KEY)??null);const saved=addDefect(library,defect,true);storage?.setItem(DEFECT_LIBRARY_STORAGE_KEY,serializeDefectLibrary(saved.library));status.dataset.saveStatus="saved";status.textContent="Defect saved";};
      const onCopy=async():Promise<void>=>{const copied=await copyText(`${report.summary}\n\n${report.description}\nExpected: ${report.expectedEvent}`);status.dataset.copyStatus=copied?"copied":"failed";status.textContent=copied?"Defect report copied for Jira":"Copy failed";};
      save.addEventListener("click",onSave);copy.addEventListener("click",onCopy);cleanups.push(()=>{save.removeEventListener("click",onSave);copy.removeEventListener("click",onCopy);save.remove();copy.remove();status.remove();});
    }
  }
  return ()=>{for(const cleanup of cleanups)cleanup();};
}
