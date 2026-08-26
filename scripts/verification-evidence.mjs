#!/usr/bin/env node
import { pathToFileURL } from "node:url";

export * from "./verification-evidence/core.mjs";
import { runVerificationEvidenceCommand } from "./verification-evidence/core.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runVerificationEvidenceCommand(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
