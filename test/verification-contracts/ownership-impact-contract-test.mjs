import assert from "node:assert/strict";

import { verificationOwnerForPath } from "../../scripts/verification-planner/ownership/resolve.mjs";

const packs = [
  { id:"shell", source:[], process:["scripts/"] },
  { id:"narrow", source:["scripts/verification-registry/"] },
];
assert.equal(verificationOwnerForPath(packs, "scripts/verification-registry/compiler.mjs")?.id, "narrow",
  "the most specific declared prefix owns a changed path");
assert.equal(verificationOwnerForPath(packs, "scripts/package.mjs")?.id, "shell",
  "unmigrated process paths retain their conservative owner");
assert.equal(verificationOwnerForPath(packs, "unknown/file.mjs"), undefined,
  "an unowned path is explicit rather than silently attributed");
