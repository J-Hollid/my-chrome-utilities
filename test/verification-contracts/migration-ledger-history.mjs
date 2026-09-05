import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";

export function assertMigrationLedgerHistory(ledger, {repositoryRoot=process.cwd()} = {}) {
  const ledgerPath = "verification/manifests/migration-ledger.v1";
  const git = (...args) => execFileSync("git", args, {cwd:repositoryRoot, encoding:"utf8"});
  const commit = git("log", "-1", "--format=%H", "--", ledgerPath).trim();
  assert.match(commit, /^[a-f0-9]{40,64}$/u, "the migration ledger has a committed origin");
  assert.deepEqual(JSON.parse(git("show", `${commit}:${ledgerPath}`)), ledger,
    "an uncommitted ledger cannot assert a new migration snapshot");
  for (const entry of ledger.packs) {
    const fragment = JSON.parse(git("show", `${commit}:${entry.destination}`));
    assert.equal(fragment.version, 1);
    assert.equal(fragment.order, entry.order);
    assert.equal(fragment.pack.id, entry.id);
    assert.equal(createHash("sha256").update(JSON.stringify(fragment.pack)).digest("hex"),
      entry.sourceObjectDigest, `${entry.id} conserves its recorded migration snapshot`);
  }
}
