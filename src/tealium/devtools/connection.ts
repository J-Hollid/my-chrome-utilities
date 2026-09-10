// Retry only a lost transport. An open port does not send keepalive traffic.
export function recoverablePort(name: string, ready: (port: chrome.runtime.Port) => void,
  message: (value: any, port: chrome.runtime.Port) => void, lost: () => void) {
  let current: chrome.runtime.Port | null = null, disposed = false, failures = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const disconnect = (port: chrome.runtime.Port | null, error?: unknown): void => {
    if (disposed || current !== port) return;
    current = null;
    lost();
    try { port?.disconnect(); } catch { /* The failed transport is already closed. */ }
    if (/extension context invalidated/i.test(String(error)) ||
        ('id' in chrome.runtime && !chrome.runtime.id)) { disposed = true; return; }
    if (timer === undefined && failures < 6) {
      timer = setTimeout(() => { timer = undefined; connect(); }, Math.min(8000, 500 * 2 ** failures++));
    }
  };
  const connect = (): void => {
    if (disposed) return;
    let port: chrome.runtime.Port | null = null;
    try {
      port = chrome.runtime.connect({name});
      current = port;
      const active = port;
      active.onMessage.addListener(value => {
        if (disposed || current !== active) return;
        failures = 0;
        message(value, active);
      });
      active.onDisconnect.addListener(() => {
        const error = chrome.runtime.lastError?.message;
        disconnect(active, error);
      });
      ready(active);
    } catch (error) { disconnect(port, error); }
  };
  return {
    start: connect,
    send(value: unknown): void {
      if (!current || disposed) return;
      const port = current;
      try { port.postMessage(value); } catch (error) { disconnect(port, error); }
    },
    isCurrent: (port: chrome.runtime.Port): boolean => !disposed && current === port,
    dispose(): void {
      disposed = true;
      clearTimeout(timer); timer = undefined;
      const port = current; current = null;
      lost();
      try { port?.disconnect(); } catch { /* The extension context can already be gone. */ }
    },
  };
}
