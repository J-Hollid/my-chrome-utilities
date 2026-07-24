import assert from "node:assert/strict";
import {focusedConditionLabel,focusedOwnershipActions,focusedPropertySections,focusedRuleFields,focusedSparseDelta} from "../dist/data-layer-focused-schema-property-ui.js";

assert.deepEqual(focusedPropertySections,["definition","presence","values","conditions","rules","documentation","example","structure"]);
assert.deepEqual(focusedOwnershipActions({inherited:true}),["View","Override here","Open source"]);
assert.deepEqual(focusedOwnershipActions({local:true}),["View","Edit","Remove local"]);
assert.deepEqual(focusedOwnershipActions({overridden:true}),["View","Edit","Reset to parent"]);
assert.deepEqual(focusedOwnershipActions({invariant:true}),["View","Open source"]);
assert.deepEqual(focusedOwnershipActions({conflict:true}),["View conflict","Edit local resolution","Open contributing sources"]);
assert.deepEqual(focusedRuleFields("range"),["minimum","maximum","severity","message"]);
assert.deepEqual(focusedRuleFields("pattern"),["pattern","severity","message"]);
assert.equal(focusedConditionLabel({kind:"all",children:[{kind:"predicate",propertyId:"/page_type",operator:"Equals",value:"trade"}]}),"All (/page_type Equals trade)");
assert.deepEqual(focusedSparseDelta({type:"string",presence:"required",documentation:"new"},{type:"string",presence:"optional",documentation:"old"}),{presence:"required",documentation:"new"});
console.log("focused schema property UI tests passed");
