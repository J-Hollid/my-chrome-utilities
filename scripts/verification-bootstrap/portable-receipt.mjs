import {createHash} from "node:crypto";

export function encodePortableReceipt(bytes) {
  const value=Buffer.from(bytes);
  return {rawBase64:value.toString("base64"),
    sha256:createHash("sha256").update(value).digest("hex")};
}

export function decodePortableReceipt(value) {
  if (typeof value?.rawBase64!=="string"||!/^[A-Za-z0-9+/]*={0,2}$/u.test(value.rawBase64)) {
    throw new Error("Bootstrap portable receipt encoding is invalid");
  }
  const bytes=Buffer.from(value.rawBase64,"base64");
  if (bytes.toString("base64")!==value.rawBase64||
      createHash("sha256").update(bytes).digest("hex")!==value.sha256) {
    throw new Error("Bootstrap portable receipt digest changed");
  }
  return bytes;
}
