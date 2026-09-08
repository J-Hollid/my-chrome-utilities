/** Runs in Chrome's isolated world. One removable listener for each channel. */
export function observationPageBridge(action, channel) {
    const page = globalThis;
    const listeners = page.__twaObservationBridges ??= new Map();
    const name = "twa-observation:" + channel;
    const previous = listeners.get(channel);
    if (previous) {
        globalThis.removeEventListener(name, previous);
        listeners.delete(channel);
    }
    if (action === "detach")
        return;
    const listener = event => {
        const detail = event.detail;
        void chrome.runtime.sendMessage({ type: "twa-observation", channel, ...detail }).catch(() => { });
    };
    listeners.set(channel, listener);
    globalThis.addEventListener(name, listener);
}
//# sourceMappingURL=page-bridge.js.map