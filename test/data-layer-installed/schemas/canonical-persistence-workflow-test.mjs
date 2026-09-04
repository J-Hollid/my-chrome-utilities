import assert from "node:assert/strict";
import { SchemaCanonicalPersistenceWorkflow } from "../../../dist/data-layer-installed/schemas/canonical-persistence-workflow.js";

const calls=[],schemas=[{id:"schema:one",name:"One",version:1,document:{type:"object"},assignments:[]}];
const library={schemas,persist(){calls.push("persist");}},rules={rules:[],render(){calls.push("rules-render");},persist(){calls.push("rules-persist");}},canonical={settlementClaims:new Map([[7,"schema:one"]]),editor:undefined,settlementSchemaId:undefined,
  beginSettlement(id){calls.push(["begin",id]);return 7;},clearSettlement(id,claim){calls.push(["clear",id,claim]);return true;},queueLibraryPersistence(id,current,persist){calls.push(["queue",id,current.length]);persist();}};
const view={renderContext(){calls.push("context");},render(){calls.push("render");},open(adapter){calls.push(["open",adapter.key]);},close(value){calls.push(["close",value]);},openSaved(schema){calls.push(["saved",schema.id]);},projection(){return schemas[0];},facet(){return "facet";}};
const workflow=new SchemaCanonicalPersistenceWorkflow({root:{querySelector(){return null;}},storage:{setItem(){},getItem(){return null;},removeItem(){}},library,rules,property:{},canonical,view,editor:{setAttribute(name,value){calls.push([name,value]);}},save:{disabled:false},scheduleFrame(run){run();},renderAll(){calls.push("all");},editorDraft:(schema)=>schema});
workflow.renderContext();workflow.render();workflow.queueLibraryPersistence("schema:one");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-022
assert.deepEqual(calls.slice(0,5),["context","render",["queue","schema:one",1],"persist"]);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-003
assert.equal(workflow.beginSettlement("schema:one"),7);await workflow.settle({type:"saved",schemaId:"schema:one"});

// retired-schema-assertion: canonical-edit-history-settlement-overlay-004
assert.equal(calls.some((entry)=>Array.isArray(entry)&&entry[0]==="clear"),true);
const completion=workflow.begin("guided","schema:one",schemas,[],schemas,[]);await workflow.settle({type:"saved",schemaId:"schema:one"});await completion;
