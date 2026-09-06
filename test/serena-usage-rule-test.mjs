import {matchesGlob} from "node:path";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {projectConfig,symbolRoute} from "../swarmforge/scripts/serena/config.mjs";
const rule=await readFile("swarmforge/scripts/shared-articles/tool-use.prompt","utf8");
for(const expression of [/file search for filenames, literal text, configuration/,/outlines/,/symbol structure and code references/,
  /ownership helper/,/concrete\nunanswered question/,/complete candidate diff/,/ordinary reads for unsupported .bb/,
  /external edit or checkout/,/refresh doubtful results or inspect current\nfiles/,/not verification proof/,
  /helped, neutral, or impeded/,/concrete\nreason/,/Missing\nobservations cannot block delivery/,/do not replay work or collect new telemetry/])
  assert.match(rule,expression);
const compact=rule.replace(/\s+/g," ");
for(const route of [
  "use a scoped Serena symbol overview for unfamiliar supported module structure",
  "use Serena symbols and references for callers affected by a split or interface",
  "A CSS selector or literal configuration uses ordinary file search",
  "Verification owners and consumers use the canonical ownership query",
  "Complete architecture review uses the full diff and suitable symbol work",
]) assert.ok(compact.toLowerCase().includes(route.toLowerCase()),route);
for(const condition of ["missing tool","server failure","stale symbol result","unsupported file type"])
  assert.ok(compact.includes(condition),condition);
assert.match(compact,/continue with ordinary inspection and one short fallback reason/);
assert.match(compact,/Generated instructions do not prove actual Serena use/);
assert.match(compact,/Do not install tools, replay work, or create a tool-use gate/);
for(const file of ["src/a.ts","test/a.mjs"])assert.equal(symbolRoute(file),"typescript");
for(const file of ["panel.css","panel.html","settings.json","swarmforge/scripts/a.bb","acceptance/a.clj"])
  assert.equal(symbolRoute(file),"ordinary");
assert.equal(symbolRoute("acceptance/a.clj",{clojureProvisioned:true}),"clojure");
const excluded=file=>projectConfig().ignored_paths.some(pattern=>matchesGlob(file,pattern));
for(const file of ['src/example.ts','test/example.mjs','scripts/example.mjs'])assert.equal(excluded(file),false);
for(const file of ['.worktrees/coder/src/a.ts','node_modules/package/a.js','vendor/a.js','dist/a.js','tmp/receipt.json','.swarmforge/receipt.json','.serena/cache/a'])
  assert.equal(excluded(file),true,file);
console.log(JSON.stringify({serenaUsage:{routes:true,currentFallback:true,observations:true,exclusions:true,assessment:true}}));
