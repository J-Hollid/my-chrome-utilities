import { readStoredZip, writeStoredZip } from "../flow-visual-zip.js";
const encoder = new TextEncoder(), decoder = new TextDecoder();
const FORMAT = "my-chrome-utilities.shared-project-archive";
const MEDIA_TYPE = "application/vnd.my-chrome-utilities.shared-project-archive+json";
async function digest(bytes) {
    return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer)), (value) => value.toString(16).padStart(2, "0")).join("");
}
export async function splitProjectArchive(projectId, archive, signal) {
    const source = archive instanceof Blob ? archive : new Blob([Uint8Array.from(archive).buffer]);
    const entries = await readStoredZip(source, undefined, { ...(signal ? { signal } : {}) });
    const parts = [], descriptors = [];
    for (const [name, blob] of entries) {
        signal?.throwIfAborted();
        const bytes = new Uint8Array(await blob.arrayBuffer()), contentDigest = await digest(bytes), bodyDigest = `project-part:sha256:${contentDigest}`;
        parts.push({ digest: bodyDigest, mediaType: "application/octet-stream", bytes });
        descriptors.push({ name, bodyDigest, contentDigest });
    }
    const descriptor = { format: FORMAT, version: 1, parts: descriptors };
    return { archiveBody: { digest: `project-archive:${projectId}`, mediaType: MEDIA_TYPE,
            bytes: encoder.encode(JSON.stringify(descriptor)) }, parts };
}
export function isSharedProjectArchive(body) { return body.mediaType === MEDIA_TYPE; }
export async function rebuildSharedProjectArchive(body, bodies, signal) {
    let value;
    try {
        value = JSON.parse(decoder.decode(body.bytes));
    }
    catch {
        throw new DOMException("Project archive parts are invalid JSON.", "DataError");
    }
    const descriptor = value;
    if (descriptor?.format !== FORMAT || descriptor.version !== 1 || !Array.isArray(descriptor.parts) ||
        !descriptor.parts.length)
        throw new DOMException("Project archive parts are invalid.", "DataError");
    const names = new Set(), entries = [];
    for (const part of descriptor.parts) {
        signal?.throwIfAborted();
        if (!part || typeof part.name !== "string" || typeof part.bodyDigest !== "string" ||
            typeof part.contentDigest !== "string" || names.has(part.name))
            throw new DOMException("Project archive parts have an invalid or duplicate entry.", "DataError");
        names.add(part.name);
        const found = bodies.get(part.bodyDigest);
        if (!found || part.bodyDigest !== `project-part:sha256:${part.contentDigest}` ||
            await digest(found.bytes) !== part.contentDigest)
            throw new DOMException(`Project archive entry ${part.name} has no valid body.`, "DataError");
        entries.push({ name: part.name, body: new Blob([Uint8Array.from(found.bytes).buffer]) });
    }
    if (!names.has("manifest.json") || !names.has("draft.json"))
        throw new DOMException("Project archive parts have no manifest or draft.", "DataError");
    const chunks = [];
    await writeStoredZip(entries, { write: async (chunk) => { chunks.push(chunk); } }, { ...(signal ? { signal } : {}) });
    return new Blob(chunks, { type: "application/zip" });
}
//# sourceMappingURL=shared-project-archive.js.map