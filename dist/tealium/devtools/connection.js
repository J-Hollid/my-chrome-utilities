// Retry only a lost transport. An open port does not send keepalive traffic.
export function recoverablePort(name, ready, message, lost) {
    let current = null, disposed = false, failures = 0;
    let timer;
    const disconnect = (port, error) => {
        if (disposed || current !== port)
            return;
        current = null;
        lost();
        try {
            port?.disconnect();
        }
        catch { /* The failed transport is already closed. */ }
        if (/extension context invalidated/i.test(String(error)) ||
            ('id' in chrome.runtime && !chrome.runtime.id)) {
            disposed = true;
            return;
        }
        if (timer === undefined && failures < 6) {
            timer = setTimeout(() => { timer = undefined; connect(); }, Math.min(8000, 500 * 2 ** failures++));
        }
    };
    const connect = () => {
        if (disposed)
            return;
        let port = null;
        try {
            port = chrome.runtime.connect({ name });
            current = port;
            const active = port;
            active.onMessage.addListener(value => {
                if (disposed || current !== active)
                    return;
                failures = 0;
                message(value, active);
            });
            active.onDisconnect.addListener(() => {
                const error = chrome.runtime.lastError?.message;
                disconnect(active, error);
            });
            ready(active);
        }
        catch (error) {
            disconnect(port, error);
        }
    };
    return {
        start: connect,
        send(value) {
            if (!current || disposed)
                return;
            const port = current;
            try {
                port.postMessage(value);
            }
            catch (error) {
                disconnect(port, error);
            }
        },
        isCurrent: (port) => !disposed && current === port,
        dispose() {
            disposed = true;
            clearTimeout(timer);
            timer = undefined;
            const port = current;
            current = null;
            lost();
            try {
                port?.disconnect();
            }
            catch { /* The extension context can already be gone. */ }
        },
    };
}
//# sourceMappingURL=connection.js.map