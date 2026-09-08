import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import { timeoutIncidentDigest as digest } from "../verification-reliability-values.mjs";
import { diagnosticRuntimeTask, loadDiagnosticRuntimeTask } from "./diagnostic-runtime-task.mjs";
import { loadVerificationPacks, planVerification, verificationTaskIdentity } from "../verification-packs.mjs";

export async function runDiagnosticRuntimeTaskTests() {
await verifyDiagnosticTestIsolation();
const registered = { key:"unit:chrome-probe", stage:"unit", packId:"shell",
  executable:"node", args:["probe.mjs"], requiredCapabilities:["local-loopback"],
  temporaryPathClass:"chrome-short" };
const stored = verificationTaskIdentity(registered);
const restored = diagnosticRuntimeTask(stored, [registered]);
assert.equal(restored.temporaryPathClass, "chrome-short",
  "a stored unit task must retain its registered Chrome temporary route");
assert.deepEqual(verificationTaskIdentity(restored), stored,
  "restoring runtime metadata must not change the governed executable identity");
assert.equal(stored.temporaryPathClass, undefined, "the immutable source stays unchanged");
assert.throws(() => diagnosticRuntimeTask(stored, [{ ...registered, args:["other.mjs"] }]),
  /identity/u, "a different executable cannot supply diagnostic runtime metadata");
const workspace = { ...registered, temporaryPathClass:"workspace" };
assert.equal(diagnosticRuntimeTask(stored, [workspace]).temporaryPathClass, "workspace");
assert.deepEqual(diagnosticRuntimeTask(stored, []), stored,
  "a legacy task without a current registration retains its stored identity");
const lifecycle=planVerification(await loadVerificationPacks(),{packIds:["shell"]}).tasks
  .find(({key})=>key==="unit:test/headless-chrome-lifecycle-test.mjs");
assert.equal((await loadDiagnosticRuntimeTask(verificationTaskIdentity(lifecycle))).temporaryPathClass,
  "chrome-short", "the real diagnostic loader restores the installed lifecycle route");
console.log("diagnostic runtime task tests passed");
}

async function verifyDiagnosticTestIsolation() {
  const failedCommit="161c36c8b481df7ed316b12cfe5b956e3f7ad6c1";
  const checkerPath="test/verification-registry-planner-modularization-acceptance-test.mjs";
  const contractPath="test/verification-contracts/reliability-prerequisite-contract-test.mjs";
  const historical=(file)=>execFileSync("git",["show",`${failedCommit}:${file}`],{encoding:"utf8"});
  const parserSource=historical(checkerPath).match(/const directContractImports = ([\s\S]*?);\nconst directImportFailures/u)?.[1];
  assert.ok(parserSource,"the regression executes the immutable failed isolation checker");
  const inspect=vm.runInNewContext(`(${parserSource})`,{ts});
  const observe=(source)=>({sideEffectImports:inspect(source,contractPath).filter(x=>x.sideEffect).length});
  const before=observe(historical(contractPath)),after=observe(await readFile(contractPath,"utf8"));
  assert.deepEqual(before,{sideEffectImports:1});
  assert.deepEqual(after,{sideEffectImports:0});
  const plan=planVerification(await loadVerificationPacks(),{packIds:["verification_process"]});
  assert.equal(plan.tasks.filter(({key})=>key==="unit:scripts/verification-execution/diagnostic-runtime-task-test.mjs").length,1,
    "the isolated diagnostic test remains registered exactly once");
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION??"null");
  if(context?.causalCategory!=="other:Diagnostic test registration isolation")return;
  const fixture={id:"diagnostic-test-registration-isolation-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{failedCommit,contractPath},
    expectedPreRepairFailure:before,expectedRepairResult:after},fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:before},
    repairResult:{status:"passed",fixtureDigest,observed:after}}}));
}

if(process.argv[1]===fileURLToPath(import.meta.url))await runDiagnosticRuntimeTaskTests();
