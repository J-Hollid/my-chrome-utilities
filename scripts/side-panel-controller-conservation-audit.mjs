import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import ts from "typescript";
import { collectSidePanelCutoverInventory } from "./side-panel-single-cutover-inventory.mjs";
import { reviewedControllerReplacements } from "../test/support/side-panel-controller-reviewed-replacements.mjs";

const base = "7f74443923";
const controllerPaths = ["capture", "event-library", "schemas", "defects", "replay", "projects",
  "durable-projects", "project-event-transport", "live-flow-testing"]
  .map((owner) => `src/data-layer-installed/${owner}/index.ts`);
const declarations = new Map(), calls = new Map();
const add = (map, key, value) => map.set(key, [...(map.get(key) ?? []), value]);
for (const file of controllerPaths) {
  const source = await readFile(file, "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const position = (node) => ast.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) add(declarations, node.name.text, { path:file, symbol:node.name.text, line:position(node) });
    if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.name && ts.isIdentifier(node.name)) add(declarations, node.name.text, { path:file, symbol:node.name.text, line:position(node) });
    if (ts.isCallExpression(node)) add(calls, node.expression.getText(ast), { path:file, symbol:node.expression.getText(ast), line:position(node) });
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
const replacementMap = new Map();
for (const replacement of reviewedControllerReplacements) {
  if (replacementMap.has(replacement.identity)) throw new Error(`Duplicate reviewed replacement ${replacement.identity}`);
  if (!controllerPaths.includes(replacement.path)) throw new Error(`Replacement target is not a controller: ${replacement.path}`);
  const targets = (replacement.kind === "call" ? calls : declarations).get(replacement.symbol) ?? [];
  const exactTargets = targets.filter(({ path:targetPath }) => targetPath === replacement.path);
  if (exactTargets.length !== 1) {
    throw new Error(`Reviewed replacement target is absent: ${replacement.path}::${replacement.symbol}`);
  }
  replacementMap.set(replacement.identity, replacement);
}
const inventory = await collectSidePanelCutoverInventory({ repositoryRoot:process.cwd(), base });
const unresolved = [], duplicate = [], resolved = [];
for (const kind of ["stateOwners", "functions", "listeners", "subscriptions", "timers"]) {
  for (const [index, record] of inventory[kind].entries()) {
    const label = record.name ?? record.expression;
    const identity = `${kind}:${index}:${label}@${record.line}:${record.column}`;
    const reviewed = replacementMap.get(identity);
    if (reviewed) { resolved.push({ identity, target:`${reviewed.path}::${reviewed.symbol}`, reviewed:true }); continue; }
    const candidates = (kind === "stateOwners" || kind === "functions" ? declarations : calls).get(label) ?? [];
    if (candidates.length === 1) resolved.push({ identity, target:`${candidates[0].path}::${candidates[0].symbol}` });
    else if (candidates.length === 0) unresolved.push(identity);
    else duplicate.push({ identity, targets:candidates.map(({ path:targetPath, symbol }) => `${targetPath}::${symbol}`) });
  }
}
const frozenRoot = execFileSync("git", ["show", `${base}:src/side-panel.ts`], { encoding:"utf8" });
const usedReviewed = new Set(resolved.filter(({ reviewed }) => reviewed).map(({ identity }) => identity));
for (const identity of replacementMap.keys()) if (!usedReviewed.has(identity)) throw new Error(`Reviewed replacement does not bind a frozen identity: ${identity}`);
const currentRoot = await readFile("src/side-panel.ts", "utf8");
if (currentRoot !== frozenRoot) {
  const rootAst = ts.createSourceFile("src/side-panel.ts", currentRoot, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const retained = [];
  function visitRoot(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && inventory.stateOwners.some(({ name }) => name === node.name.text)) retained.push(`state:${node.name.text}`);
    if (ts.isFunctionDeclaration(node) && node.name && inventory.functions.some(({ name }) => name === node.name.text)) retained.push(`function:${node.name.text}`);
    if (ts.isCallExpression(node) && [...inventory.listeners, ...inventory.subscriptions, ...inventory.timers]
      .some(({ expression }) => expression === node.expression.getText(rootAst))) retained.push(`call:${node.expression.getText(rootAst)}`);
    ts.forEachChild(node, visitRoot);
  }
  visitRoot(rootAst);
  if (retained.length) throw new Error(`Composition root retains frozen identities:\n${retained.join("\n")}`);
}
console.log(JSON.stringify({ frozen:resolved.length + unresolved.length + duplicate.length, resolved:resolved.length,
  reviewed:resolved.filter(({ reviewed }) => reviewed).length, unresolved:unresolved.length, duplicate:duplicate.length,
  unresolvedSample:unresolved.slice(0, 25), duplicateSample:duplicate.slice(0, 10) }, null, 2));
if ((unresolved.length || duplicate.length) && !process.argv.includes("--report")) process.exitCode = 1;
