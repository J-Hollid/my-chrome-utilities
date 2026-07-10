import assert from "node:assert/strict";
import {
  attachSelectedObservationTarget,
  closeObservationTarget,
  createObservationTarget,
  createObservationTargetState,
  endAndAttachObservationTarget,
  findObservationTargets,
  navigateObservationTarget,
  selectObservationTarget,
  targetAccessExplanation,
  targetAccessForUrl,
  updateObservationTargetAccess,
} from "../dist/data-layer-observation-targets.js";
import { findCommand, runCommandById } from "../dist/commands.js";

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

console.log("observation target unit tests passed");
