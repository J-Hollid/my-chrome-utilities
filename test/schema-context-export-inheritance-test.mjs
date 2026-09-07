import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";
import {savedSchemaCanonicalDocument,savedSchemaFromCanonical} from "../dist/data-layer-saved-schema-canonical.js";
import {createContextExportSnapshot} from "../dist/schema-context-export/snapshot.js";

const parent={id:"parent",name:"Parent",version:2,assignments:[],document:{type:"object",required:["inherited","removed"],properties:{inherited:{type:"string"},removed:{type:"boolean"}}}};
const child={id:"child",name:"Child",version:4,assignments:[],parentSchemaId:"parent",inheritedRuleOverrides:{"/removed":"disabled"},document:{type:"object",properties:{code:{type:"string",maxLength:8}}}};
const canonical=savedSchemaCanonicalDocument(child,kind=>`${kind}:${crypto.randomUUID()}`);
const schema=savedSchemaFromCanonical(child,canonical);
const source={key:"child",name:"Child",role:"Saved Schema",context:"",version:"Draft",canonical,schema,schemas:[parent,child]};
const snapshot=createContextExportSnapshot(source),validate=new Ajv2020({strict:false}).compile(snapshot.document);
assert.equal(snapshot.document.properties.inherited.type,"string");
assert.equal(snapshot.document.properties.removed,undefined);
assert.equal(validate({inherited:"yes",code:"12345678"}),true);
assert.equal(validate({code:"OK"}),false);
assert.equal(validate({inherited:"yes",code:"123456789"}),false);
assert.equal(snapshot.document.$id,undefined);
assert.equal(snapshot.compatibility.omitted.length,0);
console.log("Saved Draft inheritance, exclusions, and source constraints passed.");
