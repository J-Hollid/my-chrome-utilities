import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdir,readFile,readdir,rm} from "node:fs/promises";
import path from "node:path";
import {queryFixture} from "./fixture.mjs";
import {canonicalVerificationChangeSet,verificationPacksAtCommit,planVerification} from "../../scripts/verification-packs.mjs";
const cli=path.resolve("scripts/verification-ownership-query.mjs"),f=await queryFixture();
const run=(...args)=>JSON.parse(execFileSync(process.execPath,[cli,...args,"--json"],{cwd:f.root,encoding:"utf8",stdio:"pipe"}));
const changes=(base=f.base)=>run("changes","--base",base,"--task","fixture","--pack","pack_a","--expand","checks");
const snapshot=async(dir)=>{const values={};for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())Object.assign(values,await snapshot(p));else values[p]=(await readFile(p)).toString("base64");}return values;};
try {
  await mkdir(path.join(f.root,"pack_b/sliced"),{recursive:true});
  f.git("mv","pack_a/sliced/value.mjs","pack_b/sliced/value.mjs");f.commit();
  let a=changes();assert.deepEqual(a.changeSet.paths,["pack_a/sliced/value.mjs","pack_b/sliced/value.mjs"]);
  assert.ok(a.packIds.includes("pack_a"));assert.ok(a.packIds.includes("pack_b"));
  const before=await snapshot(f.root);changes();run("path","pack_b/sliced/value.mjs");
  assert.throws(()=>run("path","pack_b/sliced/value.mjs","--expand","no"),/Unknown expansion/);
  assert.deepEqual(await snapshot(f.root),before,"queries cannot write files, Git state, or metadata");
  f.git("rm","pack_b/sliced/value.mjs");f.commit();a=changes();assert.ok(a.packIds.includes("pack_a"));
  // Changing a mapping cannot erase the canonical historical task union.
  f.packs[0].verificationSlices[0].tasks=["unit:test/pack_a-2.mjs"];
  await f.compile();f.commit();
  const changeSet=await canonicalVerificationChangeSet({base:f.base,repositoryRoot:f.root});
  const basePacks=await verificationPacksAtCommit(f.base,{repositoryRoot:f.root});
  const canonical=planVerification(f.packs,{changedPaths:changeSet.paths,changeSet,basePacks,includeProperties:true});
  a=changes();assert.deepEqual(a.checks.entries.map(c=>c.key),canonical.tasks.map(t=>t.key));
  f.git("notes","--ref=refs/notes/swarmforge-verification-slice-quarantine","add","-m",
    JSON.stringify({version:1,transitions:[{kind:"selection-miss",sliceId:"slice_a"}]}));
  a=run("path","pack_a/sliced/proposed.mjs");assert.equal(a.ownership.quarantined,true);
  assert.equal(a.ownership.kind,"parent-fallback");assert.ok(a.restrictions.includes("quarantined:slice_a"));
  assert.throws(()=>changes("missing-revision"),/revision|argument|base/);
  f.git("checkout","--orphan","unrelated");await f.write("unrelated.txt","other history");const unrelated=f.commit();
  f.git("checkout","master");assert.throws(()=>changes(unrelated),/not an ancestor/);
  f.packs[1].source.push("pack_a/");await f.compile();
  assert.throws(()=>run("path","pack_a/unsliced.mjs"),/Ambiguous verification ownership/);
  await rm(path.join(f.root,"verification/packs.base.json"));
  assert.throws(()=>run("path","pack_a/unsliced.mjs"),/ENOENT|no such file/);
  console.log(JSON.stringify({ownershipHistory:{renameAcrossOwners:true,deletion:true,canonicalUnion:true,
    quarantine:true,nonmutation:true,invalidBase:true,ambiguity:true,missingAuthority:true}}));
}finally{await f.close();}
