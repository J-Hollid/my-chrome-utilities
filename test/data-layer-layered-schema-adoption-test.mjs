import assert from "node:assert/strict";
import {adoptSavedSchema,createSpecificationProject} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:${++sequence}`,source={id:"schema:sitewide",name:"Sitewide",version:4,published:true,document:{type:"object",properties:{checkout:{type:"object",properties:{funnel_step:{type:"string",enum:["3a","3b"]}}}}},rules:[{name:"checkout"}],documentation:"Site contract",examples:[{checkout:{funnel_step:"3b"}}],assignments:[]},libraryBytes=JSON.stringify(source);
const state=adoptSavedSchema(createSpecificationProject({name:"Shop",site:"shop.example",id}),source),profile=state.project.collections.profiles[0];
assert.equal(profile.name,"Sitewide");
assert.equal(profile.sourceIdentity,source.id);
assert.equal(profile.sourceRevision,4);
assert.deepEqual(profile.adoptionProvenance,{kind:"saved-schema-library",schemaId:source.id,revision:4});
assert.deepEqual(profile.structuredSchema,source.document);
assert.notEqual(profile.structuredSchema,source.document);
assert.equal(JSON.stringify(source),libraryBytes,"adoption must not change Saved Schema Library bytes");
assert.equal(state.project.collections.profiles.length,1);
console.log("data-layer layered schema adoption tests passed");
