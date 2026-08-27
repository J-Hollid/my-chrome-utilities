#!/usr/bin/env node
import { pathToFileURL } from "node:url";

export * from "./verification-performance/report-throughput.mjs";
import { runVerificationThroughputCommand } from "./verification-performance/report-throughput.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runVerificationThroughputCommand(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
