import assert from "node:assert/strict";
import { SchemaInstalledEditorWorkflow } from "../../../dist/data-layer-installed/schemas/installed-editor-workflow.js";

const calls=[];
const tabs=[{dataset:{schemaSubview:"master"},setAttribute(name,value){this[name]=value;}},{dataset:{schemaSubview:"rules"},setAttribute(name,value){this[name]=value;}}];
const panels=[{id:"master",hidden:false},{id:"rules",hidden:true}],filter={value:"query",focus(){calls.push("focus-filter");}},name={focus(){calls.push("focus-name");}};
const library={schemas:[],activeSchemaId:undefined,draft:undefined},editor={updateName(){calls.push("update-name");},render(){calls.push("render-editor");}};
const workflow=new SchemaInstalledEditorWorkflow({library,editor,property:{},propertyFilter:filter,subviews:tabs,panels,liveEventQuery:{hidden:false},schemaEditorName:name,
  renderProperty(){calls.push("render-property");},renderAll(){calls.push("render-all");},showSchemas(){calls.push("show-schemas");},openRoute(){},createEmpty(){},renderSpecification(){}});
workflow.updateName();workflow.clearPropertyFilter();workflow.showSubview("rules");
assert.deepEqual(calls,["update-name","render-property","focus-filter"]);
assert.equal(filter.value,"");assert.equal(tabs[1]["aria-selected"],"true");assert.equal(panels[0].hidden,true);assert.equal(panels[1].hidden,false);
workflow.openDraft({id:"schema:one",name:"One",version:1,document:{type:"object"},assignments:[]});
assert.equal(library.activeSchemaId,"schema:one");assert.deepEqual(calls.slice(-3),["show-schemas","render-all","focus-name"]);
