import { DURABLE_PROJECT_STORES } from "./data-layer-durable-project-repository.js";
import { CONFIGURATION_COMMIT_MARKER_KEY } from "./configuration-portability/durable-journal.js";
const CONFIGURATION_STORES = [
    "projectMetadata", "projectRoots", "projectEntityMetadata", "projectEntities", "flowGraphs", "fixtures",
    "releases", "projectRevisions", "productionManifests", "schemaRevisions", "changeFeed", "savedSchemas", "visualAssetMetadata",
    "visualAssetBodies", "visualAssetThumbnails",
];
export async function readDurablePortableProjectState(backend) {
    const known = new Set([...CONFIGURATION_STORES, "settings", "migrationReceipts", "migrationBackups"]);
    const unknown = DURABLE_PROJECT_STORES.filter((store) => !known.has(store));
    if (unknown.length)
        throw new DOMException(`Durable stores ${unknown.join(", ")} have no configuration export rule.`, "DataError");
    return backend.transaction([...CONFIGURATION_STORES, "settings"], "readonly", async (transaction) => {
        const activeProjectId = await transaction.get("settings", "activeProjectId");
        return { ...(activeProjectId ? { activeProjectId } : {}), stores: Object.fromEntries(await Promise.all(CONFIGURATION_STORES.map(async (store) => [store, await transaction.getAll(store)]))) };
    });
}
export async function replaceDurablePortableProjectState(backend, state, commitMarker, signal) {
    await backend.transaction([...CONFIGURATION_STORES, "settings"], "readwrite", async (transaction) => {
        for (const store of CONFIGURATION_STORES) {
            signal?.throwIfAborted();
            for (const { key } of await transaction.getAll(store))
                await transaction.delete(store, key);
            for (const { key, value } of state.stores[store]) {
                signal?.throwIfAborted();
                await transaction.put(store, key, value);
            }
        }
        signal?.throwIfAborted();
        if (state.activeProjectId)
            await transaction.put("settings", "activeProjectId", state.activeProjectId);
        else
            await transaction.delete("settings", "activeProjectId");
        if (commitMarker !== undefined) {
            if (commitMarker === null)
                await transaction.delete("settings", CONFIGURATION_COMMIT_MARKER_KEY);
            else
                await transaction.put("settings", CONFIGURATION_COMMIT_MARKER_KEY, commitMarker);
        }
    });
}
//# sourceMappingURL=data-layer-durable-portable-state.js.map