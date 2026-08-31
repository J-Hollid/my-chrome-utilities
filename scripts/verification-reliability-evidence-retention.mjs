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
    return { action:"retain", consumer:{ kind:"incident", id:activeObligation.incidentId },
      reason:"active incident obligation requires the evidence" };
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

export function createSharedEvidenceRetention() {
  const retained = new Map();
  return {
    retain(contentIdentity, consumer) {
      if (!contentIdentity || !consumer) throw new Error("Shared evidence requires exact identities");
      const consumers = retained.get(contentIdentity) ?? new Set();
      consumers.add(consumer);
      retained.set(contentIdentity, consumers);
    },
    consumers(contentIdentity) {
      return [...(retained.get(contentIdentity) ?? [])].sort();
    },
    release(contentIdentity, consumer) {
      const consumers = retained.get(contentIdentity) ?? new Set();
      consumers.delete(consumer);
      if (!consumers.size) retained.delete(contentIdentity);
      return { removable:consumers.size === 0, consumers:[...consumers].sort() };
    },
  };
}

export async function applyReceiptDisposition({ path, identity, decision, priorResult,
  recordCompactFact, remove }) {
  validateReceiptIdentity(identity);
  if (priorResult) return structuredClone(priorResult);
  if (decision.action === "retain") {
    return { status:"retained", path, reason:decision.reason, consumer:decision.consumer };
  }
  if (decision.action !== "remove") throw new Error("Receipt disposition action is unknown");
  const compactFact = { identity:structuredClone(identity), result:"removed", reason:decision.reason };
  await recordCompactFact(compactFact);
  await remove(path);
  return { status:"removed", path, compactFact };
}

