import { ObservationSession, type LiveState } from './session.js';
import { pageOrigin } from './target.js';
import { readTarget } from '../detection/browser-target.js';
import { sourceActions, type SourceState } from './source-actions.js';

export interface SurfaceState { live: LiveState; source: SourceState; }

export function createLiveOwner(tabId: number, publish: (state: SurfaceState) => void) {
  let sourceState: SourceState = {connected: false, resolution: null, feedback: ''};
  let sources: ReturnType<typeof sourceActions> | undefined;
  const session = new ObservationSession(tabId, () => readTarget(tabId), () => {
    sources?.update(); publish({live: session.state, source: sourceState});
  });
  sources = sourceActions(tabId, () => session.state, value => {
    sourceState = value; publish({live: session.state, source: value});
  });
  let disposed = false, checkingLifecycle = false, timer: ReturnType<typeof setTimeout> | undefined;
  let navigationWithoutAddress = false;
  const readiness = async (): Promise<void> => {
    if (disposed || checkingLifecycle || ['Ended', 'Target closed'].includes(session.state.status)) return;
    checkingLifecycle = true;
    let visibleUrl: string | undefined;
    try {
      const tab = await chrome.tabs.get(tabId);
      visibleUrl = tab.url;
      if (disposed || ['Ended', 'Target closed'].includes(session.state.status)) return;
      if (tab.url) session.context(tab.url);
      if (tab.url && !pageOrigin(tab.url)) {
        session.state.error = 'This browser page cannot be observed';
        session.accessLost(); return;
      }
      const frames = await chrome.scripting.executeScript({target: {tabId, allFrames: true}, func: () => location.href});
      if (disposed || ['Ended', 'Target closed'].includes(session.state.status)) return;
      for (const old of session.state.inventory.frames) {
        if (!frames.some(frame => frame.frameId === old.frameId && frame.documentId === old.documentId)) {
          session.invalidate(old.frameId);
        }
      }
      const top = frames.find(frame => frame.frameId === 0);
      if (!top?.documentId || typeof top.result !== 'string') throw Error('Website access is unavailable');
      session.context(top.result);
      if (tab.status === 'complete') navigationWithoutAddress = false;
      session.restoreAccess();
    } catch (error) {
      if (disposed || ['Ended', 'Target closed'].includes(session.state.status)) return;
      if (navigationWithoutAddress && !visibleUrl) session.context('');
      session.state.error = session.state.url ? String(error) :
        'The current address is unavailable. Activate the extension on the website, then check access again, or use Browse all tabs.';
      session.accessLost();
    } finally {
      checkingLifecycle = false;
    }
  };
  const tick = async (): Promise<void> => {
    if (disposed) return;
    if (session.state.status === 'Observing') void session.observe();
    if (['Observing', 'Paused'].includes(session.state.status)) {
      await readiness();
    }
    if (!disposed) timer = setTimeout(() => void tick(), 1000);
  };
  const updated = (id: number, change: chrome.tabs.TabChangeInfo): void => {
    if (id !== tabId || disposed) return;
    if (change.status === 'loading') navigationWithoutAddress = !change.url;
    if (change.url) { navigationWithoutAddress = false; session.context(change.url); }
    if (change.status || change.url) void readiness();
  };
  const removed = (id: number): void => { if (id === tabId) session.closeTarget(); };
  const revoked = (): void => { if (!disposed) void readiness(); };
  chrome.tabs.onUpdated.addListener(updated); chrome.tabs.onRemoved.addListener(removed);
  chrome.permissions.onRemoved.addListener(revoked);
  void readiness(); void tick();
  return {
    session,
    action(value: {name: string; key?: string | null; search?: string; code?: string; profile?: string; message?: string}): void {
      if (value.name === 'start') session.start();
      if (value.name === 'pause') session.pause();
      if (value.name === 'resume') session.resume();
      if (value.name === 'end') session.end();
      if (value.name === 'reset') { session.reset(); void readiness(); }
      if (value.name === 'select') session.select(value.key ?? null);
      if (value.name === 'filters') session.filters(value.search ?? '', value.code ?? '', value.profile ?? '');
      if (value.name === 'source') sources?.show();
      if (value.name === 'access') void readiness();
      if (value.name === 'feedback' && ['Source URL copied', 'The source URL could not be copied'].includes(value.message ?? '')) {
        sources?.feedback(value.message!);
      }
    },
    dispose(): void {
      disposed = true; clearTimeout(timer); session.end(); sources?.dispose();
      chrome.tabs.onUpdated.removeListener(updated); chrome.tabs.onRemoved.removeListener(removed);
      chrome.permissions.onRemoved.removeListener(revoked);
    },
  };
}
