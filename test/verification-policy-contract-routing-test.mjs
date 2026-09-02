import assert from "node:assert/strict";

import {
  verificationPolicyContracts,
  verificationPolicyContractForPath,
  verificationProcessCompatibilitySuccessors,
  verificationProcessTransitionSuccessors,
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
  verificationPolicyContracts.flatMap(({ testPaths }) => testPaths),
  "the explicit compatibility command expands once to every boundary contract");

const tasks=verificationProcessTransitionSuccessors.map((testPath)=>({
  key:`unit:${testPath}`,stage:"unit",packId:"verification_process",executable:"node",
  args:[testPath],target:testPath,environment:null,requiredCapabilities:[],
}));
const boundResults=tasks.map((identity)=>({key:identity.key,status:"passed",identity}));
const results=runVerificationProcessCompatibility({tasks,results:boundResults});
assert.equal(results.length,new Set(tasks.map(({key})=>key)).size,
  "the compatibility command validates every bound successor once");
assert.throws(()=>runVerificationProcessCompatibility(),/bound child tasks and results/u,
  "the compatibility command does not start an unbound child workload");
assert.throws(()=>runVerificationProcessCompatibility({tasks,results:boundResults.slice(1)}),
  /missing child/u,"a missing bound child fails the compatibility aggregate");
