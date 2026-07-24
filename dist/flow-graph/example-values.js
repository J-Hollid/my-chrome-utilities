import { clone } from "../data-layer-flow-graph.js";
export const pointerParts = (path) => path.split("/").filter(Boolean).map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));
export const setAtPath = (payload, path, value) => { const parts = pointerParts(path); if (!parts.length)
    return; let parent = payload; for (const part of parts.slice(0, -1)) {
    const next = parent[part];
    if (!next || typeof next !== "object" || Array.isArray(next))
        parent[part] = {};
    parent = parent[part];
} parent[parts.at(-1)] = clone(value); };
export const valueAtPath = (payload, path) => pointerParts(path).reduce((value, part) => value && typeof value === "object" && !Array.isArray(value) ? value[part] : undefined, payload);
export const applicableExample = (constraint, occurrence, eventId, role) => !constraint.target || constraint.target === "all" || constraint.target === occurrence.id || constraint.target === eventId || constraint.target === (role === "context-setting" ? "context" : "interaction");
export const exampleEditHref = (flowId, occurrenceId, path) => `?kind=flow-page-instances&flow=${encodeURIComponent(flowId)}&entity=${encodeURIComponent(occurrenceId)}&field=${encodeURIComponent(`canonicalSchema.properties${path}.example`)}`;
//# sourceMappingURL=example-values.js.map