import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadVerificationPacks } from "../../scripts/verification-registry/validation.mjs";
import { verificationPackTaskKeys } from "../../scripts/verification-packs.mjs";

const packs = await loadVerificationPacks();
const runnable = packs.filter((pack) => verificationPackTaskKeys(pack).size > 0);
const added = { id:"synthetic-runnable", source:[], verificationOnly:true,
  unit:["test/synthetic-runnable-test.mjs"] };
const empty = { id:"synthetic-empty", source:[], verificationOnly:true };
assert.equal([...packs, added].filter((pack) => verificationPackTaskKeys(pack).size > 0).length,
  runnable.length + 1, "a new runnable identity expands terminal cardinality by one");
assert.equal([...packs, empty].filter((pack) => verificationPackTaskKeys(pack).size > 0).length,
  runnable.length, "an empty compatibility identity does not expand terminal cardinality");

const capture = packs.find(({ id }) => id === "capture");
const permissionSlice = capture.verificationSlices.find(
  ({ id }) => id === "capture_live_target_permission_recovery");
assert.ok(permissionSlice, "Capture keeps the bounded live-target permission slice");
assert.deepEqual(permissionSlice.consumers,
  [{ packId:"shell", sliceId:"live_target_permission_recovery_consumer" }],
  "the bounded permission slice retains its exact Shell consumer");

const legacyHandlers = await readFile(new URL(
  "../../acceptance/src/acceptance/steps/verification_process_legacy.clj", import.meta.url),
"utf8");
assert.ok(legacyHandlers.indexOf("administration-preflight/handlers") <
          legacyHandlers.indexOf("modular-architecture/handlers"),
"feature-scoped administration preflight handlers run before the generic modular fallback");

console.log(JSON.stringify({ verificationAdministrationAcceptanceDependencies:{
  cardinality:{ currentRunnable:true, addedRunnable:true, emptyCompatibilityExcluded:true },
  liveTarget:{ captureOwnedSlice:true, exactShellConsumer:true, noAllPack:true },
} }));
console.log("verification administration acceptance dependencies passed");
