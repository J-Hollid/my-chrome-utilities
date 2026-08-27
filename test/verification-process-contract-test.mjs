import path from "node:path";
import { fileURLToPath } from "node:url";

import "./verification-policy-contract-routing-test.mjs";
import { runVerificationProcessCompatibility } from
  "../scripts/verification-policy/process-contract-compatibility.mjs";

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runVerificationProcessCompatibility();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
