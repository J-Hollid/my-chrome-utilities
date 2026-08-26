import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  compiledVerificationRegistry,
  serializeVerificationRegistry,
} from "./compiler.mjs";

const defaultRoot = fileURLToPath(new URL("../../", import.meta.url));

export async function loadCompiledVerificationRegistry({ repositoryRoot = defaultRoot } = {}) {
  const canonicalPath = path.join(repositoryRoot, "verification/packs.json");
  const [canonicalBytes, compiled] = await Promise.all([
    readFile(canonicalPath, "utf8"),
    compiledVerificationRegistry({ repositoryRoot }),
  ]);
  const expected = serializeVerificationRegistry(compiled);
  if (canonicalBytes !== expected) {
    throw new Error("Generated verification/packs.json is stale; run the registry compiler");
  }
  return compiled;
}
