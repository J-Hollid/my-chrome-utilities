import assert from "node:assert/strict";
import {
  applyCanonicalCommand,
  canonicalArrayBoundaries,
  canonicalFriendlyPropertyPath,
  canonicalJsonSchemaDocument,
  canonicalPropertyPath,
  canonicalSchemaFromJsonSchema,
  createCanonicalSchema,
} from "../dist/data-layer-canonical-schema.js";
import {canonicalArrayScopeIssue} from "../dist/data-layer-canonical-array-items.js";
import {compileLayeredSchema,validateLayeredObservation} from "../dist/data-layer-layered-schema.js";

let sequence=0;
const id=(kind)=>`${kind}:property:${++sequence}`;
const applied=(result)=>{
  assert.equal(result.status,"applied");
  return result.document;
};

for(let depth=1;depth<=8;depth+=1){
  let document=createCanonicalSchema({id:`schema:depth:${depth}`,contributorId:`profile:depth:${depth}`,contributorName:`Depth ${depth}`});
  document=applied(applyCanonicalCommand(document,{kind:"add",baseRevision:document.revision,name:"matrix",type:"array",id}));
  const matrix=document.selectedPropertyId,itemIds=Array.from({length:Math.max(0,depth-1)},(_,index)=>`item:depth:${depth}:${index}`),itemSchema=itemIds.reduceRight((items,itemId)=>({id:itemId,type:"array",items}),{id:`item:terminal:${depth}`,type:"object"});
  document=applied(applyCanonicalCommand(document,{kind:"set",baseRevision:document.revision,propertyId:matrix,patch:{type:"array",itemType:itemSchema.type,itemSchema},confirmed:true}));
  document=applied(applyCanonicalCommand(document,{kind:"add",baseRevision:document.revision,name:"code",type:"string",parentId:matrix,id}));
  const code=document.selectedPropertyId,stars="/*".repeat(depth),brackets="[]".repeat(depth);
  assert.equal(canonicalPropertyPath(document,code),`/matrix${stars}/code`);
  assert.equal(canonicalFriendlyPropertyPath(document,code),`matrix${brackets}.code`);
  assert.equal(canonicalArrayBoundaries(document,code).length,depth);
  const json=canonicalJsonSchemaDocument(document),imported=canonicalSchemaFromJsonSchema({id:`schema:import:${depth}`,contributorId:`profile:import:${depth}`,contributorName:"Import",sourceIdentity:`json:${depth}`,sourceRevision:1,document:json,idFactory:id}),importedCode=Object.values(imported.nodes).find(({name})=>name==="code");
  assert.ok(importedCode);
  assert.equal(canonicalPropertyPath(imported,importedCode.id),`/matrix${stars}/code`);
  const scopeBoundaries=canonicalArrayBoundaries(document,code).map(({propertyId},index)=>({propertyId,mode:index===depth-1?"position":"every",...(index===depth-1?{position:1}:{})}));
  const compiled=compileLayeredSchema([{id:`profile:scope:${depth}`,name:"Scope",scope:"Shared Profile",constraints:[
    {path:"/matrix",type:"array",itemType:itemSchema.type,itemSchema,definitionId:matrix},
    {path:`/matrix${stars}/code`,type:"string",definitionId:code,rules:[{id:`rule:scope:${depth}`,kind:"pattern",pattern:"^OK$",severity:"error",condition:{kind:"predicate",propertyId:code,operator:"Exists"},arrayScope:{boundaries:scopeBoundaries}}]},
  ]}],{eventId:`event:scope:${depth}`,eventRole:"interaction"});
  const nested=(remaining)=>remaining===1?[{code:"BAD"},{code:"OK"}]:[nested(remaining-1)];
  const issues=validateLayeredObservation({targetId:`target:scope:${depth}`,targetName:"Scope",revision:1,compiled},{matrix:nested(depth)}).issues;
  assert.deepEqual(issues.map(({path,canonicalPath,code:issueCode})=>({path,canonicalPath,code:issueCode})),[
    {path:`/matrix${"/0".repeat(depth)}/code`,canonicalPath:`/matrix${stars}/code`,code:"PATTERN"},
  ]);
  const invalidAt=(remaining)=>remaining===1?["scalar"]:[invalidAt(remaining-1)];
  const invalid=validateLayeredObservation({targetId:`target:scope:${depth}`,targetName:"Scope",revision:1,compiled},{matrix:invalidAt(depth)}).issues.filter(({code})=>code==="TYPE");
  assert.deepEqual(invalid.map(({path,canonicalPath,expected})=>({path,canonicalPath,expected})),[
    {path:`/matrix${"/0".repeat(depth)}`,canonicalPath:`/matrix${"/*".repeat(depth)}`,expected:"object"},
  ]);
  const scalarItems=structuredClone(itemSchema);
  let terminal=scalarItems;
  while(terminal.items)terminal=terminal.items;
  terminal.type="string";
  const destructive=applyCanonicalCommand(document,{kind:"set",baseRevision:document.revision,propertyId:matrix,patch:{itemSchema:scalarItems}});
  assert.equal(destructive.status,"confirmation-required",`depth ${depth} recursive type change requires confirmation`);
  assert.deepEqual(destructive.document,document,`depth ${depth} pre-confirmation result preserves the document`);
  const confirmed=applied(applyCanonicalCommand(document,{kind:"set",baseRevision:document.revision,propertyId:matrix,patch:{itemSchema:scalarItems},confirmed:true}));
  assert.equal(confirmed.nodes[code],undefined,`depth ${depth} confirmation removes incompatible descendants`);
  let confirmedTerminal=confirmed.nodes[matrix].itemSchema;
  while(confirmedTerminal.items)confirmedTerminal=confirmedTerminal.items;
  assert.equal(confirmedTerminal.type,"string");
  assert.equal(document.nodes[code].id,code,`depth ${depth} prior state retains the stable child identity for Undo`);
}

for(let position=-3;position<=12;position+=0.5){
  const issue=canonicalArrayScopeIssue({boundaries:[{propertyId:"array",mode:"position",position}]});
  assert.equal(Boolean(issue),!Number.isInteger(position)||position<1);
}
for(let depth=1;depth<=8;depth+=1){
  const boundaries=Array.from({length:depth},(_,index)=>({propertyId:`array:${index}`,mode:index===depth-1?"position":"every",...(index===depth-1?{position:1}:{})}));
  assert.equal(canonicalArrayScopeIssue({boundaries}),undefined);
  if(depth>1)assert.match(canonicalArrayScopeIssue({boundaries:boundaries.map((boundary,index)=>index<2?{...boundary,mode:"position",position:1}:boundary)}),/at most one/);
}
