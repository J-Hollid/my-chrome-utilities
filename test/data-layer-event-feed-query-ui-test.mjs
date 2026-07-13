import assert from "node:assert/strict";
import { renderEventFeedQueryBuilder } from "../dist/data-layer-event-feed-query-ui.js";
import { applyQueryCondition, filterEventsByQuery, queryConditionSummary } from "../dist/data-layer-event-feed-query.js";
import { createLiveObserverState, filteredLiveEvents, recordLiveEvent, selectLiveEvent, setLiveQuery } from "../dist/data-layer-live-observer.js";
import { captureInspectorReturn } from "../dist/data-layer-live-inspector-return.js";

class FakeElement {
  constructor(tagName) { this.tagName = tagName.toUpperCase(); this.children = []; this.attributes = new Map(); this.listeners = new Map(); this.hidden = false; this.disabled = false; this.textContent = ""; this.value = ""; this.id = ""; this.dataset = {}; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  addEventListener(name, listener) { this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]); }
  dispatch(name) { for (const listener of this.listeners.get(name) ?? []) listener({ target: this }); }
  focus(options) { this.focusOptions = options; }
  querySelector(selector) { return descendants(this).find((candidate) => selector.startsWith("#") && candidate.id === selector.slice(1)); }
}
globalThis.document = { createElement: (tagName) => new FakeElement(tagName) };

const descendants = (root) => {
  const result = [];
  const visit = (element) => { if (!(element instanceof FakeElement)) return; result.push(element); element.children.forEach(visit); };
  visit(root); return result;
};
const find = (root, predicate) => { const match = descendants(root).find(predicate); assert.ok(match); return match; };

const events = [
  { id: "purchase", name: "purchase", sourceId: "adobe", sourceName: "Adobe beacons", sourceKind: "Adobe", captureTime: "10:00:00", pageUrl: "https://shop.test/checkout", payload: { currency: "EUR" }, validation: "1 issues", validationDetails: { issues: [], evaluations: [{ propertyPath:"page_type", status:"error", rule:"Page type allowed values", severity:"warning", message:"fail", expected:"known", actual:"other", ruleVersion:1, schemaName:"Purchase event", schemaVersion:1 }], schema: { id: "purchase", name: "Purchase event", version: 1 } } },
  { id: "checkout", name: "checkout", sourceId: "history", sourceName: "Event history", sourceKind: "Data layer", captureTime: "10:00:01", pageUrl: "https://shop.test/products", payload: { currency: "GBP" }, validation: "Valid", validationDetails: { issues: [], evaluations: [{ propertyPath:"currency", status:"pass", rule:"Page type allowed values", severity:"error", message:"pass", expected:"known", actual:"known", ruleVersion:1, schemaName:"Checkout event", schemaVersion:1 }] } },
];
const root = new FakeElement("section");
let updated;
const render = (query) => renderEventFeedQueryBuilder(root, events, query, (next) => { updated = next; render(next); });
render({ conditions: [] });
let add = find(root, ({ textContent }) => textContent === "Add filter");
assert.equal(find(root, ({ id }) => id === "live-event-query-count").textContent, "2 of 2 events");
assert.equal(find(root, ({ attributes }) => attributes.get("aria-label") === "Add event feed condition").hidden, true);
add.dispatch("click");
const editor = find(root, ({ attributes }) => attributes.get("aria-label") === "Add event feed condition");
assert.equal(editor.hidden, false);
const field = find(editor, ({ id }) => id === "event-feed-query-field");
const fieldOptions = field.children.map(({ textContent }) => textContent);
assert.deepEqual(field.focusOptions, { preventScroll: true });
const controls = descendants(editor).filter(({ tagName }) => ["SELECT", "INPUT", "BUTTON"].includes(tagName));
assert.deepEqual(controls.map(({ id, textContent }) => id || textContent), ["event-feed-query-field", "event-feed-query-operator", "event-feed-query-value", "Apply condition", "Cancel"]);
const apply = find(editor, ({ textContent }) => textContent === "Apply condition");
assert.equal(apply.disabled, true);
field.value = "Event name"; field.dispatch("change");
const operator = find(editor, ({ id }) => id === "event-feed-query-operator"); operator.value = "is"; operator.dispatch("change");
const operatorOptions = operator.children.map(({ textContent }) => textContent);
const suggestedNames = find(editor, ({ id }) => id === "event-feed-query-suggestions").children.map(({ value }) => value);
const value = find(editor, ({ id }) => id === "event-feed-query-value"); value.value = "purchase"; value.dispatch("input");
assert.equal(apply.disabled, false); apply.dispatch("click");
assert.equal(updated.conditions.length, 1);
const appliedCount = find(root, ({ id }) => id === "live-event-query-count").textContent;
const appliedSummary = find(root, ({ textContent }) => textContent === "Event name is purchase").textContent;
assert.equal(appliedCount, "1 of 2 events");
assert.equal(appliedSummary, "Event name is purchase");
const remove = find(root, ({ attributes }) => attributes.get("aria-label") === "Remove filter Event name is purchase");
const removeName = remove.attributes.get("aria-label");
remove.dispatch("click");
add = find(root, ({ textContent }) => textContent === "Add filter");
assert.deepEqual(add.focusOptions, { preventScroll: true });
assert.equal(updated.conditions.length, 0);

render({ conditions: [{ id: "none", field: "Event name", operator: "is", values: ["missing"] }] });
assert.equal(find(root, ({ id }) => id === "live-event-query-count").textContent, "0 of 2 events");
assert.ok(find(root, ({ textContent }) => textContent === "No events match the active filters."));
assert.equal(descendants(root).some(({ textContent }) => textContent === "No events captured yet"), false);

const matchingCases = [
  ["Event name", "is", "purchase"], ["Source", "is", "Adobe beacons"], ["Adapter kind", "is", "Adobe"], ["Pathname", "is", "/checkout"],
  ["Payload · currency", "is", "EUR"], ["Validation state", "is", "Issues"], ["Schema", "is", "Purchase event"],
  ["Validation rule", "failed", "Page type allowed values"], ["Rule severity", "is", "warning"], ["Affected property", "is", "page_type"],
].map(([field, operator, value], index) => {
  const condition = { id:String(index), field, operator, values:[value] };
  return { field, operator, value, summary:queryConditionSummary(condition), matches:filterEventsByQuery(events, { conditions:[condition] }).map(({ id }) => id) };
});
const multi = applyQueryCondition({ conditions:[] }, { id:"names", field:"Event name", operator:"is", values:["purchase", "checkout"] });
const multiAnd = applyQueryCondition(multi, { id:"issues", field:"Validation state", operator:"is", values:["Issues"] });
const ruleEvents = ["error", "warning", "pass", undefined].map((status, index) => ({ ...events[0], id:["failed", "warned", "passed", "absent"][index], validationDetails:{ ...events[0].validationDetails, evaluations:status ? [{ ...events[0].validationDetails.evaluations[0], status }] : [] } }));
const ruleOutcomes = ["failed", "warned", "passed", "was evaluated", "was not evaluated"].map((operator) => ({ operator, matches:filterEventsByQuery(ruleEvents, { conditions:[{ id:operator, field:"Validation rule", operator, values:["Page type allowed values"] }] }).map(({ id }) => id) }));
let liveState = createLiveObserverState({ pageUrl:"https://shop.test", sources:[] });
liveState = { ...liveState, events };
liveState = setLiveQuery(liveState, { conditions:[{ id:"purchase", field:"Event name", operator:"is", values:["purchase"] }] });
liveState = recordLiveEvent(liveState, { ...events[1], id:"new-nonmatch" });
liveState = recordLiveEvent(liveState, { ...events[0], id:"new-match" });
const selected = selectLiveEvent(liveState, "purchase", "stacked");

process.stdout.write(`${JSON.stringify({ eventFeedQuery: {
  fieldOptions, controlOrder:controls.map(({ id, textContent }) => id || textContent), operatorOptions, suggestedNames,
  incompleteDisabled:true, focusOnOpen:field.focusOptions, appliedCount, appliedSummary, removeName, removeFocus:add.focusOptions,
  zeroCount:"0 of 2 events", zeroMessage:"No events match the active filters.", legacyFilterAbsent:!descendants(root).some(({ id }) => id === "live-validation-filter"),
  matchingCases, ruleOutcomes, multiMatches:filterEventsByQuery(events, multi).map(({ id }) => id), multiAndMatches:filterEventsByQuery(events, multiAnd).map(({ id }) => id),
  liveMatches:filteredLiveEvents(liveState).map(({ id }) => id), preservedQuery:selected.query, returnSnapshot:captureInspectorReturn("purchase", 480),
} })}\n`);
