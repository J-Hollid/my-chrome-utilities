import { createHash } from "node:crypto";

export function canonicalSuccessionValue(value) {
  if (Array.isArray(value)) return value.map(canonicalSuccessionValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort()
      .map((key) => [key, canonicalSuccessionValue(value[key])]));
  }
  return value;
}

export function successionDigest(value) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalSuccessionValue(value))).digest("hex");
}

export function sameSuccessionValue(left, right) {
  return JSON.stringify(canonicalSuccessionValue(left)) ===
    JSON.stringify(canonicalSuccessionValue(right));
}

export const verificationTaskDigest = successionDigest;
export const taskSuccessionBoundaryDigest = successionDigest;
