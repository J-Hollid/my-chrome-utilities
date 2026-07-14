import assert from "node:assert/strict";
import {
  attachSelectedObservationTarget,
  closeObservationTarget,
  createObservationTarget,
  createObservationTargetState,
  detachObservationTarget,
  endAndAttachObservationTarget,
  findObservationTargets,
  navigateObservationTarget,
  registerObservationTarget,
  restoreAttachedObservationTarget,
  selectObservationTarget,
  targetAccessExplanation,
  targetAccessForUrl,
  updateObservationTargetAccess,
} from "../dist/data-layer-observation-targets.js";
import { findCommand, runCommandById } from "../dist/commands.js";
import { closeObservationTargetPicker, showObservationTargetPicker } from "../dist/data-layer-observation-targets-ui.js";
import {
  attachedTargetRecoveryIsCurrent,
  captureAttachedTargetRecovery,
  completeAttachedTargetRecovery,
} from "../dist/data-layer-target-recovery.js";

const checkout = createObservationTarget({
  tabId: 42,
  windowId: 7,
  pageUrl: "https://shop.example.test/checkout",
  title: "Checkout",
  activeTab: true,
});
const confirmation = createObservationTarget({
  tabId: 43,
  windowId: 7,
  pageUrl: "https://shop.example.test/confirmation",
  title: "Purchase confirmation",
});

assert.equal(targetAccessForUrl("chrome://extensions"), "Restricted");
assert.equal(targetAccessExplanation("Restricted", "chrome-extension://id/panel"), "Extension pages cannot be observed");
assert.notEqual(checkout.id, createObservationTarget({
  tabId: 44,
  windowId: checkout.windowId,
  pageUrl: checkout.pageUrl,
  title: checkout.title,
}).id);

let state = createObservationTargetState([checkout, confirmation]);
assert.equal(attachSelectedObservationTarget(state).result, "Selection required");
state = selectObservationTarget(state, confirmation.id);
assert.deepEqual(findObservationTargets(state, "purchase").map(({ id }) => id), [confirmation.id]);
assert.equal(attachSelectedObservationTarget(state).state.attachedTargetId, confirmation.id);

const attachedCheckout = attachSelectedObservationTarget(selectObservationTarget(createObservationTargetState([checkout, confirmation]), checkout.id)).state;
const blockedSwitch = attachSelectedObservationTarget(selectObservationTarget(attachedCheckout, confirmation.id));
assert.equal(blockedSwitch.result, "End current session before attaching selected target");
assert.equal(endAndAttachObservationTarget(attachedCheckout, confirmation.id).state.attachedTargetId, confirmation.id);

const navigated = navigateObservationTarget(attachedCheckout, 42, "https://shop.example.test/confirmation");
assert.equal(navigated.targets.find(({ tabId }) => tabId === 42)?.pageUrl, "https://shop.example.test/confirmation");
assert.equal(closeObservationTarget(attachedCheckout, 42).sessionState, "Target unavailable");
const permissionLost = updateObservationTargetAccess(attachedCheckout, checkout.id, "Permission required");
assert.equal(permissionLost.attachedTargetId, undefined);
assert.equal(permissionLost.sessionState, "Permission required");

const newTarget = createObservationTarget({
  tabId: 73,
  windowId: 7,
  pageUrl: "https://shop.example.test/order-confirmation",
  title: "Order confirmation",
});
const recoveringOldTarget = registerObservationTarget(
  restoreAttachedObservationTarget(checkout),
  newTarget,
);
const oldSession = { session:{ id:"session-old", status:"active", tabId:42 } };
const recoveryRequest = captureAttachedTargetRecovery(recoveringOldTarget, oldSession);
assert.deepEqual(recoveryRequest, {
  sessionId:"session-old",
  targetId:checkout.id,
  tabId:42,
});
const releasedForNewTarget = selectObservationTarget(
  detachObservationTarget(recoveringOldTarget),
  newTarget.id,
);
const staleBeforeStart = completeAttachedTargetRecovery(
  releasedForNewTarget,
  { session:{ ...oldSession.session, status:"ended" } },
  recoveryRequest,
  { ...checkout, title:"Stale checkout" },
);
assert.equal(staleBeforeStart.applied, false);
assert.equal(staleBeforeStart.state.selectedTargetId, newTarget.id);
assert.equal(staleBeforeStart.state.attachedTargetId, undefined);
assert.deepEqual(staleBeforeStart.state.targets.map(({ id }) => id), [checkout.id, newTarget.id]);
assert.equal(attachedTargetRecoveryIsCurrent(releasedForNewTarget, { session:{ ...oldSession.session, status:"ended" } }, recoveryRequest), false);

const attachedNewTarget = attachSelectedObservationTarget(releasedForNewTarget).state;
const staleAfterStart = completeAttachedTargetRecovery(
  attachedNewTarget,
  { session:{ id:"session-new", status:"active", tabId:73 } },
  recoveryRequest,
  { ...checkout, title:"Stale checkout" },
);
assert.equal(staleAfterStart.applied, false);
assert.equal(staleAfterStart.state.selectedTargetId, newTarget.id);
assert.equal(staleAfterStart.state.attachedTargetId, newTarget.id);
assert.equal(attachedTargetRecoveryIsCurrent(attachedNewTarget, { session:{ id:"session-new", status:"active", tabId:73 } }, recoveryRequest), false);
assert.equal(attachedTargetRecoveryIsCurrent(recoveringOldTarget, oldSession, recoveryRequest), true);

const currentRecovery = completeAttachedTargetRecovery(
  recoveringOldTarget,
  oldSession,
  recoveryRequest,
  { ...checkout, title:"Recovered checkout" },
);
assert.equal(currentRecovery.applied, true);
assert.equal(currentRecovery.state.targets.length, 2);
assert.equal(currentRecovery.state.targets.find(({ id }) => id === checkout.id)?.title, "Recovered checkout");

const commandEvents = [];
for (const [id, action] of [
  ["data-layer.choose-observation-target", "Choose target"],
  ["data-layer.attach-selected-target", "Attach selected target"],
  ["data-layer.detach-observation-target", "Detach target"],
]) {
  assert.match(findCommand(id)?.title ?? "", new RegExp(action.replaceAll(" ", "\\s+"), "i"));
  runCommandById(id, {
    record: (entry) => commandEvents.push(entry),
    showWorkspace: (tab) => commandEvents.push({ tab }),
    showDataLayerView: (view) => commandEvents.push({ view }),
  });
}
assert.equal(commandEvents.filter(({ tab }) => tab === "data-layer").length, 3);
assert.equal(commandEvents.filter(({ view }) => view === "Live").length, 3);

const calls = [];
const picker = { hidden: true };
const elements = {
  picker,
  sidePanelContent: { setAttribute: (...args) => calls.push(["set", ...args]), removeAttribute: (...args) => calls.push(["remove", ...args]) },
  search: { focus: () => calls.push(["search-focus"]) },
  browseButton: { focus: () => calls.push(["browse-focus"]) },
};
showObservationTargetPicker(elements);
assert.equal(picker.hidden, false);
assert.deepEqual(calls, [["set", "inert", ""], ["search-focus"]]);
closeObservationTargetPicker(elements);
assert.equal(picker.hidden, true);
assert.deepEqual(calls.at(-2), ["remove", "inert"]);
assert.deepEqual(calls.at(-1), ["browse-focus"]);

console.log("observation target unit tests passed");
