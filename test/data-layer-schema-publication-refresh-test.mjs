import assert from "node:assert/strict";

import {
  revalidateCurrentLiveSession,
} from "../dist/data-layer-schema-publication-refresh.js";
import {
  buildValidationPropertyTree,
  presentValidationPropertyTree,
} from "../dist/data-layer-live-validation-presentation.js";

const required = (version, severity = "error") => ({
  id:"required-page-type", name:"Required page type", version,
  propertyPath:"/page_type", operator:"required", severity,
});
const assignment = (versionPolicy = "follow latest") => ({
  id:"product-listing", sourceId:"history", eventName:"page_view", target:"payload",
  versionPolicy, priority:10, enabled:true,
});
const revision3 = {
  id:"product-listing", name:"Product listing", version:3, published:true,
  document:{ type:"object", properties:{ page_type:{ type:"string" } } },
  assignments:[assignment("follow latest")], attachedRules:[],
};
const revision4 = {
  ...revision3,
  version:4,
  attachedRules:[required(4)],
  revisionHistory:[revision3],
};
const checkout = {
  id:"checkout", name:"Checkout", version:7, published:true,
  document:{ type:"object", properties:{ order_id:{ type:"string" } } },
  assignments:[], attachedRules:[{ ...required(7), id:"checkout-order", name:"Checkout order", propertyPath:"/order_id" }],
};
const events = [
  { id:"visible", name:"page_view", sourceId:"history", captureTime:"2026-07-14T12:00:00Z", pageUrl:"https://shop.example/products", payload:{}, rawInput:["page_view"], captureOrder:1, validation:"Valid", validationDetails:{ schema:{ id:"product-listing", name:"Product listing", version:3 }, issues:[], evaluations:[] } },
  { id:"query-hidden", name:"page_view", sourceId:"history", captureTime:"2026-07-14T12:00:01Z", pageUrl:"https://shop.example/products/2", payload:{ page_type:"listing" }, rawInput:["page_view", { page_type:"listing" }], captureOrder:2, validation:"Valid", validationDetails:{ schema:{ id:"product-listing", name:"Product listing", version:3 }, issues:[], evaluations:[] } },
  { id:"manual", name:"page_view", sourceId:"history", captureTime:"2026-07-14T12:00:02Z", pageUrl:"https://shop.example/checkout", payload:{}, rawInput:["page_view"], captureOrder:3, validation:"Valid", validationDetails:{ schema:{ id:"product-listing", name:"Product listing", version:3 }, issues:[], evaluations:[] } },
];
const state = {
  status:"Live", view:"Live", listVisible:true, inspectorEventId:"visible", inspectorLayout:"split",
  pageUrl:"https://shop.example/products", sources:[], events,
  query:{ conditions:[{ id:"errors", field:"Validation state", operator:"is", values:["Issues"] }] },
};
const original = structuredClone(state);
const refresh = revalidateCurrentLiveSession(state, [revision4, checkout], { manual:"checkout" });

assert.deepEqual(refresh.revalidatedEventIds, ["visible", "query-hidden", "manual"]);
assert.equal(refresh.state.events.length, 3);
assert.deepEqual(refresh.state.events.map(({ id, payload, rawInput, captureTime, pageUrl, captureOrder }) => ({ id, payload, rawInput, captureTime, pageUrl, captureOrder })), events.map(({ id, payload, rawInput, captureTime, pageUrl, captureOrder }) => ({ id, payload, rawInput, captureTime, pageUrl, captureOrder })));
assert.deepEqual(refresh.state.query, state.query, "publication refresh changed the active feed query");
assert.equal(refresh.state.inspectorEventId, "visible");
assert.equal(refresh.state.events[0].validation, "1 issues");
assert.equal(refresh.state.events[0].validationDetails.schema.version, 4);
assert.deepEqual(refresh.state.events[0].validationDetails.evaluations.map(({ ruleVersion }) => ruleVersion), [4]);
assert.equal(refresh.state.events[1].validation, "Valid", "query-hidden event was not refreshed");
assert.equal(refresh.state.events[1].validationDetails.schema.version, 4);
assert.equal(refresh.state.events[2].validationDetails.schema.name, "Checkout");
assert.equal(refresh.state.events[2].validationDetails.schema.version, 7);
assert.equal(refresh.state.events[2].validationDetails.evaluations[0].rule, "Checkout order");
assert.deepEqual(state, original, "publication refresh mutated captured state");

const pinned = revalidateCurrentLiveSession({ ...state, events:[events[0]] }, [{ ...revision4, assignments:[{ ...assignment("pinned"), schemaVersion:3 }] }], {});
assert.equal(pinned.state.events[0].validationDetails.schema.version, 3);
assert.equal(pinned.state.events[0].validation, "Valid");

const notApplicable = { propertyPath:"test", status:"not-applicable", message:"Optional target absent", expected:"known", actual:"missing", rule:"Allowed values", ruleVersion:2, severity:"error", schemaName:"Page view", schemaVersion:4 };
const requiredFailure = { ...notApplicable, propertyPath:"required", status:"error", message:"Required value", rule:"Required", actual:"missing" };
const observedSkipped = { ...notApplicable, propertyPath:"observed", message:"Condition did not match", rule:"Conditional" };
const trees = buildValidationPropertyTree({ observed:"value", nullable:null }, [notApplicable, requiredFailure, observedSkipped, { ...notApplicable, propertyPath:"nullable", status:"error", actual:"null" }], []);
const hidden = presentValidationPropertyTree(trees, false);
assert.equal(hidden.some(({ path }) => path === "test"), false);
assert.equal(hidden.some(({ path }) => path === "required"), true);
assert.equal(hidden.find(({ path }) => path === "required").summary.treatment, "error");
assert.equal(hidden.find(({ path }) => path === "observed").summary.status, "No applicable rules");
assert.deepEqual(hidden.find(({ path }) => path === "observed").evaluations, []);
assert.equal(hidden.find(({ path }) => path === "nullable").summary.treatment, "error");

const shown = presentValidationPropertyTree(trees, true);
const optional = shown.find(({ path }) => path === "test");
assert.equal(optional.missing, true);
assert.equal(optional.valueLabel, "Missing");
assert.equal(optional.summary.treatment, "neutral");
assert.equal(optional.evaluations[0].status, "not-applicable");
assert.equal(shown.find(({ path }) => path === "observed").summary.treatment, "neutral");

const nested = buildValidationPropertyTree({ sibling:"kept" }, [
  { ...notApplicable, propertyPath:"optional.branch.value" },
  { ...requiredFailure, propertyPath:"required.branch.value" },
], []);
const nestedHidden = presentValidationPropertyTree(nested, false);
assert.equal(nestedHidden.some(({ path }) => path === "optional"), false);
assert.equal(nestedHidden.some(({ path }) => path === "required"), true);
assert.equal(nestedHidden.some(({ path }) => path === "sibling"), true);

console.log("schema publication refresh tests passed");
