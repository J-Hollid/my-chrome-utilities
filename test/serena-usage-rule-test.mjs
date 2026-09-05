import {matchesGlob} from "node:path";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {projectConfig} from "../swarmforge/scripts/serena/config.mjs";
const rule=await readFile("swarmforge/scripts/shared-articles/tool-use.prompt","utf8");
for(const expression of [/file search for filenames, literal text, configuration/,/outlines/,/symbol structure and code references/,
  /ownership helper/,/concrete\nunanswered question/,/complete candidate diff/,/ordinary reads for unsupported .bb/,
  /external edit or checkout/,/refresh doubtful results or inspect current\nfiles/,/not verification proof/,
  /helped, neutral, or impeded/,/concrete\nreason/,/Missing\nobservations cannot block delivery/,/do not replay work or collect new telemetry/])
  assert.match(rule,expression);
const excluded=file=>projectConfig().ignored_paths.some(pattern=>matchesGlob(file,pattern));
for(const file of ['src/example.ts','test/example.mjs','scripts/example.mjs'])assert.equal(excluded(file),false);
for(const file of ['.worktrees/coder/src/a.ts','node_modules/package/a.js','vendor/a.js','dist/a.js','tmp/receipt.json','.swarmforge/receipt.json','.serena/cache/a'])
  assert.equal(excluded(file),true,file);
console.log(JSON.stringify({serenaUsage:{routes:true,currentFallback:true,observations:true,exclusions:true}}));
