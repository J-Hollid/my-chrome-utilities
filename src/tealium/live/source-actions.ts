import type { LiveState } from './session.js';
import type { SourceResolution } from '../devtools/source.js';
import { element } from './render.js';

export interface SourceState { connected: boolean; resolution: SourceResolution | null; feedback: string; }

export function sourceActions(tabId: number, current: () => LiveState,
  publish: (state: SourceState) => void) {
  const port = chrome.runtime.connect({name: 'tealium-live'});
  const state: SourceState = {connected: false, resolution: null, feedback: ''};
  let binding = '', selection: string | null = null, requestId = '';
  const request = (open: boolean): void => {
    const live = current(), row = live.rows.find(tag => tag.key === live.selected);
    if (!state.connected || !row || !live.sessionId) return;
    requestId = crypto.randomUUID();
    port.postMessage({type: 'source', tabId, sessionId: live.sessionId, row, requestId, open});
  };
  port.onMessage.addListener(message => {
    if (message?.type === 'connection') {
      const wasConnected = state.connected;
      state.connected = message.connected === true;
      if (!state.connected) { state.resolution = null; state.feedback = ''; }
      publish(state);
      if (state.connected && !wasConnected) request(false);
    }
    if (message?.type === 'result' && message.requestId === requestId) {
      state.resolution = message.resolution ?? null;
      state.feedback = message.error ?? (message.opened ? 'Source opened' : '');
      publish(state);
    }
  });
  port.onDisconnect.addListener(() => {
    state.connected = false; state.resolution = null; state.feedback = 'DevTools connection ended'; publish(state);
  });
  return {
    update(): void {
      const live = current();
      const nextBinding = ['Ended', 'Target closed', 'Permission required'].includes(live.status) ? '' : live.sessionId;
      if (binding !== nextBinding) {
        binding = nextBinding;
        state.resolution = null; requestId = '';
        publish(state);
        port.postMessage({type: 'bind', tabId, sessionId: binding});
      }
      const row = live.rows.find(tag => tag.key === live.selected);
      const nextSelection = row ? JSON.stringify([row.key, row.senderSource, row.requestUrls, row.codeState]) : null;
      if (selection !== nextSelection) {
        selection = nextSelection; requestId = ''; state.resolution = null; state.feedback = '';
        publish(state); request(false);
      }
    },
    show: () => request(true),
    feedback(message: string): void {
      state.feedback = message;
      publish(state);
    },
    dispose: () => port.disconnect(),
  };
}

export function renderSource(state: SourceState): void {
  element('source-status').textContent = state.connected
    ? state.resolution?.detail ?? 'Resolving the selected source'
    : 'Open DevTools for the bound website to inspect sources.';
  element('source-url').textContent = state.resolution?.url ?? '';
  element('feedback').textContent = state.feedback;
  element<HTMLButtonElement>('show-source').disabled = !state.connected || state.resolution?.status !== 'Resolved';
  element<HTMLButtonElement>('copy-source').disabled = !state.resolution?.url;
}
