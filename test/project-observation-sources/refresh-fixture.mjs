import assert from 'node:assert/strict';
import {createObservationSourceCoordinator} from '../../dist/data-layer-installed/capture/observation-sources/coordinator.js';
import {startObservationSourceSubscription} from '../../dist/data-layer-installed/capture/observation-sources/subscription.js';

export async function until(predicate) {
  for (let turn = 0; turn < 150 && !predicate(); turn++) await Promise.resolve();
  assert.ok(predicate(), 'controlled scheduler reached its boundary');
}

export function refreshFixture({initial = false} = {}) {
  const bus = new EventTarget(), listeners = new Set(), jobs = new Map();
  const holds = new Set(), releases = new Map(), events = [], received = [];
  let pending = 0;
  globalThis.addEventListener = bus.addEventListener.bind(bus);
  globalThis.removeEventListener = bus.removeEventListener.bind(bus);
  globalThis.dispatchEvent = bus.dispatchEvent.bind(bus);
  globalThis.dataLayer = initial ? [{event: 'M0'}] : [];
  globalThis.application = initial ? [{event: 'A0'}] : [];
  globalThis.chrome = {
    runtime: {onMessage: {addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn)},
      sendMessage: async message => {
        received.push(message.rawValue.event);
        for (const fn of listeners) fn(message, {tab: {id: 7}});
      }},
    scripting: {executeScript: async details => {
      pending++;
      try {
        const result = details.func(...details.args);
        const path = details.args[1];
        if (details.func.name === 'observationArrayHook' && details.args[0] === 'attach' && holds.delete(path)) {
          await new Promise(resolve => releases.set(path, resolve));
          releases.delete(path);
        }
        return [{result}];
      } finally { pending--; }
    }},
  };
  const sources = [{id: 'm', name: 'Marketing', path: 'dataLayer', enabled: true},
    {id: 'a', name: 'Application', path: 'application', enabled: true}];
  const coordinator = createObservationSourceCoordinator({
    start: options => startObservationSourceSubscription(options, {
      schedule: fn => { jobs.set(options.historyPath, fn); return options.historyPath; },
      cancel: path => jobs.delete(path),
    }),
    event: event => events.push(event), status: () => {}, now: () => 'equal-time',
  });
  const context = {projectId: 'retail', sessionId: 'session', tabId: 7, pageUrl: 'https://retail.test', pageLoadId: 'page'};
  return {
    events, received, sources,
    start: () => coordinator.synchronize(context, sources),
    hold: path => holds.add(path),
    blocked: path => releases.has(path),
    release: path => { assert.ok(releases.has(path)); releases.get(path)(); },
    push: (path, event) => globalThis[path].push({event}),
    tick(path) { const job = jobs.get(path); assert.ok(job); jobs.delete(path); job(); },
    settle: () => until(() => pending === 0 && jobs.size === 2),
    async close() {
      coordinator.stop();
      for (const release of releases.values()) release();
      await until(() => pending === 0);
      assert.equal(listeners.size, 0);
      assert.equal(jobs.size, 0);
    },
  };
}
