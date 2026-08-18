#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

export { authorityDigest, boundedExecutionScope, classifyOutcome, unblockerContentDigest,
  validateAuthorityClaim, validateStoredUnblocker, validateTransportUnblocker,
  validateUnblockerDraft } from "./unblocker-authority.mjs";
export { claimUnblocker, completeUnblocker, deliverUnblocker } from "./unblocker-queue.mjs";
import { unblockerCli } from "./unblocker-adapters.mjs";

if (process.argv[1] && fileURLToPath(import.meta.url)===path.resolve(process.argv[1])) {
  unblockerCli(process.argv.slice(2)).catch((error)=>{console.error(error.message); process.exitCode=1;});
}
