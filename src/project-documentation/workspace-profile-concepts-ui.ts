import {reconcileProjectDocumentationConcepts} from "../data-layer-project-documentation-compiler.js";
import type {ProjectDocumentationSection,ProjectDocumentationSet} from "../data-layer-project-documentation-records.js";
import {declareStudioChoice} from "../data-layer-studio-choice-controls.js";
import {profileConceptPresentation,updateProfileConceptPaths,type ProfileConceptBulkAction,type ProfileConceptFilter,type ProfileConceptProperty} from "./workspace-profile-concepts.js";
import {documentationButton as button,documentationControlInput as controlInput,documentationHeading as heading,documentationLabelled as labelled} from "./workspace-ui-elements.js";

type MutateSection=(set:ProjectDocumentationSet,sectionId:string,update:(section:ProjectDocumentationSection)=>ProjectDocumentationSection,label:string)=>void;
interface ProfileConceptUiState {activeConcept?:string;query:string;filter:ProfileConceptFilter;mobileSurface:"concepts"|"properties"}

export function createDocumentationProfileConceptRenderer(mutateSection:MutateSection):(host:HTMLElement,set:ProjectDocumentationSet,section:ProjectDocumentationSection,properties:readonly ProfileConceptProperty[])=>void {
  const states=new Map<string,ProfileConceptUiState>();
  return function render(host,set,section,properties):void {
    const state=states.get(section.id)??{query:"",filter:"all",mobileSurface:"concepts"},allPaths=properties.map(({path})=>path),selectedPaths=section.configuration?.paths??allPaths,concepts=reconcileProjectDocumentationConcepts(set,properties.flatMap(({concept})=>concept?.trim()?[concept]:[])),presentation=profileConceptPresentation({concepts,properties,selectedPaths,activeConcept:state.activeConcept,query:state.query,filter:state.filter});
    states.set(section.id,state);
    host.replaceChildren();
    host.className="documentation-profile-rows";
    host.append(heading(4,"Profile rows"));
    const search=controlInput("profilePropertySearch",state.query,"search"),filter=document.createElement("select"),controls=document.createElement("div");
    search.setAttribute("aria-label","Search Profile concepts and property paths");
    filter.setAttribute("aria-label","Profile row filter");
    for(const [label,value] of [["All","all"],["Included","included"],["Excluded","excluded"],["Overrides","overrides"]] as const)filter.append(new Option(label,value));
    filter.value=state.filter;
    const redraw=()=>render(host,set,section,properties);
    search.addEventListener("input",()=>{state.query=search.value;redraw();});
    filter.addEventListener("change",()=>{state.filter=filter.value as ProfileConceptFilter;redraw();});
    controls.className="documentation-profile-row-controls";
    controls.append(labelled("Search",search),labelled("Show",filter));
    const navigator=document.createElement("nav"),detail=document.createElement("section"),grid=document.createElement("div"),mobileControls=document.createElement("div");
    navigator.setAttribute("aria-label",`${section.name} concept navigator`);
    navigator.dataset.profileConceptSurface=state.mobileSurface==="concepts"?"active":"inactive";
    detail.setAttribute("aria-label",`${section.name} concept property detail`);
    detail.dataset.profileConceptSurface=state.mobileSurface==="properties"?"active":"inactive";
    for(const concept of presentation.concepts){
      const status=concept.setIncluded?"Included in Document settings":"Excluded in Document settings",control=button(`${concept.name} · ${concept.included} of ${concept.total} included · ${concept.matching} matching · ${status}`,()=>{state.activeConcept=concept.name;state.mobileSurface="properties";redraw();});
      control.dataset.profileConcept=concept.name;
      control.setAttribute("aria-current",String(concept.name===state.activeConcept));
      navigator.append(control);
    }
    if(state.activeConcept){
      const active=concepts.find(({name})=>name.toLocaleLowerCase()===state.activeConcept!.toLocaleLowerCase()),conceptPaths=properties.filter(({concept})=>(concept?.trim()||"Ungrouped").toLocaleLowerCase()===state.activeConcept!.toLocaleLowerCase()).map(({path})=>path);
      detail.append(heading(4,`${state.activeConcept} properties`));
      const apply=(action:ProfileConceptBulkAction)=>mutateSection(set,section.id,(value)=>({...value,configuration:{...value.configuration,paths:updateProfileConceptPaths(allPaths,selectedPaths,conceptPaths,action,active?.included??true)}}),`${action==="include-all"?"Include all":action==="exclude-all"?"Exclude all":"Reset"} ${state.activeConcept} properties for ${section.name}`);
      detail.append(button("Include all",()=>apply("include-all")),button("Exclude all",()=>apply("exclude-all")),button("Reset",()=>apply("reset")));
      const choices=document.createElement("fieldset");
      choices.setAttribute("aria-label",`${section.name} ${state.activeConcept} property choices`);
      choices.append(Object.assign(document.createElement("legend"),{textContent:`${presentation.properties.length} matching properties` }));
      for(const property of presentation.properties){const check=document.createElement("input");check.type="checkbox";check.checked=property.included;declareStudioChoice(check,"documentation.property-row");check.addEventListener("change",()=>{const selected=new Set(selectedPaths);check.checked?selected.add(property.path):selected.delete(property.path);mutateSection(set,section.id,(value)=>({...value,configuration:{...value.configuration,paths:allPaths.filter((path)=>selected.has(path))}}),`${check.checked?"Include":"Exclude"} ${property.path} for ${section.name}`);});choices.append(labelled(property.path,check));}
      detail.append(choices);
    }
    const showConcepts=button("Show Profile concepts",()=>{state.mobileSurface="concepts";redraw();}),showProperties=button("Show concept properties",()=>{state.mobileSurface="properties";redraw();});
    showConcepts.setAttribute("aria-pressed",String(state.mobileSurface==="concepts"));showProperties.setAttribute("aria-pressed",String(state.mobileSurface==="properties"));showProperties.disabled=!state.activeConcept;
    mobileControls.className="documentation-profile-mobile-switcher";mobileControls.append(showConcepts,showProperties);
    grid.className="documentation-profile-concept-grid";grid.append(navigator,detail);
    host.append(controls,mobileControls,grid);
  };
}
