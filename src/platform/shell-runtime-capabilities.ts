interface ListenerContract {
  addListener?: unknown;
}

interface ChromeShellRuntime {
  runtime?: { onMessage?: ListenerContract };
  tabs?: { query?: unknown; onUpdated?: ListenerContract; onRemoved?: ListenerContract };
  permissions?: { onRemoved?: ListenerContract };
  scripting?: { executeScript?: unknown };
}

const callable = (candidate: unknown): boolean => typeof candidate === "function";

export function shellRuntimeCapabilities(runtime: ChromeShellRuntime | undefined): string[] {
  const capabilities: [string, boolean][] = [
    ["runtime.messaging", callable(runtime?.runtime?.onMessage?.addListener)],
    ["tabs.query", callable(runtime?.tabs?.query)],
    ["tabs.lifecycle",
      callable(runtime?.tabs?.onUpdated?.addListener) && callable(runtime?.tabs?.onRemoved?.addListener)],
    ["permissions.lifecycle", callable(runtime?.permissions?.onRemoved?.addListener)],
    ["scripting.execute", callable(runtime?.scripting?.executeScript)],
  ];
  return capabilities.filter(([, available]) => available).map(([name]) => name);
}
