import assert from "node:assert/strict";

import {
  confirmOccurrenceExpectation,
  createOccurrenceDefectDraft,
  createOccurrenceReport,
  editOccurrenceExpectedPayload,
  initializeOccurrenceExpectedPayload,
  occurrenceDefectIdentity,
  occurrenceIdentityMatches,
  renderOccurrenceReport,
  selectOccurrenceExpectedIdentity,
} from "../dist/data-layer-event-occurrence-defect-report.js";
import {
  addDefect,
  createDefectLibrary,
  createOccurrenceDefect,
  eventMatchesOccurrenceDefect,
  matchingOccurrenceDefects,
  restoreDefectLibrary,
  serializeDefectLibrary,
} from "../dist/data-layer-defect-library.js";

const actual = {
  id:"event:page-view",
  sourceId:"event-history",
  sourceName:"Event history",
  eventName:"page_view",
  target:"payload",
  payload:{ page_type:"product_detail", product_id:"robot-1" },
  validation:"Valid",
  schema:{ id:"schema:page-view", name:"Page view", version:4 },
  captureTime:"2026-07-15T07:31:00Z",
  pageUrl:"https://shop.example/products",
  visitId:"visit:products:2",
  pathname:"/products",
  pageLoadGeneration:"generation:2",
};
const pageViewAssignment = { id:"assignment:page-view", name:"Product page views", sourceId:"event-history", eventName:"page_view", target:"payload", pathname:"/products", schemaId:"schema:page-view" };
const productViewAssignment = { id:"assignment:product-view", name:"Product views", sourceId:"event-history", eventName:"product_view", target:"payload", pathname:"/products", schemaId:"schema:product-view" };
const compatibleSchema = {
  id:"schema:product-view", name:"Product view", version:3,
  document:{ type:"object", required:["page_type","product_id"], properties:{ page_type:{type:"string"}, product_id:{type:"string"} } },
};

let unexpected = createOccurrenceDefectDraft(actual, "Unexpected event", {
  assignments:[pageViewAssignment, productViewAssignment], schemas:[compatibleSchema], visitEvents:[actual],
});
assert.equal(unexpected.mode, "Unexpected event");
assert.equal(unexpected.guardrail, "explicit override required");
assert.throws(() => confirmOccurrenceExpectation(unexpected), /override/i);
unexpected = confirmOccurrenceExpectation(unexpected, { override:true });
const unexpectedReport = createOccurrenceReport(unexpected);
assert.equal(unexpectedReport.type, "Unexpected event");
assert.equal(unexpectedReport.expectedPayload, undefined);
assert.deepEqual(unexpectedReport.payloadCorrections, []);
assert.equal(unexpectedReport.actual.payload.page_type, "product_detail");
const unexpectedRendered = renderOccurrenceReport(unexpectedReport);
assert.match(unexpectedRendered.text, /Captured page_view/);
assert.match(unexpectedRendered.text, /Validation state: Valid/);
assert.match(unexpectedRendered.text, /no page_view event is fired during \/products/);
assert.match(unexpectedRendered.text, /page_view was an unexpected occurrence/);
assert.doesNotMatch(unexpectedRendered.text, /validation failure|corrected property/i);

let wrongName = createOccurrenceDefectDraft(actual, "Wrong event name", {
  assignments:[productViewAssignment], schemas:[compatibleSchema], visitEvents:[actual],
});
assert.equal(wrongName.expectedIdentity.eventName, "product_view");
assert.deepEqual(wrongName.expectedPayload, actual.payload);
assert.equal(wrongName.payloadState, "typed captured payload reused");
assert.equal(wrongName.completionState, "ready with optional editing");
wrongName = confirmOccurrenceExpectation(wrongName);
const wrongReport = createOccurrenceReport(wrongName);
assert.equal(wrongReport.type, "Wrong event name");
assert.deepEqual(wrongReport.expectedPayload, actual.payload);
assert.notEqual(wrongReport.expectedPayload, actual.payload);
const wrongRendered = renderOccurrenceReport(wrongReport);
assert.match(wrongRendered.text, /Captured page_view/);
assert.match(wrongRendered.text, /product_view/);
assert.match(wrongRendered.text, /page_view was fired and product_view should have been fired instead/);
assert.deepEqual(wrongReport.payloadCorrections, []);

const incompatibleSchema = {
  id:"schema:product-view-v2", name:"Product view v2", version:2,
  document:{ type:"object", required:["page_type","product","items"], properties:{
    page_type:{type:"string"}, product:{type:"object",required:["id","name"],properties:{id:{type:"number"},name:{type:"string"}}},
    items:{type:"array",items:{type:"object",required:["sku"],properties:{sku:{type:"string"}}}},
  } },
};
const initialized = initializeOccurrenceExpectedPayload(actual.payload, incompatibleSchema);
assert.deepEqual(initialized.payload, { page_type:"product_detail", product:{}, items:[] });
assert.equal(initialized.payloadState, "compatible captured fields prefilled");
assert.equal(initialized.completionState, "blocked on invalid and missing expected fields");
let incompatibleDraft = selectOccurrenceExpectedIdentity(
  createOccurrenceDefectDraft(actual, "Wrong event name", { assignments:[], schemas:[incompatibleSchema], visitEvents:[actual] }),
  { sourceId:"custom", eventName:"product_view", target:"payload", pathname:"/products", schemaId:incompatibleSchema.id },
);
assert.equal(incompatibleDraft.completionState, "blocked on invalid and missing expected fields");
incompatibleDraft = editOccurrenceExpectedPayload(incompatibleDraft, { page_type:"product_detail", product:{ id:1, name:"Robot" }, items:[{ sku:"robot-1" }] });
assert.equal(incompatibleDraft.completionState, "ready with optional editing");
assert.equal(confirmOccurrenceExpectation(incompatibleDraft).confirmed, true);

const customIdentity = { sourceId:"custom", eventName:"product_view", target:"payload", pathname:"/products" };
wrongName = selectOccurrenceExpectedIdentity(
  createOccurrenceDefectDraft(actual, "Wrong event name", { assignments:[], schemas:[], visitEvents:[actual] }),
  customIdentity,
);
assert.equal(wrongName.guardrail, "warning acknowledgement and confirmation required");
assert.throws(() => confirmOccurrenceExpectation(wrongName), /acknowledge/i);
assert.equal(confirmOccurrenceExpectation(wrongName, { acknowledgeWarning:true }).confirmed, true);
assert.throws(() => confirmOccurrenceExpectation(selectOccurrenceExpectedIdentity(wrongName, { ...customIdentity, eventName:"page_view" }), { acknowledgeWarning:true }), /different event name/i);

const identity = occurrenceDefectIdentity(wrongReport);
for (const changed of [
  { payload:{ changed:true } },
  { captureTime:"later" },
  { pageLoadGeneration:"generation:99" },
  { sourceName:"Renamed source" },
]) assert.equal(occurrenceIdentityMatches(identity, occurrenceDefectIdentity({ ...wrongReport, actual:{ ...wrongReport.actual, ...changed } })), true);
for (const changed of [
  { sourceId:"other" },
  { eventName:"other" },
  { target:"raw input" },
  { pathname:"/checkout" },
]) assert.equal(occurrenceIdentityMatches(identity, occurrenceDefectIdentity({ ...wrongReport, actual:{ ...wrongReport.actual, ...changed } })), false);
assert.equal(occurrenceIdentityMatches(identity, occurrenceDefectIdentity({ ...wrongReport, mode:"Unexpected event", type:"Unexpected event" })), false);
assert.equal(occurrenceIdentityMatches(identity, occurrenceDefectIdentity({ ...wrongReport, expectedIdentity:{ ...wrongReport.expectedIdentity, eventName:"other" } })), false);

const defect = createOccurrenceDefect({ id:"defect:occurrence", now:"2026-07-15T07:40:00Z", report:wrongReport });
const added = addDefect(createDefectLibrary(), defect);
assert.equal(added.added, true);
assert.equal(added.defect.type, "Wrong event name");
assert.deepEqual(matchingOccurrenceDefects(identity, added.library).map(({ id }) => id), ["defect:occurrence"]);
assert.equal(addDefect(added.library, createOccurrenceDefect({ id:"defect:duplicate", now:"2026-07-15T07:41:00Z", report:{ ...wrongReport, actual:{ ...wrongReport.actual, payload:{ changed:true }, captureTime:"later" } } })).added, false);
assert.equal(eventMatchesOccurrenceDefect({ sourceId:"event-history", name:"page_view", pageUrl:"https://shop.example/products?reload=1", validationDetails:{ assignment:{ target:"payload" } } }, defect), true);
const restored = restoreDefectLibrary(serializeDefectLibrary(added.library));
assert.deepEqual(restored.defects[0].occurrenceMatch, defect.occurrenceMatch);

assert.deepEqual(actual.payload, { page_type:"product_detail", product_id:"robot-1" });
console.log("data-layer event occurrence defect report tests passed");
