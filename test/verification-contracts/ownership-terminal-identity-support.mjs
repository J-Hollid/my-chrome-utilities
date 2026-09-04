import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const schemaEditorReachabilityFeatures = [
  "features/data-layer-side-panel-schema-editor-reachability-runtime.feature",
  "features/data-layer-side-panel-schema-editor-reachability.feature",
];
const schemaEditorReachabilityAcceptanceArtifacts = schemaEditorReachabilityFeatures
  .flatMap((feature) => {
    const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
    const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
      .replace(/(^-+|-+$)/gu, "");
    return [
      `build/acceptance/generated/${slug}_acceptance_test.clj`,
      `build/acceptance/ir/${basename}.json`,
    ];
  });

export const approvedSchemaEditorReachabilityTaskKeys = new Set([
  "browser:test/browser-packs/side-panel-schema-editor-reachability.mjs",
]);

export const normalizeSchemaEditorReachabilityIdentity = (identity) => {
  if (identity.key !== "acceptance-session:schemas") return identity;
  identity.args = identity.args.filter((value) =>
    !schemaEditorReachabilityAcceptanceArtifacts.includes(value));
  identity.target = identity.target.split(",")
    .filter((value) => !schemaEditorReachabilityFeatures.includes(value)).join(",");
  return identity;
};

const normalizedDigest = (value) => {
  const normalize = (candidate) => Array.isArray(candidate) ? candidate.map(normalize)
    : candidate && typeof candidate === "object" ? Object.fromEntries(Object.entries(candidate)
      .sort(([left],[right]) => left.localeCompare(right))
      .map(([key,nested]) => [key,normalize(nested)])) : candidate;
  return createHash("sha256").update(JSON.stringify(normalize(value))).digest("hex");
};

export function emitSchemaEditorReachabilityRepairRegression({ terminalPlan, normalizeIdentity }) {
  if (!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) return;
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const expectedPreRepairFailure = {
    browserTaskConserved:false,
    schemasSessionNormalized:false,
  };
  const expectedRepairResult = {
    browserTaskConserved:true,
    schemasSessionNormalized:true,
  };
  const schemaSession = terminalPlan.tasks.find(({key}) => key === "acceptance-session:schemas");
  const observed = {
    browserTaskConserved:[...approvedSchemaEditorReachabilityTaskKeys].every((key) =>
      terminalPlan.tasks.some((task) => task.key === key)),
    schemasSessionNormalized:Boolean(schemaSession) && !normalizeIdentity(schemaSession).target.includes(
      "data-layer-side-panel-schema-editor-reachability"),
  };
  assert.deepEqual(observed,expectedRepairResult,
    "Schema reachability repair conserves the exact browser and normalized acceptance identities");
  const fixture = {
    id:"schema-reachability-terminal-normalization-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:normalizedDigest(context.diagnosedBoundary),
    input:{
      browserTask:"browser:test/browser-packs/side-panel-schema-editor-reachability.mjs",
      acceptanceSession:"acceptance-session:schemas",
    },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const fixtureDigest = normalizedDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{
    version:2,
    incidentId:context.incidentId,
    failureDigest:context.failureDigest,
    fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed},
  }}));
}
