import { startLiveHistoryPushCapture } from "../../dist/data-layer-live-observation.js";
import { endLiveSession } from "../../dist/data-layer-live-session-end.js";
import {
  appendObservedHistoryEntry,
  attachHistoryArraySnapshot,
} from "../../dist/data-layer-observer.js";
import {
  attachSelectedObservationTarget,
  createObservationTarget,
  registerObservationTarget,
  restoreAttachedObservationTarget,
  selectObservationTarget,
} from "../../dist/data-layer-observation-targets.js";
import {
  attachedTargetRecoveryIsCurrent,
  captureAttachedTargetRecovery,
  completeAttachedTargetRecovery,
} from "../../dist/data-layer-target-recovery.js";
import { createLiveObserverState } from "../../dist/data-layer-live-observer.js";
import { beginDataLayerTestingSession } from "../../dist/data-layer-session-start.js";
import { startDataLayerTestingSession } from "../../dist/data-layer-session.js";

const historyPath = "queue.history";
const oldTarget = createObservationTarget({
  tabId:42,
  windowId:7,
  pageUrl:"https://shop.example.test/checkout",
  title:"Checkout",
});
const newTarget = createObservationTarget({
  tabId:73,
  windowId:7,
  pageUrl:"https://shop.example.test/order-confirmation",
  title:"Order confirmation",
});

function installRuntime() {
  const pageListeners = new Map();
  const runtimeListeners = [];
  const scripts = [];
  const pageArray = [];

  delete globalThis.__myChromeUtilitiesHistoryPushObservers;
  for (const key of Object.keys(globalThis)) {
    if (key.startsWith("__myChromeUtilitiesHistoryBridge_")) delete globalThis[key];
  }
  globalThis.queue = { history:pageArray };
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options) {
      super(type);
      this.detail = options?.detail;
    }
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
        for (const listener of [...runtimeListeners]) {
          listener(message, { tab:{ id:newTarget.tabId } });
        }
      },
    },
    scripting: {
      executeScript: async (request) => {
        scripts.push(request);
        return [{ result:request.func(...request.args) }];
      },
    },
  };

  return { pageArray, runtimeListeners, scripts };
}

function completeStaleRecovery(targetState, sessionState, request) {
  if (!attachedTargetRecoveryIsCurrent(targetState, sessionState, request)) {
    return { targetState, applied:false };
  }
  const completion = completeAttachedTargetRecovery(
    targetState,
    sessionState,
    request,
    { ...oldTarget, title:"Recovered Checkout" },
  );
  return { targetState:completion.state, applied:completion.applied };
}

async function scenario(releaseAction, completionOrder) {
  const runtime = installRuntime();
  let targetState = registerObservationTarget(
    restoreAttachedObservationTarget(oldTarget),
    newTarget,
  );
  let sessionState = startDataLayerTestingSession({}, {
    id:"session-old",
    tabId:oldTarget.tabId,
    url:oldTarget.pageUrl,
    historyPath,
    windowId:oldTarget.windowId,
    targetTitle:oldTarget.title,
    targetOrigin:oldTarget.origin,
  });
  const recoveryRequest = captureAttachedTargetRecovery(targetState, sessionState);
  if (!recoveryRequest) throw new Error("The old attached target did not start recovery.");

  const released = [];
  const ended = endLiveSession(
    sessionState,
    targetState,
    (targetId) => released.push(targetId),
  );
  sessionState = ended.sessionState;
  targetState = selectObservationTarget(ended.targetState, newTarget.id);

  let staleApplied = false;
  const staleBeforeStart = completionOrder === "stale recovery then Start testing";
  if (staleBeforeStart) {
    const stale = completeStaleRecovery(targetState, sessionState, recoveryRequest);
    targetState = stale.targetState;
    staleApplied = stale.applied;
  }

  const attachment = attachSelectedObservationTarget(targetState);
  targetState = attachment.state;
  const started = beginDataLayerTestingSession(
    sessionState,
    createLiveObserverState({ pageUrl:newTarget.pageUrl, sources:[] }),
    {
      id:"session-new",
      tabId:newTarget.tabId,
      url:newTarget.pageUrl,
      historyPath,
      windowId:newTarget.windowId,
      targetTitle:newTarget.title,
      targetOrigin:newTarget.origin,
    },
  );
  sessionState = started.sessionState;

  let observerState = {
    sessionState,
    sourceEvents:[],
  };
  const stopCapture = await startLiveHistoryPushCapture({
    tabId:newTarget.tabId,
    historyPath,
    onSnapshot: ({ rawValues }) => {
      observerState = attachHistoryArraySnapshot(observerState, {
        historyPath,
        pageUrl:newTarget.pageUrl,
        pageLoadId:"new-target-load",
        rawValues,
        requestId:"new-target-activation",
      });
    },
    onEntry: ({ rawValue, timestamp }) => {
      observerState = appendObservedHistoryEntry(observerState, rawValue, timestamp);
    },
  });

  if (completionOrder === "Start testing then stale recovery" || completionOrder === undefined) {
    const stale = completeStaleRecovery(targetState, sessionState, recoveryRequest);
    targetState = stale.targetState;
    staleApplied = stale.applied;
  }

  const registry = globalThis.__myChromeUtilitiesHistoryPushObservers?.[historyPath];
  const channelId = registry && Object.keys(registry.channels)[0];
  if (!channelId) throw new Error("The new target page hook was not installed.");
  const message = (event) => ({
    type:"my-chrome-utilities.data-layer-history-entry",
    channelId,
    rawValue:{ event },
    timestamp:"2026-07-14T12:00:00.000Z",
  });
  for (const listener of [...runtime.runtimeListeners]) {
    listener(message("old-view"), { tab:{ id:oldTarget.tabId } });
    listener(message("new-view"), { tab:{ id:newTarget.tabId } });
  }

  const feed = observerState.sourceEvents.map(({ name }) => name);
  const observation = {
    releaseAction,
    completionOrder:completionOrder ?? "immediate Start testing",
    historyPath,
    oldTarget:oldTarget.title,
    oldTabId:oldTarget.tabId,
    oldTargetId:oldTarget.id,
    newTarget:newTarget.title,
    newTabId:newTarget.tabId,
    newTargetId:newTarget.id,
    releasedTargetIds:released,
    selectedTargetId:targetState.selectedTargetId,
    attachedTargetId:targetState.attachedTargetId,
    sessionId:sessionState.session?.id,
    sessionTabId:sessionState.session?.tabId,
    sessionTargetTitle:sessionState.session?.targetTitle,
    sessionStarted:started.started,
    attachmentResult:attachment.result,
    staleRecoveryApplied:staleApplied,
    observerCount:observerState.observer?.activeCount ?? 0,
    observerTabId:sessionState.session?.tabId,
    pageHookCount:Object.keys(registry.channels).length,
    pageHookTabIds:runtime.scripts
      .filter(({ world }) => world === "MAIN")
      .map(({ target }) => target.tabId),
    runtimeListenerCount:runtime.runtimeListeners.length,
    feed,
    eventTargetTabIds:observerState.sourceEvents.map(() => sessionState.session?.tabId),
    pushedOldEvent:"old-view",
    pushedNewEvent:"new-view",
    newEventCount:feed.filter((name) => name === "new-view").length,
    oldEventCount:feed.filter((name) => name === "old-view").length,
  };
  stopCapture();
  await Promise.resolve();
  return observation;
}

const cases = [];
for (const releaseAction of ["End testing", "confirmed target detachment"]) {
  cases.push(await scenario(releaseAction));
  for (const completionOrder of [
    "stale recovery then Start testing",
    "Start testing then stale recovery",
  ]) {
    cases.push(await scenario(releaseAction, completionOrder));
  }
}

console.log(JSON.stringify({ cases }));
