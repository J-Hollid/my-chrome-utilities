import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";
import {createContextExportSnapshot} from "../dist/schema-context-export/snapshot.js";
const schema={id:"saved",name:"Saved",version:4,published:true,assignments:[],document:{type:"object",additionalProperties:false,properties:{
  code:{type:"string",enum:["EUR","USD"],pattern:"^[A-Z]+$",maxLength:3,description:"Currency",examples:["EUR"]},
  values:{type:"array",minItems:1,maxItems:3,items:{type:"array",items:{type:"number",minimum:0}}},
  checked:{$ref:"#/$defs/value"},
},$defs:{value:{type:"number",minimum:10}}}};
const source={key:"saved",name:"Saved",role:"Saved Schema",context:"",version:4,schema,schemas:[schema]};
const snapshot=createContextExportSnapshot(source),validate=new Ajv2020({strict:false}).compile(snapshot.document);
assert.equal(snapshot.filename,"saved-revision-4.schema.json");
assert.match(snapshot.document.$id,/saved\/revisions\/4$/);
assert.equal(validate({code:"EUR",values:[[0]],checked:10}),true);
for(const value of [{code:"GBR"},{values:[]},{values:[["0"]]},{checked:9}])assert.equal(validate(value),false,JSON.stringify(value));
assert.equal(snapshot.document.properties.code.description,"Currency");
assert.deepEqual(snapshot.document.properties.code.examples,["EUR"]);
const broken=structuredClone(schema);broken.document.properties.checked.$ref="#/$defs/missing";
assert.throws(()=>createContextExportSnapshot({...source,schema:broken}),/reference/i);
broken.document.properties.checked.$ref="https://example.test/schema";
assert.throws(()=>createContextExportSnapshot({...source,schema:broken}),/reference/i);
assert.throws(()=>createContextExportSnapshot({...source,schema:{...schema,parentSchemaId:"missing"}}),/reference/i);
const unsupported={...schema,attachedRules:[{id:"custom",name:"Conditional custom",version:1,operator:"custom",propertyPath:"/code",conditionGroup:{operator:"All",predicates:[{propertyPath:"/code",operator:"Exists"}]}}]};
assert.equal(createContextExportSnapshot({...source,schema:unsupported}).compatibility.omitted.length,1);
console.log("Saved context export: revision identity, nested constraints, local references, and conditional omissions passed.");
