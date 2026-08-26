import assert from "node:assert/strict";

import { candidateRepositoryPaths } from
  "../../scripts/verification-registry/candidate-inventory.mjs";
import {
  compileVerificationRegistry,
  serializeVerificationRegistry,
} from "../../scripts/verification-registry/compiler.mjs";

const registryTest = "test/verification-contracts/registry-inventory-contract-test.mjs";
const policyTest = "test/verification-policy-contract-routing-test.mjs";
const base = [{ id:"shell", source:["src/workspace-tabs-ui.ts"], unit:[registryTest] }];
const fragments = [{ order:1, pack:{ id:"verification_process", unit:[policyTest] } }];
const first = compileVerificationRegistry({ base, fragments });
const second = compileVerificationRegistry({ base:structuredClone(base),
  fragments:structuredClone(fragments) });

assert.deepEqual(first.map(({ id }) => id), ["shell", "verification_process"],
  "mixed registry assembly preserves base order followed by explicit fragment order");
assert.equal(serializeVerificationRegistry(first), serializeVerificationRegistry(second),
  "identical fragment inputs compile to byte-identical canonical output");
assert.throws(() => compileVerificationRegistry({ base, fragments:[
  { order:1, pack:{ id:"shell", unit:[policyTest] } },
]}), /Duplicate verification pack identity: shell/u,
"duplicate pack authority blocks assembly");
assert.throws(() => compileVerificationRegistry({ base, fragments:[
  { order:1, pack:{ id:"verification_process", source:["src/workspace-tabs-ui.ts"],
    unit:[policyTest] } },
]}), /Duplicate verification source ownership: src\/workspace-tabs-ui\.ts/u,
"duplicate source ownership blocks assembly");
assert.throws(() => compileVerificationRegistry({ base, fragments:[
  { order:1, pack:{ id:"verification_process", unit:["test/missing-policy-leaf.mjs"] } },
]}), /Missing executable verification leaf: test\/missing-policy-leaf\.mjs/u,
"missing executable leaves block assembly");
assert.throws(() => compileVerificationRegistry({ base, fragments:[
  { order:1, pack:{ id:"verification_process", unit:[policyTest], verificationSlices:[{
    id:"registry", sourcePrefixes:["scripts/verification-registry/"], tasks:[`unit:${policyTest}`],
    prerequisites:[], consumers:[{ packId:"absent" }], observableBoundary:"registry",
  }] } },
]}), /Unknown verification slice consumer: absent/u,
"unknown slice consumers block assembly");
const sharedBoundary = (id, owner, prefix) => ({
  id, owner, prefixes:[prefix], consumers:[owner === "shell" ? "verification_process" : "shell"],
  structuralClass:"composition", propagateDependants:false, terminalFullObligation:true,
  qaTargets:[owner === "shell" ? "shell-smoke" : "policy-smoke"],
});
assert.throws(() => compileVerificationRegistry({ base:[{
  ...base[0], browserObservations:[{ id:"shell-smoke", path:registryTest }],
  sharedBoundaries:[sharedBoundary("shell-boundary", "shell", "scripts/shared/")],
}], fragments:[{ order:1, pack:{ id:"verification_process", unit:[policyTest],
  browserObservations:[{ id:"policy-smoke", path:policyTest }],
  sharedBoundaries:[sharedBoundary("policy-boundary", "verification_process", "scripts/shared/")],
} }] }), /Conflicting shared boundary prefix: scripts\/shared\//u,
"conflicting shared-boundary authority blocks assembly");
assert.equal(typeof candidateRepositoryPaths, "function",
  "candidate inventory is owned by the registry boundary");
