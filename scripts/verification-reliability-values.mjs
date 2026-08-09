import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
export const incidentIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;
export const shaPattern = /^[a-f0-9]{64}$/u;
export const retryClassifications = Object.freeze({
  passed:"confirmed-flaky",
  sameFailure:"reproduced-failure",
  failed:"changed-failure",
  identityChanged:"diagnostic-contract-failure",
});

export const timeoutRepairPackIds = Object.freeze([
  "branding_polish", "capture", "command-palette", "defects", "durable_project_repository",
  "event-library", "flow_export", "flow_graph", "guided_test_cases", "hotkeys", "layered_schema",
  "live_flow_testing", "project_assurance_severity", "project_event_transport", "project_management",
  "property_set_flow_sections", "replay", "schema_relationship_tree", "schemas", "shell",
].sort());

export function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalized(nested)]));
  }
  return value;
}

export function timeoutIncidentDigest(value) {
  return createHash("sha256").update(
    typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(normalized(value)),
  ).digest("hex");
}

function stableDiagnosticShape(value) {
  return String(value ?? "")
    .replaceAll(/\b\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z\b/gu, "<timestamp>")
    .replaceAll(/(?:\/tmp|tmp\/)[^\s:'"]+/gu, "<temporary-path>")
    .replaceAll(/\b(?:localhost|127\.0\.0\.1):\d+\b/gu, "<local-port>")
    .replaceAll(/\bpid[=: ]+\d+\b/giu, "pid=<pid>")
    .replaceAll(/\s+/gu, " ")
    .trim()
    .slice(0, 2048);
}

export function reliabilityFailureFingerprint({
  failureClass, task, failedBoundary, lastProgress, exitCode, signal, error, stderr,
} = {}) {
  if (typeof failureClass !== "string" || !failureClass) {
    throw new Error("Reliability failure fingerprint requires a failure class");
  }
  const boundary = failedBoundary ?? lastProgress ?? {};
  return timeoutIncidentDigest({
    failureClass,
    taskKey:task?.key,
    logicalTargetId:boundary.logicalTargetId,
    caseId:boundary.caseId,
    phase:boundary.phase,
    assertionSite:boundary.assertionSite,
    deadlineOwner:boundary.deadlineOwner,
    exitCode:exitCode ?? null,
    signal:signal ?? null,
    diagnostic:stableDiagnosticShape(boundary.state?.message || error || stderr),
  });
}

export function exactObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value;
}

export function stableIncidentId(value) {
  if (!incidentIdPattern.test(value ?? "") || value === "." || value === "..") {
    throw new Error(`Invalid timeout incident id: ${value}`);
  }
  return value;
}

export function boundedState(value, maximumCharacters) {
  if (value === undefined) return undefined;
  let encoded;
  try { encoded = JSON.stringify(value); }
  catch { encoded = JSON.stringify({ diagnostic:"unserializable progress state" }); }
  if (encoded.length <= maximumCharacters) return JSON.parse(encoded);
  return `${encoded.slice(0, Math.max(0, maximumCharacters - 10))}…`;
}

export function git(root, ...args) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd:root }, (error, stdout, stderr) => error
      ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim()));
  });
}
