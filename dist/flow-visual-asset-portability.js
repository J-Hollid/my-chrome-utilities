import { readStoredZip, writeStoredZip } from "./flow-visual-zip.js";
import { validateFlowVisualBody, validateFlowVisualMetadata } from "./flow-visual-asset-validation.js";
const clone = (value) => structuredClone(value), encoder = new TextEncoder(), decoder = new TextDecoder();
const assetKey = (projectId, assetId) => `${projectId}:${assetId}`, bodyKey = (projectId, digest) => `${projectId}:${digest}`;
export function createMemoryFlowVisualAssetStore() {
    let metadata = new Map(), bodies = new Map(), trace = { metadataReads: 0, bodyReads: 0, metadataWrites: 0, bodyWrites: 0, bodyDeletes: 0 };
    return {
        trace: () => clone(trace), clearTrace: () => { trace = { metadataReads: 0, bodyReads: 0, metadataWrites: 0, bodyWrites: 0, bodyDeletes: 0 }; },
        async listMetadata(projectId) { trace.metadataReads += 1; return [...metadata].filter(([identity]) => identity.startsWith(`${projectId}:`)).map(([, value]) => clone(value)).sort((a, b) => a.id.localeCompare(b.id)); },
        async readBody(projectId, assetId) { trace.bodyReads += 1; const asset = metadata.get(assetKey(projectId, assetId)), value = asset && bodies.get(bodyKey(projectId, asset.digest)); if (!value)
            throw new DOMException(`Original visual body ${assetId} is unavailable.`, "NotFoundError"); return value.slice(0, value.size, value.type); },
        async replaceProjectAssets(projectId, assets) {
            const nextMetadata = new Map(metadata), nextBodies = new Map(bodies), wantedAssets = new Set(), wantedDigests = new Set();
            for (const asset of assets) {
                await validateFlowVisualBody(asset.metadata, asset.body);
                const identity = assetKey(projectId, asset.metadata.id), digestIdentity = bodyKey(projectId, asset.metadata.digest);
                if (wantedAssets.has(identity))
                    throw new DOMException(`Duplicate visual asset identity ${asset.metadata.id}.`, "DataError");
                wantedAssets.add(identity);
                wantedDigests.add(digestIdentity);
                if (JSON.stringify(nextMetadata.get(identity)) !== JSON.stringify(asset.metadata)) {
                    nextMetadata.set(identity, clone(asset.metadata));
                    trace.metadataWrites += 1;
                }
                if (!nextBodies.has(digestIdentity)) {
                    nextBodies.set(digestIdentity, asset.body.slice(0, asset.body.size, asset.body.type));
                    trace.bodyWrites += 1;
                }
            }
            for (const identity of [...nextMetadata.keys()])
                if (identity.startsWith(`${projectId}:`) && !wantedAssets.has(identity))
                    nextMetadata.delete(identity);
            for (const identity of [...nextBodies.keys()])
                if (identity.startsWith(`${projectId}:`) && !wantedDigests.has(identity)) {
                    nextBodies.delete(identity);
                    trace.bodyDeletes += 1;
                }
            metadata = nextMetadata;
            bodies = nextBodies;
        },
        async deleteProject(projectId) { for (const identity of [...metadata.keys()])
            if (identity.startsWith(`${projectId}:`))
                metadata.delete(identity); for (const identity of [...bodies.keys()])
            if (identity.startsWith(`${projectId}:`)) {
                bodies.delete(identity);
                trace.bodyDeletes += 1;
            } },
    };
}
const extension = (type) => type === "image/png" ? "png" : type === "image/jpeg" ? "jpg" : "webp";
const withoutEmbeddedBodies = (project) => { const value = clone(project); if (value.conceptVisualAssets)
    value.conceptVisualAssets = value.conceptVisualAssets.map(({ bytes, ...metadata }) => metadata); return value; };
const jsonBlob = (value) => new Blob([JSON.stringify(value)], { type: "application/json" });
async function prepareArchive(input, options = {}) {
    const ordered = [...input.assets].sort((a, b) => a.metadata.id.localeCompare(b.metadata.id)), assets = [], uniqueBodies = new Map();
    for (const [index, asset] of ordered.entries()) {
        if (options.signal?.aborted)
            throw new DOMException("Project archive work was cancelled.", "AbortError");
        await validateFlowVisualBody(asset.metadata, asset.body);
        const entry = `assets/${asset.metadata.digest.slice(7)}.${extension(asset.metadata.mediaType)}`, prior = uniqueBodies.get(entry);
        if (prior && (prior.metadata.digest !== asset.metadata.digest || prior.metadata.mediaType !== asset.metadata.mediaType || prior.metadata.byteLength !== asset.metadata.byteLength))
            throw new DOMException(`Digest-addressed entry ${entry} has inconsistent metadata.`, "DataError");
        uniqueBodies.set(entry, prior ?? asset);
        assets.push({ ...asset.metadata, entry });
        options.onProgress?.({ phase: "validate", entry, completed: index + 1, total: ordered.length });
    }
    const project = withoutEmbeddedBodies(input.project), publishedProject = input.publishedProject ? withoutEmbeddedBodies(input.publishedProject) : undefined, manifest = { format: "my-chrome-utilities.project-archive", version: 3, requiredFeatures: ["digest-addressed-visual-assets"], draftEntry: "draft.json", ...(publishedProject ? { publishedEntry: "published.json" } : {}), assets };
    return { manifest, project, publishedProject, uniqueBodies };
}
export async function writeFlowVisualArchive(input, sink, options = {}) {
    const prepared = await prepareArchive(input, options), entries = async function* () { yield { name: "manifest.json", body: jsonBlob(prepared.manifest) }; yield { name: "draft.json", body: jsonBlob(prepared.project) }; if (prepared.publishedProject)
        yield { name: "published.json", body: jsonBlob(prepared.publishedProject) }; for (const [name, asset] of prepared.uniqueBodies)
        yield { name, body: asset.body }; }();
    let completed = 0, total = prepared.uniqueBodies.size + 2 + (prepared.publishedProject ? 1 : 0);
    return writeStoredZip(entries, sink, { ...(options.signal ? { signal: options.signal } : {}), onEntry: (entry) => options.onProgress?.({ phase: "write", entry, completed: ++completed, total }) });
}
export async function createFlowVisualArchive(input) {
    const chunks = [];
    await writeFlowVisualArchive(input, { write: async (chunk) => { chunks.push(Uint8Array.from(chunk)); } });
    const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0), result = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}
export async function estimateFlowVisualArchiveSize(input) {
    const prepared = await prepareArchive(input), entries = [{ name: "manifest.json", size: jsonBlob(prepared.manifest).size }, { name: "draft.json", size: jsonBlob(prepared.project).size }, ...(prepared.publishedProject ? [{ name: "published.json", size: jsonBlob(prepared.publishedProject).size }] : []), ...[...prepared.uniqueBodies].map(([name, asset]) => ({ name, size: asset.body.size }))];
    return entries.reduce((total, { name, size }) => total + size + 76 + 2 * encoder.encode(name).length, 22);
}
const parseJson = async (entries, name) => { const value = entries.get(name); if (!value)
    throw new DOMException(`The archive is missing ${name}.`, "DataError"); try {
    return JSON.parse(await value.text());
}
catch {
    throw new DOMException(`Archive entry ${name} is not readable JSON.`, "DataError");
} };
export async function importFlowVisualArchive(source, input = {}) {
    const blob = source instanceof Blob ? source : new Blob([Uint8Array.from(source)]), entries = await readStoredZip(blob, undefined, { ...(input.signal ? { signal: input.signal } : {}), onEntry: (entry, index) => input.onProgress?.({ phase: "read", entry, completed: index, total: 0 }) }), manifest = await parseJson(entries, "manifest.json");
    if (manifest.format !== "my-chrome-utilities.project-archive" || manifest.version !== 3)
        throw new DOMException("Use a supported project archive version.", "NotSupportedError");
    if ((manifest.requiredFeatures ?? []).some(feature => feature !== "digest-addressed-visual-assets"))
        throw new DOMException("The project archive requires unsupported features.", "NotSupportedError");
    if (new Set(manifest.assets.map(({ id }) => id)).size !== manifest.assets.length)
        throw new DOMException("The archive manifest contains duplicate visual asset identities.", "DataError");
    const entryContracts = new Map();
    for (const asset of manifest.assets) {
        validateFlowVisualMetadata(asset);
        const contract = JSON.stringify([asset.digest, asset.mediaType, asset.width, asset.height, asset.byteLength]), prior = entryContracts.get(asset.entry);
        if (prior && prior !== contract)
            throw new DOMException(`Archive entry ${asset.entry} has inconsistent asset declarations.`, "DataError");
        entryContracts.set(asset.entry, contract);
    }
    const allowed = new Set(["manifest.json", manifest.draftEntry, ...(manifest.publishedEntry ? [manifest.publishedEntry] : []), ...entryContracts.keys()]);
    for (const name of entries.keys())
        if (!allowed.has(name))
            throw new DOMException(`The archive contains undeclared entry ${name}.`, "DataError");
    const sourceProject = await parseJson(entries, manifest.draftEntry), published = manifest.publishedEntry ? await parseJson(entries, manifest.publishedEntry) : undefined, mapping = projectMapping(sourceProject, input.projectId ?? sourceProject.id, input.id ?? (oldId => oldId)), assets = [];
    for (const [index, declared] of manifest.assets.entries()) {
        if (input.signal?.aborted)
            throw new DOMException("Project archive work was cancelled.", "AbortError");
        const body = entries.get(declared.entry);
        if (!body)
            throw new DOMException(`Restore the missing asset ${declared.id} and export again.`, "DataError");
        await validateFlowVisualBody(declared, body);
        assets.push({ metadata: { id: mapping.get(declared.id) ?? input.id?.(declared.id) ?? declared.id, mediaType: declared.mediaType, width: declared.width, height: declared.height, byteLength: declared.byteLength, digest: declared.digest }, body: body.slice(0, body.size, declared.mediaType) });
        input.onProgress?.({ phase: "validate", entry: declared.entry, completed: index + 1, total: manifest.assets.length });
    }
    const declaredIds = new Set(manifest.assets.map(({ id }) => id));
    for (const referenced of [...assetReferences(sourceProject), ...(published ? assetReferences(published) : [])])
        if (!declaredIds.has(referenced))
            throw new DOMException(`Restore the missing asset ${referenced} and export again.`, "DataError");
    return { formatVersion: 3, project: remap(sourceProject, mapping), ...(published ? { publishedProject: remap(published, mapping) } : {}), assets, migrations: [] };
}
export async function migrateVersion2VisualAssets(bundle, input) {
    if (bundle.version !== 2)
        throw new DOMException("Use a supported version 2 project bundle.", "NotSupportedError");
    const source = clone(bundle.project), mapping = projectMapping(source, input.projectId, input.id), assets = [];
    for (const asset of source.conceptVisualAssets ?? []) {
        if (typeof asset.bytes !== "string" || !asset.bytes.startsWith(`data:${asset.mediaType};base64,`))
            throw new DOMException(`Legacy visual ${asset.id} has unreadable embedded bytes.`, "DataError");
        const raw = atob(asset.bytes.slice(asset.bytes.indexOf(",") + 1)), body = new Blob([Uint8Array.from(raw, character => character.charCodeAt(0))], { type: asset.mediaType });
        await validateFlowVisualBody(asset, body);
        assets.push({ metadata: { id: mapping.get(asset.id) ?? input.id(asset.id), mediaType: asset.mediaType, width: asset.width, height: asset.height, byteLength: asset.byteLength, digest: asset.digest }, body });
    }
    return { formatVersion: 3, project: remap(withoutEmbeddedBodies(source), mapping), ...(bundle.publishedProject ? { publishedProject: remap(withoutEmbeddedBodies(bundle.publishedProject), mapping) } : {}), assets, migrations: ["Embedded concept visuals moved to separate original Blob bodies"] };
}
function projectMapping(project, targetProjectId, id) { const ids = new Set(); const visit = (value, external = false, parent = "") => { if (Array.isArray(value)) {
    for (const entry of value)
        visit(entry, external, parent);
    return;
} if (!value || typeof value !== "object")
    return; for (const [name, entry] of Object.entries(value)) {
    const outside = external || name === "sourceLineage" || name === "externalLineage";
    if (!outside && name === "id" && typeof entry === "string")
        ids.add(entry);
    if (!outside && parent === "documentationFlowGraphs")
        ids.add(name);
    visit(entry, outside, name);
} }; visit(project); return new Map([...ids].map(old => [old, old === project.id ? targetProjectId : id(old)])); }
function remap(value, mapping, external = false, parent = "") { if (typeof value === "string")
    return !external && mapping.has(value) ? mapping.get(value) : value; if (Array.isArray(value))
    return value.map(entry => remap(entry, mapping, external, parent)); if (!value || typeof value !== "object")
    return value; return Object.fromEntries(Object.entries(value).map(([name, entry]) => { const outside = external || name === "sourceLineage" || name === "externalLineage", mappedName = !outside && parent === "documentationFlowGraphs" ? (mapping.get(name) ?? name) : name; return [mappedName, remap(entry, mapping, outside, name)]; })); }
function assetReferences(project) { return Object.values(project.documentationFlowGraphs ?? {}).flatMap(graph => [...(graph.pageFrames ?? []), ...(graph.occurrences ?? [])].flatMap(item => item.conceptVisual?.assetId ? [item.conceptVisual.assetId] : [])); }
//# sourceMappingURL=flow-visual-asset-portability.js.map