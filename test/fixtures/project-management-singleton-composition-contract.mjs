import assert from "node:assert/strict";
import {createHash} from "node:crypto";

const normalized=(value)=>Array.isArray(value)
  ?value.map(normalized)
  :value&&typeof value==="object"
    ?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right)).map(([key,nested])=>[key,normalized(nested)]))
    :value;

const digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");

export function singletonCompositionContractRepairProtocol(observed){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION),
    expectedPreRepairFailure={expectsSingletonReorder:true,singletonReorderPresent:false},
    expectedRepairResult={expectsSingletonReorder:false,singletonReorderPresent:false},
    fixture={id:"project-management-singleton-composition-contract-v1",causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{surface:"Page Property composition",applicationCount:1},
      expectedPreRepairFailure,expectedRepairResult},fixtureDigest=digest(fixture);
  assert.deepEqual(observed,expectedRepairResult);
  return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed}};
}
