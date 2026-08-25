import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import ts from "typescript";
import { collectSidePanelCutoverInventory } from "./side-panel-single-cutover-inventory.mjs";
import { reviewedControllerReplacements } from "../test/support/side-panel-controller-reviewed-replacements.mjs";

const base = "7f74443923";
const controllerPaths = ["capture", "event-library", "schemas", "defects", "replay", "projects",
  "durable-projects", "project-event-transport", "live-flow-testing"]
  .map((owner) => `src/data-layer-installed/${owner}/index.ts`).concat("src/data-layer-installed/runtime.ts");
const declarations = new Map(), calls = new Map();
const add = (map, key, value) => map.set(key, [...(map.get(key) ?? []), value]);
function declaredBindings(name) {
  if (ts.isIdentifier(name)) return [name];
  return name.elements.flatMap((element) => ts.isOmittedExpression(element) ? [] : declaredBindings(element.name));
}
for (const file of controllerPaths) {
  const source = await readFile(file, "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const position = (node) => ast.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  const localDeclarations = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node)) for (const binding of declaredBindings(node.name)) {
      const declaration = { path:file, symbol:binding.text, line:position(binding), live:false };
      localDeclarations.push(declaration); add(declarations, binding.text, declaration);
    }
    if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.name && ts.isIdentifier(node.name)) {
      const declaration = { path:file, symbol:node.name.text, line:position(node), live:false };
      localDeclarations.push(declaration); add(declarations, node.name.text, declaration);
    }
    if (ts.isCallExpression(node)) add(calls, node.getText(ast), { path:file,
      symbol:node.expression.getText(ast), invocation:node.getText(ast), line:position(node) });
    ts.forEachChild(node, visit);
  }
  visit(ast);
  const liveNames = new Set();
  const insideVoidPlaceholder = (node) => {
    for (let current = node.parent; current && !ts.isStatement(current); current = current.parent) {
      if (ts.isVoidExpression(current)) return true;
    }
    return false;
  };
  const isDeclarationName = (node) => (ts.isVariableDeclaration(node.parent) && node.parent.name === node)
    || ((ts.isFunctionDeclaration(node.parent) || ts.isMethodDeclaration(node.parent)) && node.parent.name === node);
  const isNonReferenceName = (node) => (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node)
    || ((ts.isPropertyAssignment(node.parent) || ts.isMethodDeclaration(node.parent)) && node.parent.name === node)
    || ts.isImportSpecifier(node.parent) || ts.isImportClause(node.parent);
  function visitUses(node) {
    if (ts.isIdentifier(node) && !isDeclarationName(node) && !isNonReferenceName(node) && !insideVoidPlaceholder(node)) {
      liveNames.add(node.text);
    }
    ts.forEachChild(node, visitUses);
  }
  visitUses(ast);
  for (const declaration of localDeclarations) declaration.live = liveNames.has(declaration.symbol);
}
const replacementMap = new Map();
for (const replacement of reviewedControllerReplacements) {
  if (replacementMap.has(replacement.identity)) throw new Error(`Duplicate reviewed replacement ${replacement.identity}`);
  if (!controllerPaths.includes(replacement.path)) throw new Error(`Replacement target is not a controller: ${replacement.path}`);
  const targets = replacement.kind === "call"
    ? [...calls.values()].flat().filter(({ symbol }) => symbol === replacement.symbol)
    : declarations.get(replacement.symbol) ?? [];
  const exactTargets = targets.filter(({ path:targetPath, live }) => targetPath === replacement.path
    && (replacement.kind === "call" || live));
  const lineTargets = replacement.line ? exactTargets.filter(({ line }) => line === replacement.line) : exactTargets;
  if (lineTargets.length !== 1) {
    throw new Error(`Reviewed replacement target is absent: ${replacement.path}::${replacement.symbol}`);
  }
  replacementMap.set(replacement.identity, replacement);
}
const inventory = await collectSidePanelCutoverInventory({ repositoryRoot:process.cwd(), base });
const frozenRoot = execFileSync("git", ["show", `${base}:src/side-panel.ts`], { encoding:"utf8" });
const frozenAst = ts.createSourceFile("src/side-panel.ts", frozenRoot, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const frozenCalls = new Map();
function visitFrozen(node) {
  if (ts.isCallExpression(node)) {
    const { line, character } = frozenAst.getLineAndCharacterOfPosition(node.getStart());
    frozenCalls.set(`${line + 1}:${character + 1}`, node.getText(frozenAst));
  }
  ts.forEachChild(node, visitFrozen);
}
visitFrozen(frozenAst);
const unresolved = [], duplicate = [], resolved = [];
const entries = [];
for (const kind of ["stateOwners", "functions", "listeners", "subscriptions", "timers"]) {
  for (const [index, record] of inventory[kind].entries()) {
    const label = record.name ?? record.expression;
    const identity = `${kind}:${index}:${label}@${record.line}:${record.column}`;
    const reviewed = replacementMap.get(identity);
    const invocation = kind === "stateOwners" || kind === "functions" ? undefined : frozenCalls.get(`${record.line}:${record.column}`);
    const candidates = kind === "stateOwners" || kind === "functions"
      ? (declarations.get(label) ?? []).filter(({ live }) => live) : calls.get(invocation) ?? [];
    if (reviewed) {
      const target = `${reviewed.path}::${reviewed.symbol}${reviewed.line ? `:${reviewed.line}` : ""}`;
      resolved.push({ identity, target, reviewed:true }); entries.push({ identity, kind, frozen:record, binding:{ status:"resolved", target, reviewed:true } });
    } else if (candidates.length === 1) {
      const target = `${candidates[0].path}::${candidates[0].symbol}:${candidates[0].line}`;
      resolved.push({ identity, target }); entries.push({ identity, kind, frozen:{ ...record, ...(invocation ? { invocation } : {}) }, binding:{ status:"resolved", target } });
    } else if (candidates.length === 0) {
      unresolved.push(identity); entries.push({ identity, kind, frozen:{ ...record, ...(invocation ? { invocation } : {}) }, binding:{ status:"pending" } });
    } else {
      const targets = candidates.map(({ path:targetPath, symbol, line }) => `${targetPath}::${symbol}:${line}`);
      duplicate.push({ identity, targets }); entries.push({ identity, kind, frozen:{ ...record, ...(invocation ? { invocation } : {}) }, binding:{ status:"ambiguous", targets } });
    }
  }
}
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
const manifest = `${JSON.stringify({ version:1, base, sourceSha256:inventory.source.sha256, entries }, null, 2)}\n`;
const manifestPath = "test/support/side-panel-controller-migration-manifest.json";
if (process.argv.includes("--write-manifest")) await writeFile(manifestPath, manifest);
else {
  const recorded = await readFile(manifestPath, "utf8");
  if (recorded !== manifest) throw new Error(`Controller migration manifest is stale; regenerate ${manifestPath}`);
}
console.log(JSON.stringify({ frozen:resolved.length + unresolved.length + duplicate.length, resolved:resolved.length,
  reviewed:resolved.filter(({ reviewed }) => reviewed).length, unresolved:unresolved.length, duplicate:duplicate.length,
  unresolvedSample:unresolved.slice(0, 25), duplicateSample:duplicate.slice(0, 10) }, null, 2));
if ((unresolved.length || duplicate.length) && !process.argv.includes("--report")) process.exitCode = 1;
