import type {LayerConstraint} from "./data-layer-layered-schema.js";
import {isStringLiteralRuleKind} from "./data-layer-string-rule-validation.js";
export {focusedRuleIssue} from "./data-layer-focused-rule-policy.js";

/** The deliberately small vocabulary shared by every schema contributor editor. */
export const focusedPropertySections = [
  "definition",
  "rules",
  "structure",
] as const;
export type FocusedPropertySection = typeof focusedPropertySections[number]|"presence"|"values"|"conditions"|"documentation"|"example";
export const focusedDefinitionFieldLabels=["Type","Array item type","Presence","Allowed values","Display text","Description","Comments","Example method","Example value"] as const;
export type FocusedPropertyPrimarySection=typeof focusedPropertySections[number];
export function focusedPropertyLayerSequence(
  section?:FocusedPropertyPrimarySection,
  terminal?:"review",
):("menu"|FocusedPropertyPrimarySection|"review")[] {
  return ["menu",...(section?[section]:[]),...(terminal?[terminal]:[])];
}

export const focusedPropertySectionLabels:Record<FocusedPropertySection,string> = {
  definition:"Definition",
  presence:"Presence",
  values:"Expected and allowed values",
  conditions:"Conditions",
  rules:"Rules",
  documentation:"Documentation",
  example:"Example",
  structure:"Structure",
};

export interface FocusedOwnershipInput {
  inherited?:boolean;
  local?:boolean;
  structureOwned?:boolean;
  overridden?:boolean;
  invariant?:boolean;
  conflict?:boolean;
  replaceable?:boolean;
}

export interface FocusedOwnershipActionTarget {
  section:"Definition"|"Rules"|"Structure";
  kind:"facet"|"rule"|"property";
  id:string;
  label:string;
}

export interface FocusedOwnershipSession {
  inherited:boolean;
  local:boolean;
  structureOwned:boolean;
  invariant?:boolean;
  activated:readonly FocusedPropertyPrimarySection[];
}

export function focusedOwnershipState(input:FocusedOwnershipInput):{input:FocusedOwnershipInput;session:FocusedOwnershipSession} {
  const normalized:FocusedOwnershipInput={...input,inherited:Boolean(input.inherited),local:Boolean(input.local),structureOwned:Boolean(input.structureOwned)};
  return{input:normalized,session:{inherited:Boolean(normalized.inherited),local:Boolean(normalized.local),structureOwned:Boolean(normalized.structureOwned),...(normalized.invariant?{invariant:true}:{}),activated:[]}};
}

export function focusedOwnershipSectionEditable(session:FocusedOwnershipSession,section:FocusedPropertyPrimarySection):boolean {
  if(section==="rules")return true;
  if(section==="definition")return true;
  return session.structureOwned||!session.inherited||session.activated.includes(section);
}

export function activateFocusedOwnershipSection(session:FocusedOwnershipSession,section:FocusedPropertyPrimarySection,action:string):FocusedOwnershipSession {
  if(action!=="Override here"&&action!=="Replace here"||session.activated.includes(section))return session;
  return{...session,activated:[...session.activated,section]};
}

const localStructureActions=new Set(["Add child","Add sibling","Duplicate"]);
export function focusedOwnershipControlEditable(session:FocusedOwnershipSession,section:FocusedPropertyPrimarySection,label:string):boolean {
  if(section==="definition")return !session.invariant||!["propertyType","itemType","presenceMode"].includes(label);
  if(section!=="structure")return focusedOwnershipSectionEditable(session,section);
  if(!session.inherited)return true;
  if(localStructureActions.has(label)||label==="New local property name"||label.startsWith("Remove local "))return true;
  if(label==="Delete property")return false;
  return focusedOwnershipSectionEditable(session,section);
}

export function gateFocusedOwnershipSection(host:HTMLElement,session:FocusedOwnershipSession,section:FocusedPropertyPrimarySection):void {
  host.dataset.ownershipEditable=String(focusedOwnershipSectionEditable(session,section));
  for(const control of Array.from(host.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement|HTMLButtonElement>("input,select,textarea,button"))){
    if(control.dataset.ownershipAction)continue;
    const label=control instanceof HTMLButtonElement?control.textContent?.trim()??"":control.getAttribute("aria-label")??control.getAttribute("name")??"";
    if(!focusedOwnershipControlEditable(session,section,label))control.disabled=true;
  }
}

export function focusedOwnershipActionTarget(
  section:FocusedOwnershipActionTarget["section"],
  kind:FocusedOwnershipActionTarget["kind"],
  id:string,
):FocusedOwnershipActionTarget {
  return {section,kind,id,label:`${section} ${kind} ${id}`};
}

export function focusedPropertyProvenanceSummary(
  entries:readonly {contributorName?:string;source?:string;state?:string}[],
):string {
  const chain=entries.map(({contributorName,source,state})=>`${contributorName??source??"Unknown source"}${state?` · ${state}`:""}`);
  return `Provenance · ${chain.length?chain.join(" → "):"local contributor"}`;
}

export function focusedPropertyLifecycleOperation(
  action:string,
  propertyId:string,
):{kind:"delete";propertyId:string}|undefined {
  return action==="Remove local"||action==="Reset to parent"?{kind:"delete",propertyId}:undefined;
}

/**
 * Keep ownership legality in one place.  The UI may present an inherited item,
 * but it must never accidentally turn a parent item into a local deletion.
 */
export function focusedOwnershipActions(input:FocusedOwnershipInput):string[] {
  if(input.conflict) return ["View conflict","Edit local resolution","Open contributing sources"];
  if(input.invariant) return ["View","Open source"];
  if(input.overridden) return ["View","Edit","Reset to parent"];
  if(input.local) return ["View","Edit","Remove local"];
  if(input.inherited) return ["View",...(input.replaceable?["Replace here"]:[]),"Open source"];
  return ["View","Edit"];
}

export function focusedSectionOwnershipActions(input:FocusedOwnershipInput):Record<FocusedPropertyPrimarySection,string[]> {
  const actions=focusedOwnershipActions(input),lifecycle=new Set(["Remove local","Reset to parent"]);
  return {
    definition:input.inherited&&!input.local?[]:actions.filter((action)=>!lifecycle.has(action)&&action!=="Replace here"),
    rules:[],
    structure:input.inherited&&!input.structureOwned?["Override here"]:actions.filter((action)=>lifecycle.has(action)),
  };
}

export function focusedDefinitionFacetOwnershipActions(input:Pick<FocusedOwnershipInput,"inherited"|"local">):string[] {
  return input.inherited&&input.local?["Reset to parent"]:[];
}

export interface FocusedReusableRule {id:string;name:string;kind?:string;enabled?:boolean;outcome?:Record<string,unknown>;[field:string]:unknown;}
export const focusedReusableRuleStorageKey = "my-chrome-utilities.schema-rule-library.v1";

export function filterFocusedReusableRules(rules:readonly FocusedReusableRule[],query:string):FocusedReusableRule[] {
  const needle=query.trim().toLocaleLowerCase();
  return rules.filter(({enabled,name})=>enabled!==false&&(!needle||name.toLocaleLowerCase().includes(needle)));
}

export function readFocusedReusableRules(storage?:Pick<Storage,"getItem">):FocusedReusableRule[] {
  let source=storage;
  if(!source)try{source=globalThis.localStorage;}catch{return[];}
  if(!source)return[];
  try {
    const parsed=JSON.parse(source.getItem(focusedReusableRuleStorageKey)??"[]");
    return Array.isArray(parsed)?parsed.filter((entry):entry is FocusedReusableRule=>Boolean(entry)&&typeof entry.id==="string"&&typeof entry.name==="string"):[];
  } catch{return[];}
}

export function focusedReusableOutcome(rule:FocusedReusableRule):Record<string,unknown>|undefined {
  const source=rule.outcome&&typeof rule.outcome==="object"?rule.outcome:rule;
  const kind=String(source.kind??"");if(!["presence","value","allowed-values","pattern","range","cardinality","condition","custom","starts-with","ends-with","includes"].includes(kind))return undefined;
  const outcome=cloneReusable(source);delete outcome.id;delete outcome.name;delete outcome.enabled;delete outcome.condition;delete outcome.outcome;
  return outcome;
}

const cloneReusable=(value:Record<string,unknown>):Record<string,unknown>=>structuredClone(value);

export function focusedRuleFields(kind:string):string[] {
  switch(kind) {
    case "presence": return ["condition","presence","severity","message"];
    case "value": return ["condition","valueOperator","severity","message"];
    case "allowed-values": return ["condition","ordinaryValue","severity","message"];
    case "pattern": return ["condition","pattern","severity","message"];
    case "starts-with":
    case "ends-with":
    case "includes": return ["condition","literal","severity","message"];
    case "range": return ["condition","minimum","maximum","severity","message"];
    case "cardinality": return ["condition","minItems","maxItems","severity","message"];
    case "reusable": return ["condition","reusableRuleId"];
    case "custom": return ["condition","severity","message","reusableRuleId"];
    default: return isStringLiteralRuleKind(kind)?["condition","literal","severity","message"]:["severity","message"];
  }
}

export function focusedConditionLabel(condition:Record<string,unknown>|undefined):string {
  if(!condition) return "All (empty)";
  if(condition.kind === "predicate") return `${String(condition.propertyId??"Unresolved property")} ${String(condition.operator??"Exists")}${condition.value===undefined?"":` ${String(condition.value)}`}`;
  const kind = condition.kind === "any" ? "Any" : condition.kind === "not" ? "Not" : "All";
  const children = Array.isArray(condition.children) ? condition.children as Record<string,unknown>[] : [];
  return `${kind} (${children.map((child)=>focusedConditionLabel(child)).join(kind === "Any" ? " or " : " and ")})`;
}

export interface FocusedStagedChange {
  kind:"add"|"edit"|"remove"|"restore"|"override"|"reset";
  label:string;
  detail:string;
}

export function focusedSparseDelta(next:Record<string,unknown>,inherited:Record<string,unknown>):Record<string,unknown> {
  const same=(left:unknown,right:unknown)=>JSON.stringify(left)===JSON.stringify(right);
  return Object.fromEntries(Object.entries(next).filter(([key,value])=>value!==undefined&&!same(value,inherited[key])));
}

export function focusedConstraintPreview(path:string,facets:LayerConstraint):string {
  const pieces=[
    facets.type?`type ${facets.type}`:undefined,
    facets.presence?`presence ${facets.presence}`:undefined,
    facets.allowedValues?.length?`allowed ${JSON.stringify(facets.allowedValues)}`:undefined,
    facets.rules?.length?`${facets.rules.length} rules`:undefined,
  ].filter(Boolean);
  return `${path} · ${pieces.join(" · ")||"no local facets"}`;
}
