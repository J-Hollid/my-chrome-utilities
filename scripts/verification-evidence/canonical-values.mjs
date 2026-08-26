import { createHash } from "node:crypto";

function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalized(nested)]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(normalized(value));
}

export function verificationDigest(value) {
  return createHash("sha256").update(
    typeof value === "string" || Buffer.isBuffer(value) ? value : canonicalJson(value),
  ).digest("hex");
}

export function sameEvidenceValue(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

export function sortedUniqueEvidenceValues(values) {
  return [...new Set(values)].sort();
}
