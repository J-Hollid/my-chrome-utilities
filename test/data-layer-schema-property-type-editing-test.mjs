import assert from "node:assert/strict";
import { applySchemaPropertyTypeEdit, inspectSchemaPropertyTypeEdit, schemaPropertyTypeLabel } from "../dist/data-layer-schema-property-type-editing.js";
import { createSchemaWorkingDraft, publishSchemaWorkingDraft, schemaRevision, updateSchemaWorkingDraft, validateWithSchema } from "../dist/data-layer-schema-verification.js";

const schema={id:"page",name:"Page view",version:3,document:{type:"object",required:["order_id"],properties:{order_id:{type:"number"},price:{type:"number"},tags:{type:"array",items:{type:"string"}},products:{type:"array",items:{type:"object",required:["name"],properties:{name:{type:"string"}}}}}},assignments:[],documentation:{properties:{"/order_id":{displayName:"Order",description:"Order identifier",example:{value:42,selectionMethod:"custom"}},"/products/*/name":{displayName:"Name",description:"Product name"}}},attachedRules:[{id:"range",version:1,propertyPath:"/order_id",operator:"numeric-range",parameters:"1,99"}]};
assert.equal(schemaPropertyTypeLabel(schema.document.properties.tags),"Array of String");
assert.deepEqual(inspectSchemaPropertyTypeEdit(schema,"/order_id","string"),{from:"Number",to:"String",compatible:["required membership","documentation"],incompatible:["example value","rule range"]});
const order=applySchemaPropertyTypeEdit(schema,{path:"/order_id",type:"string",treatment:"warning",removeIncompatible:true});
assert.equal(order.document.properties.order_id.type,"string");assert.equal(order.document.properties.order_id.typeMismatchTreatment,"warning");assert.equal(order.documentation.properties["/order_id"].example,undefined);assert.equal(order.attachedRules.length,0);
const warning=validateWithSchema({sourceId:"history",eventName:"page",payload:{order_id:1,price:"19.95",tags:["ok"],products:[]}},applySchemaPropertyTypeEdit(schema,{path:"/price",type:"number",treatment:"warning",removeIncompatible:false}),[schema]);
assert.deepEqual(warning.issues.filter(({message})=>message==="Type mismatch").map(({instancePath,severity})=>[instancePath,severity]),[["/price","warning"]]);
const ignored=validateWithSchema({sourceId:"history",eventName:"page",payload:{order_id:1,price:"19.95",tags:["ok"],products:[]}},applySchemaPropertyTypeEdit(schema,{path:"/price",type:"number",treatment:"ignore",removeIncompatible:false}),[schema]);
assert.equal(ignored.issues.some(({instancePath,message})=>instancePath==="/price"&&message==="Type mismatch"),false);

const productsSchema={...schema,documentation:{properties:{...schema.documentation.properties,"/products/*/name":{displayName:"Name",description:"Product name"}}},attachedRules:[...schema.attachedRules,{id:"product-name-required",version:1,propertyPath:"/products/*/name",operator:"required"}]};
assert.deepEqual(inspectSchemaPropertyTypeEdit(productsSchema,"/products","array"),{from:"Array of Object",to:"Array",compatible:[],incompatible:["descendant definitions","descendant required relationships","descendant documentation","descendant rules"]});
assert.throws(()=>applySchemaPropertyTypeEdit(productsSchema,{path:"/products",type:"array",treatment:"error",removeIncompatible:false}),/Resolve every incompatible/);
const flattened=applySchemaPropertyTypeEdit(productsSchema,{path:"/products",type:"array",treatment:"error",removeIncompatible:true});
assert.deepEqual(flattened.document.properties.products,{type:"array",typeMismatchTreatment:"error"});assert.equal(flattened.documentation.properties["/products/*/name"],undefined);assert.equal(flattened.attachedRules.some(({id})=>id==="product-name-required"),false);

const anyItems=applySchemaPropertyTypeEdit(schema,{path:"/tags",type:"array",treatment:"warning",removeIncompatible:false});
const numberItems=applySchemaPropertyTypeEdit(anyItems,{path:"/tags",type:"array",itemType:"number",treatment:"warning",removeIncompatible:false});
const objectItems=applySchemaPropertyTypeEdit(numberItems,{path:"/tags",type:"array",itemType:"object",treatment:"ignore",removeIncompatible:false});
assert.deepEqual(anyItems.document.properties.tags,{type:"array",typeMismatchTreatment:"warning"});assert.deepEqual(numberItems.document.properties.tags,{type:"array",typeMismatchTreatment:"warning",items:{type:"number",typeMismatchTreatment:"warning"}});assert.deepEqual(objectItems.document.properties.tags,{type:"array",typeMismatchTreatment:"ignore",items:{type:"object",typeMismatchTreatment:"ignore"}});

const conditional={id:"order-condition",version:1,propertyPath:"/price",operator:"allowed-values",allowedValues:[10,20],conditionGroup:{operator:"All",predicates:[{propertyPath:"/order_id",operator:"Equals",comparison:{type:"number",value:42}}]}};
const reusableDefinition={id:"range",name:"Reusable range",kind:"Numeric range",version:7,operator:"numeric-range",parameters:"1,99",attachments:["page"]};
const dependent={...schema,attachedRules:[...schema.attachedRules,conditional]};const reusableBefore=structuredClone(reusableDefinition);
assert.deepEqual(inspectSchemaPropertyTypeEdit(dependent,"/order_id","string").incompatible,["example value","rule range","conditional dependency order-condition"]);
assert.deepEqual(inspectSchemaPropertyTypeEdit(dependent,"/order_id","number").incompatible,[]);assert.equal(applySchemaPropertyTypeEdit(dependent,{path:"/order_id",type:"number",treatment:"warning",removeIncompatible:false}).attachedRules.length,2);
assert.throws(()=>applySchemaPropertyTypeEdit(dependent,{path:"/order_id",type:"string",treatment:"warning",removeIncompatible:false,resolutions:{"example value":{action:"remove"}}}),/every incompatible/);
const replaced=applySchemaPropertyTypeEdit(dependent,{path:"/order_id",type:"string",treatment:"warning",removeIncompatible:false,resolutions:{"example value":{action:"replace",value:"ORDER-42"},"rule range":{action:"remove"},"conditional dependency order-condition":{action:"replace",value:"ORDER-42"}}});
assert.equal(replaced.documentation.properties["/order_id"].example.value,"ORDER-42");assert.deepEqual(replaced.attachedRules,[{...conditional,conditionGroup:{operator:"All",predicates:[{propertyPath:"/order_id",operator:"Equals",comparison:{type:"string",value:"ORDER-42"}}]}}]);
const resolved=applySchemaPropertyTypeEdit(dependent,{path:"/order_id",type:"string",treatment:"warning",removeIncompatible:true});
assert.deepEqual(resolved.attachedRules,[]);assert.deepEqual(reusableDefinition,reusableBefore);assert.equal(resolved.documentation.properties["/order_id"].example,undefined);

const withDraft=createSchemaWorkingDraft(schema);const draftSurface={...schema,document:withDraft.workingDraft.document,assignments:withDraft.workingDraft.assignments,documentation:withDraft.workingDraft.documentation,attachedRules:withDraft.workingDraft.attachedRules};const editedDraft=applySchemaPropertyTypeEdit(draftSurface,{path:"/tags",type:"array",treatment:"warning",removeIncompatible:false});
const pending=updateSchemaWorkingDraft(withDraft,{document:editedDraft.document,documentation:editedDraft.documentation,attachedRules:editedDraft.attachedRules},"Change /tags type");const published=publishSchemaWorkingDraft(pending),historical=schemaRevision(published,3);
assert.equal(published.version,4);assert.deepEqual(published.document.properties.tags,{type:"array",typeMismatchTreatment:"warning"});assert.deepEqual(historical.document.properties.tags,{type:"array",items:{type:"string"}});assert.deepEqual(published.revisionHistory.map(({version})=>version),[3]);
