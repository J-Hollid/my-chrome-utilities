import type {ProjectEntity, SpecificationProject} from "../data-layer-specification-project.js";
import {record} from "./contract.js";
import type {AgentChange, AgentReview} from "./types.js";

export function validateProjectReferences(project:SpecificationProject):string[] {
  const issues:string[] = [], has = (kind:keyof SpecificationProject["collections"], id:unknown):boolean =>
    typeof id === "string" && Boolean(project.collections[kind]?.some(entity=>entity.id === id));
  for (const page of project.collections.pages) {
    for (const application of (page.propertySetApplications ?? []) as Record<string,unknown>[]) {
      if (!has("propertySets", application.propertySetId)) issues.push(`${page.name}: unknown Property Set.`);
      if (application.applicabilitySetId && !has("applicabilitySets", application.applicabilitySetId)) issues.push(`${page.name}: unknown applicability condition.`);
    }
  }
  for (const entity of [...project.collections.assignments, ...project.collections.fixtures]) {
    if (entity.eventId && !has("events", entity.eventId)) issues.push(`${entity.name}: unknown Event.`);
    if (entity.pageId && !has("pages", entity.pageId)) issues.push(`${entity.name}: unknown Page.`);
    if (entity.applicabilitySetId && !has("applicabilitySets", entity.applicabilitySetId)) issues.push(`${entity.name}: unknown applicability condition.`);
    const targets:Record<string, keyof SpecificationProject["collections"]> = {"Shared Profile":"profiles", "Property Set":"propertySets", Page:"pages", Event:"events"};
    if (entity.targetId && targets[String(entity.targetKind)] && !has(targets[String(entity.targetKind)]!, entity.targetId)) issues.push(`${entity.name}: unknown assignment target.`);
  }
  for (const [flowId, raw] of Object.entries((project.documentationFlowGraphs ?? {}) as Record<string,unknown>)) {
    if (!has("flows", flowId) || !record(raw)) { issues.push("A flow graph has no Flow."); continue; }
    const frames = (raw.pageFrames ?? []) as ProjectEntity[], occurrences = (raw.occurrences ?? []) as ProjectEntity[];
    for (const frame of frames) if (!has("pages", frame.pageId)) issues.push(`${flowId}: unknown Page in flow.`);
    for (const occurrence of occurrences) {
      if (!has("events", occurrence.eventId)) issues.push(`${flowId}: unknown Event in flow.`);
      if (!frames.some(frame=>frame.id === occurrence.pageFrameId && frame.pageId === occurrence.pageId)) issues.push(`${flowId}: event occurrence needs its containing Page.`);
    }
    for (const relationship of (raw.relationships ?? []) as Record<string,unknown>[]) {
      for (const side of ["sourceEndpoint", "targetEndpoint"]) {
        const endpoint = relationship[side];
        if (!record(endpoint) || endpoint.kind !== "page-frame" || !frames.some(frame=>frame.id === endpoint.id)) issues.push(`${flowId}: invalid flow connection.`);
      }
    }
  }
  return [...new Set(issues)];
}
export function assertPermittedChanges(review:AgentReview, changes:AgentChange[]):void {
  const permitted = new Set(review.permittedIds), proposed = new Set(changes.map(item=>item.id));
  for (const change of changes) {
    if(change.action==="create"&&change.targetId!==null)throw new Error(`${change.name}: a new record cannot have an existing target.`);
    if (change.questions.length) throw new Error(`${change.name}: answer its open questions before acceptance.`);
    if (change.action !== "create" && (!change.targetId || (!permitted.has(change.targetId) && !proposed.has(change.targetId)))) throw new Error(`${change.name}: select an allowed target definition.`);
    if (!review.allowNewDefinitions && change.action === "create" && ["profiles", "propertySets"].includes(change.kind)) throw new Error(`${change.name}: new reusable definitions are disabled.`);
    for (const dependency of change.dependsOn) if (!proposed.has(dependency) && !review.appliedIds.includes(dependency)) throw new Error(`${change.name}: accept dependency ${dependency} first.`);
    const data = JSON.parse(change.recordJson) as Record<string,unknown>;
    for (const inheritance of (data.inheritance ?? []) as Record<string,unknown>[]) {
      if (!permitted.has(String(inheritance.profileId)) && !proposed.has(String(inheritance.profileId))) throw new Error(`${change.name}: this Shared Profile is excluded.`);
      const selected = review.selectedProperties?.[String(inheritance.profileId)];
      if (selected && (!Array.isArray(inheritance.propertyIds) || inheritance.propertyIds.some(id=>!selected.includes(String(id))))) throw new Error(`${change.name}: this Shared Profile property is excluded.`);
    }
    const checkReferences = (value:unknown, key=""):void => {
      if (typeof value === "string" && /(?:Id|Ids)$/u.test(key) && key !== "sourceId") {
        const isExisting = Object.values(review.baseProject.collections).some(items=>(items as ProjectEntity[]).some(entity=>entity.id === value));
        if (isExisting && !permitted.has(value)) throw new Error(`${change.name}: definition ${value} is excluded.`);
      } else if (Array.isArray(value)) value.forEach(item=>checkReferences(item,key));
      else if (record(value)) Object.entries(value).forEach(([field,item])=>checkReferences(item,field));
    };
    checkReferences(data);
  }
}
