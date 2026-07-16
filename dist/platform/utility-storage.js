export function createUtilityStorage(backing, contract) {
    const ownedKeys = [...(contract.legacyKeys ?? [])];
    const owned = new Set(ownedKeys);
    const assertOwned = (key) => {
        if (!owned.has(key)) {
            throw new Error(`${contract.namespace} does not own storage key ${key}`);
        }
    };
    const readEnvelope = () => {
        try {
            const value = JSON.parse(backing.getItem(contract.namespace) ?? "{}");
            return value && typeof value === "object" && !Array.isArray(value) ? value : {};
        }
        catch {
            return {};
        }
    };
    const writeEnvelope = (value) => {
        if (Object.keys(value).length)
            backing.setItem(contract.namespace, JSON.stringify(value));
        else
            backing.removeItem(contract.namespace);
    };
    return {
        get length() { return ownedKeys.length; },
        clear() {
            for (const key of ownedKeys)
                backing.removeItem(key);
            backing.removeItem(contract.namespace);
        },
        getItem(key) {
            assertOwned(key);
            return backing.getItem(key) ?? readEnvelope()[key] ?? null;
        },
        key(index) { return ownedKeys[index] ?? null; },
        removeItem(key) {
            assertOwned(key);
            const envelope = readEnvelope();
            delete envelope[key];
            writeEnvelope(envelope);
            backing.removeItem(key);
        },
        setItem(key, value) {
            assertOwned(key);
            const serialized = String(value);
            writeEnvelope({ ...readEnvelope(), [key]: serialized });
            backing.setItem(key, serialized);
        },
    };
}
//# sourceMappingURL=utility-storage.js.map