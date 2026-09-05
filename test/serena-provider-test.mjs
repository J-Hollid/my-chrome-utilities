import assert from "node:assert/strict";
import {mkdtemp,rm,mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {inspectSerena,verifyDownload} from "../swarmforge/scripts/serena/provider.mjs";
const root=await mkdtemp(path.resolve("tmp/serena-provider-"));
try {
  const request={repositoryRoot:root,pin:{revision:"a".repeat(40),sha256:"b".repeat(64)}};
  const before=await inspectSerena(request);assert.equal(before.available,false);assert.match(before.reason,/missing/);
  await assert.rejects(verifyDownload(Buffer.from("wrong"),request.pin.sha256),/digest/);
  await mkdir(path.join(root,".serena/local"),{recursive:true});
  await writeFile(path.join(root,".serena/local/installed.json"),JSON.stringify({pin:{revision:"c".repeat(40)}}));
  const after=await inspectSerena(request);assert.equal(after.available,false);assert.match(after.reason,/pin/);
  console.log(JSON.stringify({serenaProvider:{offline:true,missing:true,pinMismatch:true,digestMismatch:true}}));
} finally {await rm(root,{recursive:true,force:true});}
