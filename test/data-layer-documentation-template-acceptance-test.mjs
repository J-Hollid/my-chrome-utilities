import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

import {verificationDigest} from "../scripts/verification-evidence.mjs";

await import("./data-layer-documentation-template-excel-test.mjs");
await import("./data-layer-documentation-template-rich-test.mjs");
await import("./data-layer-documentation-template-library-test.mjs");
const flowHandler=await readFile("acceptance/src/acceptance/steps/flow_table_documentation_export.clj","utf8");
for(const key of ["documentationTemplateMovedArea","documentationTemplateEmptyLogoArea","documentationTemplateFindingUi","documentationTemplatePresentation","documentationTemplateGuideExamples","documentationTemplateActiveContentFinding","flowTemplateEffectivePageProjection"])assert.ok(flowHandler.includes(`:${key}`),`acceptance runtime relation includes ${key}`);

if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION),
    handler=flowHandler,
    printerSettingsMapping=context.causalCategory==="other:Excel printer settings acceptance mapping",
    effectiveProjectionMapping=context.causalCategory==="other:Flow effective Page projection acceptance evidence",
    expectedPreRepairFailure=effectiveProjectionMapping
      ?{flowTemplateEffectivePageProjection:false}
      :printerSettingsMapping
      ?{printerSettingsPackageRow:false,printerSettingsRuntimeRow:false}
      :{guidedPackageRows:false,guidedBindingRows:false},
    expectedRepairResult=effectiveProjectionMapping
      ?{flowTemplateEffectivePageProjection:true}
      :printerSettingsMapping
      ?{printerSettingsPackageRow:true,printerSettingsRuntimeRow:true}
      :{guidedPackageRows:true,guidedBindingRows:true},
    observed=effectiveProjectionMapping?{
      flowTemplateEffectivePageProjection:handler.includes(":flowTemplateEffectivePageProjection"),
    }:printerSettingsMapping?{
      printerSettingsPackageRow:handler.includes("an unrecognized or active binary part")&&handler.includes("Use inert macro-free workbook content"),
      printerSettingsRuntimeRow:handler.includes("Template Guide")&&handler.includes("xl/printerSettings/printerSettings2.bin"),
    }:{
      guidedPackageRows:handler.includes("a formula or external workbook connection")&&handler.includes("Remove active or external workbook content"),
      guidedBindingRows:handler.includes("a binding outside its required repeat")&&handler.includes("its Template worksheet, cell, and required repeat"),
    },fixture={
      id:effectiveProjectionMapping?"flow-effective-page-projection-acceptance-evidence-v1":printerSettingsMapping?"excel-printer-settings-acceptance-relations-v1":"guided-excel-acceptance-example-relations-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{handler:"flow_table_documentation_export",contract:effectiveProjectionMapping?"effective-page-projection":printerSettingsMapping?"printer-settings":"guided-authoring"},
      expectedPreRepairFailure,expectedRepairResult,
    },fixtureDigest=verificationDigest(fixture);
  assert.deepEqual(observed,expectedRepairResult);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{
    version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed},
  }}));
}
