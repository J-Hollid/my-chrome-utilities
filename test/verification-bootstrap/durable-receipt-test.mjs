import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp,readFile,writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {claimBootstrapRun,completeBootstrapRun,waitForBootstrapRun} from
  "../../scripts/verification-bootstrap/durable-store.mjs";
import {createReviewBootstrapReceipt,validateReviewBootstrapReceipt} from
  "../../scripts/verification-bootstrap/receipt.mjs";
import {canonicalBootstrapPlan} from "../../scripts/verification-bootstrap/plan.mjs";
import {bootstrapPlan} from "./fixtures.mjs";

const root=await mkdtemp(path.join(os.tmpdir(),"bootstrap-durable-"));
const file=path.join(root,"run.json"),identity={candidateCommit:"b".repeat(40),
  candidateTree:"c".repeat(40),planDigest:"d".repeat(64),toolchainDigest:"e".repeat(64),
  registryDigest:"f".repeat(64),task:"verification-process-bootstrap-fast-path",incidentIds:[]};
const [first,second]=await Promise.all([
  claimBootstrapRun(file,identity,"owner-a"),claimBootstrapRun(file,identity,"owner-b"),
]);
assert.equal([first,second].filter(({action})=>action==="start").length,1);
assert.equal([first,second].filter(({action})=>action==="wait").length,1);

const plan=canonicalBootstrapPlan(bootstrapPlan());
const results=plan.tasks.map((task)=>({key:task.key,status:"passed",identity:task}));
const receipt=createReviewBootstrapReceipt({plan,taskResults:results,runId:"run",
  startedAt:"2026-09-02T00:00:00.000Z",completedAt:"2026-09-02T00:00:01.000Z",
  registryDigest:identity.registryDigest});
const receiptPath=path.join(root,"receipt.json"),bytes=Buffer.from(`${JSON.stringify(receipt)}\n`);
await writeFile(receiptPath,bytes);
const owner=[first,second].find(({action})=>action==="start").run.ownerToken;
const waiting=waitForBootstrapRun(file,identity,{timeoutMs:500,pollMs:5});
await completeBootstrapRun(file,owner,{receiptPath,receiptSha256:createHash("sha256")
  .update(bytes).digest("hex")});
const completed=await waiting;
assert.equal(completed.status,"completed");
assert.equal(validateReviewBootstrapReceipt(JSON.parse(await readFile(receiptPath,"utf8")),plan,
  identity.registryDigest).runId,"run");
await writeFile(receiptPath,"{}\n");
await assert.rejects(()=>waitForBootstrapRun(file,identity,{timeoutMs:50,pollMs:5,
  validateReceipt:true}),/receipt digest/u);
await assert.rejects(()=>claimBootstrapRun(file,identity,"owner-c"),/receipt digest/u);

console.log("verification bootstrap durable receipt contracts passed");
