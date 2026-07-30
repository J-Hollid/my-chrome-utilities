import {compileLayeredSchema,validateLayeredObservation,type CompiledLayeredSchema,type EffectiveProperty,type LayerConstraint} from "./data-layer-layered-schema.js";
import {layeredContributorPath,layeredContributorsForPath} from "./data-layer-layered-schema-project.js";
import type {Condition,ProjectEntity,ProjectState} from "./data-layer-specification-project.js";

export interface PageGroupStructuralMembership {
  groupId:string;
  groupName:string;
  order:number;
  applicabilitySetId?:string;
  applicabilitySetName:string;
  condition:string;
  contributions:readonly LayerConstraint[];
}

export interface PageGroupConditionalBranch {
  groupId:string;
  groupName:string;
  order:number;
  applicabilitySetId:string;
  applicabilitySetName:string;
  condition:string;
  properties:Record<string,LayerConstraint>;
}

export interface PageGroupStructuralSchema {
  mode:"complete-page-specification";
  pageId:string;
  pageName:string;
  memberships:PageGroupStructuralMembership[];
  applicabilityPreviews:{applicabilitySetId:string;applicabilitySetName:string;condition:string;checked:boolean}[];
  includedMemberships:PageGroupStructuralMembership[];
  excludedMemberships:PageGroupStructuralMembership[];
  compiled:CompiledLayeredSchema;
  unconditional:CompiledLayeredSchema;
  conditionalBranches:PageGroupConditionalBranch[];
}

export interface PageGroupFixtureEvaluation {
  mode:"evaluated-example";
  fixtureId:string;
  fixtureName:string;
  pageId:string;
  pageName:string;
  payload:Record<string,unknown>;
  includedStack:string[];
  inactiveGroups:string[];
  matchedApplicabilitySets:string[];
  unmatchedApplicabilitySets:string[];
  compiled:CompiledLayeredSchema;
  validation:ReturnType<typeof validateLayeredObservation>;
}

export interface PageApplicabilityPreviewRoute {
  projectId:string;
  pageId:string;
}

export function resetDepartedPageApplicabilityPreview(
  previews:Map<string,Set<string>>,
  active:PageApplicabilityPreviewRoute|undefined,
  next:PageApplicabilityPreviewRoute|undefined,
):PageApplicabilityPreviewRoute|undefined {
  if(active&&(active.projectId!==next?.projectId||active.pageId!==next?.pageId))previews.delete(active.pageId);
  return next;
}

const scalar=(value:unknown):string=>typeof value==="string"?value:JSON.stringify(value);

export function pageGroupConditionText(condition:Condition|undefined):string {
  if(!condition)return"Always";
  if(condition.kind==="predicate"){
    const expected=condition.values?.join(", ")??condition.pattern??condition.value;
    return[condition.field,condition.operator,expected===undefined?undefined:scalar(expected)].filter(Boolean).join(" ");
  }
  const joiner=condition.kind==="all"?" and ":condition.kind==="any"?" or ":" nor ";
  const body=condition.conditions.map(pageGroupConditionText).join(joiner);
  return condition.kind==="not"?`not (${body})`:`(${body})`;
}

const pageFor=(state:ProjectState,pageId:string):ProjectEntity=>{
  const page=state.project.collections.pages.find(({id})=>id===pageId);
  if(!page)throw new Error(`Page ${pageId} is unavailable.`);
  return page;
};

export function pageGroupStructuralSchema(state:ProjectState,pageId:string,selectedApplicabilitySetIds?:readonly string[]):PageGroupStructuralSchema {
  const page=pageFor(state,pageId);
  const contributorPath=layeredContributorPath(state,page,"Page"),contributors=layeredContributorsForPath(state,contributorPath);
  const memberships=contributors.filter(({scope})=>scope==="Page Group").map((contributor,order):PageGroupStructuralMembership=>({
    groupId:contributor.id,
    groupName:contributor.name,
    order,
    ...(contributor.applicabilitySetId?{applicabilitySetId:contributor.applicabilitySetId}:{}),
    applicabilitySetName:contributor.applicabilitySetName??"Always",
    condition:contributor.applicabilityCondition?pageGroupConditionText(contributor.applicabilityCondition as unknown as Condition):"Always",
    contributions:contributor.constraints.map((constraint)=>structuredClone(constraint)),
  }));
  const referencedSetIds=[...new Set(memberships.flatMap(({applicabilitySetId})=>applicabilitySetId?[applicabilitySetId]:[]))];
  const selected=new Set(selectedApplicabilitySetIds??referencedSetIds);
  const applicabilityPreviews=referencedSetIds.map((applicabilitySetId)=>{
    const membership=memberships.find((candidate)=>candidate.applicabilitySetId===applicabilitySetId)!;
    return{applicabilitySetId,applicabilitySetName:membership.applicabilitySetName,condition:membership.condition,checked:selected.has(applicabilitySetId)};
  });
  const includedMemberships=memberships.filter(({applicabilitySetId})=>!applicabilitySetId||selected.has(applicabilitySetId));
  const excludedMemberships=memberships.filter(({applicabilitySetId})=>Boolean(applicabilitySetId&&!selected.has(applicabilitySetId)));
  const participatingGroupIds=includedMemberships.map(({groupId})=>groupId),unconditionalGroupIds=memberships.filter(({applicabilitySetId})=>!applicabilitySetId).map(({groupId})=>groupId),participatingContributors=layeredContributorsForPath(state,{...contributorPath,pageGroupIds:participatingGroupIds}),unconditionalContributors=layeredContributorsForPath(state,{...contributorPath,pageGroupIds:unconditionalGroupIds});
  const conditionalBranches=memberships.filter((membership):membership is PageGroupStructuralMembership&{applicabilitySetId:string}=>Boolean(membership.applicabilitySetId)).map((membership)=>({
    groupId:membership.groupId,
    groupName:membership.groupName,
    order:membership.order,
    applicabilitySetId:membership.applicabilitySetId,
    applicabilitySetName:membership.applicabilitySetName,
    condition:membership.condition,
    properties:Object.fromEntries(membership.contributions.map((constraint)=>[constraint.path,structuredClone(constraint)])),
  }));
  return{
    mode:"complete-page-specification",
    pageId:page.id,
    pageName:page.name,
    memberships,
    applicabilityPreviews,
    includedMemberships,
    excludedMemberships,
    compiled:compileLayeredSchema(participatingContributors,{eventId:String(page.eventName??page.id),eventRole:"context"}),
    unconditional:compileLayeredSchema(unconditionalContributors,{eventId:String(page.eventName??page.id),eventRole:"context"}),
    conditionalBranches,
  };
}

const fixturePayload=(fixture:ProjectEntity):Record<string,unknown>=>{
  if(fixture.payload&&typeof fixture.payload==="object"&&!Array.isArray(fixture.payload))return structuredClone(fixture.payload as Record<string,unknown>);
  const observations=(fixture.observations as Record<string,unknown>[]|undefined)??[];
  const observed=observations.at(-1);
  if(observed?.payload&&typeof observed.payload==="object"&&!Array.isArray(observed.payload))return structuredClone(observed.payload as Record<string,unknown>);
  return structuredClone(observed??{});
};

export function evaluatePageGroupFixture(state:ProjectState,fixtureId:string):PageGroupFixtureEvaluation {
  const fixture=state.project.collections.fixtures.find(({id})=>id===fixtureId);
  if(!fixture)throw new Error(`Fixture ${fixtureId} is unavailable.`);
  const pageId=String(fixture.pageId??(fixture.context as {pageId?:string}|undefined)?.pageId??"");
  const page=pageFor(state,pageId),payload=fixturePayload(fixture);
  const contributors=layeredContributorsForPath(state,layeredContributorPath(state,page,"Page"),payload);
  const compiled=compileLayeredSchema(contributors,{eventId:String(page.eventName??page.id),eventRole:"context"});
  const groups=contributors.filter(({scope})=>scope==="Page Group");
  const distinctSets=(active:boolean)=>[...new Set(groups.filter((group)=>active?group.active!==false:group.active===false).flatMap(({applicabilitySetName})=>applicabilitySetName?[applicabilitySetName]:[]))];
  return{
    mode:"evaluated-example",
    fixtureId:fixture.id,
    fixtureName:fixture.name,
    pageId:page.id,
    pageName:page.name,
    payload,
    includedStack:groups.filter(({active})=>active!==false).map(({name})=>name),
    inactiveGroups:groups.filter(({active})=>active===false).map(({name})=>name),
    matchedApplicabilitySets:distinctSets(true),
    unmatchedApplicabilitySets:distinctSets(false),
    compiled,
    validation:validateLayeredObservation({targetId:page.id,targetName:page.name,revision:Number(page.revision??1),compiled},payload),
  };
}

const constraintText=(constraint:LayerConstraint):string=>{
  const facets=[
    constraint.type?`type ${constraint.type}`:undefined,
    constraint.allowedValues?`allowed ${JSON.stringify(constraint.allowedValues)}`:undefined,
    constraint.expectedValue!==undefined?`equals ${scalar(constraint.expectedValue)}`:undefined,
    constraint.presence?`presence ${constraint.presence}`:undefined,
  ].filter(Boolean).join(" · ");
  return`${constraint.path}: ${facets||"constraint"}`;
};
const provenanceText=(property:EffectiveProperty):string=>property.origins.flatMap(({contributorName,inheritanceRoutes})=>inheritanceRoutes?.length?[...inheritanceRoutes]:[contributorName]).join(" | ");

export function documentPageGroupStructure(input:PageGroupStructuralSchema|PageGroupFixtureEvaluation):string {
  if(input.mode==="evaluated-example"){
    return[
      `Evaluated example: ${input.fixtureName} · Page ${input.pageName}`,
      `Matched Applicability Sets: ${input.matchedApplicabilitySets.join(", ")||"none"}`,
      `Not matched Applicability Sets: ${input.unmatchedApplicabilitySets.join(", ")||"none"}`,
      `Applicable Page Groups: ${input.includedStack.join(", ")||"none"}`,
      `Inactive Page Groups: ${input.inactiveGroups.join(", ")||"none"}`,
      ...Object.values(input.compiled.properties).map((property)=>`${constraintText(property)} · provenance ${provenanceText(property)}`),
    ].join("\n");
  }
  return[
    `Complete Page specification: ${input.pageName}`,
    ...input.memberships.map(({groupName,applicabilitySetId,applicabilitySetName,condition})=>`${groupName} · ${applicabilitySetId?`Applicability Set ${applicabilitySetName} · ${condition}`:"Always included"}`),
    ...Object.values(input.compiled.properties).map((property)=>`${constraintText(property)} · provenance ${provenanceText(property)}${property.superseded.length?` · superseded ${property.superseded.map(({contributorName,value})=>`${contributorName} ${scalar(value)}`).join(", ")}`:""}`),
  ].join("\n");
}
