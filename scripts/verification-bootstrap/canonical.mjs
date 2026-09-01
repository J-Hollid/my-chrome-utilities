import {createHash} from "node:crypto";

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value&&typeof value==="object") return `{${Object.keys(value).sort()
    .map((key)=>`${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function bootstrapDigest(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function stableIdentity(value,name) {
  if (typeof value!=="string"||!/^[a-f0-9]{40,64}$/u.test(value)) {
    throw new Error(`Bootstrap ${name} identity is invalid`);
  }
  return value;
}
