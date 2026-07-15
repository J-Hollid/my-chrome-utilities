import assert from "node:assert/strict";
import { copyStoredDefectForJira } from "../dist/data-layer-defect-library-copy.js";
import {
  createMissingEventDefect,
  createOccurrenceDefect,
  createValidationDefect,
} from "../dist/data-layer-defect-library.js";

const now = "2026-07-15T12:00:00Z";
const validationReport = {
  summary:"purchase has invalid currency",
  description:"Use the current stored description",
  expectedExplanation:"Use EUR",
  editable:["summary", "description", "expectedExplanation"],
  event:{ id:"event:1", name:"purchase", source:"Event history", pageUrl:"https://shop.example/checkout", pathname:"/checkout", captureTime:now, payload:{ currency:"GBP" }, schema:{ name:"Checkout", version:1 }, issues:[] },
  issues:[],
  actual:{ payload:{ currency:"GBP" }, differences:[] },
  expected:{ payload:{ currency:"EUR" }, corrections:[], explanations:[] },
  evidence:{ schema:"Checkout", validation:[], capture:{ eventName:"purchase", source:"Event history", pageUrl:"https://shop.example/checkout", captureTime:now } },
  reproductionSteps:[],
  timeline:[],
};
const issue = {
  sourceId:"event-history", eventName:"purchase", schemaId:"schema:checkout",
  validationTarget:"payload", concretePath:"/currency", ruleId:"rule:currency", ruleRevision:1,
};
const validation = createValidationDefect({ id:"validation", now, report:validationReport, issues:[issue] });

const richWrites = [];
assert.deepEqual(await copyStoredDefectForJira(validation, {
  writeRich:async (html, text) => richWrites.push({ html, text }),
  writeText:async () => assert.fail("plain fallback should not run"),
}), { status:"success", feedback:"Report copied for Jira Cloud with rich formatting." });
assert.match(richWrites[0].html, /Use the current stored description/);
assert.match(richWrites[0].text, /Use the current stored description/);

const plainWrites = [];
assert.deepEqual(await copyStoredDefectForJira(validation, {
  writeRich:async () => { throw new Error("rich clipboard rejected"); },
  writeText:async (text) => plainWrites.push(text),
}), { status:"warning", feedback:"Report copied as plain text; rich formatting was not copied." });
assert.match(plainWrites[0], /Use the current stored description/);

assert.deepEqual(await copyStoredDefectForJira(validation, {}), {
  status:"failure", feedback:"Copy failed. The saved defect is unchanged.",
});

const missing = createMissingEventDefect({
  id:"missing", now,
  report:{ type:"Missing event", summary:"Missing purchase", description:"purchase was absent", actual:"No purchase", absenceEvidence:"No matching event", expected:"purchase", expectedPayload:{ currency:"EUR" }, expectedResponseSources:{}, expectedResponseProvenance:{}, expectedExplanation:"purchase should fire", schema:{ id:"schema:checkout", name:"Checkout", version:1, rules:[], documentation:{} }, expectation:{ sourceId:"event-history", eventName:"purchase", target:"payload", pageUrl:"https://shop.example/checkout", explanation:"purchase should fire" }, scope:{ id:"visit:1", pageUrl:"https://shop.example/checkout", pathname:"/checkout", startedAt:now, endedAt:now }, validationIssues:[], matchingEventEvidence:[], reproductionSteps:[], reproductionStartVisitId:"visit:1", reproductionEndpointVisitId:"visit:1", timeline:[] },
});
const occurrence = createOccurrenceDefect({
  id:"occurrence", now,
  report:{ type:"Unexpected event", mode:"Unexpected event", summary:"Unexpected purchase", description:"purchase was unexpected", expectedExplanation:"purchase should not fire", actual:{ id:"event:1", sourceId:"event-history", eventName:"purchase", target:"payload", pathname:"/checkout", payload:{ currency:"GBP" }, validation:"Failed", captureTime:now, pageUrl:"https://shop.example/checkout", visitId:"visit:1" }, completionState:"ready with optional editing", matchingEventIds:[], confirmed:true, override:false, warningAcknowledged:false, reproductionSteps:[], timeline:[], payloadCorrections:[], occurrenceEvidence:{ sourceId:"event-history", validation:"Failed", captureTime:now, pageUrl:"https://shop.example/checkout", visitId:"visit:1", pathname:"/checkout" } },
});
const wrongName = createOccurrenceDefect({
  id:"wrong-name", now,
  report:{ ...occurrence.report, type:"Wrong event name", mode:"Wrong event name", summary:"Wrong event name", expectedExplanation:"checkout should fire", expectedIdentity:{ sourceId:"event-history", eventName:"checkout", target:"payload", pathname:"/checkout" }, expectedPayload:{ currency:"EUR" } },
});
for (const defect of [missing, occurrence, wrongName]) {
  const writes = [];
  const result = await copyStoredDefectForJira(defect, { writeRich:async (html, text) => writes.push({ html, text }) });
  assert.equal(result.status, "success");
  assert.equal(writes.length, 1);
  assert.ok(writes[0].html.length > 0 && writes[0].text.length > 0);
}

console.log("data-layer defect library copy tests passed");
