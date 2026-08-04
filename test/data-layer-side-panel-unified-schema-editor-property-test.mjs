import assert from "node:assert/strict";
import {
  savedSchemaCanonicalDocument,
  savedSchemaFromCanonical,
} from "../dist/data-layer-side-panel-unified-schema-editor.js";
import {
  canonicalPredicateText,
  validateCanonicalPredicateTree,
} from "../dist/data-layer-canonical-predicate-editor.js";
import {applyCanonicalCommand,canonicalPropertyPath} from "../dist/data-layer-canonical-schema.js";

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

for(let example=0;example<64;example+=1){
  let sequence=0;
  const id=(kind)=>`${kind}:path-keyed:${example}:${++sequence}`,scalarTypes=["string","number","integer","boolean"],pageType=scalarTypes[example%scalarTypes.length],levelType=scalarTypes[(example*3+1)%scalarTypes.length],nullable=example%2===0,document={type:"object",properties:{
    "/page_type":{type:nullable?[pageType,"null"]:pageType},
    "/page_levels":{type:"array"},
    "/page_levels/0":{type:levelType},
  }},saved={id:`schema:path-keyed:${example}`,name:`Path keyed ${example}`,version:example+1,assignments:[],document},before=structuredClone(saved),canonical=savedSchemaCanonicalDocument(saved,id),pageTypeNode=Object.values(canonical.nodes).find(({name,parentId})=>name==="page_type"&&!parentId),pageLevelsNode=Object.values(canonical.nodes).find(({name,parentId})=>name==="page_levels"&&!parentId),levelNode=Object.values(canonical.nodes).find(({name,parentId})=>name==="0"&&parentId===pageLevelsNode?.id);
  assert.equal(pageTypeNode?.type,pageType,`path-keyed example ${example} resolves the /page_type definition by its complete key`);
  assert.equal(pageTypeNode?.nullable,nullable,`path-keyed example ${example} preserves a nullable /page_type union`);
  assert.equal(pageLevelsNode?.type,"array",`path-keyed example ${example} resolves the /page_levels array definition`);
  assert.equal(levelNode?.type,levelType,`path-keyed example ${example} resolves the /page_levels/0 definition independently`);
  assert.deepEqual(saved,before,`path-keyed example ${example} leaves the flat source representation immutable`);
}

for(let example=0;example<96;example+=1){
  let sequence=0;
  const id=(kind)=>`${kind}:dual:${example}:${++sequence}`,sourceIsArray=example%2===1,propertyName=`value_${example}`,renamedName=`renamed_${example}`,jsonValues=[`json-${example}-a`,`json-${example}-b`],ruleValues=[`rule-${example}-a`,`rule-${example}-b`],objectValue={type:"string",enum:jsonValues},arrayValue={type:"string",enum:jsonValues};
  const saved={
    id:`schema:dual:${example}`,name:`Dual ${example}`,version:example+1,assignments:[],
    document:{type:"object",properties:{
      object_bucket:{type:"object",...(sourceIsArray?{}:{required:[propertyName]}),properties:{object_anchor:{type:"boolean"},...(sourceIsArray?{}:{[propertyName]:objectValue})}},
      array_bucket:{type:"array",items:{type:"object",...(sourceIsArray?{required:[propertyName]}:{}),properties:{array_anchor:{type:"number"},...(sourceIsArray?{[propertyName]:arrayValue}:{})}}},
    }},
    attachedRules:[
      {id:`rule:dual-required:${example}`,version:2,propertyPath:sourceIsArray?`/array_bucket/*/${propertyName}`:`/object_bucket/${propertyName}`,operator:"required",severity:"error"},
      {id:`rule:dual-values:${example}`,version:3,propertyPath:sourceIsArray?`/array_bucket/*/${propertyName}`:`/object_bucket/${propertyName}`,operator:"allowed-values",parameters:ruleValues.join(","),severity:"warning"},
    ],
  },before=structuredClone(saved),canonical=savedSchemaCanonicalDocument(saved,id),valueNode=Object.values(canonical.nodes).find(({name})=>name===propertyName),targetNode=Object.values(canonical.nodes).find(({name})=>name===(sourceIsArray?"object_bucket":"array_bucket"));
  assert.deepEqual(valueNode.allowedValues.map(({value})=>value),ruleValues,`dual example ${example} keeps attached values canonical without erasing JSON ownership`);
  const renamed=applyCanonicalCommand(canonical,{kind:"rename",baseRevision:canonical.revision,propertyId:valueNode.id,name:renamedName});assert.equal(renamed.status,"applied");
  const moved=applyCanonicalCommand(renamed.document,{kind:"move",baseRevision:renamed.document.revision,propertyId:valueNode.id,parentId:targetNode.id});assert.equal(moved.status,"applied");
  const projected=savedSchemaFromCanonical(saved,moved.document),targetContainer=sourceIsArray?projected.document.properties.object_bucket:projected.document.properties.array_bucket.items,sourceContainer=sourceIsArray?projected.document.properties.array_bucket.items:projected.document.properties.object_bucket,rules=Object.fromEntries(projected.attachedRules.map((rule)=>[rule.id,rule])),expectedPath=canonicalPropertyPath(moved.document,valueNode.id);
  assert.deepEqual(targetContainer.required,[renamedName],`dual example ${example} rebases JSON required membership to the current container`);
  assert.deepEqual(targetContainer.properties[renamedName].enum,jsonValues,`dual example ${example} preserves the divergent JSON enum after rename and move`);
  assert.equal(sourceContainer.properties[propertyName],undefined,`dual example ${example} removes the stable node from its old JSON location`);
  assert.equal(sourceContainer.required,undefined,`dual example ${example} removes its JSON membership from the old container`);
  assert.equal(rules[`rule:dual-required:${example}`].propertyPath,expectedPath,`dual example ${example} independently rebases the attached required rule`);
  assert.equal(rules[`rule:dual-values:${example}`].propertyPath,expectedPath,`dual example ${example} independently rebases the attached allowed-values rule`);
  assert.equal(rules[`rule:dual-values:${example}`].parameters,ruleValues.join(","),`dual example ${example} never replaces attached values with the JSON enum`);
  assert.deepEqual(saved,before,`dual example ${example} leaves its source immutable`);
}

const conditionCases=[
  {type:"string",operator:"Equals",value:(sample)=>`equal-${sample}`},
  {type:"string",operator:"Does not equal",value:(sample)=>`different-${sample}`},
  {type:"string",operator:"Exists"},
  {type:"string",operator:"Does not exist"},
  {type:"string",operator:"Starts with",value:(sample)=>`prefix-${sample}`},
  {type:"string",operator:"Contains",value:(sample)=>`part-${sample}`},
  {type:"string",operator:"Is one of",values:(sample)=>[`one-${sample}`,`two-${sample}`]},
  {type:"string",operator:"Matches pattern",value:(sample)=>`^value-${sample}`},
  {type:"number",operator:"Is greater than",value:(sample)=>sample+0.25},
  {type:"number",operator:"Is at least",value:(sample)=>sample},
  {type:"number",operator:"Is less than",value:(sample)=>sample+10},
  {type:"number",operator:"Is at most",value:(sample)=>sample+20},
  {type:"boolean",operator:"Equals",value:(sample)=>sample%2===0},
  {type:"null",operator:"Equals",value:()=>null},
  {type:"integer",detectedType:"number",operator:"Is one of",values:(sample)=>[sample,sample+1]},
];
const comparison=(value)=>({type:value===null?"null":typeof value,value});
for(let example=0;example<120;example+=1){
  let sequence=0;
  const id=(kind)=>`${kind}:condition:${example}:${++sequence}`,configuration=conditionCases[example%conditionCases.length],detectedType=configuration.detectedType??configuration.type,triggerName=`trigger_${example}`,renamedName=`renamed_trigger_${example}`,operator=example%2===0?"All":"Any",predicate={propertyPath:`/${triggerName}`,operator:configuration.operator,detectedType,...(configuration.values?{comparisons:configuration.values(example).map(comparison)}:configuration.value?{comparison:comparison(configuration.value(example))}:{})},conditionGroup={operator,predicates:[predicate]},dangling={id:`rule:dangling:${example}`,name:"Opaque dangling rule",version:8,propertyPath:`/missing_target_${example}`,operator:"vendor-opaque",severity:"warning",conditionGroup:{operator:"All",predicates:[{propertyPath:`/missing_trigger_${example}`,operator:"Vendor equals",comparison:{type:"string",value:`opaque-${example}`}}]},vendorPayload:{sample:example}},saved={
    id:`schema:condition:${example}`,name:`Condition ${example}`,version:example+1,assignments:[],
    document:{type:"object",properties:{[triggerName]:{type:configuration.type},target:{type:"string"},bucket:{type:"object",properties:{anchor:{type:"boolean"}}}}},
    attachedRules:[
      {id:`rule:flat:${example}`,name:"Flat condition",version:3,propertyPath:"/target",operator:"regular-expression",parameters:"^[a-z]",severity:"error",conditionGroup},
      {id:`rule:partial:${example}`,name:"Unresolved condition",version:5,propertyPath:"/target",operator:"required",severity:"warning",conditionGroup:{operator:"All",predicates:[{propertyPath:`/unresolved_${example}`,operator:"Exists",detectedType:"string"}]},opaqueMetadata:{sample:example}},
      dangling,
    ],
  },before=structuredClone(saved),canonical=savedSchemaCanonicalDocument(saved,id),trigger=Object.values(canonical.nodes).find(({name})=>name===triggerName),bucket=Object.values(canonical.nodes).find(({name})=>name==="bucket"),target=Object.values(canonical.nodes).find(({name})=>name==="target"),renamed=applyCanonicalCommand(canonical,{kind:"rename",baseRevision:canonical.revision,propertyId:trigger.id,name:renamedName});
  assert.equal(renamed.status,"applied",`condition example ${example} renames its stable predicate property`);
  const moved=applyCanonicalCommand(renamed.document,{kind:"move",baseRevision:renamed.document.revision,propertyId:trigger.id,parentId:bucket.id});
  assert.equal(moved.status,"applied",`condition example ${example} moves its stable predicate property`);
  const projected=savedSchemaFromCanonical(saved,moved.document),expectedPath=canonicalPropertyPath(moved.document,trigger.id),expectedGroup={...conditionGroup,predicates:conditionGroup.predicates.map((entry)=>({...entry,propertyPath:expectedPath}))};
  assert.deepEqual(projected.attachedRules[0].conditionGroup,expectedGroup,`condition example ${example} losslessly projects and rebases a flat ${operator} ${configuration.operator} predicate`);
  assert.deepEqual(projected.attachedRules[1],saved.attachedRules[1],`condition example ${example} retains a partially unresolved attachment as opaque source data`);
  assert.deepEqual(projected.attachedRules[2],dangling,`condition example ${example} retains a wholly unresolved attachment by stable id and path`);
  assert.equal(new Set(projected.attachedRules.map(({id,propertyPath})=>`${id}:${propertyPath}`)).size,projected.attachedRules.length,`condition example ${example} never duplicates canonical-projected or retained attachments`);
  if(example%10===0){const renamedAgain=applyCanonicalCommand(moved.document,{kind:"rename",baseRevision:moved.document.revision,propertyId:trigger.id,name:`twice_${renamedName}`});assert.equal(renamedAgain.status,"applied");const projectedAgain=savedSchemaFromCanonical(projected,renamedAgain.document),nextPath=canonicalPropertyPath(renamedAgain.document,trigger.id);assert.deepEqual(projectedAgain.attachedRules[0].conditionGroup,{...expectedGroup,predicates:expectedGroup.predicates.map((entry)=>({...entry,propertyPath:nextPath}))},`condition example ${example} preserves predicate metadata through repeated path rebases`);assert.equal(projectedAgain.attachedRules.length,3,`condition example ${example} does not duplicate attachments on a subsequent save`);}
  if(example%4===0){const nested=structuredClone(moved.document),flat=nested.nodes[target.id].rules.find(({id})=>id===`rule:flat:${example}`);flat.condition={kind:"not",children:[{kind:"predicate",propertyId:trigger.id,operator:"Exists"}]};const nestedProjected=savedSchemaFromCanonical(saved,nested);assert.equal(nestedProjected.attachedRules[0].conditionGroup,undefined,`condition example ${example} keeps Not predicates canonical-only`);}
  assert.deepEqual(saved,before,`condition example ${example} leaves its source immutable`);
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
