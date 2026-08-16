import { flowVisualArchiveExtension as extension, flowVisualJsonBlob as jsonBlob, withoutEmbeddedFlowVisualBodies as withoutEmbeddedBodies } from "./flow-visual-archive-format.js";
import { validateFlowVisualBody, validateFlowVisualMetadata } from "./flow-visual-asset-validation.js";
import { writeStoredZip } from "./flow-visual-zip.js";
const encoder = new TextEncoder();
const sameAssetContract = (left, right) => left.metadata.digest === right.metadata.digest && left.metadata.mediaType === right.metadata.mediaType && left.metadata.byteLength === right.metadata.byteLength && left.metadata.width === right.metadata.width && left.metadata.height === right.metadata.height;
const registerArchiveAsset = (asset, uniqueBodies, assets) => { validateFlowVisualMetadata(asset.metadata); const entry = `assets/${asset.metadata.digest.slice(7)}.${extension(asset.metadata.mediaType)}`, prior = uniqueBodies.get(entry); if (prior && !sameAssetContract(prior, asset))
    throw new DOMException(`Digest-addressed entry ${entry} has inconsistent metadata.`, "DataError"); uniqueBodies.set(entry, prior ?? asset); assets.push({ ...asset.metadata, entry }); };
async function prepareArchive(input) {
    const ordered = [...input.assets].sort((a, b) => a.metadata.id.localeCompare(b.metadata.id)), assets = [], uniqueBodies = new Map();
    for (const asset of ordered)
        registerArchiveAsset(asset, uniqueBodies, assets);
    const project = withoutEmbeddedBodies(input.project), publishedProject = input.publishedProject ? withoutEmbeddedBodies(input.publishedProject) : undefined, manifest = { format: "my-chrome-utilities.project-archive", version: 3, requiredFeatures: ["digest-addressed-visual-assets"], draftEntry: "draft.json", ...(publishedProject ? { publishedEntry: "published.json" } : {}), assets };
    return { manifest, project, publishedProject, uniqueBodies };
}
export async function writeFlowVisualArchive(input, sink, options = {}) {
    const prepared = await prepareArchive(input), entries = async function* () { yield { name: "manifest.json", body: jsonBlob(prepared.manifest) }; yield { name: "draft.json", body: jsonBlob(prepared.project) }; if (prepared.publishedProject)
        yield { name: "published.json", body: jsonBlob(prepared.publishedProject) }; let validated = 0; for (const [name, asset] of prepared.uniqueBodies) {
        if (options.signal?.aborted)
            throw new DOMException("Project archive work was cancelled.", "AbortError");
        const body = typeof asset.body === "function" ? await asset.body() : asset.body;
        await validateFlowVisualBody(asset.metadata, body);
        options.onProgress?.({ phase: "validate", entry: name, completed: ++validated, total: prepared.uniqueBodies.size });
        yield { name, body };
    } }();
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
    const prepared = await prepareArchive(input), entries = [{ name: "manifest.json", size: jsonBlob(prepared.manifest).size }, { name: "draft.json", size: jsonBlob(prepared.project).size }, ...(prepared.publishedProject ? [{ name: "published.json", size: jsonBlob(prepared.publishedProject).size }] : []), ...[...prepared.uniqueBodies].map(([name, asset]) => ({ name, size: asset.metadata.byteLength }))];
    return entries.reduce((total, { name, size }) => total + size + 76 + 2 * encoder.encode(name).length, 22);
}
//# sourceMappingURL=flow-visual-archive-export.js.map