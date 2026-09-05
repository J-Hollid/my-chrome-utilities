import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdtemp, mkdir, writeFile, rm} from "node:fs/promises";
import path from "node:path";
import {assertMigrationLedgerHistory} from "./migration-ledger-history.mjs";

const root = await mkdtemp(path.resolve("tmp/migration-ledger-history-"));
const git = (...args) => execFileSync("git", args, {cwd:root, stdio:"pipe"});
const destination = "verification/manifests/example.json";
const ledgerPath = "verification/manifests/migration-ledger.v1";
const fragment = {version:1, order:1, pack:{id:"example", unit:["test/original-test.mjs"]}};
const ledger = {version:1, packs:[{id:"example", order:1, destination,
  sourceObjectDigest:createHash("sha256").update(JSON.stringify(fragment.pack)).digest("hex")}]};
try {
  await mkdir(path.join(root, "verification/manifests"), {recursive:true});
  await writeFile(path.join(root, destination), JSON.stringify(fragment));
  await writeFile(path.join(root, ledgerPath), JSON.stringify(ledger));
  git("init", "-q");
  git("add", ".");
  git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "Record migration");
  assertMigrationLedgerHistory(ledger, {repositoryRoot:root});
  fragment.pack.unit.push("test/later-test.mjs");
  await writeFile(path.join(root, destination), JSON.stringify(fragment));
  git("add", ".");
  git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "Add later checks");
  assertMigrationLedgerHistory(ledger, {repositoryRoot:root});
  const tampered = structuredClone(ledger);
  tampered.packs[0].sourceObjectDigest = "0".repeat(64);
  assert.throws(() => assertMigrationLedgerHistory(tampered, {repositoryRoot:root}), /uncommitted ledger/u);
  await writeFile(path.join(root, ledgerPath), JSON.stringify(tampered));
  git("add", ".");
  git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "Corrupt snapshot");
  assert.throws(() => assertMigrationLedgerHistory(tampered, {repositoryRoot:root}), /recorded migration snapshot/u);
  console.log("Migration history preserves exact snapshots and permits later manifest changes.");
} finally { await rm(root, {recursive:true, force:true}); }
