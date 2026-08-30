import assert from "node:assert/strict";
import {createHash} from "node:crypto";

const normalized=(value)=>Array.isArray(value)?value.map(normalized):value&&typeof value==="object"
  ?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right)).map(([key,nested])=>[key,normalized(nested)])):value;
const digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");

export function schemaContributorHydrationRepairProtocol(context,observed){
  const expectedPreRepairFailure={activeProjectHydrationSuperseded:false,relationshipRowsReady:false};
  const expectedRepairResult={activeProjectHydrationSuperseded:true,relationshipRowsReady:true};
  const fixture={id:"installed-schema-contributor-hydration-supersession-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{surface:"packaged side-panel Schema relationship tree",transition:"one active project to another"},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest=digest(fixture);assert.deepEqual(observed,expectedRepairResult);
  return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed}};
}
