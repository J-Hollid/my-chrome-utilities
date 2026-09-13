import { stageProjectImport, } from "../data-layer-project-library.js";
export function createCompatibilityProjectLibraryTransport(options) {
    return {
        async prepareExport(projectId) {
            let bytes = new TextEncoder().encode(await options.exportProject(projectId));
            let started = false;
            return {
                formatVersion: 2,
                mediaType: "application/json",
                extension: "json",
                estimatedBytes: bytes.byteLength,
                async write(sink, input = {}) {
                    if (!bytes)
                        throw new Error("Prepared project export was released.");
                    if (started)
                        throw new Error("Prepared project export already started.");
                    started = true;
                    if (input.signal?.aborted)
                        throw new DOMException("Project transport was cancelled.", "AbortError");
                    await sink.write(bytes);
                },
                release() { bytes = undefined; },
            };
        },
        async inspectImport(source) {
            let serialized = await source.text();
            let parsed;
            try {
                parsed = JSON.parse(serialized);
            }
            catch { }
            const staged = stageProjectImport(serialized, options.library(), {
                id: oldId => `${options.id("import")}:${oldId.split(":")[0]}`,
                now: options.now,
            });
            let started = false;
            return {
                formatVersion: Number(parsed?.version ?? 0),
                sourceName: staged.sourceName,
                targetName: staged.targetName,
                projectId: staged.projectId,
                entityCounts: staged.entityCounts,
                referenceIntegrity: staged.referenceIntegrity,
                migrations: staged.migrations,
                blockers: staged.blockers,
                async commit(input) {
                    if (!serialized)
                        throw new Error("Inspected project import was released.");
                    if (started)
                        throw new Error("Inspected project import already started.");
                    started = true;
                    if (input.signal?.aborted)
                        throw new DOMException("Project transport was cancelled.", "AbortError");
                    await options.importProject(serialized, { projectId: staged.projectId, name: input.name });
                },
                release() { serialized = undefined; parsed = undefined; },
            };
        },
    };
}
//# sourceMappingURL=project-library-transport.js.map