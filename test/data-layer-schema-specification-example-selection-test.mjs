import assert from "node:assert/strict";
import {
  specificationExampleChoices,
  typeSpecificationExampleSelection,
} from "../dist/data-layer-schema-specification-builder.js";

const duration = {
  canonicalPath:"/products/*/duration",
  propertyName:"products[].duration",
  description:"Duration",
  mandatory:"No",
  type:"Number",
  example:"24",
  comments:"",
  allowedValues:[12,24],
  allowedValueGroups:["12 | 24 when price_monthly exists for the same products item"],
  allowedValueChoices:[
    { value:12, label:"Allowed value 12 · when price_monthly exists for the same products item" },
    { value:24, label:"Allowed value 24 · when price_monthly exists for the same products item" },
  ],
};

assert.deepEqual(specificationExampleChoices(duration, { source:"documentation", value:"24" }).map(({ label, available, selected }) => [label,available,selected]), [
  ["Documentation 24",true,true],
  ["Allowed value 12 · when price_monthly exists for the same products item",true,false],
  ["Allowed value 24 · when price_monthly exists for the same products item",true,false],
  ["Custom value",true,false],
  ["Blank",true,false],
]);
assert.deepEqual(typeSpecificationExampleSelection(duration, "allowed:12"), { source:"allowed", value:"12" });
assert.deepEqual(typeSpecificationExampleSelection(duration, "blank"), { source:"blank" });
assert.deepEqual(typeSpecificationExampleSelection(duration, "custom", "18"), { source:"custom", value:"18" });

const undocumented = { ...duration, canonicalPath:"/products/*/product_name", propertyName:"products[].product_name", example:undefined, allowedValues:[], allowedValueGroups:[], allowedValueChoices:[] };
assert.deepEqual(specificationExampleChoices(undocumented, { source:"blank" }).map(({ label, available, explanation, selected }) => ({ label,available,explanation,selected })), [
  { label:"Documentation", available:false, explanation:"No documented example exists", selected:false },
  { label:"Allowed value", available:false, explanation:"No effective allowed values exist", selected:false },
  { label:"Custom value", available:true, explanation:undefined, selected:false },
  { label:"Blank", available:true, explanation:undefined, selected:true },
]);

const conflicted = { ...duration, allowedValues:[], allowedValueGroups:["Conflict: no values satisfy all effective rules"], allowedValueChoices:[] };
assert.equal(specificationExampleChoices(conflicted, { source:"documentation", value:"24" }).some(({ id, available }) => id.startsWith("allowed:") && available), false);
