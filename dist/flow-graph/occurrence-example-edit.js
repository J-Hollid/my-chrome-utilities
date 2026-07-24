import { canonicalSchemaWithConstraint, compileLayeredSchema, createCanonicalSchema, layeredContributorPath, layeredContributorsForPath, migrateLegacyProfile, transactProject } from "../utilities/data-layer/schemas.js";
import { clone, storedGraph, saveStoredGraph } from "../data-layer-flow-graph.js";
export function setFlowOccurrenceExample(state, flowId, occurrenceId, path, value, id) {
    const occurrence = storedGraph(state.project, flowId).occurrences.find(({ id: candidateId }) => candidateId === occurrenceId);
    if (!occurrence || !path.startsWith("/"))
        return state;
    const contributorPath = layeredContributorPath(state, occurrence, "Event-occurrence", flowId), contributors = layeredContributorsForPath(state, contributorPath), effective = compileLayeredSchema(contributors, { eventId: String(occurrence.eventId ?? ""), eventRole: "interaction", occurrenceId }).properties[path], legacy = Boolean(occurrence.schemaConstraints || occurrence.localSchemaContributions), canonical = occurrence.canonicalSchema ?? (legacy ? migrateLegacyProfile(occurrence, { id }).document : createCanonicalSchema({ id: id("canonical-schema"), contributorId: occurrence.id, contributorName: occurrence.name })), next = canonicalSchemaWithConstraint(canonical, { path, ...(effective?.type ? { type: effective.type } : {}), examples: [clone(value)] }, id);
    return transactProject(state, `Save Flow occurrence example ${path}`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...graph, occurrences: graph.occurrences.map((candidate) => { if (candidate.id !== occurrenceId)
            return candidate; const updated = { ...candidate, canonicalSchema: next, schemaInstanceExamplePaths: [...new Set([...(candidate.schemaInstanceExamplePaths ?? []), path])] }; delete updated.schemaConstraints; delete updated.localSchemaContributions; return updated; }) }); });
}
//# sourceMappingURL=occurrence-example-edit.js.map