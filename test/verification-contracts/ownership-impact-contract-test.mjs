import assert from "node:assert/strict";

import { verificationOwnerForPath } from
  "../../scripts/verification-planner/ownership/resolve.mjs";

const packs = [
  { id:"shell", process:["scripts/"] },
  { id:"verification_process", verificationSlices:[{
    id:"registry_inventory", sourcePaths:[],
    sourcePrefixes:["scripts/verification-registry/"],
  }] },
];

assert.equal(verificationOwnerForPath(packs,
  "scripts/verification-registry/compiler.mjs").id, "verification_process",
"a declared verification slice outranks the conservative Shell process fallback");
assert.equal(verificationOwnerForPath(packs, "scripts/package.mjs").id, "shell",
  "unmigrated process paths retain their conservative owner");
assert.throws(() => verificationOwnerForPath([
  ...packs,
  { id:"conflict", verificationSlices:[{
    id:"conflict", sourcePaths:[], sourcePrefixes:["scripts/verification-registry/"],
  }] },
], "scripts/verification-registry/compiler.mjs"), /Ambiguous verification ownership/u,
"conflicting boundary ownership fails closed");
