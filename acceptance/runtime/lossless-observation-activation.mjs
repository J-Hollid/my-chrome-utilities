import {
  historySnapshotPageObject,
  startLiveHistoryPushCapture,
} from "../../dist/data-layer-live-observation.js";
import {
  appendObservedHistoryEntry,
  attachHistoryArrayObserver,
} from "../../dist/data-layer-observer.js";
import {
  initialObservationActivationState,
  nextObservationActivation,
  observationActivationIsCurrent,
} from "../../dist/data-layer-observation-activation.js";

const path = "queue.history";
const tabId = 7;
const raw = (name) => ({ event:name });
const names = (values) => values.map(({ event }) => event);
const eventNames = (state) => state.sourceEvents.map(({ name }) => name);
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

function observedArray(initialNames = [], returnOffset = 0) {
  const array = initialNames.map(raw);
  const calls = [];
  array.push = function (...items) {
    calls.push({ receiver:this, items });
    Array.prototype.push.apply(this, items);
    return returnOffset + this.length;
  };
  return { array, calls };
}

function installRuntime(array, mainGates = []) {
  const pageListeners = new Map();
  const runtimeListeners = [];
  let mainCalls = 0;
  delete globalThis.__myChromeUtilitiesHistoryPushObservers;
  globalThis.queue = array === undefined ? {} : { history:array };
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options) { super(type); this.detail = options?.detail; }
  };
  globalThis.addEventListener = (type, listener) => pageListeners.set(type, listener);
  globalThis.dispatchEvent = (event) => {
    pageListeners.get(event.type)?.(event);
    return true;
  };
  globalThis.chrome = {
    runtime: {
      onMessage: {
        addListener: (listener) => runtimeListeners.push(listener),
        removeListener: (listener) => {
          const index = runtimeListeners.indexOf(listener);
          if (index >= 0) runtimeListeners.splice(index, 1);
        },
      },
      sendMessage: async (message) => {
        for (const listener of [...runtimeListeners]) listener(message, { tab:{ id:tabId } });
      },
    },
    scripting: {
      executeScript: async (request) => {
        if (request.world === "MAIN") {
          const gate = mainGates[mainCalls];
          mainCalls += 1;
          if (gate) await gate;
        }
        return [{ result:request.func(...request.args) }];
      },
    },
  };
  return {
    mainCalls: () => mainCalls,
    setArray: (next) => { globalThis.queue.history = next; },
  };
}

async function waitForMainCall(runtime, count) {
  while (runtime.mainCalls() < count) await new Promise((resolve) => setImmediate(resolve));
}

function snapshotState(state, pageUrl, pageLoadId, rawValues, requestId) {
  return attachHistoryArrayObserver(state, {
    historyPath:path,
    pageUrl,
    pageLoadId,
    pageObject:historySnapshotPageObject(path, rawValues),
    requestId,
  });
}

function beginCapture(state, pageUrl, pageLoadId) {
  let current = state;
  const completion = startLiveHistoryPushCapture({
    tabId,
    historyPath:path,
    onSnapshot: ({ rawValues }) => {
      current = snapshotState(current, pageUrl, pageLoadId, rawValues, `activate:${pageLoadId}`);
    },
    onEntry: ({ rawValue, timestamp }) => {
      current = appendObservedHistoryEntry(current, rawValue, timestamp);
    },
  });
  return { completion, state:() => current };
}

async function handoffScenario({ initial = [], handoff, live, pageLoadId, pageUrl, offset = 0 }) {
  const hook = deferred();
  const { array, calls } = observedArray(initial, offset);
  const runtime = installRuntime(array, [hook.promise]);
  let state = snapshotState({ sourceEvents:[] }, pageUrl, pageLoadId, array.slice(), `snapshot:${pageLoadId}`);
  const capture = beginCapture(state, pageUrl, pageLoadId);
  await waitForMainCall(runtime, 1);
  const handoffReturns = handoff.map((name) => array.push(raw(name)));
  hook.resolve();
  const stop = await capture.completion;
  const liveReturns = live.map((name) => array.push(raw(name)));
  await Promise.resolve();
  state = capture.state();
  const registryEntry = globalThis.__myChromeUtilitiesHistoryPushObservers[path];
  const result = {
    historyPath:path,
    pageUrl,
    feed:eventNames(state),
    pageLoadIds:state.sourceEvents.map(({ pageLoadId:load }) => load),
    array:names(array),
    registryArray:names(registryEntry.array),
    activeChannels:Object.keys(registryEntry.channels).length,
    originalReceivers:calls.every(({ receiver }) => receiver === array),
    originalCallCount:calls.length,
    pushReturns:[...handoffReturns, ...liveReturns],
  };
  stop();
  return result;
}

const first = await handoffScenario({
  handoff:["event-1", "event-2", "event-3", "event-4"],
  live:["event-5", "event-6"],
  pageLoadId:"load-1",
  pageUrl:"https://example.test/new",
  offset:100,
});

const second = await handoffScenario({
  initial:["event-1", "event-2"],
  handoff:["event-3", "event-4"],
  live:["event-5"],
  pageLoadId:"load-2",
  pageUrl:"https://example.test/new",
});

async function delayedPathScenario() {
  const initialRuntime = installRuntime(undefined);
  let state = attachHistoryArrayObserver({ sourceEvents:[] }, {
    historyPath:path, pageUrl:"https://example.test/delayed", pageLoadId:"load-3", pageObject:{}, requestId:"missing",
  });
  const missingCapture = beginCapture(state, "https://example.test/delayed", "load-3");
  await waitForMainCall(initialRuntime, 1);
  const stopMissing = await missingCapture.completion;
  stopMissing();
  const hook = deferred();
  const { array } = observedArray();
  array.push(raw("event-1"), raw("event-2"));
  const retryRuntime = installRuntime(array, [hook.promise]);
  const retry = beginCapture(missingCapture.state(), "https://example.test/delayed", "load-3");
  await waitForMainCall(retryRuntime, 1);
  array.push(raw("event-3"), raw("event-4"));
  hook.resolve();
  const stop = await retry.completion;
  array.push(raw("event-5"), raw("event-6"));
  await Promise.resolve();
  const result = { historyPath:path, pageUrl:"https://example.test/delayed", pageLoadId:"load-3", feed:eventNames(retry.state()), activeChannels:Object.keys(globalThis.__myChromeUtilitiesHistoryPushObservers[path].channels).length };
  stop();
  return result;
}

const delayed = await delayedPathScenario();

async function navigationScenario() {
  let state = snapshotState({ sourceEvents:[] }, "https://example.test/home", "load-4", [raw("home-view")], "load-4");
  const hook = deferred();
  const { array } = observedArray();
  const runtime = installRuntime(array, [hook.promise]);
  const capture = beginCapture(state, "https://example.test/checkout", "load-5");
  await waitForMainCall(runtime, 1);
  array.push(raw("event-1"), raw("event-2"), raw("event-3"), raw("event-4"));
  hook.resolve();
  const stop = await capture.completion;
  array.push(raw("event-5"), raw("event-6"));
  await Promise.resolve();
  state = capture.state();
  const result = state.sourceEvents.map(({ name, pageLoadId, pageUrl }) => ({ name, pageLoadId, pageUrl }));
  stop();
  return result;
}

const navigation = await navigationScenario();

let reloadState = snapshotState({ sourceEvents:[] }, "https://example.test/home", "load-6", [raw("pageview"), raw("purchase")], "load-6");
reloadState = snapshotState(reloadState, "https://example.test/home", "load-7", [raw("pageview"), raw("purchase")], "load-7");
const reload = {
  historyPath:path,
  pageUrl:"https://example.test/home",
  feed:eventNames(reloadState),
  pageLoadIds:reloadState.sourceEvents.map(({ pageLoadId }) => pageLoadId),
  identities:reloadState.sourceEvents.map(({ id }) => id),
};

async function repeatScenario() {
  const { array, calls } = observedArray(["event-1", "event-2"]);
  installRuntime(array);
  let state = snapshotState({ sourceEvents:[] }, "https://example.test/home", "load-8", array.slice(), "initial");
  let capture = beginCapture(state, "https://example.test/home", "load-8");
  let stop = await capture.completion;
  state = capture.state();
  stop();
  capture = beginCapture(state, "https://example.test/home", "load-8");
  stop = await capture.completion;
  const pushReturn = array.push(raw("event-3"));
  await Promise.resolve();
  state = capture.state();
  const result = { historyPath:path, pageUrl:"https://example.test/home", pageLoadId:"load-8", feed:eventNames(state), channels:Object.keys(globalThis.__myChromeUtilitiesHistoryPushObservers[path].channels).length, originalCalls:calls.length, pushReturn };
  stop();
  return result;
}

const repeat = await repeatScenario();

async function staleGenerationScenario() {
  const staleGate = deferred();
  const { array } = observedArray(["current-view"]);
  const runtime = installRuntime(array, [staleGate.promise, undefined]);
  let activationState = initialObservationActivationState;
  let observerState = { sourceEvents:[] };
  const startGuarded = () => {
    const next = nextObservationActivation(activationState);
    activationState = next.state;
    const generation = next.generation;
    const completion = startLiveHistoryPushCapture({
      tabId, historyPath:path,
      onSnapshot: ({ rawValues }) => {
        if (!observationActivationIsCurrent(activationState, generation)) return;
        observerState = snapshotState(observerState, "https://example.test/current", "generation-2", rawValues, `generation:${generation}`);
      },
      onEntry: ({ rawValue, timestamp }) => {
        if (!observationActivationIsCurrent(activationState, generation)) return;
        observerState = appendObservedHistoryEntry(observerState, rawValue, timestamp);
      },
    }).then((stop) => {
      if (!observationActivationIsCurrent(activationState, generation)) stop();
      return stop;
    });
    return { completion, generation };
  };
  const stale = startGuarded();
  await waitForMainCall(runtime, 1);
  const current = startGuarded();
  await waitForMainCall(runtime, 2);
  const stopCurrent = await current.completion;
  staleGate.resolve();
  await stale.completion;
  array.push(raw("purchase"));
  await Promise.resolve();
  const result = {
    historyPath:path,
    stalePageUrl:"https://example.test/old",
    currentPageUrl:"https://example.test/current",
    staleGenerationId:"generation-1",
    currentGenerationId:"generation-2",
    feed:eventNames(observerState),
    pageLoadIds:observerState.sourceEvents.map(({ pageLoadId }) => pageLoadId),
    channels:Object.keys(globalThis.__myChromeUtilitiesHistoryPushObservers[path].channels).length,
    currentGeneration:observationActivationIsCurrent(activationState, current.generation),
    staleGeneration:observationActivationIsCurrent(activationState, stale.generation),
  };
  stopCurrent();
  return result;
}

const stale = await staleGenerationScenario();

console.log(JSON.stringify({ first, second, delayed, navigation, reload, repeat, stale }));
