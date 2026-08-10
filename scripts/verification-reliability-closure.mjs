import { normalized, timeoutIncidentDigest } from "./verification-reliability-values.mjs";

export const boundedClosureContractRevision = "2f609d7a19fd966eb82c54b2938df1fd78e2d836";

const failureDomains = new Set([
  "product-runtime",
  "verification-execution",
  "verification-record",
  "environment-prerequisite",
]);

const verificationExecutionBoundaries = new Set([
  "runner", "planner", "harness", "verification-acceptance",
]);
const verificationRecordBoundaries = new Set([
  "storage", "evidence", "history", "receipt-finalization", "promotion",
]);

export function normalizeReliabilityDiagnostic(value) {
  return String(value ?? "")
    .replaceAll(/\b\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z\b/gu, "<timestamp>")
    .replaceAll(/(?:\/tmp|tmp\/)[^\s:'"]+/gu, "<temporary-path>")
    .replaceAll(/\b(?:localhost|127\.0\.0\.1):\d+\b/gu, "<local-port>")
    .replaceAll(/\bpid[=: ]+\d+\b/giu, "pid=<pid>")
    .replaceAll(/user-[a-f0-9-]{16,}/giu, "user-<generated>")
    .replaceAll(/\s+/gu, " ")
    .trim()
    .slice(0, 2048);
}

export function classifyReliabilityFailureDomain({
  launchAuthorized,
  taskResultImmutable = false,
  ownership,
  boundary,
} = {}) {
  if (launchAuthorized === false) return "environment-prerequisite";
  if (!['product', 'verification'].includes(ownership)) {
    throw new Error("Reliability failure domain requires declared ownership");
  }
  if (taskResultImmutable || verificationRecordBoundaries.has(boundary)) {
    if (ownership !== "verification") {
      throw new Error("Post-result record boundaries require verification ownership");
    }
    return "verification-record";
  }
  if (ownership === "verification" && verificationExecutionBoundaries.has(boundary)) {
    return "verification-execution";
  }
  if (ownership === "product" && boundary === "runtime" && launchAuthorized === true) {
    return "product-runtime";
  }
  throw new Error("Reliability failure domain is not declared for the executed influence boundary");
}

function stableExecutableBoundary(task, executableBoundary) {
  const value = executableBoundary ?? task?.target ?? [task?.executable, ...(task?.args ?? [])].join(" ");
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Causal incident identity requires a stable executable boundary");
  }
  return value.trim();
}

export function causalFailureIdentity({
  domain,
  task,
  executableBoundary,
  scenarioId,
  caseId,
  assertionSite,
  diagnostic,
} = {}) {
  if (!failureDomains.has(domain) || typeof task?.key !== "string" || !task.key) {
    throw new Error("Causal incident identity requires a declared domain and canonical task");
  }
  const identity = normalized({
    domain,
    taskKey:task.key,
    executableBoundary:stableExecutableBoundary(task, executableBoundary),
    scenarioOrCase:caseId ?? scenarioId ?? null,
    assertionSite:assertionSite ?? null,
    diagnosticShape:normalizeReliabilityDiagnostic(diagnostic),
  });
  return { ...identity, key:timeoutIncidentDigest(identity) };
}

function acceptanceFailureCase(diagnostic) {
  const match = String(diagnostic ?? "").match(/Acceptance execution failed:\s*([^:\n]+(?:\/example_\d+)?):\s*([^\n;]+)/u);
  return match ? { caseId:match[1].trim(), assertion:match[2].trim() } : {};
}

function verificationOwnedTask(task, diagnostic) {
  if (/^(?:unit:)?test\/verification-|^unit:test\/swarmforge-|^promotion:/u.test(task?.key ?? "")) {
    return true;
  }
  return task?.stage === "acceptance-session" &&
    /modular-(?:verification-packs|chrome-utility-architecture)/u.test(String(diagnostic ?? ""));
}

export function reliabilityFailureContract({
  task,
  failureClass,
  failedBoundary,
  lastProgress,
  stderr,
  error,
  taskResultImmutable = false,
  launchAuthorized = true,
  resultDigestInputs = {},
} = {}) {
  const diagnostic = String(stderr || error || failedBoundary?.state?.message || "");
  const verificationOwned = verificationOwnedTask(task, diagnostic);
  const boundary = launchAuthorized === false ? "capability"
    : taskResultImmutable ? "promotion"
      : verificationOwned && task?.stage === "acceptance-session" ? "verification-acceptance"
        : verificationOwned ? "runner" : "runtime";
  const domain = classifyReliabilityFailureDomain({
    launchAuthorized, taskResultImmutable,
    ownership:verificationOwned || taskResultImmutable ? "verification" : "product",
    boundary,
  });
  const acceptance = acceptanceFailureCase(diagnostic);
  const observed = failedBoundary ?? lastProgress ?? {};
  const causal = causalFailureIdentity({
    domain,
    task,
    executableBoundary:task?.target ?? [task?.executable, ...(task?.args ?? [])].join(" "),
    caseId:observed.caseId ?? acceptance.caseId,
    assertionSite:observed.assertionSite ?? null,
    diagnostic:acceptance.assertion ?? (diagnostic || failureClass),
  });
  const occurrence = normalized({
    commit:resultDigestInputs.commit,
    tree:resultDigestInputs.tree,
    resultDigest:timeoutIncidentDigest({ failureClass, ...resultDigestInputs }),
    diagnostic:normalizeReliabilityDiagnostic(acceptance.assertion ?? (diagnostic || failureClass)),
  });
  return { contractRevision:boundedClosureContractRevision, failureDomain:domain,
    causalIdentity:causal, causalKey:causal.key, occurrence };
}

export function closureDisposition({
  lineageCondition,
  selectedLineage,
  reason,
  causalKey,
  regressionReceiptSha256,
} = {}) {
  if (lineageCondition === "off-lineage") {
    if (typeof selectedLineage?.commit !== "string" || !selectedLineage.commit ||
        typeof selectedLineage?.tree !== "string" || !selectedLineage.tree ||
        typeof reason !== "string" || !reason.trim()) {
      throw new Error("Lineage retirement requires the selected lineage and audited reason");
    }
    return { kind:"lineage-retired", blocking:false, resolved:false,
      selectedLineage:structuredClone(selectedLineage), reason:reason.trim() };
  }
  if (lineageCondition === "ancestor-product-runtime") {
    return { kind:"blocking-product-repair", blocking:true, resolved:false };
  }
  if (lineageCondition === "grouped-verifier-cause") {
    if (!/^[a-f0-9]{64}$/u.test(causalKey ?? "") ||
        !/^[a-f0-9]{64}$/u.test(regressionReceiptSha256 ?? "")) {
      throw new Error("Verifier supersession requires an exact causal key and regression receipt");
    }
    return { kind:"verifier-cause-superseded", blocking:false, resolved:false,
      causalKey, regressionReceiptSha256 };
  }
  if (lineageCondition === "ancestor-verification") {
    return { kind:"blocking-verification-repair", blocking:true, resolved:false };
  }
  throw new Error(`Unsupported audited lineage condition: ${lineageCondition}`);
}

const closureInputFields = [
  "contractRevision", "task", "transitiveCode", "featureInputs", "handlerInputs",
  "generatedInputs", "productArtifact", "runnerSemantics", "prerequisiteSemantics",
  "environment", "toolchain", "limits",
];
const influenceFields = ["transitiveCode", "featureInputs", "handlerInputs", "generatedInputs"];

export function completeTaskInputClosure(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).some((key) => !closureInputFields.includes(key)) ||
      closureInputFields.some((field) => value[field] === undefined)) {
    throw new Error("Task input closure is incomplete or contains an unknown input");
  }
  if (value.contractRevision !== boundedClosureContractRevision) {
    throw new Error("Task input closure uses a different frozen contract revision");
  }
  if (influenceFields.some((field) => value[field]?.complete !== true)) {
    throw new Error("Task input closure requires complete influence proof");
  }
  const input = normalized(structuredClone(value));
  return { version:1, input, digest:timeoutIncidentDigest(input) };
}

export function inputEquivalentTaskProof({ priorResult, priorInput, currentInput } = {}) {
  if (priorResult?.status !== "passed") return { action:"fresh", reason:"prior-result-not-passed" };
  let prior;
  let current;
  try {
    prior = completeTaskInputClosure(priorInput);
    current = completeTaskInputClosure(currentInput);
  } catch (error) {
    return { action:"fresh", reason:"incomplete-influence", diagnostic:error.message };
  }
  if (prior.digest !== current.digest || priorResult.inputDigest !== prior.digest) {
    return { action:"fresh", reason:"task-input-changed" };
  }
  const provenanceFields = ["commit", "tree", "receiptPath", "resultDigest"];
  if (provenanceFields.some((field) => typeof priorResult[field] !== "string" || !priorResult[field])) {
    return { action:"fresh", reason:"prior-provenance-incomplete" };
  }
  return { action:"input-equivalent", inputDigest:current.digest,
    prior:{ commit:priorResult.commit, tree:priorResult.tree,
      receiptPath:priorResult.receiptPath, resultDigest:priorResult.resultDigest } };
}

export function terminalClosureExecution({ attempt, runnablePackCount } = {}) {
  if (runnablePackCount !== 20) {
    throw new Error("Bounded terminal closure requires all 20 runnable packs");
  }
  if (attempt === "initial") {
    return { taskPolicy:"fresh-all", runnablePackCount, packagePolicy:"fresh" };
  }
  if (attempt === "verifier-descendant") {
    return { taskPolicy:"fresh-or-input-equivalent", runnablePackCount, packagePolicy:"fresh" };
  }
  throw new Error(`Unsupported terminal closure attempt: ${attempt}`);
}
