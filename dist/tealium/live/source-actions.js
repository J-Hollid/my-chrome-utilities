import { element } from './render.js';
export function sourceActions(tabId, current, publish) {
    const port = chrome.runtime.connect({ name: 'tealium-live' });
    const state = { connected: false, resolution: null, feedback: '' };
    let binding = '', selection = null, requestId = '';
    const request = (open) => {
        const live = current(), row = live.rows.find(tag => tag.key === live.selected);
        if (!state.connected || !row || !binding || binding !== live.sessionId)
            return;
        requestId = crypto.randomUUID();
        port.postMessage({ type: 'source', tabId, sessionId: live.sessionId, row, requestId, open });
    };
    port.onMessage.addListener(message => {
        if (message?.type === 'connection') {
            const wasConnected = state.connected;
            state.connected = message.connected === true;
            if (!state.connected) {
                state.resolution = null;
                state.feedback = '';
            }
            publish(state);
            if (state.connected && !wasConnected)
                request(false);
        }
        if (message?.type === 'result' && message.requestId === requestId) {
            state.resolution = message.resolution ?? null;
            state.feedback = message.error ?? (message.opened ? 'Source opened' : '');
            publish(state);
        }
    });
    port.onDisconnect.addListener(() => {
        state.connected = false;
        state.resolution = null;
        state.feedback = 'DevTools connection ended';
        publish(state);
    });
    return {
        update() {
            const live = current();
            const nextBinding = ['Ended', 'Target closed', 'Permission required'].includes(live.status) ? '' : live.sessionId;
            const bindingChanged = binding !== nextBinding;
            if (bindingChanged) {
                binding = nextBinding;
                state.resolution = null;
                requestId = '';
                publish(state);
                port.postMessage({ type: 'bind', tabId, sessionId: binding });
            }
            const row = live.rows.find(tag => tag.key === live.selected);
            const nextSelection = row ? JSON.stringify([row.key, row.senderSource, row.requestUrls, row.codeState]) : null;
            const selectionChanged = selection !== nextSelection;
            if (selectionChanged) {
                selection = nextSelection;
                requestId = '';
                state.resolution = null;
                state.feedback = '';
                publish(state);
            }
            if (selectionChanged || bindingChanged)
                request(false);
        },
        show: () => request(true),
        feedback(message) {
            state.feedback = message;
            publish(state);
        },
        dispose: () => port.disconnect(),
    };
}
export function renderSource(state) {
    element('source-status').textContent = state.connected
        ? state.resolution?.detail ?? 'Resolving the selected source'
        : 'Open DevTools for the bound website to inspect sources.';
    element('source-url').textContent = state.resolution?.url ?? '';
    element('feedback').textContent = state.feedback;
    element('show-source').disabled = !state.connected || state.resolution?.status !== 'Resolved';
    element('copy-source').disabled = !state.resolution?.url;
}
//# sourceMappingURL=source-actions.js.map