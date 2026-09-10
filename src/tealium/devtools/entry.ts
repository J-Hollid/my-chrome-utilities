import { recoverablePort } from './connection.js';
import { resolveTagSource, type LoadedSource } from './source.js';
import { validateCurrentTag } from '../detection/browser-target.js';
import { sourceStep } from './deadline.js';

const authorization = new Map<string, (allowed: boolean) => void>();
const operations = new Map<string, AbortController>();
const cancelOperations = (): void => {
  for (const resolve of authorization.values()) resolve(false);
  authorization.clear();
  for (const controller of operations.values()) controller.abort();
  operations.clear();
};

async function loadedSources(signal: AbortSignal): Promise<LoadedSource[]> {
  const resources = await sourceStep(new Promise<chrome.devtools.inspectedWindow.Resource[]>(resolve =>
    chrome.devtools.inspectedWindow.getResources(resolve)), signal);
  const sources: LoadedSource[] = [];
  for (const resource of resources) {
    if (!/^https?:\/\//.test(resource.url)) continue;
    const content = await sourceStep(new Promise<string>(resolve => resource.getContent((text, encoding) => {
      try { resolve(encoding === 'base64' ? atob(text) : text); } catch { resolve(''); }
    })), signal);
    if (content) sources.push({url: resource.url, content});
  }
  return sources;
}

const connection = recoverablePort('tealium-devtools', port => {
  port.postMessage({type: 'hello', tabId: chrome.devtools.inspectedWindow.tabId});
}, async (message, port) => {
  if (message?.type === 'cancel') { operations.get(message.id)?.abort(); return; }
  if (message?.type === 'authorized') {
    authorization.get(message.id)?.(message.allowed === true); authorization.delete(message.id); return;
  }
  if (message?.type !== 'source' || message.row?.tabId !== chrome.devtools.inspectedWindow.tabId) return;
  const controller = new AbortController();
  operations.get(message.id)?.abort();
  operations.set(message.id, controller);
  const remaining = Number.isFinite(message.expiresAt) ? Math.max(0, Math.min(8000, message.expiresAt - Date.now())) : 8000;
  const timer = setTimeout(() => controller.abort(), remaining);
  if (remaining === 0) controller.abort();
  const step = <T>(work: Promise<T>): Promise<T> => sourceStep(work, controller.signal);
  try {
    await step(validateCurrentTag(message.row));
    const resolution = resolveTagSource(message.row, await loadedSources(controller.signal));
    await step(validateCurrentTag(message.row));
    if (!connection.isCurrent(port)) return;
    if (message.open && resolution.status === 'Resolved' && resolution.url) {
      const allowed = await step(new Promise<boolean>(resolve => {
        authorization.set(message.id, resolve); port.postMessage({type: 'authorize', id: message.id});
      }));
      if (!allowed || !connection.isCurrent(port)) throw Error('The observation session or document is no longer current');
      await step(validateCurrentTag(message.row));
      if (controller.signal.aborted || Date.now() >= message.expiresAt) throw Error('Source inspection did not finish; try again');
      await step(new Promise<void>(resolve => chrome.devtools.panels.openResource(resolution.url!,
        resolution.line ?? 0, resolution.column ?? 0, () => resolve())));
    }
    port.postMessage({type: 'result', id: message.id, resolution, opened: message.open === true &&
      resolution.status === 'Resolved'});
  } catch (error) {
    if (connection.isCurrent(port)) port.postMessage({type: 'result', id: message.id, error: String(error)});
  } finally {
    clearTimeout(timer); authorization.delete(message.id); operations.delete(message.id);
  }
}, cancelOperations);
connection.start();
window.addEventListener('pagehide', () => connection.dispose(), {once: true});
