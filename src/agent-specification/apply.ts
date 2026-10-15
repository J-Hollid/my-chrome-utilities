import {transactProject, type ProjectEntity, type ProjectState} from "../data-layer-specification-project.js";
import {markProfileInheritanceConsumersForSourceChange} from "../data-layer-selective-profile-inheritance.js";
import type {CanonicalSchemaDocument} from "../data-layer-canonical-schema.js";
import {changeRecord, entityRecord, materializeChange, remapReferences} from "./records.js";
import {parseRecord, stableJson} from "./contract.js";
import {materializeAgentFlow} from "./flow.js";
import {findDefinitionMatches, historyFor, sourceMappingKey} from "./matching.js";
import {assertPermittedChanges, validateProjectReferences} from "./validation.js";
import type {AgentReview} from "./types.js";

export function applyAcceptedChanges(state:ProjectState, review:AgentReview):{state:ProjectState; applied:string[]} {
  if (state.project.id !== review.projectId) throw new Error("Open the project used by this proposal.");
  if (stableJson(state.project) !== stableJson(review.baseProject)) throw new Error("The project changed. Refresh the proposal context and review it again.");
  const changes = review.proposal.changes.filter(item=>review.decisions[item.id]?.decision === "accepted" && !review.appliedIds.includes(item.id));
  if (!changes.length) throw new Error("Accept at least one unapplied change.");
  assertPermittedChanges(review, changes);
  const history = structuredClone(historyFor(state.project)), ids = new Map<string,string>();
  for (const change of review.proposal.changes) ids.set(change.id, change.targetId ?? `agent:${review.taskId}:${change.id}`);
  for (let pass=0; pass<ids.size; pass++) for (const [id,target] of ids) if (ids.has(target)) ids.set(id,ids.get(target)!);
  const order = ["profiles", "applicabilitySets", "propertySets", "pages", "events", "flows", "fixtures", "assignments"];
  const pending = [...changes].sort((a,b)=>order.indexOf(a.kind)-order.indexOf(b.kind)), sorted:typeof changes=[];
  while (pending.length) {
    const index=pending.findIndex(item=>item.dependsOn.every(id=>!pending.some(candidate=>candidate.id===id)) && !pending.some(candidate=>candidate.id===item.targetId));
    if (index<0) throw new Error("The proposal has a dependency cycle.");
    sorted.push(pending.splice(index,1)[0]!);
  }
  const next = transactProject(state, "Apply accepted agent proposal", source => {
    let project = source;
    for (const change of sorted) {
      const receipt = `${review.taskId}:${change.id}`;
      if (history.applied.includes(receipt)) continue;
      const collection = project.collections[change.kind] as ProjectEntity[];
      const identity = ids.get(change.id)!, target = change.action === "create" ? undefined : collection.find(entity=>entity.id === identity);
      if (change.action !== "create" && !target) throw new Error(`${change.name}: the target no longer exists.`);
      const mappingKey = sourceMappingKey(review.sourceKey, change), previous = history.mappings.find(item=>item.key === mappingKey);
      if (change.action === "create") {
        const duplicates = findDefinitionMatches(project, change, review.sourceKey).filter(item=>item.kind !== "similar");
        if (duplicates.length) throw new Error(`${change.name}: resolve its existing definition match before creating a duplicate.`);
        if (collection.some(entity=>entity.id === identity)) throw new Error(`${change.name}: duplicate proposed identity.`);
      }
      if (change.action === "update" && previous && target && previous.targetRecord !== stableJson(entityRecord(target,project)) && previous.sourceRecord !== stableJson(changeRecord(change))) {
        throw new Error(`${change.name}: both the project and source changed since the last import. Resolve this conflict in the project, or reuse the current definition.`);
      }
      if(change.action==="update"&&previous&&target&&previous.targetRecord!==stableJson(entityRecord(target,project))&&previous.sourceRecord===stableJson(changeRecord(change)))throw new Error(`${change.name}: the source is unchanged, but the project has local edits. Reuse the current definition to retain them.`);
      if (change.action !== "reuse") {
        const entity = materializeChange(change, identity, project, ids, target);
        project = {...project, collections:{...project.collections, [change.kind]:target ? collection.map(item=>item.id === identity ? entity : item) : [...collection, entity]}};
        if (change.kind === "profiles" && target?.canonicalSchema && entity.canonicalSchema) project = markProfileInheritanceConsumersForSourceChange(project, identity, target.canonicalSchema as CanonicalSchemaDocument, entity.canonicalSchema as CanonicalSchemaDocument);
        const data = parseRecord(change.recordJson);
        if (change.kind === "flows" && data.graph !== undefined) {
          const graphs=project.documentationFlowGraphs as Record<string,unknown> ?? {};
          project.documentationFlowGraphs = {...graphs, [identity]:materializeAgentFlow(remapReferences(data.graph,ids),graphs[identity])};
        }
      }
      const saved = (project.collections[change.kind] as ProjectEntity[]).find(entity=>entity.id === identity)!;
      if (review.sourceKey) history.mappings = [...history.mappings.filter(item=>item.key !== mappingKey), {key:mappingKey, kind:change.kind, targetId:identity, sourceRecord:stableJson(changeRecord(change)), targetRecord:stableJson(entityRecord(saved,project))}];
      history.applied.push(receipt);
    }
    const priorIssues = new Set(validateProjectReferences(source));
    const issues = validateProjectReferences(project).filter(issue=>!priorIssues.has(issue));
    if (issues.length) throw new Error(issues.join("\n"));
    project.agentHistory = history;
    return project;
  });
  return {state:next, applied:changes.map(item=>item.id)};
}
