export function shellRuntimeCapabilities(runtime) {
    const capabilities = [];
    if (runtime?.runtime?.onMessage?.addListener)
        capabilities.push("runtime.messaging");
    if (runtime?.tabs?.query)
        capabilities.push("tabs.query");
    if (runtime?.tabs?.onUpdated?.addListener && runtime.tabs.onRemoved?.addListener)
        capabilities.push("tabs.lifecycle");
    if (runtime?.permissions?.onRemoved?.addListener)
        capabilities.push("permissions.lifecycle");
    if (runtime?.scripting?.executeScript)
        capabilities.push("scripting.execute");
    return capabilities;
}
//# sourceMappingURL=shell-runtime-capabilities.js.map