import assert from "node:assert/strict";
import {
  normalizeValueRule,
  regularExpressionTest,
  stringRuleMatches,
  stringRuleRequirement,
  valueOperatorOptions,
  valueRuleMatches,
  valueRuleOperand,
  valueRuleRequirement,
} from "../dist/data-layer-string-rule-validation.js";
import {focusedRuleIssue} from "../dist/data-layer-focused-rule-policy.js";
import {schemaTableRuleOutcomeSummary} from "../dist/data-layer-schema-table.js";
import {compileLayeredSchema,validateLayeredObservation} from "../dist/data-layer-layered-schema.js";
import {
  regularExpressionTesterCopy,
  regularExpressionTesterGridStyle,
} from "../dist/data-layer-string-rule-validation-ui.js";

assert.deepEqual(
  regularExpressionTesterCopy,
  {
    patternLabel:"Regular expression",
    sampleLabel:"Test value",
    resultLabel:"Test result",
    guidance:"Enter a sample value to check it against the regular expression. Test values are not saved.",
  },
  "the shared Pattern helper exposes the complete visible copy contract",
);
assert.match(regularExpressionTesterGridStyle,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(regularExpressionTesterGridStyle,/grid-column:1\/-1/);
assert.match(regularExpressionTesterGridStyle,/max-width:100%/);

assert.deepEqual(valueOperatorOptions("string"),[
  "Equals",
  "Does not equal",
  "Starts with",
  "Does not start with",
  "Ends with",
  "Does not end with",
  "Includes",
  "Does not include",
]);
for(const type of ["number","integer","boolean"])assert.deepEqual(
  valueOperatorOptions(type),
  ["Equals","Does not equal"],
  `${type} Value rules expose only equality operators`,
);
assert.deepEqual(valueOperatorOptions("object"),[]);
assert.deepEqual(valueOperatorOptions("array"),[]);
assert.equal(valueRuleMatches("Equals",0,-0),true,"typed numeric equality treats signed zeroes as the same value");
assert.equal(valueRuleMatches("Does not equal",0,-0),false,"negative equality complements equality for signed zeroes");
assert.equal(valueRuleMatches("Equals",Number.NaN,Number.NaN),false,"NaN is not equal to itself");
assert.equal(valueRuleMatches("Does not equal",Number.NaN,Number.NaN),true,"negative equality complements equality for NaN");
assert.equal(valueRuleOperand("integer","12"),12);
assert.equal(valueRuleOperand("integer","1.5"),undefined);
assert.equal(valueRuleOperand("number","Infinity"),undefined);
assert.equal(focusedRuleIssue({kind:"value",name:"Integer value",operator:"Equals",expectedValue:1.5},"integer"),"Enter a whole-number Value");

const examples=[
  {operator:"Equals",operand:"sale",passing:"sale",failing:"presale",requirement:"equal sale"},
  {operator:"Does not equal",operand:"sale",passing:"retail",failing:"sale",requirement:"not equal sale"},
  {operator:"Starts with",operand:"order-",passing:"order-123",failing:"pre-order-123",requirement:"start with order-"},
  {operator:"Does not start with",operand:"order-",passing:"retail-123",failing:"order-123",requirement:"not start with order-"},
  {operator:"Ends with",operand:".com",passing:"shop.example.com",failing:"shop.example.com.au",requirement:"end with .com"},
  {operator:"Does not end with",operand:".com",passing:"shop.example.net",failing:"shop.example.com",requirement:"not end with .com"},
  {operator:"Includes",operand:"sale",passing:"wholesale-item",failing:"premium-item",requirement:"include sale"},
  {operator:"Does not include",operand:"sale",passing:"premium-item",failing:"wholesale-item",requirement:"not include sale"},
];
for(const example of examples){
  assert.equal(valueRuleMatches(example.operator,example.passing,example.operand),true);
  assert.equal(valueRuleMatches(example.operator,example.failing,example.operand),false);
  assert.equal(valueRuleRequirement(example.operator,example.operand),example.requirement);
  assert.equal(
    schemaTableRuleOutcomeSummary({kind:"value",operator:example.operator,expectedValue:example.operand}),
    example.requirement,
    "rule inventory summaries retain the selected Value operation",
  );
  assert.equal(focusedRuleIssue({kind:"value",name:"Value rule",operator:example.operator,expectedValue:example.operand}),undefined);
  const persisted=JSON.parse(JSON.stringify({id:`rule:${example.operator}`,name:`Named ${example.operator} rule`,kind:"value",operator:example.operator,expectedValue:example.operand,severity:"error"}));
  const compiled=compileLayeredSchema([{
    id:"profile:string-rules",
    name:"String rules",
    scope:"Shared Profile",
    constraints:[{path:"/value",type:"string",rules:[persisted]}],
  }],{eventId:"event:string-rules",eventRole:"interaction"});
  assert.deepEqual(compiled.properties["/value"].rules,[persisted],"compilation retains the Value rule bytes");
  assert.equal(
    validateLayeredObservation({targetId:"target:string-rules",targetName:"String rules",revision:1,compiled},{value:example.passing}).issues.length,
    0,
  );
  const issues=validateLayeredObservation({targetId:"target:string-rules",targetName:"String rules",revision:1,compiled},{value:example.failing}).issues;
  assert.deepEqual(
    issues.map(({code,message,expected})=>({code,message,expected})),
    [{code:example.operator==="Starts with"?"STARTS_WITH":example.operator==="Ends with"?"ENDS_WITH":example.operator==="Includes"?"INCLUDES":"VALUE_OPERATOR",message:`Named ${example.operator} rule`,expected:example.operand}],
    "the production validator reports the named Value rule",
  );
}
assert.equal(valueRuleMatches("Starts with","[order","[order"),true,"regular-expression punctuation remains literal");
assert.equal(focusedRuleIssue({kind:"value",name:"Value rule",operator:"Includes"}),"Enter a Value");
assert.equal(focusedRuleIssue({kind:"allowed-values",name:"Allowed values rule",allowedValues:[]}),"Enter at least one allowed value");

for(const legacy of [
  {kind:"starts-with",operator:"Starts with",literal:"order-"},
  {kind:"ends-with",operator:"Ends with",literal:".com"},
  {kind:"includes",operator:"Includes",literal:"sale"},
]){
  const source={id:`rule:${legacy.kind}`,name:"Legacy rule",kind:legacy.kind,literal:legacy.literal,condition:{kind:"all",children:[]},severity:"warning",message:"Legacy message",provenance:{source:"created"}};
  assert.deepEqual(normalizeValueRule(source),{
    id:source.id,
    name:source.name,
    kind:"value",
    operator:legacy.operator,
    expectedValue:legacy.literal,
    condition:source.condition,
    severity:source.severity,
    message:source.message,
    provenance:source.provenance,
  },"legacy literal rules normalize without losing surrounding rule state");
  const legacyPassing=legacy.kind==="starts-with"?`${legacy.literal}x`:legacy.kind==="ends-with"?`x${legacy.literal}`:`x${legacy.literal}x`;
  assert.equal(stringRuleMatches(legacy.kind,legacyPassing,legacy.literal),true,"legacy rules remain executable before save");
}

assert.deepEqual(
  regularExpressionTest("^order-[0-9]+$","order-123"),
  {state:"match",text:"Matches pattern",treatment:"valid-green"},
);
assert.deepEqual(
  regularExpressionTest("^order-[0-9]+$","pre-order-123"),
  {state:"no-match",text:"Does not match pattern",treatment:"invalid-red"},
);
const invalid=regularExpressionTest("[","order-123");
assert.equal(invalid.state,"invalid");
assert.match(invalid.text,/Invalid regular expression/);
assert.equal("treatment" in invalid,false,"an invalid expression exposes no match-state colour token");
assert.match(focusedRuleIssue({kind:"pattern",name:"Pattern rule",pattern:"["}),/Invalid regular expression/);

console.log("data-layer string rule validation tests passed");
