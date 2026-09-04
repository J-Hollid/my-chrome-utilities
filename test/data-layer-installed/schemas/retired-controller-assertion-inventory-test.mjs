import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  retiredSchemaControllerAssertionInventory as inventory,
} from "./retired-controller-assertion-inventory.mjs";

const checks = inventory.flatMap(({ checks:groupChecks }) => groupChecks);
const conservationDigest = createHash("sha256").update(JSON.stringify(
  checks.map(({ id, method, observable, expected, binding }) =>
    ({ id, method, observable, expected, binding })),
)).digest("hex");

assert.equal(
  conservationDigest,
  "e904e1c9a26190d245493c500d328fef7ddeb69836550e1c13fa3c96ee40d989",
  "the retired ordinal, observable, expected value, method, and direct assertion remain conserved",
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

function directAssertion(source, start) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'" || character === "`") quote = character;
    else if (character === "(") depth += 1;
    else if (character === ")") depth -= 1;
    else if (character === ";" && depth === 0) {
      return source.slice(start, index + 1).replace(/\s+/gu, " ").trim();
    }
  }
  throw new Error(`Unterminated direct assertion at ${start}`);
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
    found.push({ owner, method:directCall[1], assertionIndex,
      binding:directAssertion(source, assertionIndex) });
    occurrences.set(marker[1], found);
  }
}

for (const { id, method, owner, binding } of checks) {
  const found = occurrences.get(id) ?? [];
  assert.equal(found.length, 1, `${id} occurs exactly once`);
  assert.deepEqual(
    { owner:found[0].owner, method:found[0].method, binding:found[0].binding },
    { owner, method, binding },
    `${id} retains its exact direct owner, method, and observable assertion binding`,
  );
}
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
}
const supportSource = await readFile("test/support/schema-library-fake-dom.mjs", "utf8");
assert.equal(
  supportSource.includes("createSchemasInstalledController"),
  false,
  "shared fake DOM support does not mount the aggregate installed controller",
);
