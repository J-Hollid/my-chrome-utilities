import assert from "node:assert/strict";
import {filterFocusedReusableRules,focusedConditionLabel,focusedOwnershipActions,focusedPropertySections,focusedRuleFields,focusedSparseDelta} from "../dist/data-layer-focused-schema-property-ui.js";
import {schemaTableOverlayTransition,schemaTableStageExpectedOrAllowed,schemaTableValueFacet} from "../dist/data-layer-schema-table.js";

const expectedSections=["definition","presence","values","conditions","rules","documentation","example","structure"];
assert.deepEqual(focusedPropertySections,expectedSections,"every focused editor shares the same ordered section vocabulary");
for(const section of expectedSections)assert.equal(typeof section,"string");
for(const kind of ["pattern","range","cardinality","condition","reusable","custom"]){const fields=focusedRuleFields(kind);assert.ok(fields.length>0,`${kind} exposes type-specific fields`);assert.equal(new Set(fields).size,fields.length,`${kind} has no duplicate fields`);assert.ok(!fields.includes("targetGroup"),`${kind} has no target-group control`);}
assert.deepEqual(focusedRuleFields("reusable"),["reusableRuleId"],"the reusable kind exposes only its named library selector");
for(const input of [{inherited:true},{local:true},{overridden:true},{invariant:true},{conflict:true}]){const actions=focusedOwnershipActions(input);assert.equal(actions[0]==="View"||actions[0]==="View conflict",true);assert.equal(new Set(actions).size,actions.length);}
for(let index=0;index<100;index+=1){const left={type:index%2?"string":"number",presence:index%3?"required":"optional",documentation:`draft-${index}`},inherited={...left,presence:"optional",documentation:`source-${index}`};const delta=focusedSparseDelta(left,inherited);assert.deepEqual(delta,{...(index%3?{presence:"required"}:{}),documentation:`draft-${index}`});assert.deepEqual(inherited,{...left,presence:"optional",documentation:`source-${index}`});}
for(const kind of ["all","any","not"]){const label=focusedConditionLabel({kind,children:[]});assert.match(label,new RegExp(`^${kind==="all"?"All":kind==="any"?"Any":"Not"} \\(`));}
for(let index=0;index<100;index+=1){
  const query=`Customer ${index}`,rules=[
    {id:`rule:customer:${index}`,name:`${query} tier range`},
    {id:`rule:disabled:${index}`,name:`${query} disabled`,enabled:false},
    {id:`rule:postal:${index}`,name:`Postal code ${index}`},
  ],filtered=filterFocusedReusableRules(rules,index%2?query.toUpperCase():query.toLowerCase());
  assert.deepEqual(filtered,[rules[0]],"reusable search is case-insensitive, name-backed, and excludes disabled entries");
  assert.deepEqual(filterFocusedReusableRules(rules,""),[rules[0],rules[2]],"an empty query restores every enabled reusable rule in stable order");
}
const typedValues=["retail",0,1.5,true,false,null,{tier:"gold"},["nested",2]];
for(let index=0;index<100;index+=1){
  const values=typedValues.slice(0,index%typedValues.length+1),source={allowedValues:values,documentation:`doc-${index}`,example:index};
  const projection=schemaTableValueFacet(source);
  assert.equal(projection.kind,"allowed");
  assert.deepEqual(JSON.parse(projection.text),values,"allowed-value order and JSON types survive table formatting");
  const staged=schemaTableStageExpectedOrAllowed(source,projection.text);
  assert.deepEqual(staged,{...source,allowedValues:values},"staging an allowed-values cell conserves its represented facet and unrelated fields");
  const expected={...source,expectedValue:index};
  assert.equal(schemaTableValueFacet(expected).kind,"expected","expected value always takes precedence over allowed values");
  assert.deepEqual(schemaTableStageExpectedOrAllowed(expected,String(index+1)),{...expected,expectedValue:index+1},"typed expected values remain expected values");
}
assert.deepEqual(schemaTableStageExpectedOrAllowed({allowedValues:["retail"]},'["business",2,true]'),{allowedValues:["business",2,true]});
for(let index=0;index<100;index+=1){
  const path=`/generated ${index}/child~${index%7}`,opened=schemaTableOverlayTransition({phase:"closed"},{kind:"open",path}),focused=schemaTableOverlayTransition(opened,{kind:"focus"}),review=schemaTableOverlayTransition(focused,{kind:"review"});
  assert.deepEqual([opened.path,focused.path,review.path],[path,path,path],"staged row identity is conserved across menu, focused, and review phases");
  for(const kind of ["cancel","escape"]){
    assert.deepEqual(schemaTableOverlayTransition(review,{kind}),{phase:"closed",restorePath:path},`${kind} closes the overlay and restores its exact invoking row path`);
  }
}
console.log("focused schema property UI property tests passed");
