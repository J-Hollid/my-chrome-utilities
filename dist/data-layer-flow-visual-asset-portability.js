const clone = (value) => structuredClone(value);
const encoder = new TextEncoder(), decoder = new TextDecoder();
const key = (projectId, assetId) => `${projectId}:${assetId}`;
const hex = (value) => Array.from(new Uint8Array(value), byte => byte.toString(16).padStart(2, "0")).join("");
const sha256 = async (value) => `sha256:${hex(await crypto.subtle.digest("SHA-256", Uint8Array.from(value).buffer))}`;
export function createMemoryFlowVisualAssetStore() {
    let metadata = new Map(), bodies = new Map(), trace = { metadataReads: 0, bodyReads: 0, metadataWrites: 0, bodyWrites: 0, bodyDeletes: 0 };
    return {
        trace: () => clone(trace), clearTrace: () => { trace = { metadataReads: 0, bodyReads: 0, metadataWrites: 0, bodyWrites: 0, bodyDeletes: 0 }; },
        async listMetadata(projectId) { trace.metadataReads += 1; return [...metadata].filter(([identity]) => identity.startsWith(`${projectId}:`)).map(([, value]) => clone(value)).sort((a, b) => a.id.localeCompare(b.id)); },
        async readBody(projectId, assetId) { trace.bodyReads += 1; const value = bodies.get(key(projectId, assetId)); if (!value)
            throw new DOMException(`Original visual body ${assetId} is unavailable.`, "NotFoundError"); return value.slice(0, value.size, value.type); },
        async replaceProjectAssets(projectId, assets) {
            const nextMetadata = new Map(metadata), nextBodies = new Map(bodies), wanted = new Set();
            for (const asset of assets) {
                validateMetadata(asset.metadata);
                if (asset.body.size !== asset.metadata.byteLength)
                    throw new DOMException(`Visual ${asset.metadata.id} byte length does not match its metadata.`, "DataError");
                const bytes = new Uint8Array(await asset.body.arrayBuffer());
                if (await sha256(bytes) !== asset.metadata.digest)
                    throw new DOMException(`Visual ${asset.metadata.id} digest does not match its original body.`, "DataError");
                const identity = key(projectId, asset.metadata.id);
                wanted.add(identity);
                const prior = nextMetadata.get(identity), body = nextBodies.get(identity);
                if (JSON.stringify(prior) !== JSON.stringify(asset.metadata)) {
                    nextMetadata.set(identity, clone(asset.metadata));
                    trace.metadataWrites += 1;
                }
                if (!body || prior?.digest !== asset.metadata.digest) {
                    nextBodies.set(identity, asset.body.slice(0, asset.body.size, asset.body.type));
                    trace.bodyWrites += 1;
                }
            }
            for (const identity of [...nextMetadata.keys()])
                if (identity.startsWith(`${projectId}:`) && !wanted.has(identity)) {
                    nextMetadata.delete(identity);
                    if (nextBodies.delete(identity))
                        trace.bodyDeletes += 1;
                }
            metadata = nextMetadata;
            bodies = nextBodies;
        },
        async deleteProject(projectId) { for (const identity of [...metadata.keys()])
            if (identity.startsWith(`${projectId}:`)) {
                metadata.delete(identity);
                if (bodies.delete(identity))
                    trace.bodyDeletes += 1;
            } },
    };
}
function validateMetadata(value) {
    if (!value.id || !/^image\/(?:png|jpeg|webp)$/.test(value.mediaType))
        throw new DOMException("A visual asset has unsupported metadata.", "DataError");
    if (!Number.isInteger(value.width) || !Number.isInteger(value.height) || value.width < 1 || value.height < 1 || value.width > 4096 || value.height > 4096 || value.width * value.height > 16_000_000)
        throw new DOMException(`Visual ${value.id} dimensions exceed the supported limit.`, "DataError");
    if (!Number.isInteger(value.byteLength) || value.byteLength < 1 || value.byteLength > 5 * 1024 * 1024)
        throw new DOMException(`Visual ${value.id} exceeds the supported byte limit.`, "DataError");
    if (!/^sha256:[0-9a-f]{64}$/.test(value.digest))
        throw new DOMException(`Visual ${value.id} has an invalid SHA-256 digest.`, "DataError");
}
const crcTable = Array.from({ length: 256 }, (_, index) => { let value = index; for (let bit = 0; bit < 8; bit += 1)
    value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1; return value >>> 0; });
const crc32 = (bytes) => { let value = 0xffffffff; for (const byte of bytes)
    value = crcTable[(value ^ byte) & 255] ^ (value >>> 8); return (value ^ 0xffffffff) >>> 0; };
const u16 = (value) => Uint8Array.of(value & 255, (value >>> 8) & 255), u32 = (value) => Uint8Array.of(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255);
const concat = (parts) => { const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0)); let offset = 0; for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
} return output; };
function zip(entries) {
    const files = [], directory = [];
    let offset = 0;
    for (const entry of entries) {
        const name = encoder.encode(entry.name), crc = crc32(entry.bytes), local = concat([u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(entry.bytes.length), u32(entry.bytes.length), u16(name.length), u16(0), name, entry.bytes]);
        files.push(local);
        directory.push(concat([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(entry.bytes.length), u32(entry.bytes.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name]));
        offset += local.length;
    }
    const central = concat(directory);
    return concat([...files, central, u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(central.length), u32(offset), u16(0)]);
}
const view32 = (bytes, offset) => new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true), view16 = (bytes, offset) => new DataView(bytes.buffer, bytes.byteOffset + offset, 2).getUint16(0, true);
function unzip(bytes, limits = { entries: 10_000, unpackedBytes: 512 * 1024 * 1024 }) {
    const entries = new Map();
    let offset = 0, total = 0;
    while (offset + 4 <= bytes.length && view32(bytes, offset) === 0x04034b50) {
        if (entries.size >= limits.entries)
            throw new DOMException("The archive has excessive entry count.", "DataError");
        const method = view16(bytes, offset + 8), crc = view32(bytes, offset + 14), compressed = view32(bytes, offset + 18), size = view32(bytes, offset + 22), nameLength = view16(bytes, offset + 26), extraLength = view16(bytes, offset + 28);
        if (method !== 0)
            throw new DOMException("The archive uses an unsupported entry method.", "NotSupportedError");
        const name = decoder.decode(bytes.slice(offset + 30, offset + 30 + nameLength));
        if (!safePath(name) || entries.has(name))
            throw new DOMException(`The archive contains an unsafe or duplicate path: ${name}.`, "DataError");
        if (compressed !== size)
            throw new DOMException(`Archive entry ${name} has inconsistent stored lengths.`, "DataError");
        const start = offset + 30 + nameLength + extraLength, end = start + size;
        if (end > bytes.length)
            throw new DOMException(`Archive entry ${name} is incomplete.`, "DataError");
        total += size;
        if (total > limits.unpackedBytes)
            throw new DOMException("The archive exceeds the aggregate unpacked limit.", "QuotaExceededError");
        const body = bytes.slice(start, end);
        if (crc32(body) !== crc)
            throw new DOMException(`Archive entry ${name} failed CRC validation.`, "DataError");
        entries.set(name, body);
        offset = end;
    }
    if (!entries.size)
        throw new DOMException("Choose a readable version 3 project archive.", "DataError");
    return entries;
}
const safePath = (name) => Boolean(name && !name.startsWith("/") && !name.includes("\\") && !name.split("/").some(part => part === "" || part === "." || part === ".."));
const jsonEntry = (name, value) => ({ name, bytes: encoder.encode(JSON.stringify(value)) });
export async function createFlowVisualArchive(input) {
    const assets = [], entries = [];
    for (const asset of [...input.assets].sort((a, b) => a.metadata.digest.localeCompare(b.metadata.digest))) {
        validateMetadata(asset.metadata);
        const body = new Uint8Array(await asset.body.arrayBuffer());
        if (body.length !== asset.metadata.byteLength || await sha256(body) !== asset.metadata.digest)
            throw new DOMException(`Visual ${asset.metadata.id} does not match its declared body.`, "DataError");
        const entry = `assets/${asset.metadata.digest.slice(7)}.${extension(asset.metadata.mediaType)}`;
        assets.push({ ...asset.metadata, entry });
        entries.push({ name: entry, bytes: body });
    }
    const project = withoutEmbeddedBodies(input.project), publishedProject = input.publishedProject ? withoutEmbeddedBodies(input.publishedProject) : undefined, manifest = { format: "my-chrome-utilities.project-archive", version: 3, requiredFeatures: ["digest-addressed-visual-assets"], draftEntry: "draft.json", ...(publishedProject ? { publishedEntry: "published.json" } : {}), assets };
    return zip([jsonEntry("manifest.json", manifest), jsonEntry("draft.json", project), ...(publishedProject ? [jsonEntry("published.json", publishedProject)] : []), ...entries]);
}
function withoutEmbeddedBodies(project) { const value = clone(project); if (value.conceptVisualAssets)
    value.conceptVisualAssets = value.conceptVisualAssets.map(({ bytes, ...metadata }) => metadata); return value; }
const extension = (type) => type === "image/png" ? "png" : type === "image/jpeg" ? "jpg" : "webp";
const parseJson = (entries, name) => { const value = entries.get(name); if (!value)
    throw new DOMException(`The archive is missing ${name}.`, "DataError"); try {
    return JSON.parse(decoder.decode(value));
}
catch {
    throw new DOMException(`Archive entry ${name} is not readable JSON.`, "DataError");
} };
export async function importFlowVisualArchive(bytes, input = {}) {
    const entries = unzip(bytes), manifest = parseJson(entries, "manifest.json");
    if (manifest.format !== "my-chrome-utilities.project-archive" || manifest.version !== 3)
        throw new DOMException("Use a supported project archive version.", "NotSupportedError");
    if ((manifest.requiredFeatures ?? []).some(feature => feature !== "digest-addressed-visual-assets"))
        throw new DOMException("The project archive requires unsupported features.", "NotSupportedError");
    if (new Set(manifest.assets.map(({ id }) => id)).size !== manifest.assets.length || new Set(manifest.assets.map(({ entry }) => entry)).size !== manifest.assets.length)
        throw new DOMException("The archive manifest contains duplicate visual assets.", "DataError");
    const allowed = new Set(["manifest.json", manifest.draftEntry, ...(manifest.publishedEntry ? [manifest.publishedEntry] : []), ...manifest.assets.map(asset => asset.entry)]);
    for (const name of entries.keys())
        if (!allowed.has(name))
            throw new DOMException(`The archive contains undeclared entry ${name}.`, "DataError");
    const source = parseJson(entries, manifest.draftEntry), published = manifest.publishedEntry ? parseJson(entries, manifest.publishedEntry) : undefined, mapping = projectMapping(source, input.projectId ?? source.id, input.id ?? (oldId => oldId)), assets = [];
    for (const declared of manifest.assets) {
        validateMetadata(declared);
        const body = entries.get(declared.entry);
        if (!body)
            throw new DOMException(`Restore the missing asset ${declared.id} and export again.`, "DataError");
        if (body.length !== declared.byteLength || await sha256(body) !== declared.digest)
            throw new DOMException(`Asset ${declared.id} bytes do not match their digest.`, "DataError");
        assets.push({ metadata: { ...declared, id: mapping.get(declared.id) ?? input.id?.(declared.id) ?? declared.id }, body: new Blob([Uint8Array.from(body).buffer], { type: declared.mediaType }) });
    }
    const declaredIds = new Set(manifest.assets.map(({ id }) => id));
    for (const referenced of [...assetReferences(source), ...(published ? assetReferences(published) : [])])
        if (!declaredIds.has(referenced))
            throw new DOMException(`Restore the missing asset ${referenced} and export again.`, "DataError");
    return { formatVersion: 3, project: remap(source, mapping), ...(published ? { publishedProject: remap(published, mapping) } : {}), assets, migrations: [] };
}
export async function migrateVersion2VisualAssets(bundle, input) {
    if (bundle.version !== 2)
        throw new DOMException("Use a supported version 2 project bundle.", "NotSupportedError");
    const source = clone(bundle.project), mapping = projectMapping(source, input.projectId, input.id), assets = [];
    for (const asset of source.conceptVisualAssets ?? []) {
        if (typeof asset.bytes !== "string" || !asset.bytes.startsWith(`data:${asset.mediaType};base64,`))
            throw new DOMException(`Legacy visual ${asset.id} has unreadable embedded bytes.`, "DataError");
        const raw = atob(asset.bytes.slice(asset.bytes.indexOf(",") + 1)), body = Uint8Array.from(raw, character => character.charCodeAt(0));
        validateMetadata(asset);
        if (body.length !== asset.byteLength || await sha256(body) !== asset.digest)
            throw new DOMException(`Legacy visual ${asset.id} bytes do not match their digest.`, "DataError");
        assets.push({ metadata: { id: mapping.get(asset.id) ?? input.id(asset.id), mediaType: asset.mediaType, width: asset.width, height: asset.height, byteLength: asset.byteLength, digest: asset.digest }, body: new Blob([body], { type: asset.mediaType }) });
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
//# sourceMappingURL=data-layer-flow-visual-asset-portability.js.map