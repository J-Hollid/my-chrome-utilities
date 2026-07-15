import assert from "node:assert/strict";

import { addLiveSchemaPropertyDeclaration, createLiveSchemaPropertyDeclaration } from "../dist/data-layer-live-schema-property-declaration.js";
import { validateWithSchema } from "../dist/data-layer-schema-verification.js";

const schema={id:"product-detail",name:"Product detail",version:3,published:true,document:{type:"object",properties:{}},assignments:[{id:"product-view",sourceId:"history",eventName:"product_view",target:"payload"}],attachedRules:[{id:"page-type",version:1,propertyPath:"/page_type",operator:"required"}],workingDraft:{baseVersion:3,sourceVersion:3,document:{type:"object",additionalProperties:false,properties:{products:{type:"array",minItems:1,items:{type:"object",properties:{product_name:{type:"string",description:"Existing name"},metadata:{type:"object"}}}}}},assignments:[{id:"product-view",sourceId:"history",eventName:"product_view",target:"payload"}],attachedRules:[{id:"page-type",version:1,propertyPath:"/page_type",operator:"required"}],pendingChanges:["Existing change"]}};
const payload={products:[{product_name:"Phone",product_id:42}]};
const review=createLiveSchemaPropertyDeclaration(payload,"/products/0/product_id",schema);
assert.deepEqual(review,{concretePath:"/products/0/product_id",canonicalPath:"/products/*/product_id",detectedType:"Number",schemaId:"product-detail",schemaName:"Product detail",schemaVersion:3});
const before=structuredClone(schema);const updated=addLiveSchemaPropertyDeclaration(schema,review);
assert.deepEqual(schema,before);assert.equal(updated.version,3);
assert.equal(updated.workingDraft.document.properties.products.minItems,1);
assert.equal(updated.workingDraft.document.properties.products.items.properties.product_name.description,"Existing name");
assert.equal(updated.workingDraft.document.properties.products.items.properties.product_id.type,"number");
assert.deepEqual(updated.workingDraft.assignments,before.workingDraft.assignments);
assert.deepEqual(updated.workingDraft.attachedRules,before.workingDraft.attachedRules);
assert.equal(updated.workingDraft.document.required,undefined);
assert.deepEqual(Object.keys(updated.workingDraft.document.properties.products.items.properties.product_id),["type"]);
assert.match(updated.workingDraft.pendingChanges.at(-1),/Declare \/products\/\*\/product_id/);
const draftSchema={...updated,document:updated.workingDraft.document,assignments:updated.workingDraft.assignments,attachedRules:updated.workingDraft.attachedRules};
for(const candidate of [{products:[{product_name:"Phone",product_id:42}]},{products:[{product_id:42}]}]){
  const validation=validateWithSchema({sourceId:"history",eventName:"product_view",payload:candidate,rawInput:[]},draftSchema,[draftSchema]);
  assert.equal(validation.issues.some(({instancePath,message})=>instancePath.includes("product_name")&&(message==="Undeclared property"||message==="Required value")),false);
  assert.equal(validation.evaluations.some(({propertyPath})=>propertyPath.includes("product_name")),false);
}
