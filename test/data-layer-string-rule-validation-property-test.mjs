import assert from "node:assert/strict";
import {
  normalizeValueRule,
  regularExpressionTest,
  valueOperatorOptions,
  valueRuleMatches,
  valueRuleOperand,
} from "../dist/data-layer-string-rule-validation.js";
import {focusedRuleIssue} from "../dist/data-layer-focused-rule-policy.js";
import {compileLayeredSchema,validateLayeredObservation} from "../dist/data-layer-layered-schema.js";

let state=0x5a17c0de;
const random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/0x100000000);
const alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789[]().+*?^-_$ ";
const text=(minimum=0,maximum=18)=>{
  const length=minimum+Math.floor(random()*(maximum-minimum+1));
  return Array.from({length},()=>alphabet[Math.floor(random()*alphabet.length)]).join("");
};
const escapeRegularExpression=(value)=>value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const stringReferences={
  "Equals":(actual,operand)=>actual===operand,
  "Does not equal":(actual,operand)=>actual!==operand,
  "Starts with":(actual,operand)=>actual.startsWith(operand),
  "Does not start with":(actual,operand)=>!actual.startsWith(operand),
  "Ends with":(actual,operand)=>actual.endsWith(operand),
  "Does not end with":(actual,operand)=>!actual.endsWith(operand),
  "Includes":(actual,operand)=>actual.includes(operand),
  "Does not include":(actual,operand)=>!actual.includes(operand),
};
const inverseOperators={"Equals":"Does not equal","Does not equal":"Equals","Starts with":"Does not start with","Does not start with":"Starts with","Ends with":"Does not end with","Does not end with":"Ends with","Includes":"Does not include","Does not include":"Includes"};

for(let index=0;index<400;index+=1){
  const operator=valueOperatorOptions("string")[index%8],operand=text(0,10),actual=index%3===0?operand:index%3===1?`${text(0,5)}${operand}${text(0,5)}`:text(0,18),expected=stringReferences[operator](actual,operand);
  assert.equal(valueRuleMatches(operator,actual,operand),expected,`${operator} ${index} agrees with its String reference`);
  assert.equal(valueRuleMatches(operator,actual,operand),!valueRuleMatches(inverseOperators[operator],actual,operand),`${operator} ${index} complements its inverse`);
  const rule={id:`rule:value:${index}`,name:`Value property ${index}`,kind:"value",operator,expectedValue:operand,severity:"error"},before=structuredClone(rule),compiled=compileLayeredSchema([{id:"profile:value-properties",name:"Value properties",scope:"Shared Profile",constraints:[{path:"/value",type:"string",rules:[rule]}]}],{eventId:"event:value-properties",eventRole:"interaction"});
  assert.deepEqual(rule,before,`Value rule ${index} is not mutated by compilation`);
  assert.deepEqual(compiled.properties["/value"].rules,[rule],`Value rule ${index} survives compilation`);
  const issues=validateLayeredObservation({targetId:"target:value-properties",targetName:"Value properties",revision:1,compiled},{value:actual}).issues;
  assert.equal(issues.length,expected?0:1,`Value validator ${index} agrees with its matcher`);
}

for(let index=0;index<240;index+=1){
  const actual=(random()-.5)*1e6,operand=(random()-.5)*1e6;
  assert.equal(valueRuleMatches("Equals",actual,operand),actual===operand);
  assert.equal(valueRuleMatches("Does not equal",actual,operand),actual!==operand);
  assert.equal(valueRuleMatches("Equals",actual,operand),!valueRuleMatches("Does not equal",actual,operand));
}
for(const [actual,operand] of [[0,-0],[-0,0],[Number.NaN,Number.NaN],[Infinity,Infinity],[-Infinity,-Infinity]]){
  assert.equal(valueRuleMatches("Equals",actual,operand),actual===operand);
  assert.equal(valueRuleMatches("Does not equal",actual,operand),actual!==operand);
}

for(let index=0;index<160;index+=1){
  const integer=Math.floor((random()-.5)*1e6),fraction=integer+.5;
  assert.equal(valueRuleOperand("integer",String(integer)),integer);
  assert.equal(valueRuleOperand("integer",String(fraction)),undefined);
  assert.equal(focusedRuleIssue({kind:"value",name:"Integer",operator:"Equals",expectedValue:fraction},"integer"),"Enter a whole-number Value");
  assert.equal(focusedRuleIssue({kind:"value",name:"Integer",operator:"Equals",expectedValue:integer},"integer"),undefined);
}

for(let index=0;index<120;index+=1){
  const kind=["starts-with","ends-with","includes"][index%3],source={id:`rule:legacy:${index}`,name:`Legacy ${index}`,kind,literal:text(0,10),condition:{id:`condition:${index}`,kind:"all",children:[]},severity:index%2?"warning":"error",message:`Message ${index}`,provenance:{source:"created"}},before=structuredClone(source),normalized=normalizeValueRule(source);
  assert.deepEqual(source,before,`legacy normalization ${index} does not mutate its input`);
  assert.deepEqual(normalizeValueRule(normalized),normalized,`legacy normalization ${index} is idempotent`);
  for(const key of ["id","name","condition","severity","message","provenance"])assert.deepEqual(normalized[key],source[key],`legacy normalization ${index} retains ${key}`);
  assert.equal(normalized.kind,"value");
  assert.equal(normalized.expectedValue,source.literal);
  assert.equal(Object.hasOwn(normalized,"literal"),false);
}

for(let index=0;index<60;index+=1){
  const literal=text(0,8),result=regularExpressionTest(`(${escapeRegularExpression(literal)}`,"sample");
  assert.equal(result.state,"invalid",`invalid expression ${index} is classified without throwing`);
  assert.equal("treatment" in result,false,`invalid expression ${index} has no match colour`);
}

const first=valueOperatorOptions("STRING");
first[0]="changed locally";
assert.equal(valueOperatorOptions("string")[0],"Equals","operator options are returned as isolated values");
assert.deepEqual(valueOperatorOptions("object"),[]);
assert.deepEqual(valueOperatorOptions("array"),[]);

console.log("data-layer string rule validation property tests passed");
