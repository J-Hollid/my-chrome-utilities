import assert from "node:assert/strict";
import {focusedPropertySections,focusedRuleFields} from "../dist/data-layer-focused-schema-property-ui.js";
import {resolveConditionalLayeredSchema,validateLayeredObservation} from "../dist/data-layer-layered-schema.js";
import {schemaTableExpectedOrAllowed,schemaTableStageExpectedOrAllowed} from "../dist/data-layer-schema-table.js";

assert.deepEqual(focusedPropertySections,["definition","rules","structure"],"property actions expose one compact first layer");
assert.deepEqual(focusedRuleFields("presence"),["condition","presence","severity","message"]);
assert.deepEqual(focusedRuleFields("value"),["condition","ordinaryValue","severity","message"]);
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

console.log("conditional rule definition tests passed");
