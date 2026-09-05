import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = await mkdtemp(path.resolve("tmp/calibration-source-test-"));
try {
  const test = fileURLToPath(new URL("./calibration-rule-test.mjs",import.meta.url));
  const run = () => execFileSync(process.execPath,[test],{cwd:root,encoding:"utf8"});
  const absent = run();
  await mkdir(path.join(root,"tmp/verification-receipts"),{recursive:true});
  await writeFile(path.join(root,"tmp/verification-receipts/unrelated.json"),"not a receipt");
  const populated = run();
  assert.equal(populated,absent,"unrelated ambient receipt bytes cannot affect authored rule inputs");
  console.log(JSON.stringify({calibrationSources:{absent:true,populated:true,identical:true}}));
} finally {await rm(root,{recursive:true,force:true});}
