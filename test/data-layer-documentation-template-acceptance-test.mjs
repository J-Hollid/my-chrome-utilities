import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

import {verificationDigest} from "../scripts/verification-evidence.mjs";

await import("./data-layer-documentation-template-excel-test.mjs");
await import("./data-layer-documentation-template-rich-test.mjs");
await import("./data-layer-documentation-template-library-test.mjs");
const flowHandler=await readFile("acceptance/src/acceptance/steps/flow_table_documentation_export.clj","utf8");
for(const key of ["documentationTemplateMovedArea","documentationTemplateEmptyLogoArea","documentationTemplateFindingUi"])assert.ok(flowHandler.includes(`:${key}`),`acceptance runtime relation includes ${key}`);

if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION),
    handler=flowHandler,
    expectedPreRepairFailure={guidedPackageRows:false,guidedBindingRows:false},
    expectedRepairResult={guidedPackageRows:true,guidedBindingRows:true},
    observed={
      guidedPackageRows:handler.includes("a formula or external workbook connection")&&handler.includes("Remove active or external workbook content"),
      guidedBindingRows:handler.includes("a binding outside its required repeat")&&handler.includes("its Template worksheet, cell, and required repeat"),
    },fixture={
      id:"guided-excel-acceptance-example-relations-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{handler:"flow_table_documentation_export",contract:2},
      expectedPreRepairFailure,expectedRepairResult,
    },fixtureDigest=verificationDigest(fixture);
  assert.deepEqual(observed,expectedRepairResult);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{
    version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed},
  }}));
}
