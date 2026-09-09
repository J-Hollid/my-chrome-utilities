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

export function compactGripAcceptanceRepairProtocol(presentation) {
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION),
    expectedPreRepairFailure={...presentation,visibleGripLabel:"Reorder",inlineGrip:false},
    expectedRepairResult=presentation,
    fixture={id:"compact-reorder-grip-acceptance-v1",causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{contract:"visible compact grip with accessible movement menu"},
      expectedPreRepairFailure,expectedRepairResult},fixtureDigest=digest(fixture);
  return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:expectedRepairResult}};
}

/** Keep the installed setup and focus evidence consumed by the canonical target.
 * The surface target owns the remaining surface observations.
 */
export function layeredCanonicalPrerequisiteSource(surfaceSource) {
  const startMarker = "const authoringCorrectionEvidence=await evaluate(socket,`";
  const endMarker = "const recursiveArrayEvidence=await evaluate(socket,`";
  const start = surfaceSource.indexOf(startMarker);
  const end = surfaceSource.indexOf(endMarker, start);
  if (start < 0 || end <= start || surfaceSource.indexOf(startMarker, start + 1) >= 0) {
    throw new Error("Layered canonical prerequisite boundary changed");
  }
  return `${surfaceSource.slice(start, end)}\n` +
    "const recursiveArrayEvidence={},viewportTarget=activeSocket??socket;\n";
}

export async function assertLayeredCanonicalPrerequisites({layeredEditorSurfaceSource,runLayeredEditorCanonicalWorkflow}) {
  const {default:assert}=await import("node:assert/strict");
  const prerequisite = layeredCanonicalPrerequisiteSource(layeredEditorSurfaceSource);
  const start = layeredEditorSurfaceSource.indexOf("const authoringCorrectionEvidence=");
  const end = layeredEditorSurfaceSource.indexOf("const recursiveArrayEvidence=", start);
  assert.equal(prerequisite.slice(0, end - start), layeredEditorSurfaceSource.slice(start, end),
    "Canonical setup and its six installed focus observations stay byte-identical");
  assert.throws(() => layeredCanonicalPrerequisiteSource("changed source"), /boundary changed/);

  // Stop at the first real evaluator call. Do not substitute a passing observation.
  const stop = new Error("observed first evaluation");
  async function firstEvaluation(run) {
    let source;
    await assert.rejects(run({socket:{},evaluate:async (_socket, expression) => {
      source = expression;
      throw stop;
    }}), error => error === stop);
    return source;
  }
  const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
  const previous = new AsyncFunction("socket", "evaluate", layeredEditorSurfaceSource);
  const before = await firstEvaluation(({socket,evaluate}) => previous(socket,evaluate));
  const after = await firstEvaluation(runLayeredEditorCanonicalWorkflow);
  const observedBefore = {duplicateCompactPanelEvaluation:before.includes("compact panel evidence:")};
  const observedAfter = {duplicateCompactPanelEvaluation:after.includes("compact panel evidence:")};
  assert.deepEqual(observedBefore, {duplicateCompactPanelEvaluation:true});
  assert.deepEqual(observedAfter, {duplicateCompactPanelEvaluation:false});
  assert.match(after, /authoring correction runtime/);
  assert.match(layeredEditorSurfaceSource, /compact panel evidence:/,
    "The surface workload retains its compact panel checks");

  const repairCategory = "other:duplicate layered canonical surface evaluations";
  if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
    const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
    if (context.causalCategory === repairCategory) {
      const fixture = {id:"layered-canonical-prerequisite-evaluation-v1",
        causalCategory:repairCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{surfaceSourceDigest:digest(layeredEditorSurfaceSource)},
        expectedPreRepairFailure:observedBefore,expectedRepairResult:observedAfter};
      const fixtureDigest = digest(fixture);
      console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
        incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
        preRepairResult:{status:"failed",fixtureDigest,observed:observedBefore},
        repairResult:{status:"passed",fixtureDigest,observed:observedAfter}}}));
    }
  }

}
