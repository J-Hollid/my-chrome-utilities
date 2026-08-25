import assert from "node:assert/strict";
const { createEventLibraryInstalledController } = await import("../../dist/data-layer-installed/event-library/index.js");
const template = { id:"template:1", name:"Page view", eventName:"page_view", sourceId:"history",
  sourceName:"History", destination:"event.history", tags:[], validation:"Not checked", payload:{ page:"/" },
  version:1, provenance:"captured" };
const values = new Map([["my-chrome-utilities.event-template-library.v1", JSON.stringify([template])]]);
let changed = 0, pushed;
const noOpTransfer = { downloadExport() {}, readImportFile:async () => "", schemas:() => [], validateDraft:() => ({ message:"Not checked" }), backToCapturedEvent() {},
  checkPushPath:async () => ({ success:true, message:"Selected-page push path is ready." }),
  pushTarget:() => ({ id:"target:1", tabId:1, windowId:1, title:"Checkout", pageUrl:"https://shop.example/checkout",
    origin:"https://shop.example", accessState:"Ready" }), renderPushReview() {}, renderRevisionReview() {} };
const controller = createEventLibraryInstalledController({
  root:{ querySelector:() => null },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  defaultPushPath:() => "event.history", push:async (value) => { pushed = value.id; },
  changed:() => { changed += 1; }, createId:() => "template:2",
  ...noOpTransfer,
});
controller.mount(); controller.select("template:1"); controller.beginDraft("template:1");
assert.equal(controller.state().editor.template.id, "template:1");
controller.saveRevision();
assert.equal(controller.templates()[0].version, 2, "Event Library owns revision mutation and persistence");
controller.store({ ...controller.templates()[0], name:"Stored from Live inspector" });
assert.equal(controller.templates()[0].name, "Stored from Live inspector",
  "the typed inspector port stores a real template through Event Library ownership");
await controller.pushSelected(); assert.equal(pushed, "template:1");
controller.reviewImport(JSON.stringify({ format:"my-chrome-utilities.event-library", version:1,
  templates:[{ ...template, id:"template:imported", name:"Imported" }] }));
controller.commitImport("append");
assert.equal(controller.templates().length, 2, "Event Library owns reviewed import settlement");
controller.requestDelete("template:imported"); controller.confirmDelete();
assert.deepEqual(controller.templates().map(({ id }) => id), ["template:1"]);
assert.equal(changed, 4);
controller.dispose(); controller.dispose(); controller.mount();
assert.equal(controller.state().editor, undefined, "dispose clears transient editor ownership");
assert.equal(controller.templates()[0].version, 2, "durable template ownership survives remount");

function element() {
  const listeners = new Map();
  return { value:"", textContent:"", hidden:false, dataset:{}, children:[],
    setAttribute(name, value) { this[name] = value; }, removeAttribute(name) { delete this[name]; }, replaceChildren(...children) { this.children = children; },
    setCustomValidity(value) { this.validationMessage = value; }, focus() {},
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); },
    dispatch(type) { listeners.get(type)?.({ preventDefault() {}, target:this }); }, click() { this.dispatch("click"); },
    showModal() { this.open = true; }, close() { this.open = false; }, listenerCount:() => listeners.size,
  };
}

const minimalNodes = new Map();
const minimalDocument = { createElement(tagName) { const node = element(); node.tagName = tagName.toUpperCase();
  node.ownerDocument = minimalDocument; node.remove = () => minimalNodes.delete(`#${node.id}`); return node; } };
const minimalValidation = element(); minimalValidation.ownerDocument = minimalDocument;
minimalValidation.after = (...nodes) => { for (const node of nodes) minimalNodes.set(`#${node.id}`, node); };
minimalNodes.set("#event-template-validation", minimalValidation);
let minimalValidated;
const minimalController = createEventLibraryInstalledController({
  root:{ querySelector:(selector) => minimalNodes.get(selector) ?? null },
  storage:{ getItem:() => JSON.stringify([template]), setItem() {} }, defaultPushPath:() => "event.history",
  push:async () => {}, changed() {}, createId:() => "template:minimal", ...noOpTransfer,
  schemas:() => [{ id:"schema:checkout", name:"Checkout", version:2 }],
  validateDraft:(draft) => { minimalValidated = draft; return { message:"Library draft validation: Valid · Checkout v2." }; },
});
minimalController.mount(); minimalController.beginDraft("template:1");
const ownedSchemaSelector = minimalNodes.get("#library-draft-schema-selector");
const ownedRefreshValidation = minimalNodes.get("#refresh-library-draft-validation");
assert.ok(ownedSchemaSelector && ownedRefreshValidation, "Event Library creates validation controls from only its base validation host");
assert.deepEqual(ownedSchemaSelector.children.map(({ value }) => value), ["", "schema:checkout"]);
ownedSchemaSelector.value = "schema:checkout"; ownedSchemaSelector.dispatch("change");
assert.equal(minimalController.state().editor.template.schemaId, "schema:checkout",
  "controller-owned selection attaches the schema to the real editor draft");
ownedRefreshValidation.click(); assert.deepEqual(minimalValidated,
  { schemaId:"schema:checkout", sourceId:"history", eventName:"page_view", payload:{ page:"/" } });
minimalController.dispose();
assert.equal(minimalNodes.has("#library-draft-schema-selector"), false);
assert.equal(minimalNodes.has("#refresh-library-draft-validation"), false,
  "Event Library removes its created validation controls during symmetric disposal");
const selectors = ["#event-template-search", "#event-template-empty-state", "#event-template-empty-recovery",
  "#library-draft-schema-selector", "#refresh-library-draft-validation", "#export-event-library",
  "#import-event-library", "#event-library-file", "#event-library-transfer-result", "#clear-event-library",
  "#event-library-delete-review", "#event-library-delete-review-heading", "#event-library-delete-review-summary",
  "#confirm-event-library-delete", "#cancel-event-library-delete", "#event-library-import-review",
  "#event-library-import-review-heading", "#event-library-import-review-summary", "#replace-event-library",
  "#append-event-library", "#cancel-event-library-import"];
const elements = new Map(selectors.map((selector) => [selector, element()]));
for (const node of elements.values()) node.ownerDocument = minimalDocument;
const transferCalls = [];
const transferController = createEventLibraryInstalledController({
  root:{ querySelector:(selector) => elements.get(selector) ?? null }, storage:{ getItem:() => null, setItem() {} },
  defaultPushPath:() => "event.history", push:async () => {}, changed() {}, createId:() => "template:transfer",
  downloadExport:(exported) => transferCalls.push(`export:${JSON.stringify(exported).includes("event-library")}`),
  readImportFile:async () => JSON.stringify({ format:"my-chrome-utilities.event-library", version:1, templates:[template] }),
  schemas:() => [{ id:"schema:checkout", name:"Checkout", version:2 }],
  validateDraft:(draft) => { transferCalls.push(`validate:${draft.schemaId}:${draft.eventName}:${draft.payload.page}`);
    return { message:"Library draft validation: Valid · Checkout v2." }; }, backToCapturedEvent:() => transferCalls.push("live"),
  pushTarget:() => undefined, checkPushPath:async () => ({ success:true, message:"ready" }),
});
transferController.mount(); transferController.store(template); transferController.beginDraft("template:1");
elements.get("#library-draft-schema-selector").value = "schema:checkout";
elements.get("#refresh-library-draft-validation").click(); elements.get("#export-event-library").click();
elements.get("#import-event-library").click(); await new Promise((resolve) => setTimeout(resolve, 0));
assert.deepEqual(transferCalls, ["validate:schema:checkout:page_view:/", "export:true"],
  "draft validation crosses the port with the real edited event payload");
assert.ok(transferController.state().pendingImport, "file selection opens controller-owned import review");
elements.get("#append-event-library").click(); assert.equal(transferController.templates().length, 2);
elements.get("#event-template-search").value = "missing"; elements.get("#event-template-search").dispatch("input");
assert.equal(elements.get("#event-template-empty-state").hidden, false);
elements.get("#event-template-empty-recovery").click(); assert.equal(elements.get("#event-template-search").value, "");
elements.get("#clear-event-library").click(); assert.equal(elements.get("#event-library-delete-review").open, true);
elements.get("#event-library-delete-review").dispatch("cancel"); assert.equal(transferController.state().pendingDeletion, undefined);
transferController.requestDelete(); transferController.confirmDelete(); elements.get("#event-template-empty-recovery").click();
assert.equal(transferCalls.at(-1), "live", "empty Library recovery returns through the explicit Live port");
transferController.dispose();
assert.equal([...elements.values()].reduce((count, item) => count + item.listenerCount(), 0), 0,
  "Event Library removes transfer and review listeners on disposal");

const editorSelectors = ["#event-template-name", "#event-template-event-name", "#event-template-source",
  "#event-template-json", "#push-destination-path", "#save-template-revision", "#save-template-copy",
  "#push-template-draft", "#discard-template-draft", "#close-template-editor", "#back-to-captured-event",
  "#event-template-rename", "#event-template-rename-heading", "#event-template-rename-name",
  "#event-template-rename-event-name", "#event-template-rename-name-error", "#event-template-rename-event-name-error",
  "#save-template-names", "#cancel-template-rename", "#event-template-rename-review",
  "#event-template-rename-review-heading", "#event-template-rename-review-summary", "#confirm-template-rename",
  "#cancel-template-rename-review", "#push-draft-review", "#push-draft-review-heading", "#push-draft-review-summary",
  "#confirm-push-draft", "#cancel-push-draft", "#revision-change-review", "#revision-change-review-heading",
  "#confirm-revision-change", "#cancel-revision-change", "#close-template-editor-confirmation",
  "#close-template-editor-summary", "#keep-editing-template", "#save-and-close-template", "#discard-and-close-template"];
const editorElements = new Map(editorSelectors.map((selector) => [selector, element()]));
let editorPush, returned = 0;
const editorController = createEventLibraryInstalledController({
  root:{ querySelector:(selector) => editorElements.get(selector) ?? null },
  storage:{ getItem:() => JSON.stringify([template]), setItem() {} }, defaultPushPath:() => "event.history",
  push:async (draft) => { editorPush = draft.name; }, changed() {}, createId:() => "template:copy", ...noOpTransfer,
  backToCapturedEvent:() => { returned += 1; },
});
editorController.mount(); editorController.beginNew();
editorElements.get("#event-template-source").value = "gtm";
editorElements.get("#event-template-source").selectedOptions = [{ textContent:"Google Tag Manager" }];
editorElements.get("#event-template-source").dispatch("input");
assert.equal(editorController.state().editor.template.sourceId, "gtm");
assert.equal(editorController.state().editor.template.sourceName, "Google Tag Manager",
  "Event Library source input updates the new draft through the exact installed event type");
editorController.beginDraft("template:1"); await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(editorController.state().pushPathReadiness.status, "ready", "Event Library owns selected-page push readiness");
assert.equal(editorElements.get("#push-template-draft").disabled, false);
editorElements.get("#event-template-name").value = "Checkout"; editorElements.get("#event-template-name").dispatch("input");
editorElements.get("#push-destination-path").value = "checkout.events";
editorElements.get("#push-destination-path").dispatch("input");
editorElements.get("#save-template-revision").click();
assert.equal(editorElements.get("#revision-change-review").open, true);
editorElements.get("#cancel-revision-change").click();
assert.equal(editorController.templates()[0].name, "Page view", "revision cancellation leaves the saved template untouched");
editorElements.get("#save-template-revision").click(); editorElements.get("#confirm-revision-change").click();
assert.equal(editorController.templates()[0].name, "Checkout");
editorElements.get("#push-template-draft").click(); assert.equal(editorElements.get("#push-draft-review").open, true);
editorElements.get("#cancel-push-draft").click(); assert.equal(editorPush, undefined, "push cancellation performs no side effect");
editorElements.get("#push-template-draft").click(); editorElements.get("#confirm-push-draft").click();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(editorPush, "Checkout");
editorElements.get("#back-to-captured-event").click(); assert.equal(returned, 1);
editorController.beginRename("template:1");
assert.equal(editorElements.get("#event-template-rename").open, true);
editorElements.get("#event-template-rename-name").value = ""; editorElements.get("#event-template-rename-name").dispatch("input");
assert.equal(editorElements.get("#save-template-names").disabled, true, "rename validation remains controller-owned");
editorElements.get("#event-template-rename-name").value = "Checkout complete";
editorElements.get("#event-template-rename-name").dispatch("input");
editorElements.get("#event-template-rename-event-name").value = "checkout_complete";
editorElements.get("#event-template-rename-event-name").dispatch("input");
editorElements.get("#save-template-names").click();
assert.equal(editorElements.get("#event-template-rename-review").open, true, "event-name changes require a second review");
editorElements.get("#event-template-rename-review").dispatch("cancel");
assert.equal(editorElements.get("#event-template-rename").open, true, "review cancellation returns to the editable rename dialog");
editorElements.get("#save-template-names").click(); editorElements.get("#confirm-template-rename").click();
assert.equal(editorController.templates()[0].name, "Checkout complete");
assert.equal(editorController.templates()[0].eventName, "checkout_complete");
editorElements.get("#event-template-name").value = "Unsaved rename"; editorElements.get("#event-template-name").dispatch("input");
editorElements.get("#close-template-editor").click();
assert.equal(editorElements.get("#close-template-editor-confirmation").hidden, false, "dirty close opens its controller-owned decision state");
editorElements.get("#keep-editing-template").click(); assert.equal(editorController.state().editor.template.name, "Unsaved rename");
editorElements.get("#close-template-editor").click(); editorElements.get("#discard-and-close-template").click();
assert.equal(editorController.state().editor, undefined, "discard closes without persisting dirty state");
editorController.dispose();
assert.equal([...editorElements.values()].reduce((count, item) => count + item.listenerCount(), 0), 0,
  "Event Library removes template-editor listeners on disposal");

const readinessElements = new Map(["#push-destination-path", "#push-template-draft", "#push-template-draft-reason"]
  .map((selector) => [selector, element()]));
const readinessSettlements = [];
const readinessController = createEventLibraryInstalledController({
  root:{ querySelector:(selector) => readinessElements.get(selector) ?? null }, storage:{ getItem:() => JSON.stringify([template]), setItem() {} },
  defaultPushPath:() => "event.history", push:async () => {}, changed() {}, createId:() => "template:readiness", ...noOpTransfer,
  checkPushPath:() => new Promise((resolve) => readinessSettlements.push(resolve)),
});
readinessController.mount(); readinessController.beginDraft("template:1");
readinessElements.get("#push-destination-path").value = "checkout.events"; readinessElements.get("#push-destination-path").dispatch("input");
readinessSettlements[0]({ success:true, message:"stale ready" }); await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(readinessController.state().pushPathReadiness.status, "checking", "stale path readiness cannot replace the latest request");
readinessSettlements[1]({ success:false, message:"blocked current path" }); await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(readinessController.state().pushPathReadiness.message, "blocked current path");
readinessElements.get("#push-destination-path").value = "disposed.events"; readinessElements.get("#push-destination-path").dispatch("input");
readinessController.dispose(); readinessSettlements[2]({ success:true, message:"disposed ready" }); await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(readinessController.state().pushPathReadiness, undefined, "disposed readiness settlement cannot repopulate controller state");
assert.equal(readinessElements.get("#push-template-draft").disabled, true, "disposed readiness cannot re-enable its former action");
assert.notEqual(readinessElements.get("#push-template-draft-reason").textContent, "disposed ready",
  "disposed readiness cannot repaint its former status surface");
assert.equal([...readinessElements.values()].reduce((count, item) => count + item.listenerCount(), 0), 0);

let inspectorActivate, inspectorDisposed = 0, libraryOpened = 0, announced = "", reviewedTemplate;
const ownershipController = createEventLibraryInstalledController({
  root:{ querySelector:() => null }, storage:{ getItem:() => JSON.stringify([{ ...template, originatingEventId:"capture:1" }]), setItem() {} },
  defaultPushPath:() => "event.history", push:async () => {}, changed() {}, createId:() => "template:owned", ...noOpTransfer,
  appendInspectorAction:(label, activate) => { assert.equal(label, "Open in Library"); inspectorActivate = activate; return () => { inspectorDisposed += 1; }; },
  openLibrary:() => { libraryOpened += 1; }, announce:(message) => { announced = message; },
  createTestCase:(value) => { reviewedTemplate = value; },
});
ownershipController.mount();
ownershipController.appendOpenInLibraryAction("capture:1", "Page view");
assert.match(announced, /Open in Library is available/); inspectorActivate();
assert.equal(libraryOpened, 1); assert.equal(ownershipController.state().editor.template.id, "template:1");
await ownershipController.reviewEventTemplateTestCaseCreation(template);
assert.equal(reviewedTemplate.id, "template:1"); assert.notEqual(reviewedTemplate, template, "review receives a controller-owned snapshot");
ownershipController.appendOpenInLibraryAction("capture:1", "Page view");
assert.equal(inspectorDisposed, 1, "replacing the inspector action disposes the prior action");
ownershipController.dispose(); inspectorActivate();
assert.equal(inspectorDisposed, 2); assert.equal(libraryOpened, 1, "disposed inspector actions cannot reopen Library UI");
