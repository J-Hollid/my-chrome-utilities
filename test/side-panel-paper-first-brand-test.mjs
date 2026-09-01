import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const moduleNames=[
  "shell.css",
  "live-transport.css",
  "projects-repository.css",
  "library-sessions.css",
  "defects-schemas.css",
  "hotkeys.css",
  "shared.css",
];
const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");
const [foundation,html,composition,...modules]=await Promise.all([
  read("twatility-brand.css"),
  read("side-panel.html"),
  read("side-panel-brand.css"),
  ...moduleNames.map((name)=>read(`side-panel-brand/${name}`)),
]);

for(const role of[
  "--twa-surface-page",
  "--twa-surface-raised",
  "--twa-surface-subtle",
  "--twa-foreground-ink",
  "--twa-brand-strong",
  "--twa-state-selected",
  "--twa-action-destructive",
]) assert.match(foundation,new RegExp(`${role}:\\s*var\\(`,"u"),`missing shared semantic role ${role}`);
assert.match(foundation,/--twa-focus:\s*#[0-9a-f]{6}/iu,"missing shared semantic focus role");

const links=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/gu)].map(([,href])=>href);
const expectedImports=moduleNames.map((name)=>`side-panel-brand/${name}`);
assert.equal(links.filter((href)=>href==="side-panel-brand.css").length,1,
  "the side panel must load one stable composition stylesheet");
assert.deepEqual([...composition.matchAll(/@import url\("([^"]+)"\);/gu)].map(([,href])=>href),
  expectedImports,"the composition stylesheet must load focused modules in deterministic order");
assert.doesNotMatch(composition,/\{[^}]*\}/su,
  "the former monolith must not retain workflow presentation rules");

const shell=modules[0],shared=modules.at(-1);
assert.match(shell,/:root\s*\{[^}]*color-scheme:\s*light/su,
  "the side-panel document root must not force dark native controls");
assert.match(shell,/body\.twatility-side-panel\s*\{[^}]*background:\s*var\(--twa-surface-page\)[^}]*color:\s*var\(--twa-foreground-ink\)/su,
  "the page canvas must use paper and dark ink");
assert.match(shell,/#application-header\s*\{[^}]*background:\s*var\(--twa-brand-strong\)[^}]*color:\s*var\(--twa-surface-raised\)/su,
  "the masthead must retain strong navy with raised-paper text");
assert.match(shared,/\.twatility-side-panel button\s*\{[^}]*background:\s*var\(--twa-surface-raised\)[^}]*color:\s*var\(--twa-brand-strong\)/su,
  "ordinary actions must use raised paper and navy text");
assert.match(shared,/data-action-variant="primary"[\s\S]*?background:\s*var\(--twa-brand-strong\)[\s\S]*?color:\s*var\(--twa-surface-raised\)/u,
  "primary actions must use strong navy and raised-paper text");
assert.match(shared,/data-action-variant="destructive"[\s\S]*?background:\s*var\(--twa-action-destructive\)/u,
  "destructive actions must use the shared destructive role");

for(const [index,source] of modules.entries()){
  assert.match(source,new RegExp(`Responsibility: ${moduleNames[index].replace(".css","")}`,"u"),
    `${moduleNames[index]} must declare one responsibility`);
  assert.ok(source.split(/\r?\n/u).length<600,`${moduleNames[index]} must not become a replacement monolith`);
  assert.doesNotMatch(source,/@import|https?:|data:/iu,`${moduleNames[index]} must remain extension-local`);
}

console.log("Side-panel paper-first brand contract tests passed");
