import assert from "node:assert/strict";
import {filterFocusedReusableRules,focusedConditionLabel,focusedOwnershipActions,focusedPropertySections,focusedRuleFields,focusedSparseDelta} from "../dist/data-layer-focused-schema-property-ui.js";
import {schemaTableAllowedValues,schemaTableEditableFacets,schemaTableExampleControl,schemaTableOverlayPlacement,schemaTableOverlayTransition,schemaTableQuickEditDestination,schemaTableStageAllowedValues,schemaTableStageExpectedOrAllowed,schemaTableValueFacet} from "../dist/data-layer-schema-table.js";

const expectedSections=["definition","rules","structure"];
assert.deepEqual(focusedPropertySections,expectedSections,"every focused editor shares the same ordered section vocabulary");
for(const section of expectedSections)assert.equal(typeof section,"string");
for(const kind of ["presence","value","pattern","range","cardinality","reusable"]){const fields=focusedRuleFields(kind);assert.ok(fields.length>0,`${kind} exposes type-specific fields`);assert.equal(new Set(fields).size,fields.length,`${kind} has no duplicate fields`);assert.ok(!fields.includes("targetGroup"),`${kind} has no target-group control`);assert.ok(fields.includes("condition"),`${kind} owns its When condition`);}
assert.deepEqual(focusedRuleFields("reusable"),["condition","reusableRuleId"],"the reusable kind owns When and its named library selector");
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
let randomState=0x51f15e;const random=()=>((randomState=Math.imul(randomState,1664525)+1013904223>>>0)/0x100000000),word=()=>`value-${Math.floor(random()*1000)}`;
const generatedValue=(type,index)=>type==="string"?(index%2?`${word()}, ${word()}`:word()):type==="number"?Number((random()*200-100).toFixed(3)):type==="integer"?Math.floor(random()*200-100):type==="boolean"?random()>=0.5:type==="null"?null:type==="object"?{first:Math.floor(random()*20),second:`${word()}, nested`}: [word(),Math.floor(random()*20),{nested:index}];
for(const type of ["string","number","integer","boolean","null","object","array"])for(let index=0;index<100;index+=1){
  const first=generatedValue(type,index),second=generatedValue(type,index+100),expectedSource={expectedValue:first,documentation:`doc-${type}-${index}`},expectedProjection=schemaTableValueFacet(expectedSource);
  assert.equal(expectedProjection.kind,"expected");
  assert.deepEqual(schemaTableStageExpectedOrAllowed(expectedSource,expectedProjection.text),expectedSource,`${type} expected values round-trip through human text`);
  const allowedSource={allowedValues:[first,second],documentation:`doc-${type}-${index}`},allowedProjection=schemaTableValueFacet(allowedSource);
  assert.equal(allowedProjection.kind,"allowed");
  assert.notEqual(allowedProjection.text,JSON.stringify([first,second]),"the allowed-value set has no enclosing JSON brackets");
  assert.deepEqual(schemaTableStageExpectedOrAllowed(allowedSource,allowedProjection.text),allowedSource,`${type} allowed values round-trip in order without losing types`);
}
for(const type of ["string","number","integer","boolean","null","object","array"])for(let index=0;index<100;index+=1){
  const values=[generatedValue(type,index),generatedValue(type,index+100)],source={allowedValues:values,untouched:`metadata-${type}-${index}`},before=structuredClone(source),text=schemaTableAllowedValues(source);
  assert.notEqual(text,JSON.stringify(values),`${type} allowed values use comma-separated authoring text rather than an enclosing collection`);
  assert.deepEqual(schemaTableStageAllowedValues(values,text,type),values,`${type} allowed values round-trip without changing order or types`);
  assert.deepEqual(source,before,`${type} allowed-value projection conserves its source object`);
  const legacy={expectedValue:values[0],untouched:`legacy-${index}`},legacyBefore=structuredClone(legacy);
  assert.deepEqual(schemaTableStageAllowedValues([],schemaTableAllowedValues(legacy),type),[values[0]],`${type} legacy exact values project as one typed allowed value`);
  assert.deepEqual(legacy,legacyBefore,`${type} legacy exact projection does not mutate its source`);
  assert.deepEqual(schemaTableExampleControl("blank",values),{kind:"none"});
  assert.deepEqual(schemaTableExampleControl("allowed-value",values),{kind:"select",values});
  assert.deepEqual(schemaTableExampleControl("custom",values),{kind:"input"});
}
assert.deepEqual(schemaTableStageExpectedOrAllowed({expectedValue:{first:1,second:2}},'{"first":3,"second":4}'),{expectedValue:{first:3,second:4}});
assert.deepEqual(schemaTableStageExpectedOrAllowed({expectedValue:"contact"},'contact, delivery, payment'),{allowedValues:["contact","delivery","payment"]});
assert.deepEqual(schemaTableStageExpectedOrAllowed({allowedValues:["contact","delivery"]},"payment"),{expectedValue:"payment"});
assert.deepEqual(schemaTableStageExpectedOrAllowed({allowedValues:[{first:1},{second:2}]},'{"first":3}, {"second":4}'),{allowedValues:[{first:3},{second:4}]});
for(let index=0;index<100;index+=1){
  const path=`/generated ${index}/child~${index%7}`,opened=schemaTableOverlayTransition({phase:"closed"},{kind:"open",path}),focused=schemaTableOverlayTransition(opened,{kind:"focus"}),review=schemaTableOverlayTransition(focused,{kind:"review"});
  assert.deepEqual([opened.path,focused.path,review.path],[path,path,path],"staged row identity is conserved across menu, focused, and review phases");
  for(const kind of ["cancel","escape"]){
    assert.deepEqual(schemaTableOverlayTransition(review,{kind}),{phase:"closed",restorePath:path},`${kind} closes the overlay and restores its exact invoking row path`);
  }
}
for(let example=0;example<200;example+=1){
  const viewport={width:64+Math.floor(random()*1200),height:64+Math.floor(random()*900)},anchorWidth=8+Math.floor(random()*48),anchorHeight=8+Math.floor(random()*48),left=Math.floor(random()*(viewport.width-anchorWidth)),top=Math.floor(random()*(viewport.height-anchorHeight)),anchor={left,right:left+anchorWidth,top,bottom:top+anchorHeight,width:anchorWidth,height:anchorHeight},width=16+Math.floor(random()*viewport.width),compactHeight=8+Math.floor(random()*viewport.height),growth=1+Math.floor(random()*viewport.height),compact=schemaTableOverlayPlacement(anchor,{width,height:compactHeight},viewport),grown=schemaTableOverlayPlacement(anchor,{width,height:compactHeight+growth},viewport);
  for(const placement of [compact,grown]){
    assert.ok(placement.left>=8&&placement.top>=8,"generated overlays retain the viewport padding");
    assert.ok(placement.left+placement.width<=viewport.width-8,"generated overlays remain horizontally contained");
    assert.ok(placement.top+placement.height<=viewport.height-8,"generated overlays remain vertically contained");
    assert.ok(placement.width<=viewport.width-16&&placement.height<=viewport.height-16,"generated overlays use no more than the available viewport");
    assert.equal(placement.maxHeight,viewport.height-16,"generated overlays expose the exact available scroll height");
  }
  assert.ok(grown.top<=compact.top,"growing an open overlay reflows only upward or remains clamped");
  assert.equal(grown.left,compact.left,"vertical content growth conserves horizontal association");
  assert.equal(grown.width,compact.width,"vertical content growth conserves overlay width");
}
for(let example=0;example<100;example+=1){
  const rowCount=1+Math.floor(random()*20),cells=Array.from({length:rowCount},(_,row)=>schemaTableEditableFacets.map((facet)=>({path:`/generated-${example}/row-${row}`,facet}))).flat();
  for(const [index,cell] of cells.entries()){
    const next=schemaTableQuickEditDestination(cells,cell,1),previous=schemaTableQuickEditDestination(cells,cell,-1);
    assert.deepEqual(next,cells[index+1],"forward quick-edit traversal preserves the generated editable-cell order");
    assert.deepEqual(previous,cells[index-1],"reverse quick-edit traversal preserves the generated editable-cell order");
    if(next)assert.deepEqual(schemaTableQuickEditDestination(cells,next,-1),cell,"forward then reverse traversal restores the exact path and facet");
    if(previous)assert.deepEqual(schemaTableQuickEditDestination(cells,previous,1),cell,"reverse then forward traversal restores the exact path and facet");
  }
  const absent={path:`/absent-${example}`,facet:schemaTableEditableFacets[example%schemaTableEditableFacets.length]};
  assert.equal(schemaTableQuickEditDestination(cells,absent,example%2?1:-1),undefined,"a stale cell identity cannot redirect focus to an unrelated editable cell");
}
console.log("focused schema property UI property tests passed");
