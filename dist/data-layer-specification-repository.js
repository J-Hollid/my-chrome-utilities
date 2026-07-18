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
export function commitCanonicalProjectState(storage, next, options) { const key = CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, previous = restoreCanonicalProjectEnvelope(storage.getItem(key)), revision = previous?.revision ?? 0; if (options?.expectedRevision !== undefined && options.expectedRevision !== revision) {
    const current = restoreCanonicalProjectState(storage.getItem(key));
    if (!current)
        throw new Error("The canonical project disappeared while resolving a stale command.");
    return { status: "conflict", key, revision, current, pending: clone(next), pendingLabel: options.pendingLabel ?? "Unsaved edit" };
} const envelope = envelopeFor(next, revision + 1, previous); storage.setItem(key, JSON.stringify(envelope)); return { status: "committed", key, revision: envelope.revision, envelope }; }
//# sourceMappingURL=data-layer-specification-repository.js.map