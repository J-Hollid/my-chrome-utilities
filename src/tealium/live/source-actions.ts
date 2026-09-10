import { recoverablePort } from '../devtools/connection.js';
import type { LiveState } from './session.js';
import type { SourceResolution } from '../devtools/source.js';

export interface SourceState { connected: boolean; resolution: SourceResolution | null; feedback: string; }

export function sourceActions(tabId: number, current: () => LiveState,
  publish: (state: SourceState) => void) {
  const state: SourceState = {connected: false, resolution: null, feedback: ''};
  let binding = '', selection: string | null = null, requestId = '';
  const request = (open: boolean): void => {
    const live = current(), row = live.rows.find(tag => tag.key === live.selected);
    if (!state.connected || !row || !binding || binding !== live.sessionId) return;
    requestId = crypto.randomUUID();
    port.send({type: 'source', tabId, sessionId: live.sessionId, row, requestId, open});
  };
  const port = recoverablePort('tealium-live', active => {
    const live = current();
    binding = ['Ended', 'Target closed', 'Permission required'].includes(live.status) ? '' : live.sessionId;
    active.postMessage({type: 'bind', tabId, sessionId: binding});
  }, message => {
    if (message?.type === 'connection') {
      const wasConnected = state.connected;
      state.connected = message.connected === true;
      if (state.connected && !wasConnected) state.feedback = '';
      if (!state.connected) { requestId = ''; state.resolution = null; state.feedback = ''; }
      publish(state);
      if (state.connected && !wasConnected) request(false);
    }
    if (message?.type === 'result' && message.requestId === requestId) {
      state.resolution = message.resolution ?? null;
      state.feedback = message.error ?? (message.opened ? 'Source opened' : '');
      publish(state);
    }
  }, () => {
    requestId = '';
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
        state.resolution = null; requestId = '';
        publish(state);
      }
      const row = live.rows.find(tag => tag.key === live.selected);
      const nextSelection = row ? JSON.stringify([row.key, row.senderSource, row.requestUrls, row.codeState]) : null;
      const selectionChanged = selection !== nextSelection;
      if (selectionChanged) {
        selection = nextSelection; requestId = ''; state.resolution = null; state.feedback = '';
        publish(state);
      }
      if (selectionChanged || bindingChanged) {
        // Rebind before resolving so the broker cancels every old selection action.
        port.send({type: 'bind', tabId, sessionId: binding});
        request(false);
      }
    },
    show: () => request(true),
    feedback(message: string): void {
      state.feedback = message;
      publish(state);
    },
    dispose: () => port.dispose(),
  };
}
