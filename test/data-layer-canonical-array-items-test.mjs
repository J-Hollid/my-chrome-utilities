import assert from "node:assert/strict";
import {
  applyCanonicalCommand,
  canonicalFriendlyPropertyPath,
  canonicalJsonSchemaDocument,
  canonicalPropertyPath,
  canonicalSchemaFromJsonSchema,
  canonicalTableRows,
  createCanonicalSchema,
} from "../dist/data-layer-canonical-schema.js";
import {
  canonicalArrayScopeIssue,
  canonicalArrayScopeSummary,
} from "../dist/data-layer-canonical-array-items.js";
import {
  compileLayeredSchema,
  validateLayeredObservation,
} from "../dist/data-layer-layered-schema.js";

let sequence=0;
const id=(kind)=>`${kind}:${++sequence}`;
const applied=(result)=>{
  assert.equal(result.status,"applied");
  return result.document;
};
const add=(document,name,type,parentId)=>applied(applyCanonicalCommand(document,{
  kind:"add",baseRevision:document.revision,name,type,...(parentId?{parentId}:{}),id,
}));

let document=createCanonicalSchema({id:"schema:arrays",contributorId:"profile:arrays",contributorName:"Arrays"});
document=add(document,"products","array");
const products=document.selectedPropertyId;
document=applied(applyCanonicalCommand(document,{kind:"type",baseRevision:document.revision,propertyId:products,type:"array",itemType:"object",confirmed:true}));
document=add(document,"name","string",products);
const name=document.selectedPropertyId;
document=add(document,"id","string",products);
const productId=document.selectedPropertyId;

assert.equal(canonicalPropertyPath(document,name),"/products/*/name");
assert.equal(canonicalFriendlyPropertyPath(document,name),"products[].name");
assert.deepEqual(canonicalTableRows(document).map(({path,friendlyPath})=>({path,friendlyPath})),[
  {path:"/products",friendlyPath:"products"},
  {path:"/products/*/name",friendlyPath:"products[].name"},
  {path:"/products/*/id",friendlyPath:"products[].id"},
]);
assert.deepEqual(canonicalJsonSchemaDocument(document),{
  type:"object",
  properties:{
    products:{
      type:"array",
      items:{
        type:"object",
        properties:{name:{type:"string"},id:{type:"string"}},
      },
    },
  },
});

document=add(document,"details","array",products);
const details=document.selectedPropertyId;
document=applied(applyCanonicalCommand(document,{kind:"type",baseRevision:document.revision,propertyId:details,type:"array",itemType:"object",confirmed:true}));
document=add(document,"code","string",details);
const code=document.selectedPropertyId;
assert.equal(canonicalPropertyPath(document,code),"/products/*/details/*/code");
assert.equal(canonicalFriendlyPropertyPath(document,code),"products[].details[].code");

const imported=canonicalSchemaFromJsonSchema({
  id:"schema:imported",contributorId:"profile:imported",contributorName:"Imported",
  sourceIdentity:"json:imported",sourceRevision:3,idFactory:id,
  document:{type:"object",properties:{orders:{type:"array",items:{type:"object",properties:{products:{type:"array",items:{type:"object",properties:{id:{type:"string"}}}}}}}}},
});
const importedId=Object.values(imported.nodes).find(({name})=>name==="id").id;
assert.equal(canonicalPropertyPath(imported,importedId),"/orders/*/products/*/id");

const destructive=applyCanonicalCommand(document,{kind:"type",baseRevision:document.revision,propertyId:products,type:"array",itemType:"string"});
assert.equal(destructive.status,"confirmation-required");
assert.match(destructive.impact,/name.*id.*details.*code/);
const simplified=applied(applyCanonicalCommand(document,{kind:"type",baseRevision:document.revision,propertyId:products,type:"array",itemType:"string",confirmed:true}));
assert.equal(Object.values(simplified.nodes).some(({parentId})=>parentId===products),false);

const constraints=[
  {path:"/products",type:"array",itemType:"object",definitionId:products},
  {path:"/products/*/id",type:"string",presence:"required",definitionId:productId,rules:[
    {id:"rule:product-id",name:"Six-character product IDs",kind:"pattern",pattern:"^.{6}$",severity:"error",
      arrayScope:{boundaries:[{propertyId:products,mode:"every"}]}},
  ]},
  {path:"/products/*/details",type:"array",itemType:"object",definitionId:details},
  {path:"/products/*/details/*/code",type:"string",definitionId:code,rules:[
    {id:"rule:first-detail",name:"First detail code",kind:"pattern",pattern:"^OK$",severity:"error",
      arrayScope:{boundaries:[{propertyId:products,mode:"every"},{propertyId:details,mode:"position",position:1}]}},
  ]},
];
const compiled=compileLayeredSchema([{id:"profile:arrays",name:"Arrays",scope:"Shared Profile",constraints}],{eventId:"event:arrays",eventRole:"interaction"});
const validation=validateLayeredObservation({targetId:"target:arrays",targetName:"Arrays",revision:1,compiled},{
  products:[
    {id:"ABC123",details:[{code:"BAD"},{code:"OK"}]},
    {details:[{code:"BAD"}]},
  ],
});
assert.deepEqual(validation.issues.map(({path,canonicalPath,code})=>({path,canonicalPath,code})),[
  {path:"/products/1/id",canonicalPath:"/products/*/id",code:"REQUIRED"},
  {path:"/products/0/details/0/code",canonicalPath:"/products/*/details/*/code",code:"PATTERN"},
  {path:"/products/1/details/0/code",canonicalPath:"/products/*/details/*/code",code:"PATTERN"},
]);

assert.equal(canonicalArrayScopeIssue({boundaries:[{propertyId:products,mode:"position",position:0}]}),"Enter a whole position of 1 or greater.");
assert.equal(canonicalArrayScopeIssue({boundaries:[{propertyId:products,mode:"position",position:1},{propertyId:details,mode:"position",position:1}]}),"Choose Item at position for at most one array boundary.");
assert.equal(canonicalArrayScopeSummary([
  {propertyId:products,name:"product",mode:"every"},
  {propertyId:details,name:"details",mode:"position",position:1},
]),"For every product item use the first item in details");
