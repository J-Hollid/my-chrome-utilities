import { validateFlowVisualMetadata } from "./flow-visual-asset-validation.js";
import { projectAssetBodyArchiveEntry } from "./project-asset-body-contribution.js";
export const flowVisualArchiveExtension = (type) => type === "image/png" ? "png" : type === "image/jpeg" ? "jpg" : "webp";
export const withoutEmbeddedFlowVisualBodies = (project) => { const value = structuredClone(project); if (value.conceptVisualAssets)
    value.conceptVisualAssets = value.conceptVisualAssets.map(({ bytes, ...metadata }) => metadata); return value; };
export const flowVisualJsonBlob = (value) => new Blob([JSON.stringify(value)], { type: "application/json" });
export const parseFlowVisualArchiveJson = async (entries, name) => { const value = entries.get(name); if (!value)
    throw new DOMException(`The archive is missing ${name}.`, "DataError"); try {
    return JSON.parse(await value.text());
}
catch {
    throw new DOMException(`Archive entry ${name} is not readable JSON.`, "DataError");
} };
const assertArchiveIdentity = (value) => { if (!value || typeof value !== "object" || value.format !== "my-chrome-utilities.project-archive" || value.version !== 3)
    throw new DOMException("Use a supported project archive version.", "NotSupportedError"); };
const assertArchiveFeatures = (features) => { if (!Array.isArray(features) || features.some(feature => feature !== "digest-addressed-visual-assets"))
    throw new DOMException("The project archive requires unsupported features.", "NotSupportedError"); };
const validArchiveEntries = (value) => value.draftEntry === "draft.json" && (value.publishedEntry === undefined || value.publishedEntry === "published.json") && Array.isArray(value.assets) && value.assets.length <= 10_000;
const assertArchiveAssetEntry = (asset) => { validateFlowVisualMetadata(asset); if (asset.entry !== projectAssetBodyArchiveEntry({ namespace: "flow-visual", digest: asset.digest.slice(7), extension: flowVisualArchiveExtension(asset.mediaType) }))
    throw new DOMException(`Visual ${asset.id} does not use its digest-addressed archive entry.`, "DataError"); };
export function assertFlowVisualArchiveManifest(value) {
    assertArchiveIdentity(value);
    assertArchiveFeatures(value.requiredFeatures);
    if (!validArchiveEntries(value))
        throw new DOMException("The project archive manifest has an unsupported structure.", "DataError");
    for (const asset of value.assets)
        assertArchiveAssetEntry(asset);
}
//# sourceMappingURL=flow-visual-archive-format.js.map