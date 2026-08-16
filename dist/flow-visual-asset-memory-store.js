import { validateFlowVisualBody } from "./flow-visual-asset-validation.js";
const clone = (value) => structuredClone(value);
const assetKey = (projectId, assetId) => `${projectId}:${assetId}`;
const bodyKey = (projectId, digest) => `${projectId}:${digest}`;
const emptyTrace = () => ({ metadataReads: 0, bodyReads: 0, metadataWrites: 0, bodyWrites: 0, bodyDeletes: 0 });
export function createMemoryFlowVisualAssetStore() {
    let metadata = new Map(), bodies = new Map(), trace = emptyTrace();
    const installAsset = async (projectId, asset, nextMetadata, nextBodies, wantedAssets, wantedDigests) => { await validateFlowVisualBody(asset.metadata, asset.body); const identity = assetKey(projectId, asset.metadata.id), digestIdentity = bodyKey(projectId, asset.metadata.digest); if (wantedAssets.has(identity))
        throw new DOMException(`Duplicate visual asset identity ${asset.metadata.id}.`, "DataError"); wantedAssets.add(identity); wantedDigests.add(digestIdentity); if (JSON.stringify(nextMetadata.get(identity)) !== JSON.stringify(asset.metadata)) {
        nextMetadata.set(identity, clone(asset.metadata));
        trace.metadataWrites += 1;
    } if (!nextBodies.has(digestIdentity)) {
        nextBodies.set(digestIdentity, asset.body.slice(0, asset.body.size, asset.body.type));
        trace.bodyWrites += 1;
    } };
    const removeUnusedMetadata = (projectId, nextMetadata, wanted) => { for (const identity of [...nextMetadata.keys()])
        if (identity.startsWith(`${projectId}:`) && !wanted.has(identity))
            nextMetadata.delete(identity); };
    const removeUnusedBodies = (projectId, nextBodies, wanted) => { for (const identity of [...nextBodies.keys()])
        if (identity.startsWith(`${projectId}:`) && !wanted.has(identity)) {
            nextBodies.delete(identity);
            trace.bodyDeletes += 1;
        } };
    return {
        trace: () => clone(trace), clearTrace: () => { trace = emptyTrace(); },
        async listMetadata(projectId) { trace.metadataReads += 1; return [...metadata].filter(([identity]) => identity.startsWith(`${projectId}:`)).map(([, value]) => clone(value)).sort((a, b) => a.id.localeCompare(b.id)); },
        async readBody(projectId, assetId) { trace.bodyReads += 1; const asset = metadata.get(assetKey(projectId, assetId)), value = asset && bodies.get(bodyKey(projectId, asset.digest)); if (!value)
            throw new DOMException(`Original visual body ${assetId} is unavailable.`, "NotFoundError"); return value.slice(0, value.size, value.type); },
        async replaceProjectAssets(projectId, assets) {
            const nextMetadata = new Map(metadata), nextBodies = new Map(bodies), wantedAssets = new Set(), wantedDigests = new Set();
            for (const asset of assets)
                await installAsset(projectId, asset, nextMetadata, nextBodies, wantedAssets, wantedDigests);
            removeUnusedMetadata(projectId, nextMetadata, wantedAssets);
            removeUnusedBodies(projectId, nextBodies, wantedDigests);
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
//# sourceMappingURL=flow-visual-asset-memory-store.js.map