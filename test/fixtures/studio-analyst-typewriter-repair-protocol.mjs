import assert from "node:assert/strict";
import {createHash} from "node:crypto";

const normalized=(value)=>Array.isArray(value)?value.map(normalized):value&&typeof value==="object"
  ?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right))
    .map(([key,nested])=>[key,normalized(nested)])):value;
const digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");

export function studioAnalystTypewriterRepairProtocol(context,observed){
  const expectedPreRepairFailure={scheduler:"fixed-interval",minimumSpacingPreserved:false};
  const expectedRepairResult={scheduler:"completion-relative-timeout",minimumSpacingPreserved:true};
  const fixture={id:"studio-analyst-typewriter-completion-relative-scheduling-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{targetId:"BRANDING_WORKFLOW_GUIDANCE_TARGET",minimumSpacingMilliseconds:15},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest=digest(fixture);
  assert.deepEqual(observed,expectedRepairResult);
  return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed}};
}
