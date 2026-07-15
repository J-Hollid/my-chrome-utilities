import assert from "node:assert/strict";

import {
  createExamplePrefillState,
  exampleValueFromInput,
  prefillExampleOnce,
  schemaPropertyExampleChoices,
  schemaPropertyExampleConflicts,
  schemaPropertyExampleInputType,
} from "../dist/data-layer-schema-property-example-values.js";
import {
  resolveEffectiveSchemaDocumentation,
  resolvePropertyDocumentation,
  setPropertyDocumentation,
} from "../dist/data-layer-schema-documentation.js";

let seed = 0x5be0cd19;

function nextInteger(limit) {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed % limit;
}

function token(prefix) {
  return `${prefix}_${nextInteger(0x1000000).toString(36)}`;
}

function encode(segment) {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

const operators = ["allowed-values", "allowed_values", "allowed values", "ALLOWED-VALUES"];

for (let sample = 0; sample < 200; sample += 1) {
  const branch = sample % 2 === 0 ? `${token("branch")}/${token("part")}` : `${token("branch")}~${token("part")}`;
  const leaf = sample % 3 === 0 ? `${token("leaf")}/value` : `${token("leaf")}~value`;
  const templatePath = `/${encode(branch)}/*/${encode(leaf)}`;
  const concretePath = `/${encode(branch)}/${sample % 7}/${encode(leaf)}`;
  const type = ["string", "number", "boolean", "null"][sample % 4];
  const stringValue = token("value");
  const numberValue = nextInteger(200001) / 10 - 10000;
  const booleanValue = sample % 2 === 0;
  const value = type === "string"
    ? stringValue
    : type === "number"
      ? numberValue
      : type === "boolean"
        ? booleanValue
        : null;
  const alternate = type === "string"
    ? `${stringValue}_alternate`
    : type === "number"
      ? numberValue + 0.5
      : type === "boolean"
        ? !booleanValue
        : null;
  const input = value === null ? "null" : String(value);

  assert.deepEqual(exampleValueFromInput(input, type), {
    value,
    selectionMethod:"custom",
  }, "typed example parsing must preserve the exact JSON scalar type");
  assert.deepEqual(exampleValueFromInput(input, type, "allowed value"), {
    value,
    selectionMethod:"allowed value",
  }, "typed parsing must preserve the explicit selection method");
  assert.deepEqual(exampleValueFromInput(stringValue, "string"), {
    value:stringValue,
    selectionMethod:"custom",
  }, "string examples must remain lossless");
  assert.equal(exampleValueFromInput("", "number"), undefined);
  assert.equal(exampleValueFromInput("not-a-number", "number"), undefined);
  assert.equal(exampleValueFromInput("1", "boolean"), undefined);
  assert.equal(exampleValueFromInput("NULL", "null"), undefined);

  const definition = type === "null" ? {} : { type };
  const document = {
    type:"object",
    properties:{
      [branch]:{
        type:"array",
        items:{
          type:"object",
          properties:{ [leaf]:definition },
        },
      },
    },
  };
  const parent = {
    id:`parent:${sample}`,
    name:`Parent ${sample}`,
    version:sample + 1,
    document,
    attachedRules:[{
      id:`rule:${sample}`,
      name:`Allowed ${sample}`,
      version:1,
      propertyPath:templatePath,
      operator:operators[sample % operators.length],
      allowedValues:type === "null" ? [null] : [value, alternate],
    }],
  };
  const child = {
    id:`child:${sample}`,
    name:`Child ${sample}`,
    version:sample + 2,
    parentSchemaId:parent.id,
    document:{ type:"object" },
    attachedRules:[{
      id:`disabled:${sample}`,
      name:"Disabled local rule",
      version:1,
      propertyPath:templatePath,
      operator:"allowed-values",
      allowedValues:["must not shadow"],
      enabled:false,
    }],
  };
  const schemas = [parent, child];
  const schemasSnapshot = structuredClone(schemas);

  assert.deepEqual(
    schemaPropertyExampleChoices(child, concretePath, schemas),
    type === "null" ? [null] : [value, alternate],
    "concrete array paths must resolve typed choices from the effective inherited wildcard rule",
  );
  assert.deepEqual(schemas, schemasSnapshot, "choice resolution must not mutate schemas or attached rules");
  assert.equal(
    schemaPropertyExampleInputType(parent, concretePath, value),
    type,
    "concrete array pointers must resolve their schema-defined input type",
  );
  assert.equal(schemaPropertyExampleInputType({ document:{ type:"object" } }, "/missing", numberValue), "number");
  assert.equal(schemaPropertyExampleInputType({ document:{ type:"object" } }, "/missing", booleanValue), "boolean");
  assert.equal(schemaPropertyExampleInputType({ document:{ type:"object" } }, "/missing", null), "null");

  const parameterRule = {
    ...parent.attachedRules[0],
    allowedValues:undefined,
    parameters:type === "null" ? "null" : `${input},${alternate === null ? "null" : String(alternate)}`,
  };
  assert.deepEqual(
    schemaPropertyExampleChoices({ ...parent, attachedRules:[parameterRule] }, concretePath),
    type === "null" ? ["null"] : [value, alternate],
    "legacy comma-separated rule parameters must parse through the property JSON type",
  );

  const selected = { value, selectionMethod:sample % 2 === 0 ? "custom" : "allowed value" };
  assert.equal(schemaPropertyExampleConflicts(selected, [value]), false);
  assert.equal(schemaPropertyExampleConflicts(selected, []), false);
  if (type !== "null") {
    assert.equal(schemaPropertyExampleConflicts(selected, [alternate]), true);
    assert.equal(
      schemaPropertyExampleConflicts(selected, [type === "number" ? String(value) : type === "boolean" ? String(value) : numberValue]),
      true,
      "conflict checks must not coerce allowed values across JSON scalar types",
    );
  }

  const parentDocumentation = setPropertyDocumentation({}, templatePath, {
    displayName:`Display ${sample}`,
    description:`Description ${sample}`,
    example:selected,
  });
  const childDocumentation = sample % 2 === 0
    ? { properties:{} }
    : setPropertyDocumentation({}, templatePath, {
      displayName:`Child display ${sample}`,
      description:`Child description ${sample}`,
      example:{ value:alternate, selectionMethod:"custom" },
    });
  const documentedParent = { ...parent, documentation:parentDocumentation };
  const documentedChild = { ...child, documentation:childDocumentation };
  const documentedSchemas = [documentedParent, documentedChild];
  const documentationSnapshot = structuredClone(documentedSchemas);
  const effective = resolveEffectiveSchemaDocumentation(documentedChild, documentedSchemas);
  const resolved = resolvePropertyDocumentation(effective, concretePath);
  assert.equal(resolved.mappingPath, templatePath);
  assert.deepEqual(
    resolved.example,
    sample % 2 === 0 ? selected : { value:alternate, selectionMethod:"custom" },
    "effective wildcard documentation must retain exactly one typed local-or-inherited example",
  );
  assert.equal(resolved.origin.id, sample % 2 === 0 ? parent.id : child.id);
  assert.equal(resolved.inherited, sample % 2 === 0);
  assert.deepEqual(documentedSchemas, documentationSnapshot, "documentation resolution must not mutate or alias schema history");
  resolved.example.value = type === "string" ? "changed" : 999;
  assert.deepEqual(documentedSchemas, documentationSnapshot, "resolved examples must not alias stored documentation");

  const pristine = createExamplePrefillState();
  assert.deepEqual(pristine, { values:{}, initialized:[] });
  const first = prefillExampleOnce(pristine, concretePath, value);
  assert.equal(first.values[concretePath], input);
  assert.deepEqual(first.initialized, [concretePath]);
  assert.deepEqual(pristine, { values:{}, initialized:[] }, "prefilling must not mutate its prior state");
  const editedValue = token("edited");
  const edited = { values:{ ...first.values, [concretePath]:editedValue }, initialized:[...first.initialized] };
  const repeated = prefillExampleOnce(edited, concretePath, alternate);
  assert.equal(repeated.values[concretePath], editedValue, "a rerender must never overwrite an operator edit");
  const otherPath = `/other/${sample}`;
  const independent = prefillExampleOnce(repeated, otherPath, undefined);
  assert.equal(independent.values[concretePath], editedValue);
  assert.equal(independent.values[otherPath], "");
  assert.deepEqual(repeated, edited, "prefilling another property must not mutate the previous draft state");
}

console.log("schema property example value properties: 200 generated cases passed");
