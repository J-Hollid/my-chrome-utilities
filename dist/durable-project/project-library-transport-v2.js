import { stageProjectImport } from "../data-layer-project-library.js";
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
//# sourceMappingURL=project-library-transport-v2.js.map