import { readStoredZip } from "./flow-visual-zip.js";
import { validateFlowVisualBody, validateFlowVisualMetadata } from "./flow-visual-asset-validation.js";
import { assertFlowVisualArchiveManifest, parseFlowVisualArchiveJson as parseJson, withoutEmbeddedFlowVisualBodies as withoutEmbeddedBodies } from "./flow-visual-archive-format.js";
import { flowVisualAssetReferences as assetReferences, flowVisualProjectMapping as projectMapping, remapFlowVisualProject as remap } from "./flow-visual-project-identity.js";
import { validateDocumentationTemplateBody } from "./documentation-templates/template-body.js";
import { validateExcelTemplateWorkbook } from "./documentation-templates/excel-workbook.js";
import { validateDocumentationTemplateRecords } from "./documentation-templates/template-library.js";
export { createMemoryFlowVisualAssetStore } from "./flow-visual-asset-memory-store.js";
export { createFlowVisualArchive, estimateFlowVisualArchiveSize, writeFlowVisualArchive } from "./flow-visual-archive-export.js";
const clone = (value) => structuredClone(value);
const assertUniqueAssetIds = (manifest) => { if (new Set(manifest.assets.map(({ id }) => id)).size !== manifest.assets.length)
    throw new DOMException("The archive manifest contains duplicate visual asset identities.", "DataError"); };
const assertUniqueTemplateBodies = (manifest) => { const bodies = manifest.templateBodies ?? []; if (new Set(bodies.map(({ digest }) => digest)).size !== bodies.length || new Set(bodies.map(({ entry }) => entry)).size !== bodies.length)
    throw new DOMException("The archive manifest contains duplicate documentation template bodies.", "DataError"); };
const assetContract = (asset) => JSON.stringify([asset.digest, asset.mediaType, asset.width, asset.height, asset.byteLength]);
const archiveEntryContracts = (manifest) => { const contracts = new Map(); for (const asset of manifest.assets) {
    validateFlowVisualMetadata(asset);
    const contract = assetContract(asset), prior = contracts.get(asset.entry);
    if (prior && prior !== contract)
        throw new DOMException(`Archive entry ${asset.entry} has inconsistent asset declarations.`, "DataError");
    contracts.set(asset.entry, contract);
} return contracts; };
const assertDeclaredEntries = (entries, manifest, contracts) => { const allowed = new Set(["manifest.json", manifest.draftEntry, ...(manifest.publishedEntry ? [manifest.publishedEntry] : []), ...contracts.keys(), ...(manifest.templateBodies ?? []).map(({ entry }) => entry)]); for (const name of entries.keys())
    if (!allowed.has(name))
        throw new DOMException(`The archive contains undeclared entry ${name}.`, "DataError"); };
const mappedAssetId = (declared, mapping, input) => mapping.get(declared.id) ?? input.id?.(declared.id) ?? declared.id;
const readDeclaredAsset = async (entries, declared, mapping, input) => { const body = entries.get(declared.entry); if (!body)
    throw new DOMException(`Restore the missing asset ${declared.id} and export again.`, "DataError"); await validateFlowVisualBody(declared, body); return { metadata: { id: mappedAssetId(declared, mapping, input), mediaType: declared.mediaType, width: declared.width, height: declared.height, byteLength: declared.byteLength, digest: declared.digest }, body: body.slice(0, body.size, declared.mediaType) }; };
const readArchiveAssets = async (entries, manifest, mapping, input) => { const assets = []; for (const [index, declared] of manifest.assets.entries()) {
    if (input.signal?.aborted)
        throw new DOMException("Project archive work was cancelled.", "AbortError");
    assets.push(await readDeclaredAsset(entries, declared, mapping, input));
    input.onProgress?.({ phase: "validate", entry: declared.entry, completed: index + 1, total: manifest.assets.length });
} return assets; };
const assertAssetReferences = (manifest, projects) => { const declaredIds = new Set(manifest.assets.map(({ id }) => id)); for (const referenced of projects.flatMap(assetReferences))
    if (!declaredIds.has(referenced))
        throw new DOMException(`Restore the missing asset ${referenced} and export again.`, "DataError"); };
const readArchiveSource = async (source, input) => { const blob = source instanceof Blob ? source : new Blob([Uint8Array.from(source)]); return readStoredZip(blob, undefined, { ...(input.signal ? { signal: input.signal } : {}), onEntry: (entry, index) => input.onProgress?.({ phase: "read", entry, completed: index, total: 0 }) }); };
const readArchiveProjects = async (entries, manifest) => { const project = await parseJson(entries, manifest.draftEntry), published = manifest.publishedEntry ? await parseJson(entries, manifest.publishedEntry) : undefined; return { project, published }; };
const archiveMapping = (project, input) => projectMapping(project, input.projectId ?? project.id, input.id ?? (oldId => oldId));
const importedArchive = (project, published, mapping, assets, templateBodies) => ({ formatVersion: 3, project: remap(project, mapping), ...(published ? { publishedProject: remap(published, mapping) } : {}), assets, templateBodies, migrations: [] });
const readTemplateBodies = async (entries, manifest) => { const result = []; for (const metadata of manifest.templateBodies ?? []) {
    const body = entries.get(metadata.entry);
    if (!body)
        throw new DOMException(`Restore the missing Excel template body ${metadata.digest}.`, "DataError");
    const typed = body.slice(0, body.size, metadata.mediaType);
    await validateDocumentationTemplateBody(metadata, typed);
    result.push({ digest: metadata.digest, byteLength: metadata.byteLength, body: typed });
} return result; };
const validateImportedTemplates = async (projects, bodies) => {
    const references = projects.flatMap(project => validateDocumentationTemplateRecords(project.documentation)), referencedByDigest = new Map();
    for (const reference of references) {
        const prior = referencedByDigest.get(reference.digest);
        if (prior && prior.byteLength !== reference.byteLength)
            throw new DOMException(`Documentation template body ${reference.digest} has inconsistent metadata.`, "DataError");
        const value = prior ?? { byteLength: reference.byteLength, kinds: new Set() };
        value.kinds.add(reference.kind);
        referencedByDigest.set(reference.digest, value);
    }
    const bodyByDigest = new Map(bodies.map(body => [body.digest, body]));
    if (bodyByDigest.size !== bodies.length || bodyByDigest.size !== referencedByDigest.size)
        throw new DOMException("The archive documentation template body set does not match its project references.", "DataError");
    for (const [digest, reference] of referencedByDigest) {
        const body = bodyByDigest.get(digest);
        if (!body || body.byteLength !== reference.byteLength)
            throw new DOMException(`Restore the missing Excel template body ${digest}.`, "DataError");
        for (const kind of reference.kinds) {
            const validation = await validateExcelTemplateWorkbook(body.body, kind);
            if (!validation.valid)
                throw new DOMException(`Excel documentation template ${digest} is invalid: ${validation.findings.map(({ location, message }) => `${location}: ${message}`).join("; ")}`, "DataError");
        }
    }
};
export async function importFlowVisualArchive(source, input = {}) {
    const entries = await readArchiveSource(source, input), manifest = await parseJson(entries, "manifest.json");
    assertFlowVisualArchiveManifest(manifest);
    assertUniqueAssetIds(manifest);
    assertUniqueTemplateBodies(manifest);
    assertDeclaredEntries(entries, manifest, archiveEntryContracts(manifest));
    const { project: sourceProject, published } = await readArchiveProjects(entries, manifest), mapping = archiveMapping(sourceProject, input), assets = await readArchiveAssets(entries, manifest, mapping, input), templateBodies = await readTemplateBodies(entries, manifest);
    assertAssetReferences(manifest, [sourceProject, ...(published ? [published] : [])]);
    await validateImportedTemplates([sourceProject, ...(published ? [published] : [])], templateBodies);
    return importedArchive(sourceProject, published, mapping, assets, templateBodies);
}
export async function migrateVersion2VisualAssets(bundle, input) {
    if (bundle.version !== 2)
        throw new DOMException("Use a supported version 2 project bundle.", "NotSupportedError");
    const source = clone(bundle.project), mapping = projectMapping(source, input.projectId, input.id), assets = [];
    for (const asset of source.conceptVisualAssets ?? [])
        assets.push(await migrateLegacyAsset(asset, mapping, input.id));
    return { formatVersion: 3, project: remap(withoutEmbeddedBodies(source), mapping), ...(bundle.publishedProject ? { publishedProject: remap(withoutEmbeddedBodies(bundle.publishedProject), mapping) } : {}), assets, templateBodies: [], migrations: ["Embedded concept visuals moved to separate original Blob bodies"] };
}
const migrateLegacyAsset = async (asset, mapping, id) => { if (typeof asset.bytes !== "string" || !asset.bytes.startsWith(`data:${asset.mediaType};base64,`))
    throw new DOMException(`Legacy visual ${asset.id} has unreadable embedded bytes.`, "DataError"); const raw = atob(asset.bytes.slice(asset.bytes.indexOf(",") + 1)), body = new Blob([Uint8Array.from(raw, character => character.charCodeAt(0))], { type: asset.mediaType }); await validateFlowVisualBody(asset, body); return { metadata: { id: mapping.get(asset.id) ?? id(asset.id), mediaType: asset.mediaType, width: asset.width, height: asset.height, byteLength: asset.byteLength, digest: asset.digest }, body }; };
//# sourceMappingURL=flow-visual-asset-portability.js.map