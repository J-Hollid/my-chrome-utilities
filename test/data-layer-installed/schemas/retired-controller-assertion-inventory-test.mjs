import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { promisify } from "node:util";
import {
  retiredSchemaControllerAssertionInventory as inventory,
} from "./retired-controller-assertion-inventory.mjs";

function quotedEnd(source,start){const quote=source[start];let escaped=false;for(let index=start+1;index<source.length;index+=1){const character=source[index];
  if(escaped)escaped=false;else if(character==="\\")escaped=true;else if(character===quote)return index+1;}throw new Error(`Unterminated quote at ${start}`);}
function balancedEnd(source,start){let depth=0;for(let index=start;index<source.length;index+=1){const character=source[index];
  if(["\"","'","`"].includes(character)){index=quotedEnd(source,index)-1;continue;}if(character==="(")depth+=1;else if(character===")"&&--depth===0)return index;}
  throw new Error(`Unterminated assertion call at ${start}`);}
function assertionArguments(call){const start=call.indexOf("("),end=call.lastIndexOf(")"),found=[];let depth=0,argumentStart=start+1;
  for(let index=start+1;index<end;index+=1){const character=call[index];if(["\"","'","`"].includes(character)){index=quotedEnd(call,index)-1;continue;}
    if(["(","[","{"].includes(character))depth+=1;else if([")","]","}"].includes(character))depth-=1;else if(character===","&&depth===0){
      found.push(call.slice(argumentStart,index).trim());argumentStart=index+1;}}found.push(call.slice(argumentStart,end).trim());return found;}
function parseDirectAssertion(source,start){const method=source.slice(start).match(/^assert\.([A-Za-z]+)\(/u)?.[1];if(!method)throw new Error(`No assertion at ${start}`);
  const open=source.indexOf("(",start),end=balancedEnd(source,open),call=source.slice(start,end+1);
  return{method,arguments:assertionArguments(call),binding:`${call};`.replace(/\s+/gu," ").trim(),end};}
function executableAssertions(source){const assertions=[];let quote="",escaped=false,lineComment=false,blockComment=false;
  for(let index=0;index<source.length;index+=1){const character=source[index],next=source[index+1];if(lineComment){if(character==="\n")lineComment=false;continue;}
    if(blockComment){if(character==="*"&&next==="/"){blockComment=false;index+=1;}continue;}if(quote){if(escaped)escaped=false;else if(character==="\\")escaped=true;
      else if(character===quote)quote="";continue;}if(character==="/"&&next==="/"){lineComment=true;index+=1;continue;}if(character==="/"&&next==="*"){
      blockComment=true;index+=1;continue;}if(["\"","'","`"].includes(character)){quote=character;continue;}if(source.startsWith("assert.",index)){
      const parsed=parseDirectAssertion(source,index);assertions.push({...parsed,index,line:source.slice(0,index).split("\n").length});index=parsed.end;}}return assertions;}
const normalizeExpression=(value)=>value.replace(/\s+/gu,"").replace(/,([}\]])/gu,"$1").replace(/,$/u,"");
const ignoredTokens=new Set(["assert","equal","deepequal","notequal","ok","match","true","false","undefined","await","the","and","that","this","with",
  "from","through","into","before","after"]);
function semanticTokens(value){const expanded=value.replace(/([a-z0-9])([A-Z])/gu,"$1 $2").replace(/[-_]/gu," ");return new Set((expanded.match(/[A-Za-z][A-Za-z0-9]*|\d+/gu)??[])
  .map((token)=>token.toLowerCase()).filter((token)=>token.length>2&&!ignoredTokens.has(token)));}

const executeFile = promisify(execFile);

const checks = inventory.flatMap(({ checks:groupChecks }) => groupChecks);
const conservationDigest = createHash("sha256").update(JSON.stringify(
  checks.map(({ id, method, observable, expected, binding }) =>
    ({ id, method, observable, expected, binding })),
)).digest("hex");

assert.equal(
  conservationDigest,
  "1ff7ca3666f28923daf79f8e20a4216703aad71b3792ff1440febe59ff85c829",
  "retired observables remain bound to the reviewed direct assertions",
);

assert.equal(inventory.length, 16, "each retired behavior family has one record");
assert.equal(checks.length, 345, "the inventory includes every executable retired assertion");
assert.equal(
  new Set(inventory.map(({ lines }) => lines)).size,
  inventory.length,
  "retired source ranges are unique",
);
assert.equal(
  new Set(checks.map(({ id }) => id)).size,
  checks.length,
  "retired assertion IDs are unique",
);
assert.equal(
  checks.every(({ owner }) => owner.endsWith("-test.mjs")),
  true,
  "each retired behavior has an executable direct owner",
);
assert.equal(
  checks.every(({ contract, observable, expected, binding }) =>
    [contract, observable, expected, binding].every((value) => typeof value === "string" && value.length > 0)),
  true,
  "each retired assertion shows its original observable contract and exact binding beside its owner",
);

const { stdout:retiredSource } = await executeFile("git", ["show",
  "7132682e14014b6333df8237d447bcd4a28fe4a8:test/data-layer-installed/schemas-controller-test.mjs"]);
const retiredAssertions = executableAssertions(retiredSource);
for (const { lines, checks:groupChecks } of inventory) {
  const [first, last] = lines.split("-").map(Number);
  const original = retiredAssertions.filter(({ line }) => line >= first && line <= last);
  assert.equal(original.length, groupChecks.length, `${lines} retains each original executable assertion`);
  for (const [index, check] of groupChecks.entries()) {
    const assertion = original[index];
    assert.equal(assertion.method, check.method, `${check.id} retains its original assertion method`);
    assert.equal(normalizeExpression(assertion.arguments[0]), normalizeExpression(check.observable),
      `${check.id} retains its immutable original observable`);
    if (check.method !== "ok") assert.equal(normalizeExpression(assertion.arguments[1]),
      normalizeExpression(check.expected), `${check.id} retains its immutable original expected result`);
  }
}

const ownerSources = new Map();
for (const { owner } of checks) {
  if (!ownerSources.has(owner)) ownerSources.set(owner, await readFile(owner, "utf8"));
}

const occurrences = new Map();
const claimedAssertions = new Map();
for (const [owner, source] of ownerSources) {
  assert.equal(
    /retired-schema-assertion:[^\n]+\n\s*\/\/ retired-schema-assertion:/u.test(source),
    false,
    `${owner} does not stack retired markers`,
  );
  for (const marker of source.matchAll(/\/\/ retired-schema-assertion: ([a-z0-9-]+)/gu)) {
    const suffix = source.slice(marker.index + marker[0].length);
    const directCall = suffix.match(/^\s*assert\.([A-Za-z]+)\(/u);
    assert.ok(directCall, `${marker[1]} directly identifies an executable assertion`);
    const assertionIndex = marker.index + marker[0].length + directCall.index
      + directCall[0].indexOf("assert.");
    const assertionKey = `${owner}:${assertionIndex}`;
    assert.equal(
      claimedAssertions.has(assertionKey),
      false,
      `${marker[1]} identifies an assertion that no other retired marker claims`,
    );
    claimedAssertions.set(assertionKey, marker[1]);
    const found = occurrences.get(marker[1]) ?? [];
    const parsed = parseDirectAssertion(source, assertionIndex);
    found.push({ owner, method:directCall[1], assertionIndex,
      binding:parsed.binding, arguments:parsed.arguments });
    occurrences.set(marker[1], found);
  }
}

const semanticMismatches = [];
for (const { id, method, owner, binding, observable, expected, contract } of checks) {
  const found = occurrences.get(id) ?? [];
  assert.equal(found.length, 1, `${id} occurs exactly once`);
  assert.deepEqual(
    { owner:found[0].owner, method:found[0].method, binding:found[0].binding },
    { owner, method, binding },
    `${id} retains its exact direct owner, method, and observable assertion binding`,
  );
  const originalTokens = semanticTokens(`${observable} ${expected} ${contract}`);
  const directTokens = semanticTokens(found[0].arguments.slice(0, 2).join(" "));
  const directExpected=found[0].arguments[1]??"";
  const expectedTokens=semanticTokens(`${expected} ${contract}`),directExpectedTokens=semanticTokens(directExpected);
  const expectedMatches = method === "ok" || normalizeExpression(directExpected) === normalizeExpression(expected)
    || [...expectedTokens].some((token)=>directExpectedTokens.has(token));
  const observableMatches=[...originalTokens].some((token) => directTokens.has(token));
  if (!observableMatches || !expectedMatches) semanticMismatches.push(id);
}
assert.deepEqual(semanticMismatches, [],
  "every retired assertion executes a direct observable that is traceable to its original behavior");
assert.equal(
  occurrences.size,
  checks.length,
  "direct owners contain no undeclared retired assertion IDs",
);

for (const [owner, source] of ownerSources) {
  assert.equal(
    source.includes("runRetiredSchemaControllerScenario"),
    false,
    `${owner} does not proxy checks through the retired installed scenario`,
  );
  assert.equal(
    /from\s+["'][^"']+-test\.mjs["']/u.test(source),
    false,
    `${owner} does not continue mutable state from another test owner`,
  );
}

const supportFiles = (await readdir("test/support", { recursive:true }))
  .filter((path) => path.endsWith(".mjs"));
for (const path of supportFiles) {
  const supportSource = await readFile(`test/support/${path}`, "utf8");
  assert.equal(
    supportSource.includes("createSchemasInstalledController"),
    false,
    `${path} does not hide an aggregate installed Schema controller fixture`,
  );
}

const schemaTestFiles = await readdir("test/data-layer-installed/schemas");
assert.deepEqual(
  schemaTestFiles.filter((path) =>
    path.startsWith("retired-") && path.endsWith("-controller-contract-test.mjs")),
  [],
  "retired aggregate scenario segments are absent",
);
