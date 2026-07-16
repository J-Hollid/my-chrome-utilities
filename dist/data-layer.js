export const HISTORY_PATH_STORAGE_KEY = "historyArrayPath";
export const DEFAULT_HISTORY_PATH = "queue.history";
export function normalizeHistoryArrayPath(path) {
    return path
        .split(".")
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .join(".");
}
export function resolvePath(pageObject, path) {
    const parts = normalizeHistoryArrayPath(path).split(".");
    if (parts.length === 0 || parts[0] === "") {
        return undefined;
    }
    let current = pageObject;
    for (const part of parts) {
        if (current === null || typeof current !== "object" || !(part in current)) {
            return undefined;
        }
        current = current[part];
    }
    return current;
}
export function pathStatus(pageObject, path) {
    const value = resolvePath(pageObject, path);
    if (value === undefined) {
        return "path missing";
    }
    return Array.isArray(value) ? "ready" : "not an array";
}
export function getHistoryArrayPath(storage = localStorage) {
    return storage.getItem(HISTORY_PATH_STORAGE_KEY) ?? DEFAULT_HISTORY_PATH;
}
export function setHistoryArrayPath(path, storage = localStorage) {
    const normalizedPath = normalizeHistoryArrayPath(path);
    storage.setItem(HISTORY_PATH_STORAGE_KEY, normalizedPath);
    return normalizedPath;
}
export function samplePageObject() {
    return {
        queue: {
            history: [],
            value: "scalar",
        },
        test: {
            test: [],
        },
        some: {
            deep: {
                object: {
                    history: [],
                },
            },
        },
    };
}
//# sourceMappingURL=data-layer.js.map