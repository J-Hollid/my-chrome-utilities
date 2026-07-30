export type StudioChoicePattern="checkbox"|"switch";
export type StudioChoiceKey=
  |"schema.only-defined"
  |"schema.copy-dependency"
  |"schema.destructive-confirmation"
  |"schema.specification-property"
  |"schema.specification-headings"
  |"schema.page-group-applicability-preview"
  |"documentation.concept-subheadings"
  |"documentation.concept-membership"
  |"documentation.section-membership"
  |"documentation.flow-context"
  |"documentation.property-row"
  |"documentation.metadata-column"
  |"documentation.matrix-context"
  |"documentation.profile-column"
  |"documentation.export-section"
  |"documentation.confirm-incomplete"
  |"documentation.theme-option"
  |"entity.creation-option"
  |"entity.editor-option"
  |"conflict.pending-field"
  |"bulk.staged-property"
  |"defect.issue-inclusion"
  |"defect.timeline-evidence"
  |"defect.expected-override"
  |"defect.acknowledgement"
  |"defect.report-section"
  |"defect.warning-acknowledgement"
  |"defect.expected-property"
  |"guided.conditional"
  |"guided.publish-rule";

export interface StudioChoiceContract{
  readonly key:StudioChoiceKey;
  readonly pattern:StudioChoicePattern;
  readonly consequence:string;
}

const contract=(key:StudioChoiceKey,pattern:StudioChoicePattern,consequence:string):StudioChoiceContract=>Object.freeze({key,pattern,consequence});
const checkbox=(key:StudioChoiceKey,consequence:string):StudioChoiceContract=>contract(key,"checkbox",consequence);
const contracts:Readonly<Record<StudioChoiceKey,StudioChoiceContract>>=Object.freeze({
  "schema.only-defined":contract("schema.only-defined","switch","Immediately applies one reversible Draft setting"),
  "schema.copy-dependency":checkbox("schema.copy-dependency","Selects a schema dependency for the reviewed copy operation"),
  "schema.destructive-confirmation":checkbox("schema.destructive-confirmation","Confirms replacement impact before the reviewed schema copy"),
  "schema.specification-property":checkbox("schema.specification-property","Selects a property for the later specification copy action"),
  "schema.specification-headings":checkbox("schema.specification-headings","Stages heading inclusion for the later specification copy action"),
  "schema.page-group-applicability-preview":checkbox("schema.page-group-applicability-preview","Previews independent Page Group composition without changing project data"),
  "documentation.concept-subheadings":checkbox("documentation.concept-subheadings","Changes configuration pending preview refresh"),
  "documentation.concept-membership":checkbox("documentation.concept-membership","Selects membership in the ordered concept group"),
  "documentation.section-membership":checkbox("documentation.section-membership","Selects membership in the Documentation Set"),
  "documentation.flow-context":checkbox("documentation.flow-context","Selects a Flow context for the saved documentation configuration"),
  "documentation.property-row":checkbox("documentation.property-row","Selects a property row for the saved documentation configuration"),
  "documentation.metadata-column":checkbox("documentation.metadata-column","Selects a metadata column for the saved documentation configuration"),
  "documentation.matrix-context":checkbox("documentation.matrix-context","Selects a context for the saved capture-matrix configuration"),
  "documentation.profile-column":checkbox("documentation.profile-column","Selects a Site Profile column for the saved documentation configuration"),
  "documentation.export-section":checkbox("documentation.export-section","Selects membership in the export scope"),
  "documentation.confirm-incomplete":checkbox("documentation.confirm-incomplete","Records an acknowledgement before incomplete export"),
  "documentation.theme-option":checkbox("documentation.theme-option","Stages a theme option for explicit Save theme"),
  "entity.creation-option":checkbox("entity.creation-option","Stages an entity option until the creation form is submitted"),
  "entity.editor-option":checkbox("entity.editor-option","Stages an entity option until Save changes"),
  "conflict.pending-field":checkbox("conflict.pending-field","Selects the pending field value for the later conflict-resolution action"),
  "bulk.staged-property":checkbox("bulk.staged-property","Selects membership for the later bulk action"),
  "defect.issue-inclusion":checkbox("defect.issue-inclusion","Selects an issue for the later defect report action"),
  "defect.timeline-evidence":checkbox("defect.timeline-evidence","Selects timeline evidence for the later defect report action"),
  "defect.expected-override":checkbox("defect.expected-override","Stages an explicit expected-result override for later defect saving"),
  "defect.acknowledgement":checkbox("defect.acknowledgement","Records an acknowledgement required before the later defect action"),
  "defect.report-section":checkbox("defect.report-section","Selects a section for the later defect report copy or save action"),
  "defect.warning-acknowledgement":checkbox("defect.warning-acknowledgement","Records an acknowledgement before the later missing-event report action"),
  "defect.expected-property":checkbox("defect.expected-property","Selects an expected property for the later defect report action"),
  "guided.conditional":checkbox("guided.conditional","Stages conditional application until the guided rule is saved"),
  "guided.publish-rule":checkbox("guided.publish-rule","Stages Rule Library publication until the guided rule is saved"),
});
const declarations=new WeakMap<HTMLInputElement,StudioChoiceContract>();

export function studioChoiceContract(key:string):StudioChoiceContract{
  const value=contracts[key as StudioChoiceKey];
  if(!value)throw new Error(`Unknown Specification Studio choice contract ${key}.`);
  return contract(value.key,value.pattern,value.consequence);
}

export function studioChoiceContractKeys():readonly StudioChoiceKey[]{return Object.freeze(Object.keys(contracts) as StudioChoiceKey[]);}

export function declareStudioChoice(input:HTMLInputElement,key:StudioChoiceKey):HTMLInputElement{
  declarations.set(input,studioChoiceContract(key));
  return input;
}

export function studioChoiceTargetHeight(input:{coarsePointer:boolean;narrow:boolean}):36|44{
  return input.coarsePointer||input.narrow?44:36;
}

let generatedId=0;
const visibleLabel=(input:HTMLInputElement):string=>input.getAttribute("aria-label")?.trim()||input.name.trim()||"Choice";
const directActions=(label:HTMLLabelElement):HTMLElement[]=>Array.from(label.children).filter((child):child is HTMLElement=>child instanceof HTMLElement&&child!==label.control&&child.matches("button,a[href],[role=button]"));

function enhanceChoice(input:HTMLInputElement):void{
  if(input.dataset.studioChoiceEnhanced==="true")return;
  const contract=declarations.get(input);
  input.dataset.studioChoiceContract=contract?.key??"missing";
  if(!contract)input.dataset.studioChoiceMissing="true";
  let label=input.labels?.[0];
  if(!label){
    label=document.createElement("label");
    input.before(label);
    label.append(input,document.createTextNode(visibleLabel(input)));
  }
  const actions=directActions(label),copy=document.createElement("span");
  copy.className="studio-choice-copy";
  for(const node of Array.from(label.childNodes))if(node!==input&&!actions.includes(node as HTMLElement))copy.append(node);
  if(!copy.textContent?.trim())copy.textContent=visibleLabel(input);
  label.replaceChildren(input,copy);
  if(actions.length)label.after(...actions);
  input.id ||= `studio-choice-${++generatedId}`;
  input.classList.add("studio-choice-indicator");
  input.dataset.studioChoiceEnhanced="true";
  input.setAttribute("aria-description",contract?.consequence??"Missing explicit Specification Studio choice consequence");
  label.htmlFor=input.id;
  label.classList.add("studio-choice-row");

  if(contract?.pattern==="switch"){
    const mark=document.createElement("span"),state=document.createElement("span");
    mark.className="studio-switch-mark";
    mark.setAttribute("aria-hidden","true");
    state.className="studio-switch-state";
    state.id=`${input.id}-state`;
    input.setAttribute("role","switch");
    const sync=():void=>{mark.textContent=input.checked?"✓":"—";state.textContent=input.checked?"On":"Off";input.setAttribute("aria-checked",String(input.checked));};
    sync();
    input.addEventListener("change",sync);
    copy.append(mark,state);
  }
}

function enhanceWithin(root:ParentNode):void{
  if(root instanceof HTMLInputElement&&root.type==="checkbox")enhanceChoice(root);
  root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(enhanceChoice);
}

export function installStudioChoiceControls(root:HTMLElement):()=>void{
  enhanceWithin(root);
  const observer=new MutationObserver((records)=>{
    for(const record of records)for(const node of Array.from(record.addedNodes))if(node instanceof HTMLElement)enhanceWithin(node);
  });
  observer.observe(root,{childList:true,subtree:true});
  return()=>observer.disconnect();
}
