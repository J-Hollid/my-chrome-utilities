import type { TagRow } from '../detection/types.js';
import { sourceStep } from './deadline.js';

interface Binding { tabId: number; sessionId: string; }
interface Pending { owner: chrome.runtime.Port; bridge: chrome.runtime.Port; binding: Binding;
  requestId: string; row: TagRow; controller: AbortController; timer: ReturnType<typeof setTimeout>; expiresAt: number; }

export function installTealiumBridge(runtime: typeof chrome.runtime,
  validate: (row: TagRow) => Promise<void>): void {
  const owners = new Map<chrome.runtime.Port, Binding>();
  const bridges = new Map<chrome.runtime.Port, number>();
  const pending = new Map<string, Pending>();
  const send = (port: chrome.runtime.Port, message: unknown): void => {
    try { port.postMessage(message); } catch { /* Port closure is handled by onDisconnect. */ }
  };
  const finish = (id: string, error?: string): void => {
    const request = pending.get(id);
    if (!request) return;
    pending.delete(id); clearTimeout(request.timer); request.controller.abort();
    if (error) {
      send(request.owner, {type: 'result', requestId: request.requestId, error});
      send(request.bridge, {type: 'cancel', id});
    }
  };
  const publish = (): void => {
    for (const [owner, binding] of owners) send(owner, {type: 'connection',
      connected: Boolean(binding.sessionId) && [...bridges.values()].includes(binding.tabId)});
  };
  runtime.onConnect.addListener(port => {
    if (!['tealium-live', 'tealium-devtools'].includes(port.name)) return;
    const expected = runtime.getURL(port.name === 'tealium-live'
      ? 'tealium/live/index.html' : 'tealium/devtools/index.html');
    if (port.sender?.id !== runtime.id || port.sender.url?.split('?')[0] !== expected) {
      port.disconnect(); return;
    }
    port.onMessage.addListener(async message => {
      if (!message || typeof message !== 'object') return;
      if (port.name === 'tealium-devtools' && message.type === 'hello' &&
          Number.isSafeInteger(message.tabId) && message.tabId >= 0) {
        bridges.set(port, message.tabId); publish(); return;
      }
      if (port.name === 'tealium-live' && message.type === 'bind' &&
          Number.isSafeInteger(message.tabId) && typeof message.sessionId === 'string') {
        owners.set(port, {tabId: message.tabId, sessionId: message.sessionId});
        for (const [id, request] of pending) if (request.owner === port) {
          finish(id, 'The observation session changed');
        }
        publish(); return;
      }
      if (port.name === 'tealium-live' && message.type === 'source') {
        const binding = owners.get(port);
        const bridge = [...bridges].find(([, tabId]) => tabId === binding?.tabId)?.[0];
        if (!binding?.sessionId || message.sessionId !== binding.sessionId ||
            message.row?.tabId !== binding.tabId || typeof message.requestId !== 'string') {
          send(port, {type: 'result', requestId: message.requestId, error: 'The source request does not match the current target and session'});
          return;
        }
        if (!bridge) { send(port, {type: 'result', requestId: message.requestId,
          error: 'Open DevTools for the selected website'}); return; }
        const id = crypto.randomUUID(), controller = new AbortController(), expiresAt = Date.now() + 8000;
        const timer = setTimeout(() => finish(id, 'Source inspection did not finish; try again'), 8000);
        const request = {owner: port, bridge, binding, requestId: message.requestId, row: message.row, controller, timer, expiresAt};
        pending.set(id, request);
        try {
          await sourceStep(validate(message.row), controller.signal);
          if (Date.now() >= expiresAt) { finish(id, 'Source inspection did not finish; try again'); return; }
          if (pending.get(id) !== request || owners.get(port) !== binding || bridges.get(bridge) !== binding.tabId) return;
          send(bridge, {type: 'source', id, row: message.row, open: message.open === true, expiresAt});
        } catch (error) {
          finish(id, String(error));
        }
      }
      if (port.name === 'tealium-devtools' && message.type === 'authorize') {
        const request = pending.get(message.id);
        if (!request || request.bridge !== port || owners.get(request.owner) !== request.binding) {
          send(port, {type: 'authorized', id: message.id, allowed: false}); return;
        }
        try {
          await sourceStep(validate(request.row), request.controller.signal);
          if (Date.now() >= request.expiresAt) finish(message.id, 'Source inspection did not finish; try again');
          send(port, {type: 'authorized', id: message.id,
            allowed: pending.get(message.id) === request && owners.get(request.owner) === request.binding});
        } catch { send(port, {type: 'authorized', id: message.id, allowed: false}); }
      }
      if (port.name === 'tealium-devtools' && message.type === 'result') {
        const request = pending.get(message.id);
        if (!request || request.bridge !== port || owners.get(request.owner) !== request.binding) return;
        finish(message.id);
        send(request.owner, {...message, requestId: request.requestId});
      }
    });
    port.onDisconnect.addListener(() => {
      owners.delete(port); bridges.delete(port);
      for (const [id, request] of pending) {
        if (request.owner !== port && request.bridge !== port) continue;
        finish(id, 'DevTools disconnected');
      }
      publish();
    });
  });
}
