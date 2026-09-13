import assert from "node:assert/strict";

import { applyLiveSchemaBulk, createLiveSchemaBulkDraft, reviewLiveSchemaBulk } from "../dist/data-layer-installed/schemas/live-schema-bulk-model.js";

const parent={id:"parent",name:"Parent",version:2,document:{type:"object",properties:{inherited:{type:"string"}}},assignments:[],documentation:{properties:{"/inherited":{displayName:"Inherited",description:"Keep",example:{value:"old",selectionMethod:"custom"}}}}};
const schema={id:"target",name:"Target",version:3,published:true,parentSchemaId:"parent",document:{type:"object",properties:{}},assignments:[],workingDraft:{baseVersion:3,sourceVersion:3,parentSchemaId:"parent",document:{type:"object",properties:{customer:{type:"string",minimum:2},products:{type:"array",items:{type:"object",properties:{name:{type:"string"}}}}}},assignments:[],documentation:{properties:{"/products/*/name":{displayName:"Name",description:"Keep name",example:{value:"Old",selectionMethod:"custom"}}}},pendingChanges:["Existing"]}};
const payload={inherited:"new",customer:{id:4},products:[{name:"Phone"},{name:"Tablet",price:25}],consent:false,count:0,empty:"",optional:null,"12":{"a/b":"escaped"},mixed:[{id:7},{id:"seven"}],emptyItems:[]};
const before=structuredClone(schema),review=reviewLiveSchemaBulk(payload,schema,[parent,schema]);
assert.ok(review.preserved.includes("/inherited"));
assert.ok(review.preserved.includes("/products/*/name"));
assert.ok(review.blocked.includes("/customer/id"));
assert.ok(review.added.includes("/products/*/price"));
assert.ok(review.added.includes("/12/a~1b"));
assert.equal(review.rows.find(({path})=>path==="/mixed/*/id").type,undefined);
assert.equal(review.rows.find(({path})=>path==="/mixed/*/id").example,7);
assert.equal(review.rows.find(({path})=>path==="/optional").example,null);
assert.equal(review.rows.find(({path})=>path==="/optional").type,undefined);
assert.equal(review.rows.find(({path})=>path==="/emptyItems").type,"array");

const updated=applyLiveSchemaBulk(schema,review);assert.deepEqual(schema,before);
assert.equal(updated.workingDraft.document.properties.products.items.properties.price.type,"number");
assert.equal(updated.workingDraft.document.properties.customer.type,"string");
assert.equal(updated.workingDraft.documentation.properties["/products/*/name"].description,"Keep name");
assert.deepEqual(updated.workingDraft.documentation.properties["/products/*/price"].example,{value:25,selectionMethod:"custom"});
assert.deepEqual(updated.workingDraft.documentation.properties["/consent"].example,{value:false,selectionMethod:"custom"});
assert.deepEqual(updated.workingDraft.documentation.properties["/count"].example,{value:0,selectionMethod:"custom"});
assert.deepEqual(updated.workingDraft.documentation.properties["/empty"].example,{value:"",selectionMethod:"custom"});
assert.equal(updated.workingDraft.pendingChanges.at(-1),`Add ${review.added.length} observed properties`);
const repeated=reviewLiveSchemaBulk(payload,updated,[parent,updated]);assert.equal(repeated.added.length,0);
assert.deepEqual(applyLiveSchemaBulk(updated,repeated),updated);

const unspecifiedParent={id:"unspecified-parent",name:"Unspecified parent",version:1,document:{type:"object",properties:{parent:{description:"Keep",properties:{}}}},assignments:[],published:false};
const unspecifiedReview=reviewLiveSchemaBulk({parent:{child:1}},unspecifiedParent,[unspecifiedParent]);
assert.ok(unspecifiedReview.preserved.includes("/parent"));assert.ok(unspecifiedReview.added.includes("/parent/child"));
const unspecifiedResult=applyLiveSchemaBulk(unspecifiedParent,unspecifiedReview);
assert.equal(unspecifiedResult.workingDraft.document.properties.parent.type,undefined);
assert.equal(unspecifiedResult.workingDraft.document.properties.parent.description,"Keep");
assert.equal(unspecifiedResult.workingDraft.document.properties.parent.properties.child.type,"number");

const mixedParent={id:"mixed-parent",name:"Mixed parent",version:1,document:{type:"object",properties:{}},assignments:[],published:false};
const mixedReview=reviewLiveSchemaBulk({rows:[{value:{child:1}},{value:"mixed"}]},mixedParent,[mixedParent]);
assert.equal(mixedReview.rows.find(({path})=>path==="/rows/*/value").type,undefined);
const mixedResult=applyLiveSchemaBulk(mixedParent,mixedReview);
assert.equal(mixedResult.workingDraft.document.properties.rows.items.properties.value.type,undefined);
assert.equal(mixedResult.workingDraft.document.properties.rows.items.properties.value.properties.child.type,"number");

const arrayParent={id:"array-parent",name:"Array parent",version:1,document:{type:"object",properties:{rows:{type:"array",items:{properties:{}}}}},assignments:[],published:false};
const arrayReview=reviewLiveSchemaBulk({rows:[{child:1}]},arrayParent,[arrayParent]);
const arrayResult=applyLiveSchemaBulk(arrayParent,arrayReview);
assert.equal(arrayResult.workingDraft.document.properties.rows.type,"array");
assert.equal(arrayResult.workingDraft.document.properties.rows.items.type,undefined);
assert.equal(arrayResult.workingDraft.document.properties.rows.items.properties.child.type,"number");

const inheritedParent={id:"inherited-parent",name:"Inherited parent",version:1,document:{type:"object",properties:{parent:{description:"Inherited",properties:{}}}},assignments:[],published:false};
const inheritedTarget={id:"inherited-target",name:"Inherited target",version:1,parentSchemaId:"inherited-parent",document:{type:"object",properties:{}},assignments:[],published:false};
const inheritedBefore=structuredClone(inheritedParent),inheritedReview=reviewLiveSchemaBulk({parent:{child:1}},inheritedTarget,[inheritedParent,inheritedTarget]);
assert.ok(inheritedReview.preserved.includes("/parent"));assert.ok(inheritedReview.added.includes("/parent/child"));
const inheritedResult=applyLiveSchemaBulk(inheritedTarget,inheritedReview);
assert.deepEqual(inheritedParent,inheritedBefore);assert.equal(inheritedResult.workingDraft.parentSchemaId,"inherited-parent");
assert.equal(inheritedResult.workingDraft.document.properties.parent.type,undefined);
assert.equal(inheritedResult.workingDraft.document.properties.parent.properties.child.type,"number");

const fresh=createLiveSchemaBulkDraft("Observed event","schema-observed");
assert.equal(fresh.published,false);assert.equal(fresh.workingDraft.pendingChanges.length,0);assert.equal(fresh.assignments.length,0);
console.log("live Add all to schema model tests passed");
