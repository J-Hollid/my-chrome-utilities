import assert from "node:assert/strict";

import { endLiveSession } from "../dist/data-layer-live-session-end.js";
import {
  attachSelectedObservationTarget,
  createObservationTarget,
  createObservationTargetState,
  detachObservationTarget,
  endAndAttachObservationTarget,
  findObservationTargets,
  navigateObservationTarget,
  observationTargetId,
  orderedObservationTargets,
  refreshDiscoveredObservationTargets,
  registerObservationTarget,
  restoreAttachedObservationTarget,
  selectObservationTarget,
  updateObservationTargetAccess,
} from "../dist/data-layer-observation-targets.js";
import {
  attachedTargetRecoveryIsCurrent,
  captureAttachedTargetRecovery,
  completeAttachedTargetRecovery,
} from "../dist/data-layer-target-recovery.js";

for (let sample = 0; sample < 100; sample += 1) {
  const targets = [
    createObservationTarget({
      tabId: sample * 3 + 1,
      windowId: sample + 1,
      pageUrl: `https://shop.example.test/${sample}`,
      title: `Checkout ${sample}`,
      activeTab: true,
      currentWindow: true,
    }),
    createObservationTarget({
      tabId: sample * 3 + 2,
      windowId: sample + 1,
      pageUrl: `https://shop.example.test/confirmation/${sample}`,
      title: `Confirmation ${sample}`,
    }),
    createObservationTarget({
      tabId: sample * 3 + 3,
      windowId: sample + 2,
      pageUrl: "chrome://extensions",
      title: `Restricted ${sample}`,
    }),
  ];
  const [checkout, confirmation, restricted] = targets;
  assert.notEqual(checkout.id, confirmation.id);
  assert.equal(checkout.id, observationTargetId(checkout.tabId, checkout.windowId));

  let state = createObservationTargetState(targets);
  state = registerObservationTarget(state, { ...checkout, title: `Updated ${sample}` });
  assert.equal(state.targets.length, targets.length);
  assert.equal(state.targets[0].title, `Updated ${sample}`);

  state = selectObservationTarget(state, confirmation.id);
  const ordered = orderedObservationTargets(state);
  assert.equal(ordered[0].id, confirmation.id);
  assert.equal(new Set(ordered.map(({ id }) => id)).size, targets.length);
  assert.deepEqual(findObservationTargets(state, "confirmation").map(({ id }) => id), [confirmation.id]);

  const attached = attachSelectedObservationTarget(state);
  assert.equal(attached.result, "Attached");
  assert.equal(attached.state.attachedTargetId, confirmation.id);
  assert.equal(
    attachSelectedObservationTarget(selectObservationTarget(attached.state, checkout.id)).result,
    "End current session before attaching selected target",
  );
  const switched = endAndAttachObservationTarget(attached.state, checkout.id).state;
  assert.equal(switched.attachedTargetId, checkout.id);
  const restored = restoreAttachedObservationTarget(checkout);
  assert.deepEqual(
    orderedObservationTargets(restored).map(({ id }) => id),
    [checkout.id],
  );
  const detached = detachObservationTarget(restored);
  assert.equal(detached.attachedTargetId, undefined);
  assert.equal(detached.recentTargetId, checkout.id);

  const session = {
    session: {
      id: `session-${sample}`,
      status: "active",
      tabId: checkout.tabId,
      historyPath: "event.history",
      startUrl: checkout.pageUrl,
      currentUrl: checkout.pageUrl,
      timeline: [],
    },
  };
  const recoveryRequest = captureAttachedTargetRecovery(switched, session);
  assert.deepEqual(recoveryRequest, {
    sessionId: session.session.id,
    targetId: checkout.id,
    tabId: checkout.tabId,
  });
  assert.equal(
    attachedTargetRecoveryIsCurrent(switched, session, recoveryRequest),
    true,
  );

  const recoveredCheckout = {
    ...checkout,
    title: `Recovered checkout ${sample}`,
  };
  const completedRecovery = completeAttachedTargetRecovery(
    switched,
    session,
    recoveryRequest,
    recoveredCheckout,
  );
  assert.equal(completedRecovery.applied, true);
  assert.equal(completedRecovery.state.targets.length, switched.targets.length);
  assert.equal(
    completedRecovery.state.targets.find(({ id }) => id === checkout.id)?.title,
    recoveredCheckout.title,
  );
  assert.equal(
    completedRecovery.state.targets.find(({ id }) => id === checkout.id)
      ?.priorSession,
    true,
  );

  const released = detachObservationTarget(switched);
  const releasedRecovery = completeAttachedTargetRecovery(
    released,
    session,
    recoveryRequest,
    recoveredCheckout,
  );
  assert.equal(releasedRecovery.applied, false);
  assert.equal(releasedRecovery.state, released);
  assert.equal(
    attachedTargetRecoveryIsCurrent(released, session, recoveryRequest),
    false,
  );

  const selectedElsewhere = selectObservationTarget(switched, confirmation.id);
  assert.equal(
    attachedTargetRecoveryIsCurrent(
      selectedElsewhere,
      session,
      recoveryRequest,
    ),
    false,
  );
  const mismatchedTargetRecovery = completeAttachedTargetRecovery(
    switched,
    session,
    recoveryRequest,
    confirmation,
  );
  assert.equal(mismatchedTargetRecovery.applied, false);
  assert.equal(mismatchedTargetRecovery.state, switched);

  const ended = endLiveSession(session, restored);
  assert.equal(ended.sessionState.session?.status, "ended");
  assert.equal(ended.targetState.attachedTargetId, undefined);
  const endedAgain = endLiveSession(ended.sessionState, ended.targetState);
  assert.deepEqual(endedAgain.sessionState, ended.sessionState);
  assert.deepEqual(endedAgain.targetState, ended.targetState);
  assert.equal(endedAgain.releasedTargetId, undefined);
  assert.equal(
    captureAttachedTargetRecovery(switched, ended.sessionState),
    undefined,
  );
  assert.equal(
    attachedTargetRecoveryIsCurrent(
      switched,
      ended.sessionState,
      recoveryRequest,
    ),
    false,
  );

  const permissionLost = updateObservationTargetAccess(
    switched,
    checkout.id,
    "Permission required",
  );
  assert.equal(permissionLost.attachedTargetId, undefined);
  assert.equal(permissionLost.sessionState, "Permission required");
  assert.equal(
    attachSelectedObservationTarget(selectObservationTarget(permissionLost, restricted.id)).result,
    "Restricted",
  );

  const navigated = navigateObservationTarget(
    permissionLost,
    confirmation.tabId,
    `https://shop.example.test/complete/${sample}`,
  );
  const navigatedTarget = navigated.targets.find(({ id }) => id === confirmation.id);
  assert.equal(navigatedTarget?.id, confirmation.id);
  assert.equal(navigatedTarget?.accessState, "Ready");
  const refreshed = refreshDiscoveredObservationTargets(
    state,
    [checkout, confirmation],
  );
  assert.equal(refreshed.targets.some(({ id }) => id === restricted.id), false);
}
