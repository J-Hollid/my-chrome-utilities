import assert from "node:assert/strict";

import {
  resolveEffectiveSchemaDocumentation,
  resolvePropertyDocumentation,
  schemaDocumentationSearchText,
} from "../dist/data-layer-schema-documentation.js";
import {
  createSchemaWorkingDraft,
  duplicateSchemaRevision,
  exportSchema,
  importSchema,
  publishSchemaWorkingDraft,
  schemaRevision,
  updateSchemaWorkingDraft,
} from "../dist/data-layer-schema-verification.js";
import {
  applySchemaPropertyCopy,
  planSchemaPropertyCopy,
  schemaPropertyCopySource,
} from "../dist/data-layer-schema-property-copy.js";
import { removeSchemaProperty, undoSchemaPropertyRemoval } from "../dist/data-layer-schema-property-removal.js";

const document = {
  type:"object",
  properties:{
    currency:{ type:"string" },
    page_type:{ type:"string" },
    products:{ type:"array", items:{ type:"object", properties:{ product_id:{ type:"string" } } } },
  },
};
const parent = {
  id:"schema:generic-commerce",
  name:"Generic commerce",
  version:2,
  document,
  assignments:[],
  documentation:{ properties:{
    "/currency":{ displayName:"Currency", description:"ISO currency", comments:"Shared currency convention" },
  } },
};
const revision3 = {
  id:"schema:product-detail",
  name:"Product detail",
  version:3,
  document,
  assignments:[],
  parentSchemaId:parent.id,
  documentation:{ properties:{
    "/page_type":{ displayName:"Page type", description:"Routing input", comments:"Legacy routing input" },
    "/products/*/product_id":{ displayName:"Product identifier", description:"Stable identifier", comments:"Sent by checkout\nDo not derive from position" },
  } },
};

const inherited = resolveEffectiveSchemaDocumentation(revision3, [parent, revision3]);
assert.equal(inherited.properties["/currency"].comments, "Shared currency convention");
assert.equal(inherited.properties["/currency"].origin.id, parent.id);
assert.equal(inherited.properties["/currency"].inherited, true);

const draft = updateSchemaWorkingDraft(createSchemaWorkingDraft(revision3), {
  documentation:{ properties:{
    ...revision3.documentation.properties,
    "/currency":{ displayName:"Currency", description:"ISO currency", comments:"Checkout currency exception" },
    "/page_type":{ displayName:"Page type", description:"Routing input", comments:"Current routing input" },
  } },
}, "Update property comments");
assert.equal(revision3.documentation.properties["/page_type"].comments, "Legacy routing input");
assert.equal(draft.workingDraft.documentation.properties["/currency"].comments, "Checkout currency exception");

const revision4 = publishSchemaWorkingDraft(draft);
assert.equal(revision4.version, 4);
assert.equal(revision4.documentation.properties["/page_type"].comments, "Current routing input");
assert.equal(schemaRevision(revision4, 3).documentation.properties["/page_type"].comments, "Legacy routing input");

const duplicate = duplicateSchemaRevision(revision4, 3, [parent, revision4]);
assert.equal(duplicate.documentation.properties["/products/*/product_id"].comments, "Sent by checkout\nDo not derive from position");
assert.equal(duplicate.documentation.properties["/currency"].comments, "Shared currency convention");

const destination = {
  id:"schema:destination",
  name:"Destination",
  version:1,
  document:{ type:"object" },
  assignments:[],
};
const source = schemaPropertyCopySource(revision4, { surface:"current" });
const copyPlan = planSchemaPropertyCopy({
  source,
  destination,
  selectedPath:"/products/*/product_id",
  schemas:[parent, revision4, destination],
  reusableRuleIds:[],
});
assert.equal(copyPlan.documentation.find(({ path }) => path === "/products/*/product_id").entry.comments, "Sent by checkout\nDo not derive from position");
const copied = applySchemaPropertyCopy(copyPlan).schema;
assert.equal(copied.workingDraft.documentation.properties["/products/*/product_id"].comments, "Sent by checkout\nDo not derive from position");

const removal = removeSchemaProperty(revision4.document, [], "/products", revision4.documentation);
assert.equal(removal.documentation.properties?.["/products/*/product_id"], undefined);
assert.equal(undoSchemaPropertyRemoval(removal).documentation.properties["/products/*/product_id"].comments, "Sent by checkout\nDo not derive from position");

const restored = importSchema(exportSchema(revision4));
assert.equal(restored.documentation.properties["/page_type"].comments, "Current routing input");
assert.equal(restored.revisionHistory[0].documentation.properties["/page_type"].comments, "Legacy routing input");

const effective = resolveEffectiveSchemaDocumentation(revision4, [parent, revision4]);
const concrete = resolvePropertyDocumentation(effective, "/products/2/product_id");
assert.equal(concrete.mappingPath, "/products/*/product_id");
assert.equal(concrete.comments, "Sent by checkout\nDo not derive from position");
assert.match(schemaDocumentationSearchText("/products/2/product_id", concrete), /do not derive from position/);

console.log("data-layer schema property comments tests passed");
