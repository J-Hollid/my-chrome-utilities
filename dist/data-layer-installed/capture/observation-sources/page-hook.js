/** Self-contained: Chrome serializes this function into the selected page. */
export function observationArrayHook(action, path, channel, eventName) {
    const page = globalThis;
    const registry = page.__twaObservationArrays ??= {
        arrays: new WeakMap(), identities: new WeakMap(), channels: new Map(), sequence: 0,
        pageId: crypto.randomUUID(),
    };
    const release = (id) => {
        const entry = registry.channels.get(id);
        if (!entry)
            return;
        entry.channels.delete(id);
        registry.channels.delete(id);
        if (!entry.channels.size) {
            if (entry.array.push === entry.wrapper)
                entry.array.push = entry.original;
            if (registry.arrays.get(entry.array) === entry)
                registry.arrays.delete(entry.array);
        }
    };
    if (action === "detach") {
        release(channel);
        return { status: "Waiting for path", rawValues: [] };
    }
    const parts = path.trim().replace(/^window\./u, "").split(".");
    let value = globalThis;
    for (const part of parts) {
        if (!/^[A-Za-z_$][\w$]*$/u.test(part) || ["__proto__", "prototype", "constructor"].includes(part) ||
            value === null || (typeof value !== "object" && typeof value !== "function") || !Object.hasOwn(value, part)) {
            release(channel);
            return { status: "Waiting for path", rawValues: [] };
        }
        value = value[part];
    }
    if (!Array.isArray(value)) {
        release(channel);
        return { status: value === undefined ? "Waiting for path" : "Not an array", rawValues: [] };
    }
    const array = value;
    let entry = registry.arrays.get(array);
    if (!entry || array.push !== entry.wrapper) {
        const id = registry.identities.get(array) ?? `${registry.pageId}:${++registry.sequence}`;
        registry.identities.set(array, id);
        const previous = entry;
        const original = array.push;
        if (typeof original !== "function") {
            release(channel);
            return { status: "Not an array", rawValues: [] };
        }
        const channels = new Map(previous?.channels);
        previous?.channels.clear();
        const next = { array, id, original, channels, wrapper: original };
        next.wrapper = function (...items) {
            const firstIndex = this.length;
            const result = Reflect.apply(original, this, items);
            if (this === array) {
                const timestamp = new Date().toISOString();
                for (let offset = 0; offset < items.length; offset += 1) {
                    for (const name of next.channels.values()) {
                        try {
                            globalThis.dispatchEvent(new CustomEvent(name, { detail: {
                                    rawValue: items[offset], timestamp, arrayId: id, index: firstIndex + offset,
                                } }));
                        }
                        catch { /* An extension observer must not change the page's push result. */ }
                    }
                }
            }
            return result;
        };
        array.push = next.wrapper;
        registry.arrays.set(array, next);
        for (const id of channels.keys())
            registry.channels.set(id, next);
        entry = next;
    }
    const old = registry.channels.get(channel);
    if (old && old !== entry)
        release(channel);
    entry.channels.set(channel, eventName);
    registry.channels.set(channel, entry);
    return { status: "Ready", arrayId: entry.id, rawValues: [...array] };
}
//# sourceMappingURL=page-hook.js.map