export function validateUtilityContributions(entries) {
    const ids = new Set(["data-layer", "hotkeys", "command-palette"]);
    const namespaces = new Set();
    for (const entry of entries) {
        if (!/^[a-z][a-z0-9-]*$/.test(entry.id) || ids.has(entry.id)) {
            throw new Error("Each utility must have a unique local identity");
        }
        if (!/^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html$/.test(entry.page)) {
            throw new Error("A utility entry must be a local HTML page");
        }
        if (!entry.label.trim() || !entry.storage.namespace.startsWith(`utility.${entry.id}.`) ||
            namespaces.has(entry.storage.namespace) || !Number.isSafeInteger(entry.storage.version) ||
            entry.storage.version < 1)
            throw new Error("A utility must declare its own versioned storage");
        ids.add(entry.id);
        namespaces.add(entry.storage.namespace);
    }
}
//# sourceMappingURL=contribution.js.map