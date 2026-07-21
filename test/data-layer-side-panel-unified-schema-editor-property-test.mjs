import assert from "node:assert/strict";
import {
  savedSchemaCanonicalDocument,
  savedSchemaFromCanonical,
} from "../dist/data-layer-side-panel-unified-schema-editor.js";
import {
  canonicalPredicateText,
  validateCanonicalPredicateTree,
} from "../dist/data-layer-canonical-predicate-editor.js";

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
  const reloaded=savedSchemaCanonicalDocument(roundTrip,()=>{throw new Error(`example ${example} regenerated canonical identity`);});

  assert.deepEqual(saved,before,`example ${example} leaves its saved schema untouched`);
  assert.deepEqual(roundTrip.document,saved.document,`example ${example} preserves JSON schema`);
  assert.deepEqual(roundTrip.attachedRules,saved.attachedRules,`example ${example} preserves attached rules`);
  assert.deepEqual(roundTrip.documentation,saved.documentation,`example ${example} preserves documentation`);
  assert.deepEqual(reloaded,canonical,`example ${example} preserves every canonical node identity and rich facet`);
}

const predicateDocument={
  id:"canonical:predicate-properties",contributorId:"profile:predicate-properties",contributorName:"Predicate properties",revision:0,rootIds:["property:string","property:number","property:boolean"],nodes:{
    "property:string":{id:"property:string",name:"title",type:"string",order:0,presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}},overrideReferences:[],provenance:[]},
    "property:number":{id:"property:number",name:"count",type:"number",order:1,presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}},overrideReferences:[],provenance:[]},
    "property:boolean":{id:"property:boolean",name:"enabled",type:"boolean",order:2,presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}},overrideReferences:[],provenance:[]},
  },view:"tree",changes:[],sourceContent:{document:{type:"object"},rules:[],documentation:{},examples:[],definitionsByNodeId:{}},
};
const leaf=(sample)=>sample%3===0
  ? {kind:"predicate",propertyId:"property:string",operator:"Starts with",value:`prefix-${sample}`}
  : sample%3===1
    ? {kind:"predicate",propertyId:"property:number",operator:"At least",value:sample}
    : {kind:"predicate",propertyId:"property:boolean",operator:"Equals",value:sample%2===0};
const nested=(depth,sample)=>depth===0?leaf(sample):{
  kind:depth%3===0?"not":depth%3===1?"all":"any",
  children:depth%3===0?[nested(depth-1,sample+1)]:[nested(depth-1,sample+1),leaf(sample+2)],
};
for(let sample=0;sample<120;sample+=1){
  const predicate=nested(sample%7,sample),before=structuredClone(predicate);
  assert.equal(validateCanonicalPredicateTree(predicateDocument,predicate).ready,true,`nested predicate ${sample} validates across depth and operator families`);
  assert.match(canonicalPredicateText(predicateDocument,predicate),/title|count|enabled/,`nested predicate ${sample} has a property-named plain-language projection`);
  assert.deepEqual(predicate,before,`nested predicate ${sample} validation and presentation are immutable`);
}

console.log("data-layer unified side-panel schema editor property tests passed");
