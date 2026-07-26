function valueAtPushPath(destination, root = globalThis) {
    let value = root;
    for (const segment of destination.split(".")) {
        if (value === null || typeof value !== "object" || !(segment in value)) {
            return {
                result: { success: false, result: `Destination ${destination} is unavailable.` },
            };
        }
        value = value[segment];
    }
    if (!Array.isArray(value)) {
        return {
            result: { success: false, result: "Push path is not push-capable" },
        };
    }
    return { result: { success: true }, value };
}
export function pushPathCapabilityInPage(destination, root = globalThis) {
    return valueAtPushPath(destination, root).result;
}
export function pushPayloadInPage(destination, eventName, payload, root = globalThis) {
    const resolved = valueAtPushPath(destination, root);
    if (!resolved.result.success || !resolved.value)
        return resolved.result;
    resolved.value.push([eventName, payload]);
    return { success: true };
}
//# sourceMappingURL=data-layer-selected-target-push-page.js.map