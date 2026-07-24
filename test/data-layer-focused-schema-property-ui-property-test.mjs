import assert from "node:assert/strict";
import {focusedConditionLabel,focusedOwnershipActions,focusedPropertySections,focusedRuleFields,focusedSparseDelta} from "../dist/data-layer-focused-schema-property-ui.js";

const expectedSections=["definition","presence","values","conditions","rules","documentation","example","structure"];
assert.deepEqual(focusedPropertySections,expectedSections,"every focused editor shares the same ordered section vocabulary");
for(const section of expectedSections)assert.equal(typeof section,"string");
for(const kind of ["pattern","range","cardinality","condition","custom"]){const fields=focusedRuleFields(kind);assert.ok(fields.length>0,`${kind} exposes type-specific fields`);assert.equal(new Set(fields).size,fields.length,`${kind} has no duplicate fields`);assert.ok(!fields.includes("targetGroup"),`${kind} has no target-group control`);}
for(const input of [{inherited:true},{local:true},{overridden:true},{invariant:true},{conflict:true}]){const actions=focusedOwnershipActions(input);assert.equal(actions[0]==="View"||actions[0]==="View conflict",true);assert.equal(new Set(actions).size,actions.length);}
for(let index=0;index<100;index+=1){const left={type:index%2?"string":"number",presence:index%3?"required":"optional",documentation:`draft-${index}`},inherited={...left,presence:"optional",documentation:`source-${index}`};const delta=focusedSparseDelta(left,inherited);assert.deepEqual(delta,{...(index%3?{presence:"required"}:{}),documentation:`draft-${index}`});assert.deepEqual(inherited,{...left,presence:"optional",documentation:`source-${index}`});}
for(const kind of ["all","any","not"]){const label=focusedConditionLabel({kind,children:[]});assert.match(label,new RegExp(`^${kind==="all"?"All":kind==="any"?"Any":"Not"} \\(`));}
console.log("focused schema property UI property tests passed");
