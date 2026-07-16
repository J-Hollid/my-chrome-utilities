import assert from "node:assert/strict";
import { deriveSpecificationRows, renderSpecificationClipboard, specificationProperties, specificationSurfaces } from "../dist/data-layer-schema-specification-builder.js";

const schema={id:"page",name:"Generic pageview",version:4,document:{type:"object",required:["page_type"],properties:{page_type:{type:"string"},products:{type:"array",items:{type:"object",properties:{product_name:{type:"string"}}}}}},assignments:[],documentation:{properties:{"/page_type":{displayName:"page_type",description:"Page classification",comments:"Routing note\nSecond line",example:{value:"product_detail",selectionMethod:"custom"}},"/products/*/product_name":{displayName:"products[].product_name",description:"Product name"}}},attachedRules:[{id:"types",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product_detail","product_list"]}]};
const rows=deriveSpecificationRows(schema,["/page_type","/products/*/product_name"]);
assert.deepEqual(rows.map(({propertyName,mandatory,type,allowedValues})=>({propertyName,mandatory,type,allowedValues})),[
  {propertyName:"page_type",mandatory:"Yes",type:"String",allowedValues:["product_detail","product_list"]},
  {propertyName:"products[].product_name",mandatory:"No",type:"String",allowedValues:[]},
]);
assert.equal(rows[0].description,"Page classification");assert.equal(rows[0].example,"product_detail");
assert.equal(rows[0].comments,"Routing note\nSecond line");assert.equal(rows[1].comments,"");
const clipboard=renderSpecificationClipboard(rows);
assert.match(clipboard.html,/^<table>/);assert.match(clipboard.html,/Property name/);assert.match(clipboard.plain,/Property name\tDescription\tMandatory\tType\tExample value\tAllowed values/);assert.equal((clipboard.html.match(/<tr>/g)??[]).length,3);
assert.doesNotMatch(clipboard.html,/<script/);
assert.match(clipboard.html,/Routing note<br>Second line/);assert.match(clipboard.plain,/Allowed values\tComments/);

const parent={id:"base",name:"Base event",version:2,document:{type:"object",required:["site_id"],properties:{site_id:{type:"string"}}},assignments:[],documentation:{properties:{"/site_id":{displayName:"site_id",description:"Site identifier",example:{value:"otelo",selectionMethod:"custom"}}}},attachedRules:[{id:"sites",version:1,propertyPath:"/site_id",operator:"allowed-values",allowedValues:["otelo","ben"]}]};
const inherited={...schema,parentSchemaId:"base",document:{...schema.document,properties:{...schema.document.properties,commerce:{type:"object",properties:{currency:{type:"string"}}}}}};
const properties=specificationProperties(inherited,[inherited,parent]);
assert.equal(properties.find(({canonicalPath})=>canonicalPath==="/products")?.selectedByDefault,false);
assert.equal(properties.find(({canonicalPath})=>canonicalPath==="/products/*/product_name")?.selectedByDefault,true);
assert.equal(properties.find(({canonicalPath})=>canonicalPath==="/site_id")?.origin,"inherited");
const inheritedRow=deriveSpecificationRows(inherited,["/site_id"],[inherited,parent])[0];
assert.deepEqual({description:inheritedRow.description,mandatory:inheritedRow.mandatory,type:inheritedRow.type,allowed:inheritedRow.allowedValuesText},{description:"Site identifier",mandatory:"Yes",type:"String",allowed:"otelo | ben"});

const conflicting={...schema,attachedRules:[{id:"one",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["a"]},{id:"two",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["b"]}]};
assert.match(deriveSpecificationRows(conflicting,["/page_type"])[0].allowedValuesText,/Conflict/);

const nested={...schema,document:{type:"object",required:["page_type"],properties:{page_type:{type:"string"},commerce:{type:"object",required:["currency"],properties:{currency:{type:"string"}}},products:{type:"array",items:{type:"object",required:["product_name"],properties:{product_name:{type:"string"},duration:{type:"number"},price_monthly:{type:"number"}}}}}},attachedRules:[
  {id:"duration",version:1,propertyPath:"/products/*/duration",operator:"required",conditionGroup:{operator:"All",predicates:[{propertyPath:"/products/*/price_monthly",operator:"Exists"}]}},
  {id:"duration-values",version:1,propertyPath:"/products/*/duration",operator:"allowed-values",allowedValues:[12,24],conditionGroup:{operator:"All",predicates:[{propertyPath:"/products/*/price_monthly",operator:"Exists"}]}},
]};
const nestedRows=deriveSpecificationRows(nested,["/commerce/currency","/products/*/product_name","/products/*/duration"]);
assert.deepEqual(nestedRows.map(({mandatory})=>mandatory),[
  "Yes when commerce exists",
  "Yes when a products item exists",
  "Yes when price_monthly exists for the same products item",
]);
assert.deepEqual(nestedRows[2].allowedValues,[12,24]);
assert.deepEqual(nestedRows[2].allowedValueGroups,["12 | 24 when price_monthly exists for the same products item"]);

const unconditional={...nested,attachedRules:[...nested.attachedRules,{id:"always-duration",version:1,propertyPath:"/products/*/duration",operator:"required"}]};
assert.equal(deriveSpecificationRows(unconditional,["/products/*/duration"])[0].mandatory,"Yes");

const allowed={...schema,attachedRules:[
  {id:"first",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product_detail","product_list","product_list"]},
  {id:"second",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product_list","product_detail","other"]},
  {id:"conditional",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["campaign"],conditionGroup:{operator:"All",predicates:[{propertyPath:"/commerce/currency",operator:"Equals",comparison:{type:"string",value:"EUR"}}]}},
]};
const allowedRow=deriveSpecificationRows(allowed,["/page_type"])[0];
assert.deepEqual(allowedRow.allowedValues,["product_detail","product_list","campaign"]);
assert.deepEqual(allowedRow.allowedValueGroups,["product_detail | product_list","campaign when commerce.currency equals EUR"]);
assert.match(renderSpecificationClipboard([allowedRow]).html,/product_detail \| product_list<br>campaign when/);

const disabledInherited={...inherited,inheritedRuleOverrides:{site_id:"disabled"}};
assert.equal(specificationProperties(disabledInherited,[disabledInherited,parent]).some(({canonicalPath})=>canonicalPath==="/site_id"),false);

const surfaced={...schema,revisionHistory:[{...schema,version:2,revisionHistory:undefined}],workingDraft:{baseVersion:4,sourceVersion:4,document:{type:"object",properties:{draft_only:{type:"boolean"}}},assignments:[],attachedRules:[],pendingChanges:[]}};
assert.deepEqual(specificationSurfaces(surfaced).map(({key,label})=>[key,label]),[
  ["published:4","published revision 4"],
  ["historical:2","historical revision 2"],
  ["working-draft","working draft based on revision 4"],
]);
