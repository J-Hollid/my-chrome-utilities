import assert from "node:assert/strict";
import {
  savedSchemaCanonicalDocument,
  savedSchemaFromCanonical,
} from "../dist/data-layer-side-panel-unified-schema-editor.js";

let randomState=0x5eed1234;
const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/0x100000000;};
const choose=(values)=>values[Math.floor(random()*values.length)];

for(let example=0;example<120;example+=1){
  let sequence=0;
  const id=(kind)=>`${kind}:${example}:${++sequence}`;
  const propertyCount=1+Math.floor(random()*4);
  const properties={};
  const required=[];
  const attachedRules=[];
  const documentationProperties={};

  for(let index=0;index<propertyCount;index+=1){
    const name=`field_${example}_${index}`;
    const type=choose(["string","number","integer","boolean"]);
    const description=`Description ${example}.${index}`;
    const value=type==="string"?`value_${example}_${index}`:type==="boolean"?random()>=0.5:Math.floor(random()*100);
    properties[name]={
      type,
      description,
      examples:[value],
      ...(type==="string"?{enum:[value,`${value}_alternate`]}:{}),
    };
    if(random()>=0.5)required.push(name);
    documentationProperties[`/${name}`]={
      displayName:`Field ${index}`,
      description,
      comments:`Comment ${example}.${index}`,
      example:{value,selectionMethod:type==="string"?"allowed value":"custom"},
    };
    attachedRules.push(type==="string"?{
      id:`rule:string:${example}:${index}`,
      version:1,
      propertyPath:name,
      operator:"regular-expression",
      parameters:"^[a-z]",
      severity:random()>=0.5?"warning":"error",
      message:`String rule ${index}`,
    }:{
      id:`rule:number:${example}:${index}`,
      version:2,
      propertyPath:name,
      operator:"numeric-range",
      parameters:"0,100",
      severity:"error",
      message:`Range rule ${index}`,
    });
  }

  const saved={
    id:`schema:${example}`,
    name:`Schema ${example}`,
    version:example+1,
    published:random()>=0.5,
    assignments:[],
    document:{type:"object",properties,...(required.length?{required}:{})},
    attachedRules,
    documentation:{description:`Schema documentation ${example}`,properties:documentationProperties},
  };
  const before=structuredClone(saved);
  const canonical=savedSchemaCanonicalDocument(saved,id);
  const roundTrip=savedSchemaFromCanonical(saved,canonical);

  assert.deepEqual(saved,before,`example ${example} leaves its saved schema untouched`);
  assert.deepEqual(roundTrip.document,saved.document,`example ${example} preserves JSON schema`);
  assert.deepEqual(roundTrip.attachedRules,saved.attachedRules,`example ${example} preserves attached rules`);
  assert.deepEqual(roundTrip.documentation,saved.documentation,`example ${example} preserves documentation`);
}

console.log("data-layer unified side-panel schema editor property tests passed");
