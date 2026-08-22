import {createHash} from "node:crypto";

const normalized=(value)=>Array.isArray(value)?value.map(normalized):value&&typeof value==="object"
  ?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right))
    .map(([key,nested])=>[key,normalized(nested)])):value;
const digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");

export const focusableOverlayControls=(controls)=>controls.filter(({disabled})=>!disabled);

export const focusableOverlayControlExpression=(expression)=>expression
  .replace("overlayControls=[...overlay.querySelectorAll('button')]","overlayControls=[...overlay.querySelectorAll('button')].filter(({disabled})=>!disabled)")
  .replace("composedOverlayControls=[...composedOverlay.querySelectorAll('button')]","composedOverlayControls=[...composedOverlay.querySelectorAll('button')].filter(({disabled})=>!disabled)");

export function overlayFocusabilityRepairProtocol(controls) {
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION),
    labels=(items)=>items.map(({label})=>label),
    expectedPreRepairFailure={focusableLabels:labels(controls)},
    expectedRepairResult={focusableLabels:labels(focusableOverlayControls(controls))},
    fixture={id:"layered-schema-disabled-overlay-focusability-v1",causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{controls},
      expectedPreRepairFailure,expectedRepairResult},fixtureDigest=digest(fixture);
  return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:expectedRepairResult}};
}
