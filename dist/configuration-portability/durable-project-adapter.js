import { createMemoryDurableProjectRepository } from "../data-layer-durable-project-repository.js";
import { COMPLETE_CONFIGURATION_DOMAINS } from "./domain-inventory.js";
import { DEFAULT_MAXIMUM_BYTES } from "./archive-format.js";
import { isSharedProjectArchive, rebuildSharedProjectArchive, splitProjectArchive } from "./shared-project-archive.js";
const clone = (value) => structuredClone(value);
const emptySections = () => Object.fromEntries(COMPLETE_CONFIGURATION_DOMAINS.map((domain) => [domain, []]));
const bytes = async (blob) => new Uint8Array(await blob.arrayBuffer());
const sha256 = async (value) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(value).buffer)), (byte) => byte.toString(16).padStart(2, "0")).join("");
const referencedSchemas = (value, known) => {
    const found = new Set();
    const visit = (item) => {
        if (Array.isArray(item)) {
            item.forEach(visit);
            return;
        }
        if (!item || typeof item !== "object")
            return;
        for (const [key, nested] of Object.entries(item)) {
            if ((key === "schemaId" || key === "sourceIdentity") && typeof nested === "string" && known.has(nested))
                found.add(nested);
            else
                visit(nested);
        }
    };
    visit(value);
    return [...found];
};
export function createDurableProjectConfigurationRepository(repository) {
    return {
        async read(options = {}) {
            const sections = emptySections(), bodies = [], uniqueBodies = new Map();
            const before = await repository.listProjectMetadata(), activeBefore = await repository.activeProjectId();
            const savedSchemasBefore = await repository.savedSchemas(), schemaIds = new Set(savedSchemasBefore.map((schema) => String(schema.id)));
            sections.savedSchemas = savedSchemasBefore.map((schema) => ({ id: String(schema.id), value: clone(schema) }));
            let uniqueBytes = 0, completed = 0;
            for (const metadata of before) {
                options.signal?.throwIfAborted();
                const prepared = await repository.prepareProjectArchive(metadata.projectId), projectEstimate = prepared.estimatedBytes;
                options.signal?.throwIfAborted();
                if (projectEstimate > DEFAULT_MAXIMUM_BYTES)
                    throw new DOMException(`A saved project exceeds the ${DEFAULT_MAXIMUM_BYTES} byte configuration limit.`, "QuotaExceededError");
                const chunks = [];
                await prepared.write({ write: async (chunk) => { chunks.push(Uint8Array.from(chunk)); } }, options.signal ? { signal: options.signal } : {});
                const archive = new Blob(chunks), archiveDigest = `project-archive:${metadata.projectId}`;
                options.signal?.throwIfAborted();
                const shared = await splitProjectArchive(metadata.projectId, archive, options.signal);
                for (const body of [shared.archiveBody, ...shared.parts]) {
                    const prior = uniqueBodies.get(body.digest);
                    if (prior) {
                        if (prior.mediaType !== body.mediaType || await sha256(prior.bytes) !== await sha256(body.bytes)) {
                            throw new DOMException(`Shared project body ${body.digest} has conflicting content.`, "DataError");
                        }
                        continue;
                    }
                    uniqueBytes += body.bytes.byteLength;
                    if (uniqueBytes > DEFAULT_MAXIMUM_BYTES)
                        throw new DOMException(`Saved project bodies exceed the ${DEFAULT_MAXIMUM_BYTES} byte configuration limit.`, "QuotaExceededError");
                    uniqueBodies.set(body.digest, body);
                    bodies.push(body);
                }
                const loaded = await repository.loadProject(metadata.projectId);
                const portableMetadata = clone(metadata);
                delete portableMetadata.navigation;
                sections.projects.push({ id: metadata.projectId, value: { name: metadata.name, archiveDigest,
                        archiveContentDigest: await sha256(shared.archiveBody.bytes), metadata: portableMetadata },
                    dependencies: referencedSchemas(loaded.state.project, schemaIds).map((id) => ({ domain: "savedSchemas", id })) });
                for (const template of loaded.state.project.documentation?.templates ?? []) {
                    sections.documentationTemplates.push({ id: `${metadata.projectId}/${template.id}`, value: clone(template),
                        dependencies: [{ domain: "projects", id: metadata.projectId }] });
                }
                options.signal?.throwIfAborted();
                options.onProgress?.(++completed, before.length);
            }
            const after = await repository.listProjectMetadata(), activeAfter = await repository.activeProjectId();
            const savedSchemasAfter = await repository.savedSchemas();
            if (JSON.stringify(before) !== JSON.stringify(after) || activeBefore !== activeAfter ||
                JSON.stringify(savedSchemasBefore) !== JSON.stringify(savedSchemasAfter))
                throw new DOMException("Saved projects or schemas changed while the configuration snapshot was read. Retry the export.", "InvalidStateError");
            return { activeProjectId: activeAfter ?? null, sections, bodies };
        },
        async commit(snapshot, options = {}) {
            const bodyByDigest = new Map(snapshot.bodies.map(body => [body.digest, body]));
            const staged = createMemoryDurableProjectRepository(), incoming = new Set(snapshot.sections.projects.map(({ id }) => id));
            let completed = 0;
            for (const record of snapshot.sections.projects) {
                options.signal?.throwIfAborted();
                const value = record.value, archiveDigest = String(value.archiveDigest ?? ""), body = bodyByDigest.get(archiveDigest);
                if (!body)
                    throw new DOMException(`Project ${record.id} is missing archive body ${archiveDigest}.`, "DataError");
                if (await sha256(body.bytes) !== value.archiveContentDigest)
                    throw new DOMException(`Project ${record.id} archive content does not match its bound digest.`, "DataError");
                if (body.mediaType === "application/json") {
                    const bundle = JSON.parse(new TextDecoder().decode(body.bytes));
                    await staged.importProject(bundle, { projectId: record.id, name: String(value.name ?? record.id) });
                }
                else {
                    const projectArchive = isSharedProjectArchive(body) ?
                        await rebuildSharedProjectArchive(body, bodyByDigest, options.signal) :
                        new Blob([Uint8Array.from(body.bytes).buffer]);
                    await staged.importProjectArchive(projectArchive, { projectId: record.id, name: String(value.name ?? record.id),
                        ...(options.signal ? { signal: options.signal } : {}) });
                }
                if (value.metadata && typeof value.metadata === "object")
                    await staged.restorePortableProjectMetadata(clone(value.metadata));
                options.onProgress?.(++completed, snapshot.sections.projects.length);
            }
            if (snapshot.activeProjectId && incoming.has(snapshot.activeProjectId))
                await staged.setActiveProject(snapshot.activeProjectId);
            if (snapshot.sections.savedSchemas.length) {
                const schemas = snapshot.sections.savedSchemas.map(({ id, value }) => {
                    if (!value || typeof value !== "object" || Array.isArray(value) || String(value.id) !== id) {
                        throw new DOMException(`Saved schema ${id} has an invalid identity.`, "DataError");
                    }
                    return { schema: clone(value) };
                });
                await staged.applySavedSchemaBatch({ upserts: schemas, deletes: [], label: "Stage configuration schemas" });
            }
            options.signal?.throwIfAborted();
            await repository.replacePortableProjectState(await staged.readPortableProjectState(), options.commitMarker, options.signal);
        },
    };
}
//# sourceMappingURL=durable-project-adapter.js.map