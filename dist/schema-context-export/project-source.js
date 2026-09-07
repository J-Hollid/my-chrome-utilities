import { canonicalPropertyPath } from "../data-layer-canonical-schema.js";
import { composedCanonicalSchema, composedSchemaWorkspace } from "../data-layer-composed-schema-workspace.js";
/** Resolve the same effective contribution used by the selected editor. */
export function projectContextExportSource(state, entity, scope, flowId, pending = false) {
    const graph = flowId ? state.project.documentationFlowGraphs[flowId] : undefined;
    const kind = scope === "Shared Profile" ? "profiles" : scope === "Property Set" ? "propertySets" : scope === "Page" ? "pages" : "events";
    const live = scope === "Flow Page-instance" ? graph?.pageFrames?.find(item => item.id === entity.id) : scope === "Event-occurrence" ? graph?.occurrences?.find(item => item.id === entity.id) : state.project.collections[kind].find(item => item.id === entity.id);
    if (!live)
        throw new Error("The selected schema context is no longer available.");
    entity = live;
    let canonical;
    const errors = [];
    if (scope === "Shared Profile") {
        if (!entity.canonicalSchema)
            throw new Error("The selected canonical schema is unavailable.");
        canonical = structuredClone(entity.canonicalSchema);
    }
    else {
        const workspace = composedSchemaWorkspace(state, entity, scope, undefined, flowId);
        if (workspace.status === "blocked")
            errors.push(workspace.conflictSummary);
        canonical = composedCanonicalSchema(state, entity, scope, flowId);
        const excluded = workspace.rows.filter(row => row.excluded).map(row => row.path);
        const kept = Object.values(canonical.nodes).filter(node => { const path = canonicalPropertyPath(canonical, node.id); return !excluded.some(exclusion => path === exclusion || path.startsWith(`${exclusion}/`)); });
        canonical.nodes = Object.fromEntries(kept.map(node => [node.id, node]));
        canonical.rootIds = canonical.rootIds.filter(id => Boolean(canonical.nodes[id]));
    }
    const flow = flowId ? state.project.collections.flows.find(item => item.id === flowId) : undefined;
    const page = graph?.pageFrames?.find(frame => frame.id === entity.pageFrameId || frame.id === entity.pageInstanceId || frame.id === entity.pageContextId);
    const context = [flow?.name, page?.name].filter(Boolean).join(" · ");
    return { key: [state.project.id, scope, flowId, entity.id].filter(Boolean).join("/"), name: entity.name, role: scope, context, version: "Draft", canonical, pending, errors };
}
//# sourceMappingURL=project-source.js.map