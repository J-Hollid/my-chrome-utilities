import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { canPushTemplate, createEditableTemplate, discardDraft, executeDraftPush, leaveEditorOptions, openPropertyEditor, removeDraftProperty, restoreEventTemplateLibrary, saveAsTemplateCopy, saveDraftRevision, searchEventTemplates, serializeEventTemplateLibrary, setDraftProperty, setPushDestination, updateDraftJson } from "../dist/data-layer-event-library-editor.js";
import { planVerification } from "../scripts/verification-packs.mjs";
import { runSidePanelBrowserSession } from "./support/side-panel-browser-session.mjs";
import { createSidePanelTargetRegistry, resolveSidePanelTargets } from "./support/side-panel-browser-target-registry.mjs";
import * as eventLibraryTargets from "./support/side-panel-event-library-targets.mjs";

const { eventLibraryTargetContract } = eventLibraryTargets;

const event = { id: "event-1", sessionId: "session-1", sourceId: "history", sourceKind: "page", name: "purchase", captureTime: "2026-07-10T10:00:00Z", pageUrl: "https://example.test/checkout", payload: { transaction_id: "test-123", debug: true, items: [{ product_id: "sku-123" }] }, rawInput: ["purchase"], validation: "Valid", provenance: "captured:history" };
const adapter = { id: "history", name: "Event history", kind: "page", destination: "event.history", enabled: true, status: "Connected", capabilities: ["push"] };
const template = createEditableTemplate(event, { name: "Purchase confirmation", destination: "event.history", sourceName: "Event history", tags: ["checkout"], schemaId: "purchase" });
event.payload.transaction_id = "mutated";
assert.equal(template.payload.transaction_id, "test-123");
let editor = openPropertyEditor(template);
editor = setDraftProperty(editor, "/transaction_id", "test-456");
editor = removeDraftProperty(editor, "/debug");
editor = setDraftProperty(editor, "/items/0/product_id", "sku-456");
assert.equal(editor.draft.transaction_id, "test-456");
assert.equal(editor.draft.items[0].product_id, "sku-456");
assert.equal(template.payload.transaction_id, "test-123");
assert.equal("debug" in editor.draft, false);
const invalid = updateDraftJson(editor, "{");
assert.match(invalid.jsonError, /position/);
assert.deepEqual(invalid.draft, editor.draft);
assert.throws(() => saveDraftRevision(invalid), /Invalid JSON/);
editor = updateDraftJson(editor, JSON.stringify(editor.draft));
assert.equal(editor.jsonError, undefined);
const trailingComma = updateDraftJson(editor, '{"tealium_generated":"1","scroll_percentage":25,}');
assert.match(trailingComma.jsonError, /Invalid JSON/);
const recovered = updateDraftJson(trailingComma, '{"tealium_generated":"1","scroll_percentage":25}');
assert.equal(recovered.jsonError, undefined);
assert.deepEqual(recovered.draft, { tealium_generated: "1", scroll_percentage: 25 });
const revised = saveDraftRevision(editor);
assert.equal(revised.template.version, 2);
assert.equal(revised.revisions[0].version, 1);
const retargeted = saveDraftRevision(setPushDestination(revised, "analytics.queue"));
assert.equal(retargeted.template.destination, "analytics.queue");
assert.equal(openPropertyEditor(retargeted.template).template.destination, "analytics.queue");
const copy = saveAsTemplateCopy(revised, "Purchase failure view");
assert.notEqual(copy.id, revised.template.id);
assert.deepEqual(copy.payload, revised.template.payload);
assert.deepEqual(searchEventTemplates([revised.template, copy], "sku-456").map(({ name }) => name), ["Purchase confirmation", "Purchase failure view"]);
assert.deepEqual(restoreEventTemplateLibrary(serializeEventTemplateLibrary([revised.template]))[0], revised.template);
assert.deepEqual(restoreEventTemplateLibrary("not json"), []);
assert.equal(canPushTemplate(revised.template, adapter), true);
let pushed;
const record = executeDraftPush(revised, adapter, "https://example.test/checkout", (destination, payload) => { pushed = { destination, payload }; });
assert.equal(record.success, true);
assert.deepEqual(pushed, { destination: "event.history", payload: revised.draft });
assert.equal(revised.template.version, 2);
assert.deepEqual(leaveEditorOptions(setDraftProperty(revised, "/transaction_id", "other")), ["keep editing", "discard draft", "save"]);
assert.equal(discardDraft(setDraftProperty(revised, "/transaction_id", "other")).draft.transaction_id, "test-456");

const packs = JSON.parse(await readFile(new URL("../verification/packs.json", import.meta.url), "utf8"));
const eventLibraryPack = packs.find(({ id }) => id === "event-library");
assert.deepEqual(eventLibraryPack.browserAdapters, [
  "test/browser-packs/event-library.mjs",
  "test/browser-packs/side-panel-event-library.mjs",
]);
assert.deepEqual(eventLibraryPack.browserAdapterModes, [
  { path:"test/browser-packs/event-library.mjs", mode:"compatibility" },
  { path:"test/browser-packs/side-panel-event-library.mjs", mode:"integration" },
]);
const compatibilityLauncher = await readFile(
  new URL("./browser-packs/event-library.mjs", import.meta.url), "utf8");
assert.equal(compatibilityLauncher.trim().split(/\r?\n/u).length <= 3, true);
assert.match(compatibilityLauncher, /EVENT_LIBRARY_RENDERED_SMOKE_TARGET/u);
assert.match(compatibilityLauncher, /side-panel-event-library\.mjs/u);
assert.doesNotMatch(compatibilityLauncher, /shared-harness|runRenderedWorkflow/u);
assert.deepEqual(eventLibraryPack.browserObservations.map(({ id }) => id), [
  "EVENT_LIBRARY_RENDERED_SMOKE_TARGET",
  "LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER",
]);
assert.deepEqual(eventLibraryTargetContract.map(({ id, processGroup, viewport }) => ({
  id, processGroup, viewport,
})), [
  { id:"EVENT_LIBRARY_RENDERED_SMOKE_TARGET", processGroup:"event-library-side-panel", viewport:[320] },
  { id:"LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER", processGroup:"event-library-side-panel", viewport:[720] },
]);
const smokeTarget = eventLibraryTargetContract[0];
assert.deepEqual(smokeTarget.observationKeys, ["eventLibraryRenderedSmoke"]);
assert.deepEqual(smokeTarget.assertionLeaves, [
  ["eventLibraryRenderedSmoke", "isolation"],
  ["eventLibraryRenderedSmoke", "editorVisible"],
  ["eventLibraryRenderedSmoke", "templateNameFocused"],
  ["eventLibraryRenderedSmoke", "persistedVersionTwo"],
  ["eventLibraryRenderedSmoke", "singleRevisionHistoryEntry"],
  ["eventLibraryRenderedSmoke", "oneExportedTemplate"],
  ["eventLibraryRenderedSmoke", "positiveTransferBytes"],
  ["eventLibraryRenderedSmoke", "transferFeedback"],
  ["eventLibraryRenderedSmoke", "containedAt320"],
  ["eventLibraryRenderedSmoke", "visibleControlsNamed"],
  ["eventLibraryRenderedSmoke", "referencesResolve"],
]);
const exactPlan = planVerification(packs, { packIds:["event-library"], includeProperties:true });
assert.equal(exactPlan.tasks.length, 29);
assert.equal(exactPlan.browserTasks.length, 0);
assert.equal(exactPlan.observationTasks.length, 1);
assert.deepEqual(exactPlan.observationTasks[0].logicalTargetIds, [
  "EVENT_LIBRARY_RENDERED_SMOKE_TARGET",
  "LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER",
]);

const targetRegistry = createSidePanelTargetRegistry(eventLibraryTargetContract, { requireHooks:false });
const targetLoader = async () => eventLibraryTargets;
const resolveOrder = (ids) => resolveSidePanelTargets({
  registry:targetRegistry,
  owningPack:"event-library",
  requests:ids.map((id) => ({ id, configuration:eventLibraryTargetContract
    .find((target) => target.id === id).configuration })),
  loaders:Object.fromEntries(ids.map((id) => [id, targetLoader])),
});
const targetIds = eventLibraryTargetContract.map(({ id }) => id);
assert.deepEqual((await resolveOrder(targetIds)).map(({ id }) => id), targetIds);
assert.deepEqual((await resolveOrder([...targetIds].reverse())).map(({ id }) => id), [...targetIds].reverse());
for (const targetId of targetIds) {
  assert.deepEqual((await resolveOrder([targetId])).map(({ id }) => id), [targetId]);
}

async function successfulBatch(ids) {
  const emitted = [];
  const openedContexts = [];
  let stopCount = 0;
  const definitions = ids.map((id) => {
    const target = eventLibraryTargetContract.find((candidate) => candidate.id === id);
    return {
      ...target,
      setup:async () => {},
      observe:async () => Object.fromEntries(target.observationKeys.map((key) => [key, { passed:true }])),
      cleanup:async () => {},
      assertionLeaves:target.observationKeys.map((key) => [key]),
    };
  });
  const result = await runSidePanelBrowserSession({
    definitions,
    emit:(record) => emitted.push(record),
    resources:{
      start:async () => ({}),
      resetOrigins:async () => {},
      openTarget:async ({ context }) => { openedContexts.push(context); return {}; },
      closeTarget:async () => {},
      stop:async () => { stopCount += 1; },
    },
  });
  const observations = emitted.filter((record) => targetIds.some((id) =>
    eventLibraryTargetContract.find((target) => target.id === id).observationKeys
      .some((key) => Object.hasOwn(record, key))));
  return { result, observations:observations.sort((left, right) =>
    Object.keys(left)[0].localeCompare(Object.keys(right)[0])), openedContexts, stopCount };
}
const canonicalBatch = await successfulBatch(targetIds);
const reverseBatch = await successfulBatch([...targetIds].reverse());
assert.deepEqual(reverseBatch.observations, canonicalBatch.observations);
assert.deepEqual(new Set(canonicalBatch.openedContexts).size, 2);
assert.deepEqual(new Set(reverseBatch.openedContexts).size, 2);
assert.deepEqual(canonicalBatch.result.executions.map(({ id }) => id), targetIds);
assert.deepEqual(reverseBatch.result.executions.map(({ id }) => id), [...targetIds].reverse());
assert.equal(canonicalBatch.stopCount, 1);
assert.equal(reverseBatch.stopCount, 1);

async function failureIsolation(failedTarget) {
  const emitted = [];
  let stopCount = 0;
  const definitions = eventLibraryTargetContract.map((target) => ({
    ...target,
    setup:async () => {},
    observe:async () => {
      if (target.id === failedTarget) {
        if (target.id === "EVENT_LIBRARY_RENDERED_SMOKE_TARGET") return {};
        throw new Error("forced direct-push interaction failure");
      }
      return Object.fromEntries(target.observationKeys.map((key) => [key, { passed:true }]));
    },
    cleanup:async () => {},
    assertionLeaves:target.observationKeys.map((key) => [key]),
  }));
  await assert.rejects(() => runSidePanelBrowserSession({
    definitions,
    emit:(record) => emitted.push(record),
    resources:{
      start:async () => ({}),
      resetOrigins:async () => {},
      openTarget:async () => ({}),
      closeTarget:async () => {},
      stop:async () => { stopCount += 1; },
    },
  }), AggregateError);
  const results = emitted.map((record) => record.swarmforgeBrowserTargetResult).filter(Boolean);
  assert.equal(results.length, 2);
  const failedResult = results.find(({ id }) => id === failedTarget);
  assert.equal(failedResult.status, "failed");
  assert.equal(failedResult.phase,
    failedTarget === "EVENT_LIBRARY_RENDERED_SMOKE_TARGET" ? "assertion" : "interaction");
  assert.equal(results.find(({ id }) => id !== failedTarget).status, "passed");
  assert.equal(stopCount, 1);
}
await failureIsolation("EVENT_LIBRARY_RENDERED_SMOKE_TARGET");
await failureIsolation("LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER");
