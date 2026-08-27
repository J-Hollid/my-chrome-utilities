import assert from "node:assert/strict";

import {
  verificationPolicyContracts,
  verificationPolicyContractForPath,
  verificationProcessCompatibilitySuccessors,
} from "../scripts/verification-policy/contracts.mjs";
import { runVerificationProcessCompatibility } from
  "../scripts/verification-policy/process-contract-compatibility.mjs";

const expected = [
  "registry_inventory",
  "ownership_impact",
  "dependency_expansion",
  "task_batching",
  "historical_planning",
  "execution_checkpoint",
  "reliability_run_intent",
  "evidence_promotion",
  "timing_performance",
];

assert.deepEqual(verificationPolicyContracts.map(({ id }) => id), expected,
  "verification policy exposes the nine specification-owned boundaries in canonical order");
assert.equal(new Set(verificationPolicyContracts.flatMap(({ sourcePrefixes }) => sourcePrefixes)).size,
  verificationPolicyContracts.flatMap(({ sourcePrefixes }) => sourcePrefixes).length,
  "policy source prefixes have one authoritative contract owner");
assert.equal(verificationPolicyContractForPath("scripts/verification-registry/compiler.mjs")?.id,
  "registry_inventory", "registry implementation selects only its boundary contract");
assert.equal(verificationPolicyContractForPath("src/workspace-tabs-ui.ts"), null,
  "product-only Shell work selects no verification policy contract");
assert.deepEqual(verificationProcessCompatibilitySuccessors,
  verificationPolicyContracts.map(({ testPath }) => testPath),
  "the explicit compatibility command expands once to every boundary contract");

const launched = [];
const results = runVerificationProcessCompatibility({ spawn:(executable, args) => {
  launched.push({ executable, args });
  return { status:0, signal:null, stdout:"", stderr:"" };
} });
assert.deepEqual(launched.map(({ args }) => args[0]), verificationProcessCompatibilitySuccessors,
  "the compatibility command launches every successor exactly once in canonical order");
assert.equal(results.length, new Set(launched.map(({ args }) => args[0])).size,
  "the compatibility command does not duplicate a successor");

const attempted = [];
assert.throws(() => runVerificationProcessCompatibility({
  successors:["first.mjs", "second.mjs"],
  spawn:(executable, args) => {
    attempted.push({ executable, args });
    return { status:1, signal:null, stdout:"", stderr:"failed\n" };
  },
  writeStdout:() => {},
  writeStderr:() => {},
}), /first\.mjs.*second\.mjs/u,
"compatibility execution reports every failed successor after running the complete set");
assert.deepEqual(attempted.map(({ args }) => args[0]), ["first.mjs", "second.mjs"],
  "one failed boundary does not prevent later boundary diagnostics");
