#!/usr/bin/env node
import { pathToFileURL } from "node:url";

export * from "./verification-execution/runner.mjs";
import { runFocusedAcceptanceCli } from "./verification-execution/runner.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runFocusedAcceptanceCli();
}
