import assert from "node:assert/strict";
import {conditionMatches} from "../dist/data-layer-specification-project.js";

const context={payload:{market:"retail",currency:"EUR",value:12,minimum:10,coupon:"SUMMER"}};
const predicate=(field,operator,extra={})=>({kind:"predicate",field,operator,...extra});
assert.equal(conditionMatches({kind:"all",conditions:[
  predicate("payload.market","exists"),
  predicate("payload.missing","does not exist"),
  predicate("payload.market","equals",{value:"retail"}),
  predicate("payload.market","does not equal",{value:"trade"}),
  predicate("payload.currency","is one of",{values:["EUR","GBP"]}),
  predicate("payload.coupon","matches pattern",{pattern:"^[A-Z]+$"}),
  predicate("payload.value","is greater than",{value:11}),
  predicate("payload.value","is at least",{valuePath:"payload.minimum"}),
  predicate("payload.value","is less than",{value:13}),
  predicate("payload.value","is at most",{value:12}),
  {kind:"not",conditions:[predicate("payload.market","equals",{value:"trade"})]},
]},context),true);
assert.equal(conditionMatches({kind:"any",conditions:[predicate("payload.market","equals",{value:"trade"}),predicate("payload.currency","equals",{value:"EUR"})]},context),true);
assert.equal(conditionMatches(predicate("payload.market","javascript",{value:"return true"}),context),false,"free-form executable expressions must never become query operators");
console.log("typed recursive Specification Project query tests passed");
