import assert from "node:assert/strict";
import { generateMissingEventRepresentations } from "../dist/data-layer-missing-event-defect-report.js";

const expectedPayload = {
  page_type:"product_detail",
  products:[{ id:1, name:"robot <&>\nline two" }],
};

const report = {
  type:"Missing event",
  actual:"No matching pageview event was captured",
  absenceEvidence:"No matching pageview event was pushed or observed during the selected /checkout page visit.",
  expected:"At least one pageview event matching Generic pageview revision 4 was expected",
  expectedPayload,
  expectedResponseSources:{
    "/page_type":"schema-provided value",
    "/products/0/id":"operator custom response",
  },
  expectedResponseProvenance:{
    "/page_type":{ id:"page-type", name:"Page type requirement", version:1, propertyPath:"/page_type" },
  },
  summary:"Missing event: pageview",
  description:"Checkout completed without pageview.",
  expectedExplanation:"Generated schema expectation must stay out of Expected result.",
  expectedResultAdditionalText:"Checkout <should> & must emit it\non the next line",
  schema:{ id:"generic-pageview", name:"Generic pageview", version:4, rules:[], documentation:{} },
  expectation:{ sourceId:"data-layer", eventName:"pageview", target:"payload", pageUrl:"https://shop.example/checkout", explanation:"Generated narrative must not duplicate." },
  scope:{ id:"visit:checkout", pageUrl:"https://shop.example/checkout", pathname:"/checkout", startedAt:"2026-07-14T12:00:00Z", endedAt:"2026-07-14T12:01:00Z" },
  validationIssues:[],
  matchingEventEvidence:[],
  reproductionSteps:["Visit /products", "Click Robot", "Visit /checkout", "Expect pageview to be pushed"],
  reproductionStartVisitId:"visit:products",
  reproductionEndpointVisitId:"visit:checkout",
  timeline:[],
};

const generated = generateMissingEventRepresentations(report);
const payloadJson = JSON.stringify(expectedPayload, null, 2);

for (const text of [generated.previewText, generated.jiraText]) {
  assert.equal(text.match(/pageview is fired with/g)?.length, 1);
  assert.equal(text.match(/"page_type": "product_detail"/g)?.length, 1);
  assert.match(text, /Expected result\nCheckout <should> & must emit it\non the next line\npageview is fired with\n\{\n  "page_type"/);
  assert.match(text, /Steps to reproduce\n1\. Visit \/products\n2\. Click Robot\n3\. Visit \/checkout\n4\. Expect pageview to be pushed/);
  assert.doesNotMatch(text, /response source|schema-provided value|operator custom response|Page type requirement|Generated schema expectation|Generated narrative/);
}

assert.equal(generated.previewHtml.match(/<pre/g)?.length, 1);
assert.equal(generated.previewHtml.match(/pageview is fired with/g)?.length, 1);
assert.match(generated.previewHtml, /<h2>Expected result<\/h2><p>Checkout &lt;should&gt; &amp; must emit it<br>on the next line<\/p><p>pageview is fired with<\/p><pre[^>]*>\{/);
assert.match(generated.previewHtml, /<h2>Steps to reproduce<\/h2><ol><li>Visit \/products<\/li><li>Click Robot<\/li><li>Visit \/checkout<\/li><li>Expect pageview to be pushed<\/li><\/ol>/);
assert.doesNotMatch(generated.previewHtml, /<p>[^<]*&quot;page_type&quot;/);
assert.match(generated.previewHtml, /robot &lt;&amp;&gt;\\nline two/);
assert.deepEqual(generated.expectedPayload, expectedPayload);
assert.deepEqual(report.expectedResponseSources, {
  "/page_type":"schema-provided value",
  "/products/0/id":"operator custom response",
});

const emptyAdditional = generateMissingEventRepresentations({ ...report, expectedResultAdditionalText:"  \n  " });
assert.equal(emptyAdditional.previewText.match(/pageview is fired with/g)?.length, 1);
assert.doesNotMatch(emptyAdditional.previewText, /Expected result\n\s*\npageview is fired with/);
assert.equal(emptyAdditional.previewHtml.match(/<h2>Expected result<\/h2><p>/g)?.length, 1);

console.log("data-layer missing-event report representation fidelity tests passed");
