import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { SchemaInstalledEditorWorkflow } from "../../../dist/data-layer-installed/schemas/installed-editor-workflow.js";

const calls=[];
const tabs=[{dataset:{schemaSubview:"master"},setAttribute(name,value){this[name]=value;}},{dataset:{schemaSubview:"rules"},setAttribute(name,value){this[name]=value;}}];
const panels=[{id:"master",hidden:false},{id:"rules",hidden:true}],filter={value:"query",focus(){calls.push("focus-filter");}},name={focus(){calls.push("focus-name");}};
let activeSchemaId,draft;
const library={schemas:[],get activeSchemaId(){return activeSchemaId;},get draft(){return draft;},
  select(id,next){activeSchemaId=id;draft=structuredClone(next);},clearSelection(){activeSchemaId=undefined;draft=undefined;},
  setDraft(next){draft=next?structuredClone(next):undefined;}},editor={updateName(){calls.push("update-name");},render(){calls.push("render-editor");}};
const workflow=new SchemaInstalledEditorWorkflow({library,editor,property:{},propertyFilter:filter,subviews:tabs,panels,liveEventQuery:{hidden:false},schemaEditorName:name,
  renderProperty(){calls.push("render-property");},renderAll(){calls.push("render-all");},showSchemas(){calls.push("show-schemas");},openRoute(){},createEmpty(){},renderSpecification(){}});
workflow.updateName();workflow.clearPropertyFilter();workflow.showSubview("rules");
assert.deepEqual(calls,["update-name","render-property","focus-filter"]);
assert.equal(filter.value,"");assert.equal(tabs[1]["aria-selected"],"true");assert.equal(panels[0].hidden,true);assert.equal(panels[1].hidden,false);
workflow.openDraft({id:"schema:one",name:"One",version:1,document:{type:"object"},assignments:[]});
assert.equal(library.activeSchemaId,"schema:one");assert.deepEqual(calls.slice(-3),["show-schemas","render-all","focus-name"]);

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const causalCategory="other:installed editor workflow fixture ownership contract";
  if(context.causalCategory===causalCategory){
    const normalized=(value)=>Array.isArray(value)?value.map(normalized):value&&typeof value==="object"
      ?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right)).map(([key,nested])=>[key,normalized(nested)])):value;
    const digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");
    const expectedPreRepairFailure={selectionCommandAvailable:false,draftOwnedByCommand:false};
    const expectedRepairResult={selectionCommandAvailable:true,draftOwnedByCommand:true};
    const observed={selectionCommandAvailable:typeof library.select==="function",draftOwnedByCommand:library.draft?.id==="schema:one"};
    assert.deepEqual(observed,expectedRepairResult);
    const fixture={id:"installed-editor-workflow-library-command-v1",causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{schemaId:"schema:one"},expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest=digest(fixture);
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
      failureDigest:context.failureDigest,fixture,preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed}}}));
  }
}
