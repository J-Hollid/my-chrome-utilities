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
const conditional={id:"conditional",name:"Conditional",version:1,assignments:[],document:{type:"object",properties:{kind:{type:"string"},amount:{type:"number"}}},attachedRules:[{id:"conditional-exact",version:1,operator:"exact-value",propertyPath:"/amount",parameters:"10",conditionGroup:{operator:"All",predicates:[{propertyPath:"/kind",operator:"Exists"}]}}]};
const migrated=savedSchemaCanonicalDocument(conditional,()=>crypto.randomUUID());
const exported=createContextExportSnapshot({...source,canonical:migrated,schema:savedSchemaFromCanonical(conditional,migrated),schemas:[conditional]});
const conditionalCheck=new Ajv2020({strict:false}).compile(exported.document);
assert.equal(conditionalCheck({kind:"purchase",amount:10}),true);
assert.equal(conditionalCheck({kind:"purchase",amount:9}),false,"Saved conditional exact values remain assertions");
assert.equal(conditionalCheck({amount:9}),true);
assert.equal(exported.compatibility.omitted.length,0,"A supported migrated rule is not an omission");
console.log("Saved Draft inheritance, exclusions, and source constraints passed.");

for(const inherited of [false,true]){
  const requiredParent={...parent,document:{type:"object",required:["code"],properties:{code:{type:"string"}}}};
  const draft={id:"required-draft",name:"Required Draft",version:1,assignments:[],
    ...(inherited?{parentSchemaId:requiredParent.id}:{}),
    document:{type:"object",required:["code","nested","rows"],properties:{
      code:{type:"string"},nested:{type:"object",required:["value"],properties:{value:{type:"number"}}},
      rows:{type:"array",items:{type:"object",required:["label"],properties:{label:{type:"string"}}}},
    }}};
  const accepted=savedSchemaCanonicalDocument(draft,()=>crypto.randomUUID());
  const saved=savedSchemaFromCanonical(draft,accepted);
  const result=createContextExportSnapshot({...source,key:draft.id,canonical:accepted,schema:saved,
    schemas:inherited?[requiredParent,saved]:[saved]});
  const ajv=new Ajv2020({strict:false});
  assert.equal(ajv.validateSchema(result.document),true,JSON.stringify(ajv.errors));
  assert.deepEqual(result.document.required,["code","nested","rows"]);
  assert.deepEqual(result.document.properties.nested.required,["value"]);
  assert.deepEqual(result.document.properties.rows.items.required,["label"]);
  const check=ajv.compile(result.document),valid={code:"A",nested:{value:1},rows:[{label:"B"}]};
  assert.equal(check(valid),true);
  for(const invalid of [{nested:{value:1},rows:[{label:"B"}]},{...valid,nested:{}},{...valid,rows:[{}]}]){
    assert.equal(check(invalid),false,JSON.stringify(invalid));
  }
}
console.log("Saved Draft root, nested, array-item, and inherited required fields remain unique and enforced.");
