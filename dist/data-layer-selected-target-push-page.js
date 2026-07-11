export function pushPayloadInPage(destination, eventName, payload, root = globalThis) {
    let value = root;
    for (const segment of destination.split(".")) {
        if (value === null || typeof value !== "object" || !(segment in value)) {
            return { success: false, result: `Destination ${destination} is unavailable.` };
        }
        value = value[segment];
    }
    if (!Array.isArray(value)) {
        return { success: false, result: `Destination ${destination} cannot accept payload.` };
    }
    value.push([eventName, payload]);
    return { success: true };
}
//# sourceMappingURL=data-layer-selected-target-push-page.js.map