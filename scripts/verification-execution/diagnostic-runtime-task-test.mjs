import assert from "node:assert/strict";
import { diagnosticRuntimeTask, loadDiagnosticRuntimeTask } from "./diagnostic-runtime-task.mjs";
import { loadVerificationPacks, planVerification, verificationTaskIdentity } from "../verification-packs.mjs";

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
