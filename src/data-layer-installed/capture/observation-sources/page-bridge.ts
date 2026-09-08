/** Runs in Chrome's isolated world. One removable listener for each channel. */
export function observationPageBridge(action: "attach" | "detach", channel: string): void {
  const page = globalThis as typeof globalThis & {__twaObservationBridges?: Map<string, EventListener>};
  const listeners = page.__twaObservationBridges ??= new Map();
  const name = "twa-observation:" + channel;
  const previous = listeners.get(channel);
  if (previous) { globalThis.removeEventListener(name, previous); listeners.delete(channel); }
  if (action === "detach") return;
  const listener: EventListener = event => {
    const detail = (event as CustomEvent).detail;
    void chrome.runtime.sendMessage({type:"twa-observation", channel, ...detail}).catch(() => {});
  };
  listeners.set(channel, listener);
  globalThis.addEventListener(name, listener);
}
