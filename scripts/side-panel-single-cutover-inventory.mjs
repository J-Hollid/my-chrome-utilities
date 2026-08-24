import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import ts from "typescript";

const exec = promisify(execFile);

function callName(expression) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return "";
}

function position(sourceFile, node) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return { line:line + 1, column:character + 1 };
}

function collectSource(source) {
  const sourceFile = ts.createSourceFile(
    "src/side-panel.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS,
  );
  const inventory = {
    imports:[], stateOwners:[], functions:[], listeners:[], subscriptions:[],
    timers:[], commands:[], asynchronous:[],
  };

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      inventory.imports.push({ module:statement.moduleSpecifier.text, ...position(sourceFile, statement) });
    }
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      inventory.functions.push({ name:statement.name.text, async:Boolean(statement.modifiers?.some(
        ({ kind }) => kind === ts.SyntaxKind.AsyncKeyword)), ...position(sourceFile, statement) });
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        if (declaration.initializer &&
          (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
          inventory.functions.push({ name:declaration.name.text,
            async:Boolean(declaration.initializer.modifiers?.some(
              ({ kind }) => kind === ts.SyntaxKind.AsyncKeyword)), ...position(sourceFile, declaration) });
        } else {
          inventory.stateOwners.push({ name:declaration.name.text, ...position(sourceFile, declaration) });
        }
      }
    }
  }

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const name = callName(node.expression);
      const record = { expression:node.expression.getText(sourceFile), ...position(sourceFile, node) };
      if (name === "addEventListener" || name === "addListener") inventory.listeners.push(record);
      if (name === "subscribe") inventory.subscriptions.push(record);
      if (name === "setTimeout" || name === "setInterval") inventory.timers.push(record);
      if (/command/iu.test(name) || /command/iu.test(record.expression)) inventory.commands.push(record);
      if (ts.isAwaitExpression(node.parent)) inventory.asynchronous.push(record);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return inventory;
}

function assertionTargets(source) {
  return [...source.matchAll(/^\s*"([A-Z0-9_]+)":\s*\[/gmu)].map(([, id]) => id);
}

export async function collectSidePanelCutoverInventory({ repositoryRoot, base }) {
  const root = path.resolve(repositoryRoot);
  const [{ stdout:source }, assertionSource] = await Promise.all([
    exec("git", ["show", `${base}:src/side-panel.ts`], { cwd:root, encoding:"utf8",
      maxBuffer:16 * 1024 * 1024 }),
    readFile(path.join(root, "test/support/side-panel-browser-assertion-leaves.mjs"), "utf8"),
  ]);
  const collected = collectSource(source);
  return {
    version:1,
    baseCommit:base,
    source:{
      path:"src/side-panel.ts",
      sha256:createHash("sha256").update(source).digest("hex"),
      lines:source.split("\n").length - 1,
    },
    ...collected,
    assertionLeaves:assertionTargets(assertionSource),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const base = process.argv[2];
  if (!base) throw new Error("Use: side-panel-single-cutover-inventory.mjs <base>");
  process.stdout.write(`${JSON.stringify(await collectSidePanelCutoverInventory({
    repositoryRoot:process.cwd(), base,
  }), null, 2)}\n`);
}
