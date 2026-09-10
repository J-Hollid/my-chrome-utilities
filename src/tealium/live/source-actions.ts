import { recoverablePort } from '../devtools/connection.js';
import type { LiveState } from './session.js';
import type { SourceResolution, SourceDestination } from '../devtools/source.js';

export interface SourceState { connected: boolean; resolution: SourceResolution | null; extensionResolution?: SourceResolution | null; feedback: string; }

export function sourceActions(tabId: number, current: () => LiveState,
  publish: (state: SourceState) => void) {
  const state: SourceState = {connected: false, resolution: null, feedback: ''};
  let binding = '', selection: string | null = null;
  const requestIds: Partial<Record<SourceDestination,string>> = {};
  const clear = (): void => {delete requestIds.send;delete requestIds.extend;state.extensionResolution = null;};
  const request = (open: boolean, destination: SourceDestination = 'send'): void => {
    const live = current(), row = live.rows.find(tag => tag.key === live.selected);
    if (!state.connected || !row || !binding || binding !== live.sessionId) return;
    if (destination === 'extend' && !Array.isArray(row.extensionSources)) return;
    if (open) {delete requestIds.send;delete requestIds.extend;port.send({type: 'bind', tabId, sessionId: binding});}
    const requestId = crypto.randomUUID();requestIds[destination] = requestId;
    port.send({type: 'source', tabId, sessionId: live.sessionId, row, requestId, open, destination});
    if (open) request(false, destination === 'send' ? 'extend' : 'send');
  };
  const resolve = (): void => {request(false);request(false, 'extend');};
  const port = recoverablePort('tealium-live', active => {
    const live = current();
    binding = ['Ended', 'Target closed', 'Permission required'].includes(live.status) ? '' : live.sessionId;
    active.postMessage({type: 'bind', tabId, sessionId: binding});
  }, message => {
    if (message?.type === 'connection') {
      const wasConnected = state.connected;
      state.connected = message.connected === true;
      if (state.connected && !wasConnected) state.feedback = '';
      if (!state.connected) { clear(); state.resolution = null; state.feedback = ''; }
      publish(state);
      if (state.connected && !wasConnected) resolve();
    }
    const destination: SourceDestination = message?.destination === 'extend' ? 'extend' : 'send';
    if (message?.type === 'result' && message.requestId === requestIds[destination]) {
      if (destination === 'extend') state.extensionResolution = message.resolution ?? null;
      else state.resolution = message.resolution ?? null;
      if (message.error || message.opened) state.feedback = message.error ?? (message.opened ? message.resolution?.exact === false ? 'Exact location unavailable; opened file' : 'Source opened' : '');
      publish(state);
    }
  }, () => {
    clear();
    state.connected = false; state.resolution = null; state.feedback = 'DevTools connection ended'; publish(state);
  });
  port.start();
  return {
    update(): void {
      const live = current();
      const nextBinding = ['Ended', 'Target closed', 'Permission required'].includes(live.status) ? '' : live.sessionId;
      const bindingChanged = binding !== nextBinding;
      if (bindingChanged) {
        binding = nextBinding;
        state.resolution = null; clear();
        publish(state);
      }
      const row = live.rows.find(tag => tag.key === live.selected);
      const nextSelection = row ? JSON.stringify([row.key, row.senderSource, row.extensionSources, row.requestUrls, row.codeState]) : null;
      const selectionChanged = selection !== nextSelection;
      if (selectionChanged) {
        selection = nextSelection; clear(); state.resolution = null; state.feedback = '';
        publish(state);
      }
      if (selectionChanged || bindingChanged) {
        // Rebind before resolving so the broker cancels every old selection action.
        port.send({type: 'bind', tabId, sessionId: binding});
        resolve();
      }
    },
    show: (destination: SourceDestination = 'send') => request(true, destination),
    feedback(message: string): void {
      state.feedback = message;
      publish(state);
    },
    dispose: () => port.dispose(),
  };
}
