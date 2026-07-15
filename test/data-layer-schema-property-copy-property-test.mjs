import assert from "node:assert/strict";

import {
  applySchemaPropertyCopy,
  planSchemaPropertyCopy,
  schemaPropertyCopySource,
  undoSchemaPropertyCopy,
} from "../dist/data-layer-schema-property-copy.js";

let seed = 0x510e527f;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

function encode(segment) {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

for (let sample = 0; sample < 200; sample += 1) {
  const branch = sample % 2 === 0 ? `branch/${nextToken()}` : `branch~${nextToken()}`;
  const leaf = sample % 3 === 0 ? `leaf/${nextToken()}` : `leaf~${nextToken()}`;
  const dependency = `dependency_${nextToken()}`;
  const transitiveDependency = `transitive_${nextToken()}`;
  const branchPath = `/${encode(branch)}`;
  const selectedPath = `${branchPath}/${encode(leaf)}`;
  const dependencyPath = `/${dependency}`;
  const transitivePath = `/${transitiveDependency}`;
  const localRuleId = `local:selected:${sample}`;
  const dependencyRuleId = `local:dependency:${sample}`;
  const reusableRuleId = `reusable:transitive:${sample}`;
  const sourceDocument = {
    type:"object",
    title:`Source ${sample}`,
    required:[branch],
    properties:{
      [branch]:{
        type:"object",
        required:[leaf],
        properties:{
          [leaf]:{ type:"number", minimum:sample },
          source_sibling:{ type:"string" },
        },
      },
      [dependency]:{ type:"string" },
      [transitiveDependency]:{ type:"boolean" },
      source_only:{ type:"string" },
    },
  };
  const selectedRule = {
    id:localRuleId,
    name:`Selected ${sample}`,
    version:1,
    propertyPath:selectedPath,
    operator:"required",
    conditionGroup:{
      operator:"All",
      predicates:[{ propertyPath:dependencyPath, operator:"Exists", detectedType:"string" }],
    },
  };
  const dependencyRule = {
    id:dependencyRuleId,
    name:`Dependency ${sample}`,
    version:2,
    propertyPath:dependencyPath,
    operator:"required",
    conditionGroup:{
      operator:"All",
      predicates:[{ propertyPath:transitivePath, operator:"Exists", detectedType:"boolean" }],
    },
  };
  const reusableRule = {
    id:reusableRuleId,
    name:`Reusable ${sample}`,
    version:3,
    propertyPath:transitivePath,
    operator:"required",
  };
  const historicalDocument = { type:"object", properties:{ historical_only:{ type:"string" } } };
  const draftDocument = {
    ...structuredClone(sourceDocument),
    properties:{ ...structuredClone(sourceDocument.properties), draft_only:{ type:"string" } },
  };
  const source = {
    id:`source:${sample}`,
    name:`Source schema ${sample}`,
    version:7,
    published:true,
    document:sourceDocument,
    assignments:[],
    attachedRules:[selectedRule, dependencyRule, reusableRule],
    documentation:{
      description:`Source documentation ${sample}`,
      properties:{
        [selectedPath]:{ displayName:`Selected ${sample}`, description:`Selected description ${sample}` },
        [dependencyPath]:{ displayName:`Dependency ${sample}`, description:`Dependency description ${sample}` },
        [transitivePath]:{ displayName:`Transitive ${sample}`, description:`Transitive description ${sample}` },
      },
    },
    revisionHistory:[{
      id:`source:${sample}`,
      name:`Source schema ${sample}`,
      version:5,
      published:true,
      document:historicalDocument,
      assignments:[],
    }],
    workingDraft:{
      baseVersion:7,
      sourceVersion:7,
      document:draftDocument,
      assignments:[],
      attachedRules:[selectedRule, dependencyRule, reusableRule],
      pendingChanges:["Existing source draft"],
    },
  };
  const destination = {
    id:`destination:${sample}`,
    name:`Destination schema ${sample}`,
    version:3,
    published:true,
    document:{
      type:"object",
      title:`Destination ${sample}`,
      properties:{
        [branch]:{ type:"object", properties:{ destination_sibling:{ type:"string", description:`Stable ${sample}` } } },
        destination_only:{ type:"boolean" },
      },
    },
    assignments:[{ sourceId:"history", eventName:`event_${sample}`, target:"payload" }],
    documentation:{
      description:`Destination documentation ${sample}`,
      properties:{ "/destination_only":{ displayName:"Destination only", description:`Stable ${sample}` } },
    },
  };
  const sourceSnapshot = structuredClone(source);
  const destinationSnapshot = structuredClone(destination);

  const current = schemaPropertyCopySource(source, { surface:"current" });
  assert.equal(current.schema.workingDraft, undefined, "current sources must exclude mutable working drafts");
  assert.equal(current.schema.revisionHistory, undefined, "current sources must be immutable revision snapshots");
  assert.deepEqual(
    schemaPropertyCopySource(source, { surface:"working draft" }).schema.document,
    draftDocument,
    "working-draft selection must use the visible draft document",
  );
  assert.deepEqual(
    schemaPropertyCopySource(source, { surface:"historical", version:5 }).schema.document,
    historicalDocument,
    "historical selection must resolve the requested immutable revision",
  );

  const plan = planSchemaPropertyCopy({
    source:current,
    destination,
    selectedPath,
    schemas:[source, destination],
    reusableRuleIds:[reusableRuleId],
  });
  assert.equal(plan.selectedPath, selectedPath, "escaped JSON-pointer paths must remain canonical");
  assert.deepEqual(
    new Set(plan.propertyPaths),
    new Set([branchPath, selectedPath, dependencyPath, transitivePath]),
    "planning must include ancestors and the complete transitive dependency closure without siblings",
  );
  assert.deepEqual(plan.dependencies, [
    { path:dependencyPath, requiredBy:selectedPath },
    { path:transitivePath, requiredBy:dependencyPath },
  ].sort((left, right) => left.path.localeCompare(right.path)));
  assert.deepEqual(
    plan.rules.map(({ sourceId, ownership }) => [sourceId, ownership]),
    [[localRuleId, "local copy"], [dependencyRuleId, "local copy"], [reusableRuleId, "reusable attachment"]],
    "planning must preserve rule ownership across the dependency closure",
  );
  assert.equal(plan.ready, true);
  assert.deepEqual(source, sourceSnapshot, "planning must not mutate the source schema");
  assert.deepEqual(destination, destinationSnapshot, "planning must not mutate the destination schema");

  const applied = applySchemaPropertyCopy(plan);
  const draft = applied.schema.workingDraft;
  assert.deepEqual(source, sourceSnapshot, "applying must not mutate the source schema");
  assert.deepEqual(destination, destinationSnapshot, "applying must not mutate the destination schema");
  assert.deepEqual(applied.schema.document, destination.document, "copying must not mutate the published destination revision");
  assert.equal(applied.schema.version, destination.version, "copying must preserve the destination revision number");
  assert.deepEqual(draft.assignments, destination.assignments, "copying must conserve destination assignments");
  assert.deepEqual(draft.document.properties.destination_only, destination.document.properties.destination_only);
  assert.deepEqual(
    draft.document.properties[branch].properties.destination_sibling,
    destination.document.properties[branch].properties.destination_sibling,
    "copying must conserve unrelated destination siblings",
  );
  assert.deepEqual(draft.document.properties[branch].required, [leaf], "copied required membership must be preserved");
  assert.equal(draft.document.properties[branch].properties[leaf].minimum, sample);
  assert.equal(draft.document.properties[branch].properties.source_sibling, undefined, "leaf copying must not include source siblings");
  assert.equal(draft.attachedRules.filter(({ id }) => id === reusableRuleId).length, 1);
  assert.equal(draft.attachedRules.some(({ id }) => id === localRuleId || id === dependencyRuleId), false);
  assert.equal(draft.attachedRules.filter(({ copySourceRuleId }) => copySourceRuleId === localRuleId).length, 1);
  assert.equal(draft.attachedRules.filter(({ copySourceRuleId }) => copySourceRuleId === dependencyRuleId).length, 1);
  assert.equal(draft.documentation.description, destination.documentation.description);
  assert.deepEqual(draft.documentation.properties["/destination_only"], destination.documentation.properties["/destination_only"]);
  assert.equal(draft.documentation.properties[selectedPath].description, `Selected description ${sample}`);

  const repeatedPlan = planSchemaPropertyCopy({
    source:current,
    destination:applied.schema,
    selectedPath,
    schemas:[source, applied.schema],
    reusableRuleIds:[reusableRuleId],
  });
  const repeated = applySchemaPropertyCopy(repeatedPlan).schema.workingDraft;
  assert.deepEqual(repeated.document, draft.document, "repeating a copy must be document-idempotent");
  assert.deepEqual(repeated.documentation, draft.documentation, "repeating a copy must be documentation-idempotent");
  assert.equal(repeated.attachedRules.filter(({ id }) => id === reusableRuleId).length, 1);
  assert.equal(repeated.attachedRules.filter(({ copySourceRuleId }) => copySourceRuleId === localRuleId).length, 1);
  assert.equal(repeated.attachedRules.filter(({ copySourceRuleId }) => copySourceRuleId === dependencyRuleId).length, 1);

  const restored = undoSchemaPropertyCopy(applied).schema;
  assert.deepEqual(restored, destinationSnapshot, "Undo must restore the exact prior destination schema");
  restored.document.properties.destination_only.type = "string";
  assert.deepEqual(destination, destinationSnapshot, "Undo results must not alias the original destination");
}

console.log("schema property copy properties: 200 generated cases passed");
