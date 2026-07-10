import assert from "node:assert/strict";

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
