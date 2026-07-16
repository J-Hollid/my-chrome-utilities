import assert from "node:assert/strict";
import { specificationProperties } from "../dist/data-layer-schema-specification-builder.js";

const parent={id:"base",name:"Base",version:1,document:{type:"object",properties:{context:{type:"object",properties:{site_id:{type:"string"}}}}},assignments:[]};
const schema={id:"page",name:"Generic pageview",version:4,parentSchemaId:"base",document:{type:"object",properties:{commerce:{type:"object",properties:{currency:{type:"string"}}},products:{type:"array",items:{type:"object",properties:{name:{type:"string"},attributes:{type:"object",properties:{color:{type:"string"}}}}}}}},assignments:[]};

const properties=specificationProperties(schema,[schema,parent]);
const expected=["/commerce","/commerce/currency","/products","/products/*/name","/products/*/attributes","/products/*/attributes/color","/context","/context/site_id"];
assert.deepEqual(properties.map(({canonicalPath})=>canonicalPath),expected);
assert.equal(properties.every(({selectedByDefault})=>selectedByDefault),true);
assert.equal(properties.some(({canonicalPath})=>canonicalPath.endsWith("/*")),false);
