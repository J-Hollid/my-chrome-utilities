import {reconcileProjectDocumentationConcepts,type ProjectDocumentationSources} from "../data-layer-project-documentation-compiler.js";
import {projectCanonicalConcepts} from "../data-layer-layered-schema-project.js";
import {createProjectDocumentationSet,type ProjectDocumentationSet} from "../data-layer-project-documentation-records.js";
import type {ProjectState} from "../data-layer-specification-project.js";
import {documentationButton as button,documentationControlInput as controlInput,documentationHeading as heading,documentationLabelled as labelled} from "./workspace-ui-elements.js";
import {renderReorderControl} from "../reorderable-editor/control.js";
import {reorderValues} from "../reorderable-editor/model.js";

type SaveSet=(set:ProjectDocumentationSet,label:string)=>void;

export function renderDocumentationContent(host:HTMLElement,set:ProjectDocumentationSet,available:ProjectDocumentationSources,saveSet:SaveSet):void {
  const flowSearch=controlInput("flowSearch","","search"),profileSearch=controlInput("profileSearch","","search");
  flowSearch.setAttribute("aria-label","Search Flows");profileSearch.setAttribute("aria-label","Search Site Profiles");
  const projectChoices=document.createElement("fieldset"),flowChoices=document.createElement("fieldset"),profileChoices=document.createElement("fieldset"),overview=set.sections.find(({kind})=>kind==="overview"),overviewCheck=document.createElement("input");
  projectChoices.append(Object.assign(document.createElement("legend"),{textContent:"Project sections"}));
  overviewCheck.type="checkbox";overviewCheck.checked=Boolean(overview?.selected);
  overviewCheck.addEventListener("change",()=>{const sections=overview?set.sections.map((section)=>section.id===overview.id?{...section,selected:overviewCheck.checked}:section):[{id:`${set.id}:overview`,kind:"overview" as const,name:"Overview",selected:true},...set.sections];saveSet(createProjectDocumentationSet({...set,sections}),`${overviewCheck.checked?"Select":"Remove"} Overview`);});
  projectChoices.append(labelled("Overview",overviewCheck));
  flowChoices.append(Object.assign(document.createElement("legend"),{textContent:"Flow value-map sections"}));
  profileChoices.append(Object.assign(document.createElement("legend"),{textContent:"Site Profile property-table sections"}));
  const draw=()=>{
    flowChoices.querySelectorAll("label").forEach((value)=>value.remove());profileChoices.querySelectorAll("label").forEach((value)=>value.remove());
    for(const {entity} of available.flows.filter(({entity})=>entity.name.toLowerCase().includes(flowSearch.value.toLowerCase()))){const existing=set.sections.find((section)=>section.kind==="flow"&&section.targetId===entity.id),check=document.createElement("input");check.type="checkbox";check.checked=Boolean(existing);check.addEventListener("change",()=>{const sections=check.checked?[...set.sections,{id:`section:flow:${entity.id}`,kind:"flow" as const,name:entity.name,targetId:entity.id,selected:true}]:set.sections.filter(({id})=>id!==existing?.id);saveSet(createProjectDocumentationSet({...set,sections}),`${check.checked?"Select":"Remove"} Flow ${entity.name}`);});flowChoices.append(labelled(entity.name,check));}
    for(const profile of available.profiles.filter(({name})=>name.toLowerCase().includes(profileSearch.value.toLowerCase()))){const existing=set.sections.find((section)=>section.kind==="profile"&&section.targetId===profile.id),check=document.createElement("input");check.type="checkbox";check.checked=Boolean(existing);check.addEventListener("change",()=>{const sections=check.checked?[...set.sections,{id:`section:profile:${profile.id}`,kind:"profile" as const,name:profile.name,targetId:profile.id,selected:true}]:set.sections.filter(({id})=>id!==existing?.id);saveSet(createProjectDocumentationSet({...set,sections}),`${check.checked?"Select":"Remove"} Site Profile ${profile.name}`);});profileChoices.append(labelled(profile.name,check));}
  };
  flowSearch.addEventListener("input",draw);profileSearch.addEventListener("input",draw);draw();host.append(projectChoices,flowSearch,flowChoices,profileSearch,profileChoices);
}

export function renderDocumentationConceptConfiguration(set:ProjectDocumentationSet,state:ProjectState,saveSet:SaveSet):HTMLElement {
  const region=document.createElement("section"),list=document.createElement("ol"),concepts=reconcileProjectDocumentationConcepts(set,projectCanonicalConcepts(state)),headings=document.createElement("input");
  region.setAttribute("aria-label","Documentation concept configuration");
  region.append(heading(2,"Document settings"),Object.assign(document.createElement("p"),{textContent:"Concept configuration affects Site Profile tables and the Data capture matrix. It does not affect Flow value maps."}));
  list.setAttribute("aria-label","Ordered documentation concepts");
  for(const concept of concepts){
    const item=document.createElement("li"),include=document.createElement("input"),reorder=renderReorderControl({itemId:concept.name,itemLabel:concept.name,completeOrder:concepts.map(({name})=>({id:name,label:name})),dropTarget:item,orderedContainer:list,onMove:({itemId,toIndex})=>{saveSet(createProjectDocumentationSet({...set,concepts:reorderValues(concepts,itemId,toIndex,value=>value.name)}),`Reorder concept ${concept.name}`);return true;}});
    include.type="checkbox";include.checked=concept.included;include.addEventListener("change",()=>saveSet(createProjectDocumentationSet({...set,concepts:concepts.map((candidate)=>candidate.name===concept.name?{...candidate,included:include.checked}:candidate)}),`${include.checked?"Include":"Exclude"} concept ${concept.name}`));item.dataset.documentationConcept=concept.name;item.append(reorder,labelled(concept.name,include));list.append(item);
  }
  headings.type="checkbox";headings.checked=set.includeConceptSubheadings===true;headings.addEventListener("change",()=>saveSet(createProjectDocumentationSet({...set,concepts,includeConceptSubheadings:headings.checked}),`${headings.checked?"Include":"Hide"} concept subheadings`));region.append(list,labelled("Include concept subheadings",headings));
  return region;
}
