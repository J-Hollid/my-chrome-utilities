import { stageProjectImport } from "../data-layer-project-library.js";
import { importFlowVisualArchive, migrateVersion2VisualAssets } from "../flow-visual-asset-portability.js";
const cancelled = () => new DOMException("Project transport was cancelled.", "AbortError");
const assertSignal = (signal) => { if (signal?.aborted)
    throw cancelled(); };
const WRITE_CHUNK_BYTES = 64 * 1024;
export function createVersion2ProjectLibraryTransport(options) {
    return {
        async prepareExport(projectId) {
            let bytes = new TextEncoder().encode(JSON.stringify(await options.repository.exportProject(projectId))), started = false, released = false;
            return { formatVersion: 2, mediaType: "application/json", extension: "json", estimatedBytes: bytes.byteLength, async write(sink, input = {}) { if (released || !bytes)
                    throw new Error("Prepared project export was released."); if (started)
                    throw new Error("Prepared project export already started."); started = true; assertSignal(input.signal); input.onProgress?.({ phase: "write", completed: 0, total: bytes.byteLength, message: "Writing project export…" }); for (let offset = 0; offset < bytes.byteLength; offset += WRITE_CHUNK_BYTES) {
                    assertSignal(input.signal);
                    await sink.write(bytes.subarray(offset, Math.min(offset + WRITE_CHUNK_BYTES, bytes.byteLength)));
                    input.onProgress?.({ phase: "write", completed: Math.min(offset + WRITE_CHUNK_BYTES, bytes.byteLength), total: bytes.byteLength, message: "Writing project export…" });
                } assertSignal(input.signal); input.onProgress?.({ phase: "write", completed: bytes.byteLength, total: bytes.byteLength, message: "Project export written." }); }, release() { released = true; bytes = undefined; } };
        },
        async inspectImport(source) {
            let serialized = await source.text(), bundle;
            try {
                bundle = JSON.parse(serialized);
            }
            catch { /* stageProjectImport owns the readable-bundle diagnostic */ }
            const staged = stageProjectImport(serialized, options.library(), { id: options.id, ...(options.now ? { now: options.now } : {}) }), formatVersion = Number(bundle?.version ?? 0);
            let started = false, released = false;
            return { formatVersion, sourceName: staged.sourceName, targetName: staged.targetName, projectId: staged.projectId, entityCounts: staged.entityCounts, referenceIntegrity: staged.referenceIntegrity, migrations: staged.migrations, blockers: staged.blockers, async commit(input) { if (released || !serialized || !bundle)
                    throw new Error("Inspected project import was released."); if (started)
                    throw new Error("Inspected project import already started."); started = true; assertSignal(input.signal); if (staged.blockers.length)
                    throw new Error("Project import is blocked."); input.onProgress?.({ phase: "commit", completed: 0, total: 1, message: "Importing project into durable storage…" }); await options.repository.importProject(bundle, { projectId: staged.projectId, name: input.name }); assertSignal(input.signal); input.onProgress?.({ phase: "commit", completed: 1, total: 1, message: "Project import committed." }); }, release() { released = true; serialized = undefined; bundle = undefined; } };
        },
    };
}
const uniqueTargetName = (library, sourceName) => { let candidate = sourceName, index = 1; const names = new Set(Object.values(library.projects).map(({ state }) => state.project.name.trim().toLowerCase())); while (names.has(candidate.trim().toLowerCase())) {
    candidate = index === 1 ? `${sourceName} copy` : `${sourceName} copy ${index}`;
    index += 1;
} return candidate; };
const entityCounts = (project) => Object.fromEntries(Object.entries(project.collections).map(([kind, entries]) => [kind, entries.length]));
const progress = (value) => ({ phase: value.phase, completed: value.completed, total: value.total, message: `${value.phase} ${value.entry ?? "project"} ${value.completed}/${value.total}` });
const importBundle = (project, publishedProject, sourceName) => { const publishedRevision = Math.max(0, ...project.releases.map(({ revision }) => revision)); return { format: "my-chrome-utilities.durable-project-bundle", version: 2, sourceProjectId: project.id, sourceName, publishedRevision, baseProjectRevision: publishedRevision, project, ...(publishedProject ? { publishedProject } : {}) }; };
export function createVersion3ProjectLibraryTransport(options) {
    return {
        async prepareExport(projectId) { const prepared = await options.repository.prepareProjectArchive(projectId); let started = false, released = false; return { formatVersion: 3, mediaType: "application/zip", extension: "zip", estimatedBytes: prepared.estimatedBytes, async write(sink, input = {}) { if (released)
                throw new Error("Prepared project export was released."); if (started)
                throw new Error("Prepared project export already started."); started = true; assertSignal(input.signal); await prepared.write(sink, { ...(input.signal ? { signal: input.signal } : {}), onProgress: value => input.onProgress?.(progress(value)) }); assertSignal(input.signal); }, release() { released = true; } }; },
        async inspectImport(source, input = {}) {
            assertSignal(input.signal);
            const bytes = source.arrayBuffer ? new Uint8Array(await source.arrayBuffer()) : new TextEncoder().encode(await source.text());
            assertSignal(input.signal);
            const archive = bytes[0] === 80 && bytes[1] === 75;
            let project, publishedProject, assets, bundle, sourceName = "Unknown", targetName = "", projectId = options.id("project"), migrations = [], counts = {}, blockers = [];
            if (archive) {
                const staged = await importFlowVisualArchive(bytes, { projectId, id: options.id, ...(input.signal ? { signal: input.signal } : {}), onProgress: value => input.onProgress?.(progress(value)) });
                project = staged.project;
                publishedProject = staged.publishedProject;
                assets = staged.assets;
                migrations = staged.migrations;
                sourceName = project.name;
                targetName = uniqueTargetName(options.library(), sourceName);
                counts = entityCounts(project);
            }
            else {
                const serialized = new TextDecoder().decode(bytes);
                bundle = JSON.parse(serialized);
                const rawProject = bundle.project, embedded = rawProject && Array.isArray(rawProject.conceptVisualAssets) && rawProject.conceptVisualAssets.some(value => Boolean(value && typeof value === "object" && typeof value.bytes === "string"));
                if (embedded && rawProject) {
                    const staged = await migrateVersion2VisualAssets({ format: String(bundle.format), version: Number(bundle.version), project: rawProject, ...(bundle.publishedProject && typeof bundle.publishedProject === "object" ? { publishedProject: bundle.publishedProject } : {}) }, { projectId, id: options.id });
                    project = staged.project;
                    publishedProject = staged.publishedProject;
                    assets = staged.assets;
                    migrations = staged.migrations;
                    sourceName = String(bundle.sourceName ?? rawProject.name);
                    targetName = uniqueTargetName(options.library(), sourceName);
                    counts = entityCounts(project);
                }
                else {
                    const staged = stageProjectImport(serialized, options.library(), { id: oldId => oldId === rawProject?.id ? projectId : options.id(oldId), ...(options.now ? { now: options.now } : {}) });
                    sourceName = staged.sourceName;
                    targetName = staged.targetName;
                    projectId = staged.projectId;
                    counts = staged.entityCounts;
                    migrations = staged.migrations;
                    blockers = staged.blockers;
                }
            }
            let started = false, released = false;
            return { formatVersion: archive ? 3 : Number(bundle?.version ?? 2), sourceName, targetName, projectId, entityCounts: counts, referenceIntegrity: blockers.length ? "blocked" : "valid", migrations, blockers, async commit(commitInput) { if (released)
                    throw new Error("Inspected project import was released."); if (started)
                    throw new Error("Inspected project import already started."); started = true; assertSignal(commitInput.signal); if (blockers.length)
                    throw new Error("Project import is blocked."); commitInput.onProgress?.({ phase: "commit", completed: 0, total: 1, message: "Importing project into durable storage…" }); if (project)
                    await options.repository.importProject(importBundle(project, publishedProject, sourceName), { projectId, name: commitInput.name }, assets);
                else if (bundle)
                    await options.repository.importProject(bundle, { projectId, name: commitInput.name });
                else
                    throw new Error("Inspected project import was released."); commitInput.onProgress?.({ phase: "commit", completed: 1, total: 1, message: "Project import committed." }); }, release() { released = true; project = undefined; publishedProject = undefined; assets = undefined; bundle = undefined; } };
        },
    };
}
//# sourceMappingURL=project-library-transport-v2.js.map