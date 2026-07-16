import assert from "node:assert/strict";
import { applySchemaPropertyTypeEdit, inspectSchemaPropertyTypeEdit, schemaPropertyTypeLabel } from "../dist/data-layer-schema-property-type-editing.js";
import { validateWithSchema } from "../dist/data-layer-schema-verification.js";

const schema={id:"page",name:"Page view",version:3,document:{type:"object",required:["order_id"],properties:{order_id:{type:"number"},price:{type:"number"},tags:{type:"array",items:{type:"string"}},products:{type:"array",items:{type:"object",required:["name"],properties:{name:{type:"string"}}}}}},assignments:[],documentation:{properties:{"/order_id":{displayName:"Order",description:"Order identifier",example:{value:42,selectionMethod:"custom"}},"/products/*/name":{displayName:"Name",description:"Product name"}}},attachedRules:[{id:"range",version:1,propertyPath:"/order_id",operator:"numeric-range",parameters:"1,99"}]};
assert.equal(schemaPropertyTypeLabel(schema.document.properties.tags),"Array of String");
assert.deepEqual(inspectSchemaPropertyTypeEdit(schema,"/order_id","string"),{from:"Number",to:"String",compatible:["required membership","documentation"],incompatible:["example value","rule range"]});
const order=applySchemaPropertyTypeEdit(schema,{path:"/order_id",type:"string",treatment:"warning",removeIncompatible:true});
assert.equal(order.document.properties.order_id.type,"string");assert.equal(order.document.properties.order_id.typeMismatchTreatment,"warning");assert.equal(order.documentation.properties["/order_id"].example,undefined);assert.equal(order.attachedRules.length,0);
const warning=validateWithSchema({sourceId:"history",eventName:"page",payload:{order_id:1,price:"19.95",tags:["ok"],products:[]}},applySchemaPropertyTypeEdit(schema,{path:"/price",type:"number",treatment:"warning",removeIncompatible:false}),[schema]);
assert.deepEqual(warning.issues.filter(({message})=>message==="Type mismatch").map(({instancePath,severity})=>[instancePath,severity]),[["/price","warning"]]);
const ignored=validateWithSchema({sourceId:"history",eventName:"page",payload:{order_id:1,price:"19.95",tags:["ok"],products:[]}},applySchemaPropertyTypeEdit(schema,{path:"/price",type:"number",treatment:"ignore",removeIncompatible:false}),[schema]);
assert.equal(ignored.issues.some(({instancePath,message})=>instancePath==="/price"&&message==="Type mismatch"),false);
