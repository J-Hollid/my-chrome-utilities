import type {ProjectEntity, SpecificationProject} from "../data-layer-specification-project.js";
import {stableJson} from "./contract.js";
import {changeRecord, entityRecord} from "./records.js";
import type {AgentChange, AgentProjectHistory} from "./types.js";

export interface DefinitionMatch {id:string; name:string; kind:"exact" | "name" | "similar" | "previous-import"; explanation:string}
const normalized = (text:string):string => text.trim().toLocaleLowerCase().replace(/[\s_-]+/gu, " ");
export const historyFor = (project:SpecificationProject):AgentProjectHistory =>
  (project.agentHistory as AgentProjectHistory | undefined) ?? {mappings:[], applied:[]};
export function sourceMappingKey(sourceKey:string, change:AgentChange):string {
  return `${sourceKey}|${change.kind}|${normalized(change.name)}|${[...new Set(change.sources.map(source=>source.sheet))].sort().join("|")}`;
}
function similarity(left:string, right:string):number {
  const a = new Set(normalized(left).split(" ")), b = new Set(normalized(right).split(" "));
  return [...a].filter(value=>b.has(value)).length / Math.max(1, new Set([...a, ...b]).size);
}
export function findDefinitionMatches(project:SpecificationProject, change:AgentChange, sourceKey=""):DefinitionMatch[] {
  const desired = changeRecord(change), mapping = sourceKey ? historyFor(project).mappings.find(item=>item.key === sourceMappingKey(sourceKey, change)) : undefined;
  return (project.collections[change.kind] as ProjectEntity[]).flatMap<DefinitionMatch>(entity => {
    if (mapping?.targetId === entity.id) return [{id:entity.id, name:entity.name, kind:"previous-import" as const, explanation:"This source was mapped to this definition in an earlier import."}];
    const actual = entityRecord(entity,project);
    if (stableJson(actual) === stableJson(desired)) return [{id:entity.id, name:entity.name, kind:"exact" as const, explanation:"The exported definition and proposed definition are equal."}];
    if (normalized(entity.name) === normalized(change.name) || (desired.eventName && desired.eventName === actual.eventName)) return [{id:entity.id, name:entity.name, kind:"name" as const, explanation:"The name matches. Review the schema and trigger before reuse or update."}];
    if (similarity(entity.name, change.name) >= 0.5) return [{id:entity.id, name:entity.name, kind:"similar" as const, explanation:"Some name terms match. This is a candidate, not proof of equivalence."}];
    return [];
  }).sort((a,b)=>({"previous-import":0,exact:1,name:2,similar:3}[a.kind] - {"previous-import":0,exact:1,name:2,similar:3}[b.kind]));
}
