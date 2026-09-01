import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { emitVerificationAdministrationAcceptanceRepairProtocol } from
  "../fixtures/verification-administration-repair-protocol.mjs";

const programs = [
  "scripts/verification-pack-cardinality/acceptance.mjs",
  "test/live-target-permission-recovery-preparation-contract-test.mjs",
];

for (const program of programs) {
  const result = spawnSync(process.execPath, [program], {
    cwd:process.cwd(), encoding:"utf8", stdio:["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `${program} failed:\n${result.stderr}`);
  process.stdout.write(result.stdout);
}

emitVerificationAdministrationAcceptanceRepairProtocol();
console.log("verification administration acceptance dependencies passed");
