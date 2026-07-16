import assert from "node:assert/strict";
import { restoreSchemaLibrary, serializeSchemaLibrary, validateWithSchema } from "../dist/data-layer-schema-verification.js";
import { configuredRuleDetails, createRuleConfiguration } from "../dist/data-layer-schema-property-rule-picker.js";
import { guidedAttachedRule } from "../dist/data-layer-guided-rule-parameter-integrity.js";

const identity={id:"rule:error-type",name:"Allowed values for error_type",version:1,propertyPath:"/error_type",operator:"allowed-values",severity:"warning",message:"Choose a known error type",enabled:true,conditionGroup:{operator:"All",predicates:[{propertyPath:"/market",operator:"Equals",comparison:{type:"string",value:"retail"}}]}};
const document={type:"object",properties:{error_type:{type:"string"},quantity:{type:"number"},enabled:{type:"boolean"},context:{}}};
const schema={id:"schema-generic-pageview",name:"Generic pageview",version:4,document,assignments:[],attachedRules:[
  {...identity,parameters:"technical,validation,authentication,login,notification"},
  {id:"rule:quantity",version:1,propertyPath:"/quantity",operator:"allowed-values",parameters:"1, 2"},
  {id:"rule:enabled",version:1,propertyPath:"/enabled",operator:"allowed-values",parameters:"true,false"},
  {id:"rule:context",version:1,propertyPath:"/context",operator:"allowed-values",parameters:"1,true"},
  {id:"rule:canonical",version:1,propertyPath:"/error_type",operator:"allowed-values",parameters:"stale",allowedValues:["technical","validation"]},
],revisionHistory:[{id:"schema-generic-pageview",name:"Generic pageview",version:2,document:{type:"object",properties:{quantity:{type:"number"}}},assignments:[],attachedRules:[{id:"rule:historical",version:1,propertyPath:"/quantity",operator:"allowed-values",parameters:"3,4"}]}],workingDraft:{baseVersion:4,sourceVersion:4,document:{type:"object",properties:{enabled:{type:"boolean"}}},assignments:[],pendingChanges:["Existing edit"],attachedRules:[{id:"rule:draft",version:1,propertyPath:"/enabled",operator:"allowed-values",parameters:"false,true"}]}};

const [migrated]=restoreSchemaLibrary(JSON.stringify([schema]));
assert.deepEqual(migrated.attachedRules[0],{...identity,allowedValues:["technical","validation","authentication","login","notification"]});
assert.deepEqual(migrated.attachedRules.slice(1,4).map(({allowedValues})=>allowedValues),[[1,2],[true,false],["1","true"]]);
assert.deepEqual(migrated.attachedRules[4],{id:"rule:canonical",version:1,propertyPath:"/error_type",operator:"allowed-values",allowedValues:["technical","validation"]});
assert.deepEqual(migrated.revisionHistory[0].attachedRules[0].allowedValues,[3,4]);
assert.deepEqual(migrated.workingDraft.attachedRules[0].allowedValues,[false,true]);
assert.deepEqual(migrated.workingDraft.pendingChanges,["Existing edit"]);
assert.equal(serializeSchemaLibrary([migrated]),serializeSchemaLibrary(restoreSchemaLibrary(serializeSchemaLibrary([migrated]))));

const unsafe={...schema,attachedRules:[{id:"rule:unsafe",version:1,propertyPath:"/quantity",operator:"allowed-values",parameters:"1,not-a-number,2"}],revisionHistory:undefined,workingDraft:undefined};
const unsafeRule=restoreSchemaLibrary(JSON.stringify([unsafe]))[0].attachedRules[0];
assert.equal(unsafeRule.parameters,"1,not-a-number,2");assert.equal(unsafeRule.allowedValues,undefined);assert.match(unsafeRule.migrationIssue,/not-a-number/);

const validationSchema={...migrated,workingDraft:undefined,revisionHistory:undefined};
assert.equal(validateWithSchema({sourceId:"history",eventName:"pageview",payload:{quantity:2,enabled:false,context:"true",error_type:"technical",market:"retail"},rawInput:[]},validationSchema,[]).state,"Valid");
assert.match(validateWithSchema({sourceId:"history",eventName:"pageview",payload:{quantity:3,enabled:false,context:"true",error_type:"technical",market:"retail"},rawInput:[]},validationSchema,[]).state,/issues/);

const picker=createRuleConfiguration("Allowed values","number");picker.allowedValues=["1","2"];
assert.deepEqual(configuredRuleDetails(picker),{operator:"allowed-values",allowedValues:[1,2]});
const guidedRule=guidedAttachedRule({path:"/enabled",expectedType:"Boolean",requirement:"Must be one of these values",values:["true","false"]},"Enabled values");
assert.deepEqual(guidedRule.allowedValues,[true,false]);assert.equal(guidedRule.parameters,undefined);
