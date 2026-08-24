import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const targets=await readFile(new URL("./support/layered-schema-targets.mjs",import.meta.url),"utf8");
const legacyPack=await readFile(new URL("./browser-packs/layered-schema.mjs",import.meta.url),"utf8");
const probe=await readFile(new URL("./support/layered-schema-editing-repairs-probe.mjs",import.meta.url),"utf8");

assert.match(probe,/export const layeredSchemaEditingRepairsExpression=/u);
assert.match(targets,/import \{layeredSchemaEditingRepairsExpression\} from "\.\/layered-schema-editing-repairs-probe\.mjs";/u);
assert.match(legacyPack,/import \{layeredSchemaEditingRepairsExpression\} from "\.\.\/support\/layered-schema-editing-repairs-probe\.mjs";/u);
assert.doesNotMatch(targets,/__swarmforgeLayeredSchemaEditingRepairsExpression/u);
assert.doesNotMatch(legacyPack,/__swarmforgeLayeredSchemaEditingRepairsExpression/u);

console.log("layered schema policy probe contract tests passed");
