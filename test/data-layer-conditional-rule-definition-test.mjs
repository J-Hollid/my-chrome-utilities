import assert from "node:assert/strict";
import {canonicalPropertyPath} from "../dist/data-layer-canonical-schema.js";
import {composedCanonicalSchema,saveComposedCanonicalDocument} from "../dist/data-layer-composed-schema-workspace.js";
import {focusedPropertySections,focusedReusableOutcome,focusedRuleFields} from "../dist/data-layer-focused-schema-property-ui.js";
import {compileLayeredSchema,resolveConditionalLayeredSchema,validateLayeredObservation} from "../dist/data-layer-layered-schema.js";
import {schemaTableExpectedOrAllowed,schemaTableStageExpectedOrAllowed} from "../dist/data-layer-schema-table.js";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {executeAcceptancePlan} from "../scripts/verification-packs.mjs";

const scheduled=["npm run build","node test/unit-a.mjs","node test/property-a.mjs","node test/browser-a.mjs","bb gherkin-parser feature","bb acceptance-pack-runner layered_schema generated"];
const executed=[];await executeAcceptancePlan({preparationCommands:[scheduled[0]],acceptanceCommands:scheduled.slice(-2),commands:scheduled},{runCommand:async(command)=>executed.push(command)});
assert.deepEqual(executed,scheduled,"the focused checkpoint executes every registered leaf exactly once in planned order");

assert.deepEqual(focusedPropertySections,["definition","rules","structure"],"property actions expose one compact first layer");
assert.deepEqual(focusedRuleFields("presence"),["condition","presence","severity","message"]);
assert.deepEqual(focusedRuleFields("value"),["condition","ordinaryValue","severity","message"]);
assert.deepEqual(
  focusedReusableOutcome({id:"library:required",name:"Required",kind:"presence",presence:"required",severity:"error",condition:{kind:"predicate"}}),
  {kind:"presence",presence:"required",severity:"error"},
  "a reusable attachment snapshots only the executable outcome and keeps its own condition",
);
assert.equal(schemaTableExpectedOrAllowed({allowedValues:["contact","delivery","payment"]}),"contact, delivery, payment");
assert.deepEqual(
  schemaTableStageExpectedOrAllowed({expectedValue:"contact",allowedValues:[]},"contact, delivery, payment"),
  {allowedValues:["contact","delivery","payment"]},
);

const compiled={
  status:"ready",
  conflicts:[],
  provenance:[],
  exclusions:[],
  properties:{
    "/page_type":{path:"/page_type",definitionId:"property:page-type",type:"string",origins:[],superseded:[]},
    "/form_type":{path:"/form_type",definitionId:"property:form-type",type:"string",origins:[],superseded:[]},
    "/page_name":{path:"/page_name",definitionId:"property:page-name",type:"string",origins:[],superseded:[]},
    "/error_message":{
      path:"/error_message",definitionId:"property:error-message",presence:"optional",origins:[],superseded:[],
      rules:[{id:"rule:error-required",name:"Require error message",kind:"presence",presence:"required",severity:"error",condition:{kind:"predicate",propertyId:"property:page-type",operator:"Equals",value:"error"}}],
    },
    "/form_step_name":{
      path:"/form_step_name",definitionId:"property:form-step",expectedValue:"contact",origins:[],superseded:[],
      rules:[{id:"rule:checkout-steps",name:"Checkout steps",kind:"value",allowedValues:["contact","delivery","payment"],severity:"error",condition:{kind:"predicate",propertyId:"property:form-type",operator:"Equals",value:"checkout"}}],
    },
    "/aProducts":{
      path:"/aProducts",definitionId:"property:products",minItems:1,origins:[],superseded:[],
      rules:[{id:"rule:bundle-size",name:"Bundle size",kind:"cardinality",minItems:2,severity:"error",condition:{kind:"predicate",propertyId:"property:page-name",operator:"Contains",value:"multi product bundle"}}],
    },
  },
};
const compiledBytes=JSON.stringify(compiled);

const matching=resolveConditionalLayeredSchema(compiled,{page_type:"error",form_type:"checkout",page_name:"large multi product bundle"});
assert.equal(matching.status,"ready");
assert.equal(matching.properties["/error_message"].presence,"required");
assert.deepEqual(matching.properties["/form_step_name"].allowedValues,["contact","delivery","payment"]);
assert.equal(matching.properties["/form_step_name"].expectedValue,undefined);
assert.equal(matching.properties["/aProducts"].minItems,2);

const ordinary=resolveConditionalLayeredSchema(compiled,{page_type:"article",form_type:"lead",page_name:"single"});
assert.equal(ordinary.status,"ready");
assert.equal(ordinary.properties["/error_message"].presence,"optional");
assert.equal(ordinary.properties["/form_step_name"].expectedValue,"contact");
assert.equal(ordinary.properties["/aProducts"].minItems,1);
assert.equal(JSON.stringify(compiled),compiledBytes,"resolution leaves persisted definition bytes unchanged");
const matchingValidation=validateLayeredObservation({targetId:"target:conditional",targetName:"Conditional",revision:1,compiled},{page_type:"error",form_type:"checkout",form_step_name:"delivery",page_name:"large multi product bundle",aProducts:["one"]});
assert.deepEqual(matchingValidation.issues.map(({code})=>code).sort(),["MIN_ITEMS","REQUIRED"]);
const ordinaryValidation=validateLayeredObservation({targetId:"target:ordinary",targetName:"Ordinary",revision:1,compiled},{page_type:"article",form_type:"lead",form_step_name:"contact",page_name:"single",aProducts:["one"]});
assert.deepEqual(ordinaryValidation.issues,[]);

const always=structuredClone(compiled);
always.properties["/error_message"].rules=[{id:"rule:always-required",name:"Always required",kind:"presence",presence:"required"}];
always.properties["/form_step_name"].rules=[{id:"rule:always-steps",name:"Always steps",kind:"value",allowedValues:["contact","delivery"]}];
const alwaysResolved=resolveConditionalLayeredSchema(always,{});
assert.equal(alwaysResolved.properties["/error_message"].presence,"required","conditionless presence rules apply Always");
assert.deepEqual(alwaysResolved.properties["/form_step_name"].allowedValues,["contact","delivery"],"conditionless value rules apply Always");
assert.deepEqual(
  validateLayeredObservation({targetId:"target:always",targetName:"Always",revision:1,compiled:always},{}).issues.map(({path,code})=>({path,code})),
  [{path:"/error_message",code:"REQUIRED"}],
  "conditionless outcomes participate in production validation",
);
const projectedAlways=compileLayeredSchema([{
  id:"profile:always-projected",name:"Always projected",scope:"Shared Profile",constraints:[{
    path:"/items",type:"array",itemType:"string",patterns:["^direct$"],minItems:3,
    rules:[
      {id:"rule:always-pattern",name:"Always pattern",kind:"pattern",pattern:"^rule$"},
      {id:"rule:always-cardinality",name:"Always cardinality",kind:"cardinality",minItems:2},
    ],
  }],
}],{eventId:"event:always-projected",eventRole:"interaction"});
const projectedAlwaysResolved=resolveConditionalLayeredSchema(projectedAlways,{});
assert.deepEqual(projectedAlwaysResolved.properties["/items"].patterns,["^direct$","^rule$"],"runtime resolution retains patterns already projected at compilation");
assert.equal(projectedAlwaysResolved.properties["/items"].minItems,3,"runtime resolution retains the strongest cardinality already projected at compilation");

const contradictory=structuredClone(compiled);
contradictory.properties["/form_step_name"].rules.push({
  id:"rule:checkout-contact",
  name:"Checkout contact only",
  kind:"value",
  expectedValue:"contact",
  severity:"error",
  condition:{kind:"predicate",propertyId:"property:form-type",operator:"Equals",value:"checkout"},
});
const blocked=resolveConditionalLayeredSchema(contradictory,{form_type:"checkout"});
assert.equal(blocked.status,"blocked");
assert.deepEqual(blocked.conflicts.at(-1).contributors,["Checkout steps","Checkout contact only"]);
assert.equal(blocked.properties["/form_step_name"].expectedValue,"contact","a contradiction has no list-order winner");
const blockedValidation=validateLayeredObservation({targetId:"target:blocked",targetName:"Blocked",revision:1,compiled:contradictory},{form_type:"checkout",form_step_name:"contact"});
assert.equal(blockedValidation.status,"blocked");
assert.deepEqual(blockedValidation.conflicts.at(-1).contributors,["Checkout steps","Checkout contact only"]);

const pathCompiled=compileLayeredSchema([{
  id:"profile:path-fallback",name:"Path fallback",scope:"Shared Profile",constraints:[
    {path:"/flag",type:"boolean"},
    {path:"/path_target",presence:"optional",rules:[{id:"rule:path",name:"Path predicate",kind:"presence",presence:"required",condition:{kind:"predicate",propertyId:"/flag",operator:"Equals",value:true}}]},
  ],
}],{eventId:"event:path",eventRole:"interaction"});
assert.deepEqual(
  validateLayeredObservation({targetId:"target:path",targetName:"Path",revision:1,compiled:pathCompiled},{flag:true}).issues.map(({code,path})=>({code,path})),
  [{code:"REQUIRED",path:"/path_target"}],
  "compiled rules match a canonical path when the referenced property has no definition identity",
);
assert.deepEqual(validateLayeredObservation({targetId:"target:path",targetName:"Path",revision:1,compiled:pathCompiled},{flag:false}).issues,[]);

const reusableCompiled=structuredClone(pathCompiled);
reusableCompiled.properties["/path_target"].rules=[{
  id:"rule:reusable-attachment",name:"Required when flagged",kind:"reusable",
  condition:{kind:"predicate",propertyId:"/flag",operator:"Equals",value:true},
  reusableRuleId:"library:required",reusableOutcome:{id:"library:required",name:"Library required",kind:"presence",presence:"required",severity:"error",message:"Required by library"},
}];
assert.deepEqual(
  validateLayeredObservation({targetId:"target:reusable",targetName:"Reusable",revision:1,compiled:reusableCompiled},{flag:true}).issues.map(({code})=>code),
  ["REQUIRED"],
  "a matching reusable attachment executes its persisted library outcome",
);
assert.deepEqual(validateLayeredObservation({targetId:"target:reusable",targetName:"Reusable",revision:1,compiled:reusableCompiled},{flag:false}).issues,[]);

const metadataCompiled=compileLayeredSchema([
  {id:"profile:metadata",name:"Metadata parent",scope:"Shared Profile",constraints:[{path:"/metadata",type:"string",displayText:"Parent label",comments:"Parent comment"}]},
  {id:"page:metadata",name:"Metadata page",scope:"Page",constraints:[{path:"/metadata",displayText:"Page label",comments:"Page comment"}]},
],{eventId:"event:metadata",eventRole:"context"});
assert.equal(metadataCompiled.properties["/metadata"].displayText,"Page label");
assert.equal(metadataCompiled.properties["/metadata"].comments,"Page comment");

const expectedToAllowedCompiled=compileLayeredSchema([
  {id:"profile:ordinary",name:"Ordinary parent",scope:"Shared Profile",constraints:[{path:"/ordinary",expectedValue:"retail"}]},
  {id:"page:ordinary",name:"Ordinary page",scope:"Page",constraints:[{path:"/ordinary",allowedValues:["retail","business"]}]},
],{eventId:"event:ordinary",eventRole:"context"});
assert.equal(expectedToAllowedCompiled.properties["/ordinary"].expectedValue,undefined,"a more-specific allowed list replaces the ordinary expectation facet");
assert.deepEqual(expectedToAllowedCompiled.properties["/ordinary"].allowedValues,["retail","business"]);
const allowedToExpectedCompiled=compileLayeredSchema([
  {id:"profile:ordinary",name:"Ordinary parent",scope:"Shared Profile",constraints:[{path:"/ordinary",allowedValues:["retail","business"]}]},
  {id:"page:ordinary",name:"Ordinary page",scope:"Page",constraints:[{path:"/ordinary",expectedValue:"business"}]},
],{eventId:"event:ordinary",eventRole:"context"});
assert.equal(allowedToExpectedCompiled.properties["/ordinary"].allowedValues,undefined,"a more-specific expectation replaces the ordinary allowed-list facet");
assert.equal(allowedToExpectedCompiled.properties["/ordinary"].expectedValue,"business");

const projectionState=createSpecificationProject({name:"Conditional projection",site:"projection.example",id:(kind)=>`${kind}:projection`});
projectionState.project.collections.profiles.push({id:"profile:projection",name:"Projection profile",schemaConstraints:[{path:"/flag",type:"boolean"},{path:"/target",type:"string",displayText:"Inherited display",comments:"Inherited comments"}]});
const projectedRule={
  id:"rule:projection",name:"Projection required",kind:"presence",presence:"required",enabled:false,enforcement:"overridable",replacesRuleId:"rule:parent",
  condition:{kind:"predicate",id:"condition:projection",propertyId:"/flag",operator:"Equals",value:true},severity:"warning",message:"Projection issue",
};
projectionState.project.collections.pages.push({id:"page:projection",name:"Projection page",profileId:"profile:projection",pageGroupIds:[],localSchemaContributions:[{path:"/target",displayText:"Local display",comments:"Local comments",rules:[projectedRule]}]});
const projection=composedCanonicalSchema(projectionState,projectionState.project.collections.pages[0],"Page");
const projectedTarget=Object.values(projection.nodes).find((node)=>canonicalPropertyPath(projection,node.id)==="/target");
assert.equal(projectedTarget.documentation.displayText,"Local display");
assert.equal(projectedTarget.documentation.comments,"Local comments");
assert.deepEqual(
  Object.fromEntries(["id","name","kind","presence","enabled","enforcement","replacesRuleId","condition","severity","message"].map((key)=>[key,projectedTarget.rules[0][key]])),
  Object.fromEntries(["id","name","kind","presence","enabled","enforcement","replacesRuleId","condition","severity","message"].map((key)=>[key,projectedRule[key]])),
  "composed canonical projection preserves the complete conditional rule AST",
);
const projectionRoundTrip=saveComposedCanonicalDocument(projectionState,"pages","page:projection",projection),storedProjection=projectionRoundTrip.project.collections.pages[0].localSchemaContributions.find(({path})=>path==="/target");
assert.equal(storedProjection.displayText,"Local display");
assert.equal(storedProjection.comments,"Local comments");
assert.deepEqual(
  Object.fromEntries(["id","name","kind","presence","enabled","enforcement","replacesRuleId","condition","severity","message"].map((key)=>[key,storedProjection.rules[0][key]])),
  Object.fromEntries(["id","name","kind","presence","enabled","enforcement","replacesRuleId","condition","severity","message"].map((key)=>[key,projectedRule[key]])),
  "composed save and reload retain the complete local rule without materializing parents",
);

console.log("conditional rule definition tests passed");
