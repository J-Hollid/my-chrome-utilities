import {declareStudioChoice} from "../data-layer-studio-choice-controls.js";
import type {ProjectDocumentationDiagnostic,ProjectDocumentationSelection,ProjectDocumentationSnapshot} from "../data-layer-project-documentation-workspace.js";
import {renderProjectDocumentationClipboard,writeProjectDocumentationWorkbook} from "../data-layer-project-documentation-workspace.js";
import {documentationButton as button,documentationHeading as heading,documentationLabelled as labelled} from "./workspace-ui-elements.js";

export type DocumentationExportScope="current"|"selected"|"complete";
export type DocumentationExportAction="copy"|"download";
export interface ProjectDocumentationPorts {writePlain(value:string):Promise<void>;writeRich(html:string,plain:string):Promise<void>;download(name:string,bytes:Uint8Array,type:string):void}

export function consumeDocumentationIncompleteConfirmation(confirmed:boolean):{confirmedForAction:boolean;confirmedAfterAction:false} {
  return{confirmedForAction:confirmed,confirmedAfterAction:false};
}

export function documentationExportPresentation(input:{
  scope:DocumentationExportScope;
  currentSectionId?:string;
  selectedSectionIds?:readonly string[];
  sections:readonly {id:string;name:string}[];
}):{checklistVisible:boolean;summary:string;sectionIds:string[]} {
  const available=new Map(input.sections.map((section)=>[section.id,section.name])),sectionIds=input.scope==="complete"
    ? input.sections.map(({id})=>id)
    : input.scope==="selected"
      ? (input.selectedSectionIds??[]).filter((id)=>available.has(id))
      : input.currentSectionId&&available.has(input.currentSectionId)?[input.currentSectionId]:[];
  const count=sectionIds.length,summary=input.scope==="complete"
    ? `${count} section${count===1?"":"s"} — the complete configured Documentation Set`
    : `${count} section${count===1?"":"s"} — ${sectionIds.map((id)=>available.get(id)).join(", ")||"none selected"}`;
  return{checklistVisible:input.scope==="selected",summary,sectionIds};
}

export function renderDocumentationExport(input:{
  host:HTMLElement;
  setName:string;
  sections:readonly {id:string;name:string}[];
  currentSectionId:string;
  selectedSectionIds:ReadonlySet<string>;
  snapshot:ProjectDocumentationSnapshot|undefined;
  stale:boolean;
  scope:DocumentationExportScope;
  pendingAction:DocumentationExportAction|undefined;
  confirmedIncomplete:boolean;
  feedback:string;
  ports:ProjectDocumentationPorts;
  selection:()=>ProjectDocumentationSelection;
  openRepair?:((target:NonNullable<ProjectDocumentationDiagnostic["repairTarget"]>)=>void)|undefined;
  setScope:(scope:DocumentationExportScope)=>void;
  setSectionSelected:(id:string,selected:boolean)=>void;
  setPendingAction:(action:DocumentationExportAction|undefined)=>void;
  setConfirmedIncomplete:(confirmed:boolean)=>void;
  setFeedback:(feedback:string)=>void;
  rerender:()=>void;
}):void {
  const scope=document.createElement("select");
  scope.setAttribute("aria-label","Documentation export scope");
  scope.append(new Option("Current section","current"),new Option("Choose sections","selected"),new Option("Complete Documentation Set","complete"));
  scope.value=input.scope;
  scope.addEventListener("change",()=>{input.setScope(scope.value as DocumentationExportScope);input.setPendingAction(undefined);input.setConfirmedIncomplete(false);input.rerender();});
  const presentation=documentationExportPresentation({scope:input.scope,currentSectionId:input.currentSectionId,selectedSectionIds:[...input.selectedSectionIds],sections:input.sections}),summary=document.createElement("p");
  summary.dataset.exportSummary="true";
  summary.textContent=presentation.summary;
  input.host.append(labelled("Output scope",scope),summary);
  if(presentation.checklistVisible){
    const checklist=document.createElement("fieldset");
    checklist.setAttribute("aria-label","Choose documentation sections");
    checklist.append(Object.assign(document.createElement("legend"),{textContent:"Sections"}));
    for(const section of input.sections){
      const check=document.createElement("input");
      check.type="checkbox";
      check.checked=input.selectedSectionIds.has(section.id);
      check.addEventListener("change",()=>{input.setSectionSelected(section.id,check.checked);input.rerender();});
      declareStudioChoice(check,"documentation.export-section");
      checklist.append(labelled(`Export ${section.name}`,check));
    }
    input.host.append(checklist);
  }
  if(input.snapshot?.incomplete){
    const warning=document.createElement("section"),diagnostics=document.createElement("ul");
    warning.className="documentation-export-warning";
    warning.setAttribute("role","alert");
    warning.append(heading(3,"Draft — incomplete"),Object.assign(document.createElement("p"),{textContent:"Continuing creates Draft — incomplete output. Diagnostic and repair details remain private."}));
    diagnostics.setAttribute("aria-label","Affected documentation sections");
    for(const issue of input.snapshot.diagnostics){
      const item=document.createElement("li");
      if(issue.repairTarget){
        const link=document.createElement("a"),query=new URLSearchParams({kind:issue.repairTarget.kind,entity:issue.repairTarget.id,...(issue.repairTarget.path?{field:issue.repairTarget.path}:{})});
        link.href=`?${query}`;
        link.textContent=issue.repair;
        link.addEventListener("click",(event)=>{event.preventDefault();input.openRepair?.(issue.repairTarget!);});
        item.append(link);
      }else item.textContent=issue.repair;
      diagnostics.append(item);
    }
    warning.append(diagnostics);
    input.host.append(warning);
  }
  const execute=(action:DocumentationExportAction,confirmed=input.confirmedIncomplete)=>{
    if(!input.snapshot)return;
    const confirmation=consumeDocumentationIncompleteConfirmation(confirmed);
    input.setConfirmedIncomplete(confirmation.confirmedAfterAction);
    try{
      if(action==="copy"){
        const value=renderProjectDocumentationClipboard(input.snapshot,{...input.selection(),confirmIncomplete:confirmation.confirmedForAction});
        void input.ports.writeRich(value.html,value.plain).then(()=>{input.setFeedback("Rich documentation copied with plain-text fallback.");input.setPendingAction(undefined);input.rerender();});
      }else{
        const bytes=writeProjectDocumentationWorkbook(input.snapshot,{...input.selection(),confirmIncomplete:confirmation.confirmedForAction});
        input.ports.download(`${input.setName.toLowerCase().replace(/[^a-z0-9]+/gu,"-")}.xlsx`,bytes,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        input.setFeedback("Excel workbook downloaded.");
        input.setPendingAction(undefined);
        input.rerender();
      }
    }catch(error){input.setFeedback(error instanceof Error?error.message:String(error));input.rerender();}
  };
  const request=(action:DocumentationExportAction)=>{
    if(!input.snapshot||input.stale)return;
    if(input.snapshot.incomplete&&!input.confirmedIncomplete){input.setPendingAction(action);input.setFeedback("Confirm Export draft anyway to produce this output.");input.rerender();return;}
    execute(action);
  },copy=button("Copy rich documentation",()=>request("copy")),download=button("Download Excel workbook",()=>request("download"));
  copy.disabled=download.disabled=!input.snapshot||input.stale;
  input.host.append(copy,download);
  if(input.pendingAction){
    const confirm=button("Export draft anyway",()=>{input.setConfirmedIncomplete(true);const action=input.pendingAction!;input.setPendingAction(undefined);execute(action,true);});
    input.host.append(confirm);
  }
  input.host.append(Object.assign(document.createElement("output"),{textContent:input.feedback}));
}
