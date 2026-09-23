import assert from "node:assert/strict";

import {createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {exportExternalStandardSchema,unsupportedStandardSchemaRules} from
  "../dist/standard-schema-interoperability.js";

const state=createSpecificationProject({name:"External schema",site:"external.example",
  id:kind=>`${kind}:external`});
state.project.collections.profiles.push({id:"profile:one",name:"One",requirements:[],
  canonicalSchema:{nodes:{property:{id:"property",rules:[
    {id:"rule:custom",kind:"custom",severity:"error"},
    {id:"rule:warning",kind:"pattern",severity:"warning"},
    {id:"rule:standard",kind:"pattern",severity:"error"},
  ]}}}});
assert.deepEqual(unsupportedStandardSchemaRules(state.project).map(({ruleId})=>ruleId),
  ["rule:custom","rule:warning"],"the report names rules that standard JSON Schema cannot carry");

const files=new Map(),repository={
  async currentProductionManifest(){return{projectRevision:1,schemas:[{
    schemaId:"schema:one",schemaRevision:1,fingerprint:"fingerprint"}]};},
  async loadProductionSchema(){return{effectiveSchema:{type:"object"}};},
  async loadCurrentPublishedProject(){return{revision:1,project:state.project};},
};
const result=await exportExternalStandardSchema({repository,projectId:state.project.id,
  download:(name,contents)=>files.set(name,JSON.parse(contents))});
assert.match(result,/not a configuration backup/u);
assert.equal(files.get("specification.schema.json").oneOf.length,1);
const manifest=files.get("specification.manifest.json");
assert.equal(manifest.configurationBackup,false);
assert.deepEqual(manifest.unsupportedRules.map(({ruleId})=>ruleId),["rule:custom","rule:warning"]);
assert.ok(manifest.excludedContent.includes("image and Excel bodies"));

console.log("standard schema interoperability tests passed");
