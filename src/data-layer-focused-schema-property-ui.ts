import type {LayerConstraint} from "./data-layer-layered-schema.js";
export {focusedRuleIssue} from "./data-layer-focused-rule-policy.js";

/** The deliberately small vocabulary shared by every schema contributor editor. */
export const focusedPropertySections = [
  "definition",
  "rules",
  "structure",
] as const;
export type FocusedPropertySection = typeof focusedPropertySections[number]|"presence"|"values"|"conditions"|"documentation"|"example";

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
  overridden?:boolean;
  invariant?:boolean;
  conflict?:boolean;
  replaceable?:boolean;
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
  if(input.inherited) return ["View",...(input.replaceable?["Replace here"]:["Override here"]),"Open source"];
  return ["View","Edit"];
}

export interface FocusedReusableRule {id:string;name:string;kind?:string;enabled?:boolean;}
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

export function focusedRuleFields(kind:string):string[] {
  switch(kind) {
    case "presence": return ["condition","presence","severity","message"];
    case "value": return ["condition","ordinaryValue","severity","message"];
    case "pattern": return ["condition","pattern","severity","message"];
    case "range": return ["condition","minimum","maximum","severity","message"];
    case "cardinality": return ["condition","minItems","maxItems","severity","message"];
    case "reusable": return ["condition","reusableRuleId"];
    case "custom": return ["condition","severity","message","reusableRuleId"];
    default: return ["severity","message"];
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
