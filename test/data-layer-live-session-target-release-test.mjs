import assert from "node:assert/strict";

const addedListeners = [];
const removedListeners = [];
const scripts = [];
globalThis.chrome = {
  runtime: {
    onMessage: {
      addListener: (listener) => addedListeners.push(listener),
      removeListener: (listener) => removedListeners.push(listener),
    },
  },
  scripting: {
    executeScript: async (request) => {
      scripts.push(request);
      return [{}];
    },
  },
};

const { startLiveHistoryPushCapture } = await import("../dist/data-layer-live-observation.js");
const stop = await startLiveHistoryPushCapture({
  tabId: 42,
  historyPath: "event.history",
  onEntry: () => {},
});

assert.equal(addedListeners.length, 1);
assert.equal(scripts.length, 2);
assert.deepEqual(scripts.map(({ target }) => target.tabId), [42, 42]);
assert.equal(scripts[1].world, "MAIN");

stop();
await Promise.resolve();
assert.deepEqual(removedListeners, addedListeners);
assert.equal(scripts.length, 3);
assert.equal(scripts[2].target.tabId, 42);
assert.equal(scripts[2].world, "MAIN");
