export const CONFIGURATION_JOURNAL_KEY = "completeConfigurationJournal";
export const CONFIGURATION_COMMIT_MARKER_KEY = "completeConfigurationCommitId";
export async function readDurableConfigurationJournal(backend) {
    return backend.transaction(["settings"], "readonly", (transaction) => transaction.get("settings", CONFIGURATION_JOURNAL_KEY));
}
export async function writeDurableConfigurationJournal(backend, value) {
    await backend.transaction(["settings"], "readwrite", async (transaction) => {
        if (await transaction.get("settings", CONFIGURATION_JOURNAL_KEY))
            throw new DOMException("Another configuration setup is pending. Reload before starting a new setup.", "InvalidStateError");
        await transaction.put("settings", CONFIGURATION_JOURNAL_KEY, value);
    });
}
export async function clearDurableConfigurationJournal(backend) {
    await backend.transaction(["settings"], "readwrite", (transaction) => transaction.delete("settings", CONFIGURATION_JOURNAL_KEY));
}
export async function readDurableConfigurationCommitMarker(backend) {
    return backend.transaction(["settings"], "readonly", (transaction) => transaction.get("settings", CONFIGURATION_COMMIT_MARKER_KEY));
}
//# sourceMappingURL=durable-journal.js.map