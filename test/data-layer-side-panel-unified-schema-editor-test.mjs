import assert from "node:assert/strict";
import {
  createUnifiedCanonicalEditorController,
  savedSchemaCanonicalDocument,
  savedSchemaFromCanonical,
} from "../dist/data-layer-side-panel-unified-schema-editor.js";
import {createSchemaWorkingDraft,publishSchemaWorkingDraft} from "../dist/data-layer-schema-verification.js";

let sequence=0;
const id=(kind)=>`${kind}:${++sequence}`;
const saved={
  id:"schema:article",name:"Article",version:3,published:true,assignments:[],
  document:{
    type:"object",additionalProperties:false,typeMismatchTreatment:"warning",required:["article"],
    properties:{
      article:{
        type:"object",propertyOrigin:"manual",required:["category"],
        properties:{
          category:{type:"string",enum:["News","Guide"],description:"Editorial category",examples:["News"],minimum:2,maximum:20,"x-editor-hint":"headline"},
          items:{type:"array",items:{type:"object",additionalProperties:false,properties:{sku:{type:"string"}}}},
        },
      },
    },
  },
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
assert.equal(category.rules.find(({id})=>id==="rule:category").message,"Use title case");
assert.deepEqual(category.rules.find(({id})=>id==="rule:length"),{id:"rule:length",kind:"range",minimum:2,maximum:20,severity:"error",message:"Use a useful length",reusableRuleId:"rule:length"});
const roundTrip=savedSchemaFromCanonical(saved,canonical);
assert.deepEqual(roundTrip.document,saved.document,"the complete JSON-schema structure survives the canonical adapter");
assert.deepEqual(roundTrip.attachedRules,saved.attachedRules,"saved-schema rules survive the canonical adapter");
assert.deepEqual(roundTrip.documentation,saved.documentation,"rich saved-schema documentation survives the canonical adapter");
assert.deepEqual(roundTrip.canonicalSchema,canonical,"the canonical document and its node identities are persisted with the saved-schema draft");
const reloaded=savedSchemaCanonicalDocument(roundTrip,()=>{throw new Error("reload must not regenerate canonical identities");});
assert.deepEqual(reloaded,canonical,"reloading a saved schema restores the exact canonical document");
const published=publishSchemaWorkingDraft(createSchemaWorkingDraft(roundTrip));
assert.deepEqual(published.canonicalSchema,canonical,"publishing carries canonical identities and rich facets into the immutable saved revision");

const documents={saved:canonical,profile:{...canonical,id:"canonical:profile",contributorId:"profile:article",contributorName:"Article profile"}},writes=[];
let mounts=0,render;
const controller=createUnifiedCanonicalEditorController((options)=>{mounts+=1;render=()=>options.load();return{render};});
controller.select({key:"saved",label:"Article saved schema",load:()=>documents.saved,dispatch:(command)=>{writes.push(["saved",command.kind]);return{status:"applied",document:documents.saved};}});
assert.equal(controller.current().id,canonical.id);
controller.select({key:"profile",label:"Article profile",load:()=>documents.profile,dispatch:(command)=>{writes.push(["profile",command.kind]);return{status:"applied",document:documents.profile};}});
assert.equal(controller.current().id,"canonical:profile");
controller.select({key:"page-group",label:"Checkout Page Group",load:()=>documents.profile,dispatch:(command)=>{writes.push(["page-group",command.kind]);return{status:"applied",document:documents.profile};}});
controller.select({key:"page",label:"Cart Page",load:()=>documents.profile,dispatch:(command)=>{writes.push(["page",command.kind]);return{status:"applied",document:documents.profile};}});
controller.dispatch({kind:"view",baseRevision:documents.profile.revision,view:"table"});
assert.deepEqual(writes,[["page","view"]]);
assert.equal(mounts,1,"saved schemas, Page Groups, Pages, and other contributors reuse one mounted canonical editor core");

console.log("data-layer unified side-panel schema editor tests passed");
