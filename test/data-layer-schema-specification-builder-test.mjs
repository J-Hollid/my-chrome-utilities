import assert from "node:assert/strict";
import { deriveSpecificationRows, renderSpecificationClipboard } from "../dist/data-layer-schema-specification-builder.js";

const schema={id:"page",name:"Generic pageview",version:4,document:{type:"object",required:["page_type"],properties:{page_type:{type:"string"},products:{type:"array",items:{type:"object",properties:{product_name:{type:"string"}}}}}},assignments:[],documentation:{properties:{"/page_type":{displayName:"page_type",description:"Page classification",example:{value:"product_detail",selectionMethod:"custom"}},"/products/*/product_name":{displayName:"products[].product_name",description:"Product name"}}},attachedRules:[{id:"types",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product_detail","product_list"]}]};
const rows=deriveSpecificationRows(schema,["/page_type","/products/*/product_name"]);
assert.deepEqual(rows.map(({propertyName,mandatory,type,allowedValues})=>({propertyName,mandatory,type,allowedValues})),[
  {propertyName:"page_type",mandatory:"Yes",type:"String",allowedValues:["product_detail","product_list"]},
  {propertyName:"products[].product_name",mandatory:"No",type:"String",allowedValues:[]},
]);
assert.equal(rows[0].description,"Page classification");assert.equal(rows[0].example,"product_detail");
const clipboard=renderSpecificationClipboard(rows);
assert.match(clipboard.html,/^<table>/);assert.match(clipboard.html,/Property name/);assert.match(clipboard.plain,/Property name\tDescription\tMandatory\tType\tExample value\tAllowed values/);assert.equal((clipboard.html.match(/<tr>/g)??[]).length,3);
assert.doesNotMatch(clipboard.html,/<script/);
