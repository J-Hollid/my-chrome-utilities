import assert from "node:assert/strict";

import {
  canonicalDocumentationPath,
  removePropertyDocumentation,
  resolveEffectiveSchemaDocumentation,
  resolvePropertyDocumentation,
  schemaDocumentationSearchText,
  setPropertyDocumentation,
  setSchemaDescription,
} from "../dist/data-layer-schema-documentation.js";

let seed = 0x7f4a7c15;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

for (let sample = 0; sample < 200; sample += 1) {
  const branch = `branch_${nextToken()}`;
  const leaf = `leaf_${nextToken()}`;
  const sibling = `sibling_${nextToken()}`;
  const dottedPath = ` ${branch} .  ${sample} . ${leaf} `;
  const concretePath = `/${branch}/${sample}/${leaf}`;
  const wildcardPath = `/${branch}/*/${leaf}`;

  assert.equal(canonicalDocumentationPath(dottedPath), concretePath);
  assert.equal(canonicalDocumentationPath(dottedPath, true), wildcardPath);
  assert.equal(
    canonicalDocumentationPath(canonicalDocumentationPath(dottedPath, true), true),
    wildcardPath,
    "canonicalization must be idempotent",
  );

  const base = {
    description:`Existing schema ${sample}`,
    properties:{
      [`/${sibling}`]:{
        displayName:`Sibling ${sample}`,
        description:`Stable sibling ${sample}`,
      },
    },
  };
  const baseSnapshot = structuredClone(base);
  const description = `Schema description ${nextToken()}`;
  const described = setSchemaDescription(base, `  ${description}  `);
  assert.equal(described.description, description);
  assert.deepEqual(base, baseSnapshot, "setting a description must not mutate its input");
  described.properties[`/${sibling}`].description = "changed result";
  assert.deepEqual(base, baseSnapshot, "description results must not alias source properties");

  const entry = {
    displayName:` Display ${nextToken()} `,
    description:` Description ${nextToken()} `,
  };
  const documented = setPropertyDocumentation(base, dottedPath, entry);
  assert.deepEqual(documented.properties[concretePath], {
    displayName:entry.displayName.trim(),
    description:entry.description.trim(),
  });
  assert.deepEqual(
    setPropertyDocumentation(documented, concretePath, documented.properties[concretePath]),
    documented,
    "saving the same canonical documentation twice must be idempotent",
  );
  assert.deepEqual(base, baseSnapshot, "property documentation must not mutate its input");

  const withDescendants = {
    description:base.description,
    properties:{
      [`/${branch}`]:{ displayName:"Branch", description:"Branch documentation" },
      [`/${branch}/${leaf}`]:{ displayName:"Leaf", description:"Leaf documentation" },
      [`/${branch}_${sibling}`]:{ displayName:"Prefix sibling", description:"Must remain" },
      [`/${sibling}`]:base.properties[`/${sibling}`],
    },
  };
  const removalSnapshot = structuredClone(withDescendants);
  assert.deepEqual(removePropertyDocumentation(withDescendants, `/${branch}`), {
    description:base.description,
    properties:{
      [`/${branch}_${sibling}`]:{ displayName:"Prefix sibling", description:"Must remain" },
      [`/${sibling}`]:base.properties[`/${sibling}`],
    },
  });
  assert.deepEqual(withDescendants, removalSnapshot, "documentation removal must not mutate its input");

  const commonPath = `/common/${leaf}`;
  const parentOnlyPath = `/parent/${leaf}`;
  const parent = {
    id:`parent-${sample}`,
    name:`Parent ${sample}`,
    version:sample + 1,
    documentation:{
      description:`Parent description ${sample}`,
      properties:{
        [commonPath]:{ displayName:"Parent common", description:`Parent ${sample}` },
        [parentOnlyPath]:{ displayName:"Parent only", description:`Inherited ${sample}` },
      },
    },
  };
  const middle = {
    id:`middle-${sample}`,
    name:`Middle ${sample}`,
    version:sample + 2,
    parentSchemaId:parent.id,
    documentation:{
      properties:{ [commonPath]:{ displayName:"Middle common", description:`Middle ${sample}` } },
    },
  };
  const child = {
    id:`child-${sample}`,
    name:`Child ${sample}`,
    version:sample + 3,
    parentSchemaId:middle.id,
    documentation:{
      description:`Child description ${sample}`,
      properties:{
        [commonPath]:{ displayName:"Child common", description:`Child ${sample}` },
        [wildcardPath]:{ displayName:entry.displayName.trim(), description:entry.description.trim() },
      },
    },
  };
  const schemas = [parent, middle, child];
  const schemasSnapshot = structuredClone(schemas);
  const effective = resolveEffectiveSchemaDocumentation(child, schemas);

  assert.equal(effective.description, child.documentation.description);
  assert.equal(effective.descriptionOrigin.id, child.id);
  assert.equal(effective.properties[commonPath].description, `Child ${sample}`);
  assert.equal(effective.properties[commonPath].origin.id, child.id);
  assert.equal(effective.properties[commonPath].inherited, false);
  assert.equal(effective.properties[parentOnlyPath].origin.id, parent.id);
  assert.equal(effective.properties[parentOnlyPath].inherited, true);
  assert.equal(Object.keys(effective.properties).filter((path) => path === commonPath).length, 1);

  const wildcard = resolvePropertyDocumentation(effective, concretePath);
  assert.equal(wildcard.mappingPath, wildcardPath);
  assert.equal(wildcard.displayName, entry.displayName.trim());
  assert.equal(resolvePropertyDocumentation(effective, `/missing/${leaf}`), undefined);

  const exactEntry = { ...wildcard, mappingPath:concretePath, displayName:"Exact match" };
  const exactFirst = {
    ...effective,
    properties:{ ...effective.properties, [concretePath]:exactEntry },
  };
  assert.equal(resolvePropertyDocumentation(exactFirst, concretePath).displayName, "Exact match");

  const search = schemaDocumentationSearchText(concretePath, wildcard);
  assert.equal(search.includes(concretePath.toLowerCase()), true);
  assert.equal(search.includes(entry.displayName.trim().toLowerCase()), true);
  assert.equal(search.includes(entry.description.trim().toLowerCase()), true);
  assert.deepEqual(schemas, schemasSnapshot, "documentation resolution must not mutate schema ancestry");

  effective.properties[commonPath].description = "changed result";
  assert.deepEqual(schemas, schemasSnapshot, "effective documentation must not alias source mappings");
}

console.log("schema documentation properties: 200 generated cases passed");
