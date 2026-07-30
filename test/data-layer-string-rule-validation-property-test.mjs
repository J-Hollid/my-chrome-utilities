import assert from "node:assert/strict";
import {
  regularExpressionTest,
  stringRuleKindOptions,
  stringRuleMatches,
} from "../dist/data-layer-string-rule-validation.js";
import {
  compileLayeredSchema,
  validateLayeredObservation,
} from "../dist/data-layer-layered-schema.js";

let state=0x5a17c0de;
const random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/0x100000000);
const alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789[]().+*?^-_$ ";
const text=(minimum=0,maximum=18)=>{
  const length=minimum+Math.floor(random()*(maximum-minimum+1));
  return Array.from({length},()=>alphabet[Math.floor(random()*alphabet.length)]).join("");
};
const escapeRegularExpression=(value)=>value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const kinds=[
  {kind:"starts-with",code:"STARTS_WITH",reference:(actual,literal)=>actual.startsWith(literal)},
  {kind:"ends-with",code:"ENDS_WITH",reference:(actual,literal)=>actual.endsWith(literal)},
  {kind:"includes",code:"INCLUDES",reference:(actual,literal)=>actual.includes(literal)},
];

for(let index=0;index<300;index+=1){
  const {kind,code,reference}=kinds[index%kinds.length];
  const literal=text(1,10),actual=text(0,6)+literal+text(0,6);
  const candidate=index%4===0?actual:index%4===1?literal+text(0,8):index%4===2?text(0,8)+literal:text(0,18);
  const expected=reference(candidate,literal);
  assert.equal(stringRuleMatches(kind,candidate,literal),expected,`${kind} ${index} agrees with literal String semantics`);

  const rule=JSON.parse(JSON.stringify({
    id:`rule:literal:${index}`,
    name:`Literal property ${index}`,
    kind,
    literal,
    severity:"error",
  }));
  const compiled=compileLayeredSchema([{
    id:"profile:literal-properties",
    name:"Literal properties",
    scope:"Shared Profile",
    constraints:[{path:"/value",type:"string",rules:[rule]}],
  }],{eventId:"event:literal-properties",eventRole:"interaction"});
  assert.deepEqual(compiled.properties["/value"].rules,[rule],`literal rule ${index} survives compilation`);
  const issues=validateLayeredObservation(
    {targetId:"target:literal-properties",targetName:"Literal properties",revision:1,compiled},
    {value:candidate},
  ).issues;
  assert.equal(issues.length,expected?0:1,`literal validator ${index} agrees with its matcher`);
  if(!expected){
    assert.equal(issues[0].code,code);
    assert.equal(issues[0].expected,literal);
    assert.equal(issues[0].actual,candidate);
  }

  const expression=`^${escapeRegularExpression(literal)}$`;
  assert.equal(regularExpressionTest(expression,literal).state,"match",`escaped expression ${index} matches its source`);
  assert.equal(
    regularExpressionTest(expression,`${literal}x`).state,
    "no-match",
    `anchored expression ${index} retains regular-expression semantics`,
  );
}

for(let index=0;index<60;index+=1){
  const result=regularExpressionTest(`(${escapeRegularExpression(text(0,8))}`,"sample");
  assert.equal(result.state,"invalid",`invalid expression ${index} is classified without throwing`);
  assert.equal("treatment" in result,false,`invalid expression ${index} has no match colour`);
}

const first=stringRuleKindOptions("STRING");
first[0].label="changed locally";
assert.equal(
  stringRuleKindOptions("string")[0].label,
  "Starts with",
  "rule-kind options are returned as isolated values",
);

console.log("data-layer string rule validation property tests passed");
