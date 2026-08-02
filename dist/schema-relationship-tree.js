const path = (parts) => parts.join(" → ");
const branch = (key, name, parts, children) => ({ key, name, kind: "branch", role: "Structural ancestor", relationshipPath: path([...parts, name]), children });
const contributor = (key, name, role, category, parts, targetKey = key) => ({ key, name, kind: "contributor", role, category, targetKey, relationshipPath: path([...parts, name]), children: [] });
const reference = (key, name, role, category, parts, targetKey, children = []) => ({ key, name, kind: "relationship", role, category, targetKey, relationshipPath: path([...parts, name]), children });
export function projectSchemaRelationshipTree(state, savedSchemas) {
    const savedPath = ["Saved schemas"], savedChildren = savedSchemas.map((schema) => contributor(`saved:${schema.id}`, schema.name, "Saved schema", "Saved schemas", savedPath, `saved:${schema.id}`));
    const saved = branch("saved-schemas", "Saved schemas", [], savedChildren);
    if (!state)
        return [saved];
    const { project } = state, { collections } = project, projectPath = [project.name], graphs = (project.documentationFlowGraphs ?? {}), propertySets = (collections.propertySets ?? collections.pageGroups);
    const byId = (values, id) => values.find((candidate) => candidate.id === id);
    const occurrencesFor = (flowId, frameId, eventId) => (graphs[flowId]?.occurrences ?? []).filter((occurrence) => (!frameId || occurrence.pageFrameId === frameId) && (!eventId || occurrence.eventId === eventId));
    const occurrenceNode = (appearance, flowId, occurrence, parts) => reference(`${appearance}:occurrence:${flowId}:${occurrence.id}`, occurrence.name, "Event occurrence", "Event occurrences", parts, `occurrences:${flowId}:${occurrence.id}`);
    const shared = branch(`project:${project.id}:shared`, "Shared Profiles", projectPath, collections.profiles.map((profile) => contributor(`profiles:${profile.id}`, profile.name, "Shared Profile", "Shared Profiles", [...projectPath, "Shared Profiles"])));
    const pageGroups = branch(`project:${project.id}:property-sets`, "Property Sets", projectPath, propertySets.map((group) => {
        const parts = [...projectPath, "Property Sets"], node = contributor(`propertySets:${group.id}`, group.name, "Property Set", "Property Sets", parts);
        node.children = collections.pages.filter((page) => (page.propertySetApplications ?? []).some(({ propertySetId }) => propertySetId === group.id) || (page.pageGroupIds ?? []).includes(group.id)).map((page) => reference(`property-set:${group.id}:page:${page.id}`, page.name, "Page application", "Pages", [...parts, group.name], `pages:${page.id}`));
        return node;
    }));
    const pages = branch(`project:${project.id}:pages`, "Pages", projectPath, collections.pages.map((page) => {
        const parts = [...projectPath, "Pages"], node = contributor(`pages:${page.id}`, page.name, "Page", "Pages", parts);
        node.children = Object.entries(graphs).flatMap(([flowId, graph]) => (graph.pageFrames ?? []).filter((frame) => frame.pageId === page.id).map((frame) => {
            const flow = byId(collections.flows, flowId), frameParts = [...parts, page.name];
            return reference(`page:${page.id}:frame:${flowId}:${frame.id}`, `${flow?.name ?? "Flow"} ${frame.name}`, "Flow Page instance", "Flow Page instances", frameParts, `flowInstances:${flowId}:${frame.id}`);
        }));
        return node;
    }));
    const events = branch(`project:${project.id}:events`, "Events", projectPath, collections.events.map((event) => {
        const parts = [...projectPath, "Events"], node = contributor(`events:${event.id}`, event.name, "Event", "Events", parts);
        node.children = Object.entries(graphs).flatMap(([flowId]) => occurrencesFor(flowId, undefined, event.id).map((occurrence) => {
            const flow = byId(collections.flows, flowId), frame = byId(graphs[flowId]?.pageFrames ?? [], occurrence.pageFrameId);
            return occurrenceNode(`event:${event.id}`, flowId, occurrence, [...parts, event.name, flow?.name ?? "Flow", frame?.name ?? "Page instance"]);
        }));
        return node;
    }));
    const flows = branch(`project:${project.id}:flows`, "Flows", projectPath, collections.flows.map((flow) => {
        const flowParts = [...projectPath, "Flows"], graph = graphs[flow.id] ?? {}, flowNode = branch(`flow:${flow.id}`, flow.name, flowParts, []);
        flowNode.children = (graph.pageFrames ?? []).map((frame) => {
            const page = byId(collections.pages, frame.pageId), frameName = frame.name || page?.name || "Page instance", parts = [...flowParts, flow.name];
            return reference(`flow:${flow.id}:frame:${frame.id}`, frameName, "Flow Page instance", "Flow Page instances", parts, `flowInstances:${flow.id}:${frame.id}`, occurrencesFor(flow.id, frame.id).map((occurrence) => occurrenceNode(`flow:${flow.id}:frame:${frame.id}`, flow.id, occurrence, [...parts, frameName])));
        });
        return flowNode;
    }));
    return [saved, branch(`project:${project.id}`, `Project ${project.name}`, [], [shared, pageGroups, pages, events, flows])];
}
function clonePruned(node, children, expanded = false, match = false) {
    const { expanded: _expanded, match: _match, ...base } = node;
    return { ...base, children, ...(expanded && children.length ? { expanded: true } : {}), ...(match ? { match: true } : {}) };
}
export function filterSchemaRelationshipTree(tree, view) {
    const query = view.query.trim().toLocaleLowerCase(), category = view.category;
    const categoryBranch = (node) => {
        if (node.key.endsWith(":shared"))
            return "Shared Profiles";
        if (node.key.endsWith(":property-sets"))
            return "Property Sets";
        if (node.key.endsWith(":pages"))
            return "Pages";
        if (node.key.endsWith(":events"))
            return "Events";
        if (node.key.endsWith(":flows"))
            return category === "Event occurrences" ? "Event occurrences" : "Flow Page instances";
        return undefined;
    };
    const relevantRoot = (node) => {
        if (category === "All")
            return true;
        if (category === "Saved schemas")
            return node.name === "Saved schemas";
        if (category === "Flow Page instances" || category === "Event occurrences")
            return node.name.startsWith("Project ");
        return node.name === category || node.name.startsWith("Project ");
    };
    const allowed = (node) => {
        if (category === "All")
            return true;
        if (node.kind === "branch")
            return true;
        if (category === "Property Sets")
            return node.category === "Property Sets" || Boolean(query && node.key.startsWith("property-set:"));
        if (category === "Flow Page instances")
            return node.category === "Flow Page instances" && node.key.startsWith("flow:");
        if (category === "Event occurrences")
            return node.category === "Event occurrences" && node.key.startsWith("flow:");
        return node.category === category;
    };
    const visit = (node) => {
        const branchCategory = categoryBranch(node);
        if (category !== "All" && category !== "Saved schemas" && branchCategory && branchCategory !== category)
            return undefined;
        const haystack = `${node.name} ${node.role} ${node.relationshipPath}`.toLocaleLowerCase(), selfMatches = !query || haystack.includes(query);
        const children = node.children.map(visit).filter((child) => Boolean(child));
        if (!allowed(node) && node.kind !== "branch") {
            if (!children.length)
                return undefined;
            const { targetKey: _targetKey, category: _category, ...ancestor } = clonePruned(node, children, Boolean(query));
            return { ...ancestor, kind: "branch" };
        }
        if (query && !selfMatches && !children.length)
            return undefined;
        if (!query && node.kind === "branch" && !children.length)
            return undefined;
        if (query && !selfMatches && children.length && node.targetKey) {
            const { targetKey: _targetKey, category: _category, ...ancestor } = clonePruned(node, children, true);
            return { ...ancestor, kind: "branch" };
        }
        return clonePruned(node, children, Boolean(query), Boolean(query && selfMatches && node.targetKey));
    };
    return tree.filter(relevantRoot).map(visit).filter((node) => Boolean(node));
}
const storageKey = (projectId) => `my-chrome-utilities.schema-relationship-tree-view.v1:${projectId}`;
const defaultView = () => ({ query: "", category: "All", expandedKeys: [], scrollTop: 0 });
export function saveSchemaRelationshipTreeView(storage, projectId, view) {
    const value = JSON.stringify(view), key = storageKey(projectId);
    try {
        if (storage.setItem)
            storage.setItem(key, value);
        else
            storage.set?.(key, value);
    }
    catch { /* Ephemeral navigation state must never block the canonical Schema Library. */ }
}
export function restoreSchemaRelationshipTreeView(storage, projectId, validKeys) {
    const key = storageKey(projectId);
    let serialized;
    try {
        serialized = storage.getItem ? storage.getItem(key) : storage.get?.(key);
    }
    catch {
        return defaultView();
    }
    if (!serialized)
        return defaultView();
    try {
        const parsed = JSON.parse(serialized), categories = ["All", "Saved schemas", "Shared Profiles", "Property Sets", "Pages", "Events", "Flow Page instances", "Event occurrences"];
        return { query: typeof parsed.query === "string" ? parsed.query : "", category: categories.includes(parsed.category) ? parsed.category : "All", expandedKeys: Array.isArray(parsed.expandedKeys) ? parsed.expandedKeys.filter((value) => typeof value === "string" && validKeys.has(value)) : [], scrollTop: Number.isFinite(parsed.scrollTop) && Number(parsed.scrollTop) >= 0 ? Number(parsed.scrollTop) : 0 };
    }
    catch {
        return defaultView();
    }
}
//# sourceMappingURL=schema-relationship-tree.js.map