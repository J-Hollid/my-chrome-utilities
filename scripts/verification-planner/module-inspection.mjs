import { spawn } from "node:child_process";
import path from "node:path";
import ts from "typescript";

export const sharedBrowserHarnessPath = "test/browser-packs/shared-harness.mjs";

export function staticallyResolvableModuleImports(source, importerPath) {
  const sourceFile = ts.createSourceFile(importerPath, source, ts.ScriptTarget.Latest,
    true, ts.ScriptKind.JS);
  if (sourceFile.parseDiagnostics.length) {
    const diagnostic = sourceFile.parseDiagnostics[0];
    throw new Error(`Cannot parse browser adapter imports for ${importerPath}: ${
      ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
  }
  const imported = new Set();
  const add = (specifier) => {
    if (!specifier?.startsWith(".")) return;
    imported.add(path.posix.normalize(path.posix.join(path.posix.dirname(importerPath), specifier)));
  };
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
      add(node.moduleSpecifier.text);
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0])) {
      add(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return [...imported].sort();
}

export function browserAdapterUsesSharedHarness(source, adapterPath) {
  return staticallyResolvableModuleImports(source, adapterPath).includes(sharedBrowserHarnessPath);
}

export function clojureRequiresNamespace(source, namespace) {
  const withoutStringsOrComments = source.replace(/"(?:\\\\.|[^"\\\\])*"|;[^\n\r]*/gu, " ");
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const token = (value) => `(?<![^\\s\\[\\](){}'\`~^@,])${escape(value)}(?![^\\s\\[\\](){}'\`~^@,])`;
  if (new RegExp(token(namespace), "u").test(withoutStringsOrComments)) return true;
  const separator = namespace.lastIndexOf(".");
  if (separator < 1 || separator === namespace.length - 1) return false;
  const prefix = namespace.slice(0, separator);
  const leaf = namespace.slice(separator + 1);
  return new RegExp(
    `\\[\\s*(?:\\^[^\\s\\[\\]]+\\s*)*${token(prefix)}[\\s\\S]*?` +
      `\\[\\s*(?:\\^[^\\s\\[\\]]+\\s*)*${token(leaf)}`,
    "u",
  ).test(withoutStringsOrComments);
}

export async function loadedCrossPackStepConsumers(packs, { repositoryRoot }) {
  const stdout = await new Promise((resolve, reject) => {
    const child = spawn("bb", ["-m", "acceptance.verification-support.isolated-handler-audit"], {
      cwd:repositoryRoot, stdio:["pipe", "pipe", "pipe"],
    });
    let output = "";
    let diagnostics = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { diagnostics += chunk; });
    child.on("error", reject);
    child.on("close", (status) => status === 0 ? resolve(output) : reject(new Error(
      diagnostics.trim() || output.trim() || `APS handler audit exited ${status}`)));
    child.stdin.end(JSON.stringify(packs));
  });
  const consumers = JSON.parse(stdout);
  if (!Array.isArray(consumers)) {
    throw new Error("APS isolated-handler audit returned invalid evidence");
  }
  return consumers;
}
