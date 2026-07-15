import assert from "node:assert/strict";

import {
  applyExpectedResult,
  createDefectReport,
  generateReportDetails,
  renderJiraReport,
  toggleReportIssue,
} from "../dist/data-layer-defect-report.js";
import { defectCapturedEvent } from "../dist/data-layer-defect-report-ui.js";

function undeclaredEvent(payload, issues) {
  return {
    id:"pageview-1", name:"pageview", source:"dataLayer", pageUrl:"https://shop.test/product",
    pathname:"/product", captureTime:"2026-07-15T10:00:00Z", payload,
    schema:{ name:"Generic pageview", version:4 },
    issues:issues.map(([id, pointer]) => ({
      id, severity:"error", pointer, violation:"Undeclared property", constraint:"declared property",
      actual:true, rule:"declared-property policy", ruleVersion:4,
    })),
  };
}

const sourcePayload = { page_type:"product_detail", debug:{ trace:true }, commerce:{ currency:"EUR", internal:true } };
const report = createDefectReport(undeclaredEvent(sourcePayload, [["debug", "/debug"], ["internal", "/commerce/internal"]]));
assert.deepEqual(report.expected.payload, { page_type:"product_detail", commerce:{ currency:"EUR" } });
assert.deepEqual(report.expected.corrections.map(({ issueId, pointer, operation }) => ({ issueId, pointer, operation })), [
  { issueId:"debug", pointer:"/debug", operation:"remove" },
  { issueId:"internal", pointer:"/commerce/internal", operation:"remove" },
]);
assert.deepEqual(sourcePayload, { page_type:"product_detail", debug:{ trace:true }, commerce:{ currency:"EUR", internal:true } });

const deselected = applyExpectedResult(toggleReportIssue(report, "debug"), []);
assert.deepEqual(deselected.expected.payload, { page_type:"product_detail", debug:{ trace:true }, commerce:{ currency:"EUR" } });
assert.deepEqual(deselected.expected.corrections.map(({ pointer }) => pointer), ["/commerce/internal"]);
const reselected = applyExpectedResult(toggleReportIssue(deselected, "debug"), []);
assert.deepEqual(reselected.expected.payload, { page_type:"product_detail", commerce:{ currency:"EUR" } });
assert.equal(reselected.expected.corrections.filter(({ pointer }) => pointer === "/debug").length, 1);

for (const [pointer, payload, expected] of [
  ["/debug", { page_type:"product", debug:{ trace:true } }, { page_type:"product" }],
  ["/commerce/debug", { commerce:{ currency:"EUR", debug:true } }, { commerce:{ currency:"EUR" } }],
  ["/products/0/debug", { products:[{ id:1, debug:true }, { id:2 }] }, { products:[{ id:1 }, { id:2 }] }],
  ["/a~1b", { "a/b":true, page_type:"product" }, { page_type:"product" }],
  ["/tilde~0name", { "tilde~name":true, page_type:"product" }, { page_type:"product" }],
]) {
  const corrected = createDefectReport(undeclaredEvent(payload, [["extra", pointer]]));
  assert.deepEqual(corrected.expected.payload, expected, pointer);
  assert.deepEqual(corrected.expected.corrections.map(({ pointer, operation }) => ({ pointer, operation })), [{ pointer, operation:"remove" }]);
}

const overlap = createDefectReport(undeclaredEvent(
  { page_type:"product", debug:{ trace:true } },
  [["debug", "/debug"], ["trace", "/debug/trace"]],
));
assert.deepEqual(overlap.expected.payload, { page_type:"product" });
assert.deepEqual(overlap.expected.corrections.map(({ issueId, pointer }) => ({ issueId, pointer })), [
  { issueId:"debug", pointer:"/debug" }, { issueId:"trace", pointer:"/debug/trace" },
]);

const replacement = applyExpectedResult(report, [{
  issueId:"internal", method:"enter a valid response", response:"replacement", responseSource:"operator custom override",
}]);
assert.equal(replacement.expected.corrections.filter(({ issueId }) => issueId === "internal").length, 1);

const rendered = renderJiraReport(generateReportDetails(report));
assert.deepEqual(JSON.parse(rendered.actualJson), sourcePayload);
assert.deepEqual(JSON.parse(rendered.expectedJson), { page_type:"product_detail", commerce:{ currency:"EUR" } });
assert.match(rendered.text, /\/debug was removed from the expected payload/);
assert.match(rendered.html, /\/debug[\s\S]*removed from the expected payload/);
assert.doesNotMatch(rendered.expectedJson, /debug|null/);

const converted = defectCapturedEvent({
  id:"pageview-2", name:"pageview", sourceId:"dataLayer", captureTime:"2026-07-15T10:01:00Z",
  payload:{ page_type:"product_detail", debug:true },
  validationDetails:{
    schema:{ id:"pageview", name:"Generic pageview", version:4 }, evaluations:[],
    issues:[{ instancePath:"/debug", message:"Undeclared property", expected:"declared property", actual:"boolean", severity:"error", schemaLocation:"#/additionalProperties" }],
  },
});
assert.equal(converted.issues[0].violation, "Undeclared property");
assert.deepEqual(createDefectReport(converted).expected.payload, { page_type:"product_detail" });

console.log("data-layer defect report undeclared property removal tests passed");
