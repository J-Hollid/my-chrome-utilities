import { createCanonicalProjectEnvelope } from "./data-layer-specification-engine.js";
export const CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY = "my-chrome-utilities.specification-project.v1";
const clone = (value) => structuredClone(value);
function entityRevisions(state, previous) { const prior = previous?.entityRevisions ?? {}; return Object.fromEntries(Object.values(state.project.collections).flat().map(({ id }) => [id, prior[id] ?? 1])); }
function envelopeFor(state, revision, previous) { const base = createCanonicalProjectEnvelope(state.project, state.draft?.id ?? `release:${state.project.currentRelease ?? "unpublished"}`); return { ...base, revision, entityRevisions: entityRevisions(state, previous), draft: clone(state.draft), history: clone(state.history) }; }
export function restoreCanonicalProjectEnvelope(serialized) { if (!serialized)
    return undefined; const parsed = JSON.parse(serialized); if ("format" in parsed && parsed.format === "my-chrome-utilities.canonical-specification-project")
    return clone(parsed); if ("project" in parsed)
    return envelopeFor(parsed, 0); throw new Error("Unsupported Specification Project storage format."); }
export function restoreCanonicalProjectState(serialized) { const envelope = restoreCanonicalProjectEnvelope(serialized); return envelope ? { project: clone(envelope.project), ...(envelope.draft ? { draft: clone(envelope.draft) } : {}), history: clone(envelope.history ?? { undo: [], redo: [] }) } : undefined; }
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const record = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const entityArray = (value) => Array.isArray(value) && value.every((item) => record(item) && typeof item.id === "string");
function changedFields(base, next, path) {
    if (same(base, next))
        return [];
    if (entityArray(base) && entityArray(next)) {
        const before = new Map(base.map((item) => [item.id, item])), after = new Map(next.map((item) => [item.id, item]));
        return [...new Set([...before.keys(), ...after.keys()])].flatMap((id) => changedFields(before.get(id), after.get(id), `${path}[${id}]`));
    }
    if (record(base) && record(next)) {
        const keys = new Set([...Object.keys(base), ...Object.keys(next)]);
        return [...keys].flatMap((key) => changedFields(base[key], next[key], `${path}.${key}`));
    }
    return [path];
}
function mergeValue(base, current, pending, path, pendingField) {
    if (same(pending, base))
        return clone(current);
    if (same(current, base))
        return clone(pending);
    if (same(current, pending))
        return clone(current);
    if (entityArray(base) && entityArray(current) && entityArray(pending)) {
        const before = new Map(base.map((item) => [item.id, item])), latest = new Map(current.map((item) => [item.id, item])), next = new Map(pending.map((item) => [item.id, item])), ids = [...current.map(({ id }) => id), ...pending.map(({ id }) => id).filter((id) => !latest.has(id))];
        return ids.map((id) => mergeValue(before.get(id), latest.get(id), next.get(id), `${path}[${id}]`, pendingField)).filter((value) => value !== undefined);
    }
    if (record(base) && record(current) && record(pending)) {
        const keys = new Set([...Object.keys(base), ...Object.keys(current), ...Object.keys(pending)]);
        return Object.fromEntries([...keys].map((key) => [key, mergeValue(base[key], current[key], pending[key], `${path}.${key}`, pendingField)]).filter(([, value]) => value !== undefined));
    }
    return clone(pendingField(path) ? pending : current);
}
export function inspectCanonicalProjectConflict(conflict) { const pendingFields = changedFields(conflict.base.project, conflict.pending.project, "project"), currentFields = changedFields(conflict.base.project, conflict.current.project, "project"), current = new Set(currentFields); return { pendingFields, currentFields, conflictingFields: pendingFields.filter((field) => current.has(field)) }; }
export function resolveCanonicalProjectConflict(conflict, choice) {
    if (choice.strategy === "reload")
        return clone(conflict.current);
    const selected = new Set(choice.pendingFields ?? []), pendingField = (path) => choice.strategy === "reapply" || selected.has(path);
    const draft = conflict.current.draft ? { ...conflict.current.draft, status: "Saved", updatedAt: new Date().toISOString() } : conflict.pending.draft;
    return { ...clone(conflict.current), project: mergeValue(conflict.base.project, conflict.current.project, conflict.pending.project, "project", pendingField), ...(draft ? { draft } : {}), history: clone(conflict.pending.history) };
}
export function commitCanonicalProjectState(storage, next, options) { const key = CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, previous = restoreCanonicalProjectEnvelope(storage.getItem(key)), revision = previous?.revision ?? 0; if (options?.expectedRevision !== undefined && options.expectedRevision !== revision) {
    const current = restoreCanonicalProjectState(storage.getItem(key));
    if (!current)
        throw new Error("The canonical project disappeared while resolving a stale command.");
    return { status: "conflict", key, revision, base: clone(options.base ?? next), current, pending: clone(next), pendingLabel: options.pendingLabel ?? "Unsaved edit" };
} const envelope = envelopeFor(next, revision + 1, previous); storage.setItem(key, JSON.stringify(envelope)); return { status: "committed", key, revision: envelope.revision, envelope }; }
//# sourceMappingURL=data-layer-specification-repository.js.map