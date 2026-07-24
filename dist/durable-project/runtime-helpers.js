import { createSpecificationProject } from "../data-layer-specification-project.js";
import { PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary } from "../data-layer-project-library.js";
import { CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, serializeCanonicalProjectState } from "../data-layer-specification-repository.js";
export const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
export const cleanState = (state) => ({ ...structuredClone(state), history: { undo: [], redo: [] } });
export const historyLabel = (state) => state.history.undo.at(-1)?.label;
export const cleanRecord = (value) => ({ ...structuredClone(value), state: cleanState(value.state) });
export const cleanLibrary = (value) => ({ ...structuredClone(value), projects: Object.fromEntries(Object.entries(value.projects).map(([projectId, entry]) => [projectId, cleanRecord(entry)])) });
export const routeWithRetainedHydration = (previous, next) => previous && previous.collectionKind === next.collectionKind && previous.entityId === next.entityId ? { ...next, collectionKinds: [...new Set([...(previous.collectionKinds ?? []), ...(next.collectionKinds ?? [])])], includeFlowGraphs: Boolean(previous.includeFlowGraphs || next.includeFlowGraphs), includeFixtures: Boolean(previous.includeFixtures || next.includeFixtures), includeReleases: Boolean(previous.includeReleases || next.includeReleases) } : next;
export function placeholder(metadata) { const state = createSpecificationProject({ name: metadata.name, site: metadata.site, id: (kind) => kind === "project" ? metadata.projectId : `placeholder:${kind}:${metadata.projectId}` }); state.project.owner = metadata.owner; state.project.placeholder = true; return { state: cleanState(state), revision: metadata.draftSequence ?? 0, publishedRevision: metadata.publishedRevision, createdAt: metadata.lastSavedAt, lastModifiedAt: metadata.lastSavedAt, ...(metadata.navigation ? { navigation: structuredClone(metadata.navigation) } : {}) }; }
export function record(loaded) { return { state: cleanState(loaded.state), revision: loaded.draftSequence, publishedRevision: loaded.publishedRevision, createdAt: loaded.lastSavedAt, lastModifiedAt: loaded.lastSavedAt, ...(loaded.navigation ? { navigation: structuredClone(loaded.navigation) } : {}) }; }
export function writeProjectLibrary(memory, library) { memory.set(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(library)); }
export function writeCanonicalState(memory, projectId, active) { if (active?.state.project.id === projectId)
    memory.set(CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, serializeCanonicalProjectState(active.state, active.draftSequence)); }
//# sourceMappingURL=runtime-helpers.js.map