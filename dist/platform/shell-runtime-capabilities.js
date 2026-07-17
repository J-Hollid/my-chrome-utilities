const callable = (candidate) => typeof candidate === "function";
export function shellRuntimeCapabilities(runtime) {
    const capabilities = [
        ["runtime.messaging", callable(runtime?.runtime?.onMessage?.addListener)],
        ["tabs.query", callable(runtime?.tabs?.query)],
        ["tabs.lifecycle",
            callable(runtime?.tabs?.onUpdated?.addListener) && callable(runtime?.tabs?.onRemoved?.addListener)],
        ["permissions.lifecycle", callable(runtime?.permissions?.onRemoved?.addListener)],
        ["scripting.execute", callable(runtime?.scripting?.executeScript)],
    ];
    return capabilities.filter(([, available]) => available).map(([name]) => name);
}
//# sourceMappingURL=shell-runtime-capabilities.js.map