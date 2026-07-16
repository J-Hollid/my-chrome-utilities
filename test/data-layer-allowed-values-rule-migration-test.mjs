import assert from "node:assert/strict";
import { restoreSchemaLibrary, serializeSchemaLibrary, validateWithSchema } from "../dist/data-layer-schema-verification.js";
import { configuredRuleDetails, createRuleConfiguration } from "../dist/data-layer-schema-property-rule-picker.js";
import { guidedAttachedRule } from "../dist/data-layer-guided-rule-parameter-integrity.js";
import { deriveSpecificationRows, renderSpecificationClipboard, specificationExampleChoices } from "../dist/data-layer-schema-specification-builder.js";

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

const wildcardDocument={type:"object",properties:{products:{type:"array",items:{type:"object",properties:{code:{type:"string"},tier:{type:"string"}}}}}};
const wildcardCondition={operator:"All",predicates:[{propertyPath:"/products/*/tier",operator:"Equals",comparison:{type:"string",value:"vip"}}]};
const wildcardParent={id:"schema-parent",name:"Parent",version:3,published:true,document:wildcardDocument,assignments:[],documentation:{properties:{"/products/*/code":{example:{value:"red",selectionMethod:"custom"}}}},attachedRules:[
  {id:"rule:wildcard",name:"Codes",version:2,operator:"allowed-values",parameters:"/products/*/code:red,blue,red",severity:"warning",message:"Known code",enabled:true,examples:"red, blue",attachments:["schema-parent"]},
  {id:"rule:duplicate",version:1,propertyPath:"/products/*/code",operator:"allowed-values",parameters:"red,blue"},
  {id:"rule:disabled",version:1,propertyPath:"/products/*/code",operator:"allowed-values",parameters:"green",enabled:false},
  {id:"rule:conditional",version:1,propertyPath:"/products/*/code",operator:"allowed-values",parameters:"gold,gold",conditionGroup:wildcardCondition},
]};
const wildcardChild={id:"schema-child",name:"Child",version:1,published:true,parentSchemaId:"schema-parent",document:{type:"object",properties:{}},assignments:[]};
const overriddenChild={...wildcardChild,id:"schema-overridden",name:"Overridden",inheritedRuleOverrides:{"/products/*/code":"disabled"}};
const [migratedParent,migratedChild,migratedOverride]=restoreSchemaLibrary(JSON.stringify([wildcardParent,wildcardChild,overriddenChild]));
assert.deepEqual(migratedParent.attachedRules.map(({allowedValues})=>allowedValues),[["red","blue","red"],["red","blue"],["green"],["gold","gold"]]);
assert.equal(migratedParent.attachedRules.every(({parameters})=>parameters===undefined),true);
assert.deepEqual(migratedParent.attachedRules.map(({id,enabled})=>[id,enabled]),[["rule:wildcard",true],["rule:duplicate",undefined],["rule:disabled",false],["rule:conditional",undefined]]);
const {parameters:_legacyWildcardParameters,...wildcardMetadata}=wildcardParent.attachedRules[0];
assert.deepEqual(migratedParent.attachedRules[0],{...wildcardMetadata,propertyPath:"/products/*/code",allowedValues:["red","blue","red"]});
assert.deepEqual(migratedParent.attachedRules[3].conditionGroup,wildcardCondition);
assert.deepEqual(migratedOverride.inheritedRuleOverrides,{"/products/*/code":"disabled"});
const wildcardRows=deriveSpecificationRows(migratedChild,["/products/*/code"],[migratedChild,migratedParent]);
assert.deepEqual(wildcardRows[0].allowedValues,["red","blue","gold"]);
assert.deepEqual(wildcardRows[0].allowedValueGroups,["red | blue","gold when tier equals vip for the same products item"]);
assert.deepEqual(specificationExampleChoices(wildcardRows[0],{source:"documentation",value:"red"}).filter(({available})=>available).map(({id})=>id),["documentation","allowed:red","allowed:blue","allowed:gold","custom","blank"]);
const wildcardClipboard=renderSpecificationClipboard(wildcardRows);
assert.match(wildcardClipboard.plain,/red \| blue; gold when tier equals vip/);assert.match(wildcardClipboard.html,/red \| blue<br>gold when tier equals vip/);
assert.equal(validateWithSchema({sourceId:"history",eventName:"event",payload:{products:[{code:"unknown",tier:"standard"}]},rawInput:[]},migratedChild,[migratedChild,migratedParent]).issues.length>0,true);
assert.equal(validateWithSchema({sourceId:"history",eventName:"event",payload:{products:[{code:"unknown",tier:"standard"}]},rawInput:[]},migratedOverride,[migratedOverride,migratedParent]).issues.length,0);
