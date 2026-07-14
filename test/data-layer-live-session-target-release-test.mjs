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
const {
  initialObservationActivationState,
  nextObservationActivation,
  observationActivationIsCurrent,
} = await import("../dist/data-layer-observation-activation.js");
let generationState = initialObservationActivationState;
const firstGeneration = nextObservationActivation(generationState);
generationState = firstGeneration.state;
const secondGeneration = nextObservationActivation(generationState);
generationState = secondGeneration.state;
assert.equal(observationActivationIsCurrent(generationState, firstGeneration.generation), false);
assert.equal(observationActivationIsCurrent(generationState, secondGeneration.generation), true);
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

const pageListeners = new Map();
const runtimeListeners = [];
const originalCalls = [];
const pageArray = [];
pageArray.push = function (...items) {
  originalCalls.push({ receiver: this, items });
  Array.prototype.push.apply(this, items);
  return 100 + this.length;
};
globalThis.queue = { history: pageArray };
globalThis.CustomEvent = class CustomEvent extends Event {
  constructor(type, options) {
    super(type);
    this.detail = options?.detail;
  }
};
globalThis.addEventListener = (type, listener) => {
  pageListeners.set(type, listener);
};
globalThis.dispatchEvent = (event) => {
  pageListeners.get(event.type)?.(event);
  return true;
};

let releaseHook;
const hookGate = new Promise((resolve) => { releaseHook = resolve; });
globalThis.chrome = {
  runtime: {
    onMessage: {
      addListener: (listener) => runtimeListeners.push(listener),
      removeListener: () => {},
    },
    sendMessage: async (message) => {
      for (const listener of runtimeListeners) listener(message, { tab:{ id:7 } });
    },
  },
  scripting: {
    executeScript: async (request) => {
      if (request.world === "MAIN") await hookGate;
      return [{ result:request.func(...request.args) }];
    },
  },
};

const captured = [];
const activationSnapshots = [];
const activation = startLiveHistoryPushCapture({
  tabId:7,
  historyPath:"queue.history",
  onSnapshot: (snapshot) => activationSnapshots.push(snapshot),
  onEntry: (entry) => captured.push(entry.rawValue),
});
await Promise.resolve();
const handoffReturns = [pageArray.push("event-1"), pageArray.push("event-2")];
releaseHook();
const stopLosslessCapture = await activation;
const liveReturns = [pageArray.push("event-3"), pageArray.push("event-4")];
await Promise.resolve();

assert.deepEqual(activationSnapshots.map(({ rawValues }) => rawValues), [["event-1", "event-2"]]);
assert.deepEqual(captured, ["event-3", "event-4"]);
assert.deepEqual(pageArray.slice(), ["event-1", "event-2", "event-3", "event-4"]);
assert.deepEqual([...handoffReturns, ...liveReturns], [101, 102, 103, 104]);
assert.ok(originalCalls.every(({ receiver }) => receiver === pageArray));
assert.equal(Object.keys(globalThis.__myChromeUtilitiesHistoryPushObservers["queue.history"].channels).length, 1);
stopLosslessCapture();
