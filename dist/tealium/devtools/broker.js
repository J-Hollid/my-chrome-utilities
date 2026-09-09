export function installTealiumBridge(runtime, validate) {
    const owners = new Map();
    const bridges = new Map();
    const pending = new Map();
    const send = (port, message) => {
        try {
            port.postMessage(message);
        }
        catch { /* Port closure is handled by onDisconnect. */ }
    };
    const publish = () => {
        for (const [owner, binding] of owners)
            send(owner, { type: 'connection',
                connected: [...bridges.values()].includes(binding.tabId) });
    };
    runtime.onConnect.addListener(port => {
        if (!['tealium-live', 'tealium-devtools'].includes(port.name))
            return;
        const expected = runtime.getURL(port.name === 'tealium-live'
            ? 'tealium/live/index.html' : 'tealium/devtools/index.html');
        if (port.sender?.id !== runtime.id || port.sender.url?.split('?')[0] !== expected) {
            port.disconnect();
            return;
        }
        port.onMessage.addListener(async (message) => {
            if (!message || typeof message !== 'object')
                return;
            if (port.name === 'tealium-devtools' && message.type === 'hello' &&
                Number.isSafeInteger(message.tabId) && message.tabId >= 0) {
                bridges.set(port, message.tabId);
                publish();
                return;
            }
            if (port.name === 'tealium-live' && message.type === 'bind' &&
                Number.isSafeInteger(message.tabId) && typeof message.sessionId === 'string') {
                owners.set(port, { tabId: message.tabId, sessionId: message.sessionId });
                for (const [id, request] of pending)
                    if (request.owner === port) {
                        send(port, { type: 'result', requestId: request.requestId, error: 'The observation session changed' });
                        pending.delete(id);
                    }
                publish();
                return;
            }
            if (port.name === 'tealium-live' && message.type === 'source') {
                const binding = owners.get(port);
                const bridge = [...bridges].find(([, tabId]) => tabId === binding?.tabId)?.[0];
                if (!binding?.sessionId || message.sessionId !== binding.sessionId ||
                    message.row?.tabId !== binding.tabId || typeof message.requestId !== 'string') {
                    send(port, { type: 'result', requestId: message.requestId, error: 'The source request does not match the current target and session' });
                    return;
                }
                if (!bridge) {
                    send(port, { type: 'result', requestId: message.requestId,
                        error: 'Open DevTools for the selected website' });
                    return;
                }
                try {
                    await validate(message.row);
                    if (owners.get(port) !== binding || bridges.get(bridge) !== binding.tabId)
                        return;
                    const id = crypto.randomUUID();
                    pending.set(id, { owner: port, bridge, binding, requestId: message.requestId, row: message.row });
                    send(bridge, { type: 'source', id, row: message.row, open: message.open === true });
                }
                catch (error) {
                    send(port, { type: 'result', requestId: message.requestId, error: String(error) });
                }
            }
            if (port.name === 'tealium-devtools' && message.type === 'authorize') {
                const request = pending.get(message.id);
                if (!request || request.bridge !== port || owners.get(request.owner) !== request.binding) {
                    send(port, { type: 'authorized', id: message.id, allowed: false });
                    return;
                }
                try {
                    await validate(request.row);
                    send(port, { type: 'authorized', id: message.id,
                        allowed: pending.get(message.id) === request && owners.get(request.owner) === request.binding });
                }
                catch {
                    send(port, { type: 'authorized', id: message.id, allowed: false });
                }
            }
            if (port.name === 'tealium-devtools' && message.type === 'result') {
                const request = pending.get(message.id);
                if (!request || request.bridge !== port || owners.get(request.owner) !== request.binding)
                    return;
                pending.delete(message.id);
                send(request.owner, { ...message, requestId: request.requestId });
            }
        });
        port.onDisconnect.addListener(() => {
            owners.delete(port);
            bridges.delete(port);
            for (const [id, request] of pending) {
                if (request.owner !== port && request.bridge !== port)
                    continue;
                if (request.owner !== port)
                    send(request.owner, { type: 'result', requestId: request.requestId,
                        error: 'DevTools disconnected' });
                pending.delete(id);
            }
            publish();
        });
    });
}
//# sourceMappingURL=broker.js.map