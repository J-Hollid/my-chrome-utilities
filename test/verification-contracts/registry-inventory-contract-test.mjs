import assert from "node:assert/strict";

import { candidateRepositoryPaths } from
  "../../scripts/verification-registry/candidate-inventory.mjs";
import {
  compileVerificationRegistry,
  serializeVerificationRegistry,
} from "../../scripts/verification-registry/compiler.mjs";

const base = [{ id:"shell", unit:["test/shell-test.mjs"] }];
const fragments = [{ order:1, pack:{ id:"verification_process", unit:["test/policy-test.mjs"] } }];
const first = compileVerificationRegistry({ base, fragments });
const second = compileVerificationRegistry({ base:structuredClone(base),
  fragments:structuredClone(fragments) });

assert.deepEqual(first.map(({ id }) => id), ["shell", "verification_process"],
  "mixed registry assembly preserves base order followed by explicit fragment order");
assert.equal(serializeVerificationRegistry(first), serializeVerificationRegistry(second),
  "identical fragment inputs compile to byte-identical canonical output");
assert.throws(() => compileVerificationRegistry({ base, fragments:[
  { order:1, pack:{ id:"shell", unit:["test/duplicate-test.mjs"] } },
]}), /Duplicate verification pack identity: shell/u,
"duplicate pack authority blocks assembly");
assert.equal(typeof candidateRepositoryPaths, "function",
  "candidate inventory is owned by the registry boundary");
