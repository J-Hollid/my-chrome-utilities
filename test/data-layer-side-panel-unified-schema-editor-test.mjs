import assert from "node:assert/strict";
import {
  createUnifiedCanonicalEditorController,
  savedSchemaCanonicalDocument,
  savedSchemaFromCanonical,
} from "../dist/data-layer-side-panel-unified-schema-editor.js";

let sequence=0;
const id=(kind)=>`${kind}:${++sequence}`;
const saved={
  id:"schema:article",name:"Article",version:3,published:true,assignments:[],
  document:{type:"object",required:["article"],properties:{article:{type:"object",required:["category"],properties:{category:{type:"string",enum:["News","Guide"],description:"Editorial category",examples:["News"]}}}}},
  attachedRules:[
    {id:"rule:category",version:2,propertyPath:"article.category",operator:"pattern",parameters:"^[A-Z]",severity:"warning",message:"Use title case"},
    {id:"rule:length",version:1,propertyPath:"article.category",operator:"numeric-range",parameters:"2,20",severity:"error",message:"Use a useful length"},
  ],
  documentation:{properties:{"/article/category":{displayName:"Category",description:"Editorial category",comments:"Shown in reporting",example:{value:"News",selectionMethod:"allowed value"}}}},
};
const canonical=savedSchemaCanonicalDocument(saved,id),category=Object.values(canonical.nodes).find(({name})=>name==="category");
assert.equal(category.type,"string");
assert.deepEqual(category.allowedValues.map(({value})=>value),["News","Guide"]);
assert.equal(category.documentation.description,"Editorial category");
assert.equal(category.documentation.displayText,"Category");
assert.equal(category.documentation.comments,"Shown in reporting");
assert.equal(category.documentation.example.value,"News");
assert.equal(category.rules[0].message,"Use title case");
assert.deepEqual(category.rules[1],{id:"rule:length",kind:"range",minimum:2,maximum:20,severity:"error",message:"Use a useful length",reusableRuleId:"rule:length"});
const roundTrip=savedSchemaFromCanonical(saved,canonical);
assert.deepEqual(roundTrip.document,saved.document,"the complete JSON-schema structure survives the canonical adapter");
assert.deepEqual(roundTrip.attachedRules,saved.attachedRules,"saved-schema rules survive the canonical adapter");
assert.deepEqual(roundTrip.documentation,saved.documentation,"rich saved-schema documentation survives the canonical adapter");

const documents={saved:canonical,profile:{...canonical,id:"canonical:profile",contributorId:"profile:article",contributorName:"Article profile"}},writes=[];
let mounts=0,render;
const controller=createUnifiedCanonicalEditorController((options)=>{mounts+=1;render=()=>options.load();return{render};});
controller.select({key:"saved",label:"Article saved schema",load:()=>documents.saved,dispatch:(command)=>{writes.push(["saved",command.kind]);return{status:"applied",document:documents.saved};}});
assert.equal(controller.current().id,canonical.id);
controller.select({key:"profile",label:"Article profile",load:()=>documents.profile,dispatch:(command)=>{writes.push(["profile",command.kind]);return{status:"applied",document:documents.profile};}});
assert.equal(controller.current().id,"canonical:profile");
controller.dispatch({kind:"view",baseRevision:documents.profile.revision,view:"table"});
assert.deepEqual(writes,[["profile","view"]]);
assert.equal(mounts,1,"saved schemas and contributors reuse one mounted canonical editor core");

console.log("data-layer unified side-panel schema editor tests passed");
