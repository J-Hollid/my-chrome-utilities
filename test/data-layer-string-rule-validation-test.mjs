import assert from "node:assert/strict";
import {
  regularExpressionTest,
  stringRuleKindOptions,
  stringRuleMatches,
  stringRuleRequirement,
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

assert.deepEqual(
  stringRuleKindOptions("string"),
  [
    {kind:"starts-with",label:"Starts with"},
    {kind:"ends-with",label:"Ends with"},
    {kind:"includes",label:"Includes"},
  ],
  "String properties expose all three literal rule types",
);
assert.deepEqual(stringRuleKindOptions("number"),[],"non-String properties exclude literal String rules");

const examples=[
  {kind:"starts-with",literal:"order-",passing:"order-123",failing:"pre-order-123",requirement:"start with order-"},
  {kind:"ends-with",literal:".com",passing:"shop.example.com",failing:"shop.example.com.au",requirement:"end with .com"},
  {kind:"includes",literal:"sale",passing:"wholesale-item",failing:"premium-item",requirement:"include sale"},
];
for(const example of examples){
  assert.equal(stringRuleMatches(example.kind,example.passing,example.literal),true);
  assert.equal(stringRuleMatches(example.kind,example.failing,example.literal),false);
  assert.equal(stringRuleMatches(example.kind,example.passing.toUpperCase(),example.literal),false,"literal matching is case-sensitive");
  assert.equal(stringRuleRequirement(example.kind,example.literal),example.requirement);
  assert.equal(
    schemaTableRuleOutcomeSummary({kind:example.kind,literal:example.literal}),
    example.requirement,
    "rule inventory summaries retain the selected literal operation",
  );
  assert.equal(focusedRuleIssue({kind:example.kind,name:"Literal rule",literal:example.literal}),undefined);
  const persisted=JSON.parse(JSON.stringify({id:`rule:${example.kind}`,name:`Named ${example.kind} rule`,kind:example.kind,literal:example.literal,severity:"error"}));
  const compiled=compileLayeredSchema([{
    id:"profile:string-rules",
    name:"String rules",
    scope:"Shared Profile",
    constraints:[{path:"/value",type:"string",rules:[persisted]}],
  }],{eventId:"event:string-rules",eventRole:"interaction"});
  assert.deepEqual(compiled.properties["/value"].rules,[persisted],"compilation retains the literal rule bytes");
  assert.equal(
    validateLayeredObservation({targetId:"target:string-rules",targetName:"String rules",revision:1,compiled},{value:example.passing}).issues.length,
    0,
  );
  const issues=validateLayeredObservation({targetId:"target:string-rules",targetName:"String rules",revision:1,compiled},{value:example.failing}).issues;
  assert.deepEqual(
    issues.map(({code,message,expected})=>({code,message,expected})),
    [{code:example.kind==="starts-with"?"STARTS_WITH":example.kind==="ends-with"?"ENDS_WITH":"INCLUDES",message:`Named ${example.kind} rule`,expected:example.literal}],
    "the production validator reports the named literal rule",
  );
}
assert.equal(stringRuleMatches("starts-with","[order","[order"),true,"regular-expression punctuation remains literal");
assert.equal(focusedRuleIssue({kind:"includes",name:"Literal rule",literal:""}),"Enter a literal value");

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
