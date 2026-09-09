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

export const approvedObservationSourceTaskKeys = new Set([
  "browser:test/project-observation-sources-browser-test.mjs",
  "browser:test/project-observation-source-host-browser-test.mjs",
]);

export const approvedSchemaContextExportTaskKeys = new Set([
  "browser:test/schema-context-export-browser-test.mjs",
  ...["schema-context-export-test", "schema-context-export-session-test", "schema-context-export-saved-test",
    "schema-context-export-inheritance-test", "schema-context-export-observation-test", "schema-context-permission-readiness-test"]
    .map(name=>`unit:test/${name}.mjs`),
  "property:test/schema-context-export-property-test.mjs",
  ...["features/data-layer-schema-context-json-schema-export.feature", "features/data-layer-schema-context-json-schema-export-runtime.feature"]
    .flatMap(feature=>[`acceptance-parse:${feature}`,`acceptance-generate:${feature}`]),
]);
export function contextPermissionTaskCount(tasks){
  const count=tasks.filter(({key})=>approvedSchemaContextExportTaskKeys.has(key)).length;
  assert.equal(count,1,"The approved permission regression is registered exactly once");
  return count;
}

export function preContextSourceInventory(inventory,packs,plan){
  const added=inventory.filter(path=>path.startsWith("src/schema-context-export/"));
  assert.equal(added.length,15);
  for(const sourcePath of added){
    assert.ok(plan(packs,{changedPaths:[sourcePath]}).changedBoundaries[sourcePath],
      `${sourcePath} has a declared impact boundary`);
  }
  return inventory.filter(path=>!added.includes(path));
}

export function preContextPlan(plan){
  const additions=new Set(["features/data-layer-schema-context-json-schema-export.feature",
    "features/data-layer-schema-context-json-schema-export-runtime.feature",
    "acceptance/src/acceptance/steps/schema_context_export.clj"]);
  return Object.fromEntries(Object.entries(plan).map(([key,value])=>[
    key,key==="features"||key==="handlers"?value.filter(path=>!additions.has(path)):
      key==="tasks"||key.endsWith("Tasks")
      ?value.filter(({key:taskKey})=>!approvedSchemaContextExportTaskKeys.has(taskKey)):value,
  ]));
}

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

export async function assertNativePermissionProbe(installNativePermissionRequestProbe){
  const nativeRequests=[];
  let resolveNativePermission;
  const nativePending=new Promise(resolve=>{resolveNativePermission=resolve;});
  const nativePermissions={request(request){
    assert.equal(this,nativePermissions);
    assert.deepEqual(request,{origins:["https://example.test/*"]});
    return nativePending;
  }};
  installNativePermissionRequestProbe(nativePermissions,nativeRequests);
  const observedPermission=nativePermissions.request({origins:["https://example.test/*"]});
  assert.equal(globalThis.__swarmforgePermissionRequestPromise,nativePending);
  assert.deepEqual(globalThis.__swarmforgePermissionRequestObservation,{requested:true});
  resolveNativePermission(true);
  assert.equal(await observedPermission,true);
  assert.deepEqual(globalThis.__swarmforgePermissionRequestObservation,{requested:true,granted:true});
  assert.equal(nativeRequests.length,1);
  delete globalThis.__swarmforgePermissionRequestPromise;
  delete globalThis.__swarmforgePermissionRequestObservation;
}
