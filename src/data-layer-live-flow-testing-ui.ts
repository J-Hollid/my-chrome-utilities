import {attachLiveFlowDefect,completeLiveFlowTest,createLiveFlowTest,liveFlowCandidateEvents,liveFlowChoices,liveFlowGraphNodes,matchLiveFlowEvent,selectLiveFlow,selectLiveFlowStep,startLiveFlowPath,type CompletedLiveFlowTest,type LiveFlowEvent,type LiveFlowHistoryEntry,type LiveFlowTestRun} from "./data-layer-live-flow-testing.js";
import {renderValidationIssueList} from "./data-layer-live-observer-ui.js";
import type {ProjectState} from "./utilities/data-layer/schemas.js";

export interface LiveFlowTestingUiOptions {
  root:ParentNode;
  activeProject:()=>Promise<ProjectState|undefined>;
  events:()=>readonly LiveFlowEvent[];
  saveSummary:(summary:CompletedLiveFlowTest)=>void;
  savedSummary?:()=>CompletedLiveFlowTest|undefined;
  onResult?:(entry:LiveFlowHistoryEntry,event:LiveFlowEvent)=>void;
  onDefect?:(entry:LiveFlowHistoryEntry,event:LiveFlowEvent)=>void;
  openProject?:()=>void;
  createProject?:()=>void;
  id?:()=>string;
  now?:()=>string;
}
export interface LiveFlowTestingUi {open():Promise<void>;render():void;reset():void;attachDefect(stepId:string,eventId:string,defectId:string):void;run():LiveFlowTestRun|undefined;summary():CompletedLiveFlowTest|undefined}

const button=(text:string,run:()=>void):HTMLButtonElement=>{const control=document.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
const option=(value:string,text:string):HTMLOptionElement=>{const item=document.createElement("option");item.value=value;item.textContent=text;return item;};
const historyItem=(entry:LiveFlowHistoryEntry):HTMLLIElement=>{
  const item=document.createElement("li"),summary=document.createElement("p"),sources=document.createElement("p");
  summary.textContent=`${entry.stepName} · ${entry.eventId} · revision ${entry.effectiveSchemaRevision} · ${entry.effectiveSchemaRevisionIdentity} · ${entry.status}${entry.defectId?` · defect ${entry.defectId}`:""}`;
  sources.textContent=`Schema sources: ${entry.provenance.map(({scope,contributorName})=>`${scope} ${contributorName}`).join(" → ")||"none"}`;
  item.append(summary,sources);
  if(entry.issues.length){const issues=renderValidationIssueList(entry.issues.map((issue)=>({path:issue.path,message:issue.code,rule:issue.code,severity:issue.severity,origin:issue.provenance,expected:JSON.stringify(issue.expected),actual:JSON.stringify(issue.actual)})));issues.setAttribute("aria-label",`Validation issues for ${entry.stepName}`);item.append(issues);}
  return item;
};

export function mountLiveFlowTestingUi(options:LiveFlowTestingUiOptions):LiveFlowTestingUi{
  const openControl=options.root.querySelector<HTMLButtonElement>("#open-live-flow-test"),host=options.root.querySelector<HTMLElement>("#live-flow-test");if(!openControl||!host)throw new Error("Live Flow test controls are unavailable.");
  const now=options.now??(()=>new Date().toISOString()),id=options.id??(()=>`live-flow:${crypto.randomUUID()}`);let project:ProjectState|undefined,run:LiveFlowTestRun|undefined,completed:CompletedLiveFlowTest|undefined,openGeneration=0;
  const setStatus=(text:string)=>{const output=host.querySelector<HTMLOutputElement>("#live-flow-test-status");if(output)output.textContent=text;};
  const render=()=>{
    host.replaceChildren();host.hidden=false;const heading=document.createElement("h4");heading.textContent="Flow test";const guidance=document.createElement("p");guidance.textContent="Manual Flow test: choose each graph step and observed feed event. No Flow, event, or Assignment is selected automatically.";host.append(heading,guidance);
    if(completed){const summary=document.createElement("section");summary.id="live-flow-completed-summary";const label=document.createElement("h5");label.textContent=completed.label;const untested=document.createElement("p");untested.textContent=completed.unchosenAlternatives.length?`${completed.unchosenAlternatives.length} unchosen alternatives · Not tested`:"No unchosen alternatives";const history=document.createElement("ol");for(const entry of completed.history)history.append(historyItem(entry));summary.append(label,untested,history);host.append(summary);if(!project){const archived=document.createElement("p");archived.textContent="Saved Flow test summary restored read-only; matching was not resumed.";host.append(archived);return;}}
    if(!project){const message=document.createElement("p");message.textContent="No active project. Open project or Create project to choose a project-bound Flow.";host.append(message,button("Open project",()=>options.openProject?.()),button("Create project",()=>options.createProject?.()));return;}
    const choices=liveFlowChoices(project.project.id,[project]).flows,flowLabel=document.createElement("label"),flowSelect=document.createElement("select");flowSelect.id="live-flow-selector";flowLabel.textContent="Flow";flowSelect.append(option("","Choose Flow"),...choices.map(({id:flowId,name})=>option(flowId,name)));flowSelect.value=run?.flowId??"";flowSelect.addEventListener("change",()=>{run=selectLiveFlow(createLiveFlowTest(id(),project!.project.id),project!,flowSelect.value);completed=undefined;render();});flowLabel.append(flowSelect);host.append(flowLabel);
    if(run?.flowId&&!run.currentStepId){const startLabel=document.createElement("label"),start=document.createElement("select");start.id="live-flow-start";startLabel.textContent="Start Page frame";start.append(option("","Choose start Page"),...run.startChoices.map((choice)=>option(choice.id,`${choice.name} · ${choice.lane} · ${choice.stableFrameId}${choice.recommended?" · Recommended root":" · Partial-path start"}`)));start.addEventListener("change",()=>{if(start.value)run=startLiveFlowPath(run!,start.value);render();});startLabel.append(start);host.append(startLabel);}
    if(run?.currentStepId&&run.history.some(({stepId})=>stepId===run!.currentStepId)){const nodes=liveFlowGraphNodes(run,project),nextSection=document.createElement("section"),title=document.createElement("h5"),list=document.createElement("ul");title.textContent="Choose next relationship-connected step";nextSection.append(title,list);for(const node of nodes){const item=document.createElement("li"),control=button(node.next?`${node.next.displayName} · ${node.next.kind}`:`${node.name} · ${node.stepKind}`,()=>{if(node.enabled){run=selectLiveFlowStep(run!,project!,node.id);render();}});control.disabled=!node.enabled;control.setAttribute("aria-label",`${node.name} · ${node.reason}`);item.append(control,` · ${node.reason}`);list.append(item);}if(!nodes.some(({enabled})=>enabled)){const terminal=document.createElement("p");terminal.textContent="No outgoing relationship from current step. Complete the selected path or end manually.";nextSection.append(terminal);}host.append(nextSection);}
    if(run?.currentStepId&&!run.history.some(({stepId,eventId})=>stepId===run!.currentStepId&&run!.matchedEventIds.includes(eventId))){const candidates=liveFlowCandidateEvents(run,project,options.events()),section=document.createElement("section"),title=document.createElement("h5"),list=document.createElement("ul");title.textContent="Choose one observed event";for(const candidate of candidates){const item=document.createElement("li"),control=button(`Match ${candidate.eventId}`,()=>{try{run=matchLiveFlowEvent(run!,project!,options.events(),candidate.eventId);const entry=run.history.at(-1)!,event=options.events().find(({id:eventId})=>eventId===candidate.eventId)!;options.onResult?.(entry,event);render();}catch(error){setStatus(error instanceof Error?error.message:String(error));}});control.disabled=!candidate.eligible;control.setAttribute("aria-label",`${candidate.eventId} · ${candidate.evidence} · ${candidate.reason}`);item.textContent=`${candidate.eventId} · ${candidate.evidence} · ${candidate.reason} `;item.append(control);list.append(item);}section.append(title,list);host.append(section);}
    if(run?.history.length){const history=document.createElement("ol");history.id="live-flow-run-history";for(const entry of run.history){const item=historyItem(entry);if(entry.issues.length&&!entry.defectId)item.append(button("Create defect report",()=>{const event=options.events().find(({id:eventId})=>eventId===entry.eventId);if(event)options.onDefect?.(entry,event);}));history.append(item);}host.append(history,button("Complete selected path",()=>{completed=completeLiveFlowTest(run!,project!,now());options.saveSummary(completed);render();}));}
    const status=document.createElement("output");status.id="live-flow-test-status";status.setAttribute("aria-live","polite");host.append(status);
  };
  const open=async()=>{const generation=++openGeneration,nextCompleted=options.savedSummary?.(),nextProject=nextCompleted?undefined:await options.activeProject();if(generation!==openGeneration)return;completed=nextCompleted;project=nextProject;run=project?createLiveFlowTest(id(),project.project.id):undefined;render();};openControl.addEventListener("click",()=>void open());
  return{open,render,reset:()=>{openGeneration++;project=undefined;run=undefined;completed=undefined;host.replaceChildren();host.hidden=true;},attachDefect:(stepId,eventId,defectId)=>{if(!run)return;run=attachLiveFlowDefect(run,stepId,defectId,eventId);render();},run:()=>run?structuredClone(run):undefined,summary:()=>completed?structuredClone(completed):undefined};
}
