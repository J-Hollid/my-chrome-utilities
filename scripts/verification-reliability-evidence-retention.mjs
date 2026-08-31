import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { atomicWriteFile } from "./dist-artifact.mjs";
import { withIncidentLock } from "./verification-reliability-persistence.mjs";

const shaPattern = /^[a-f0-9]{40,64}$/u;

function validateReceiptIdentity(identity) {
  if (!identity || !shaPattern.test(identity.candidateCommit ?? "") ||
      !shaPattern.test(identity.baseCommit ?? "") || !shaPattern.test(identity.tree ?? "") ||
      !shaPattern.test(identity.planDigest ?? "") || typeof identity.task !== "string" ||
      typeof identity.runIntent !== "string") {
    throw new Error("Receipt retention requires exact candidate, base, tree, task, plan, and run intent");
  }
}

export function receiptRetentionDecision({ receiptIdentity, identityMatches, currentConsumer,
  activeObligation, integrationComplete = false }) {
  validateReceiptIdentity(receiptIdentity);
  if (activeObligation && activeObligation.status !== "resolved") {
    const consumer = activeObligation.kind && activeObligation.id
      ? { kind:activeObligation.kind, id:activeObligation.id }
      : { kind:"incident", id:activeObligation.incidentId };
    return { action:"retain", consumer,
      reason:consumer.kind === "incident" ? "active incident obligation requires the evidence" :
        "active authorized consumer requires the evidence" };
  }
  if (identityMatches && currentConsumer) {
    return { action:"retain", consumer:structuredClone(currentConsumer),
      reason:"authorized consumer is active" };
  }
  if (!identityMatches) {
    return { action:"remove", consumer:null,
      reason:"evidence identity does not match an authorized consumer" };
  }
  if (integrationComplete) {
    return { action:"remove", consumer:null,
      reason:"evidence was consumed and has no active obligation" };
  }
  return { action:"retain", consumer:null, reason:"durable disposition is incomplete" };
}

export function createSharedEvidenceRetention({ statePath } = {}) {
  if (!statePath) throw new Error("Shared evidence retention requires durable state");
  let queue=Promise.resolve();
  const load=async() => {
    try {
      const state=JSON.parse(await readFile(statePath,"utf8"));
      if (state?.version!==1||typeof state.content!=="object") {
        throw new Error("Shared evidence retention state is invalid");
      }
      return state;
    } catch (error) {
      if (error.code==="ENOENT") return {version:1,content:{}};
      throw error;
    }
  };
  const store=async(state) => {
    await mkdir(path.dirname(statePath),{recursive:true});
    await atomicWriteFile(statePath,`${JSON.stringify(state,null,2)}\n`);
  };
  const update=(operation) => {
    const result=queue.then(async()=>{
      const directory=path.dirname(statePath);
      await mkdir(directory,{recursive:true});
      return withIncidentLock(directory,"shared-evidence-retention",async()=>{
        const state=await load(),value=await operation(state);
        await store(state);return value;
      });
    });
    queue=result.catch(()=>{});return result;
  };
  const exact=(value,label) => {
    if (typeof value!=="string"||!value) throw new Error(`Shared evidence ${label} is invalid`);
  };
  return {
    retain(contentIdentity, consumer) {
      exact(contentIdentity,"content identity");exact(consumer,"consumer identity");
      return update((state) => {
        const consumers=new Set(state.content[contentIdentity]?.consumers??[]);
        consumers.add(consumer);
        state.content[contentIdentity]={consumers:[...consumers].sort()};
      });
    },
    async consumers(contentIdentity) {
      exact(contentIdentity,"content identity");
      return [...((await load()).content[contentIdentity]?.consumers??[])].sort();
    },
    release(contentIdentity, consumer) {
      exact(contentIdentity,"content identity");exact(consumer,"consumer identity");
      return update((state) => {
        const consumers=new Set(state.content[contentIdentity]?.consumers??[]);
        consumers.delete(consumer);
        if (consumers.size) state.content[contentIdentity]={consumers:[...consumers].sort()};
        else delete state.content[contentIdentity];
        return {removable:consumers.size===0,consumers:[...consumers].sort()};
      });
    },
    replaceConsumers(contentIdentity, consumers) {
      exact(contentIdentity,"content identity");
      for (const consumer of consumers) exact(consumer,"consumer identity");
      return update((state) => {
        const exactConsumers=[...new Set(consumers)].sort();
        if (exactConsumers.length) state.content[contentIdentity]={consumers:exactConsumers};
        else delete state.content[contentIdentity];
        return {removable:exactConsumers.length===0,consumers:exactConsumers};
      });
    },
  };
}

export async function applyReceiptDisposition({ path, identity, decision, priorResult,
  recordCompactFact, remove }) {
  validateReceiptIdentity(identity);
  if (decision.action === "retain") {
    if (priorResult?.status==="retained"&&priorResult.reason===decision.reason) {
      return structuredClone(priorResult);
    }
    const retained={status:"retained",path,identity:structuredClone(identity),
      reason:decision.reason,consumer:decision.consumer};
    await recordCompactFact(retained);
    return retained;
  }
  if (decision.action !== "remove") throw new Error("Receipt disposition action is unknown");
  if (priorResult?.status==="removed") return structuredClone(priorResult);
  const compactFact = { status:"removal-pending", path,
    identity:structuredClone(identity), reason:decision.reason };
  if (priorResult?.status!=="removal-pending") await recordCompactFact(compactFact);
  await remove(path);
  const removed={...compactFact,status:"removed",removedAt:new Date().toISOString()};
  await recordCompactFact(removed);
  return removed;
}
