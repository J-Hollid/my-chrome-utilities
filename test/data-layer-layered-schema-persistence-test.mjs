import assert from "node:assert/strict";
import {compileLayeredSchema,resolveLayeredTarget,validateLayeredObservation} from "../dist/data-layer-layered-schema.js";

const stored=JSON.stringify({
  contributors:[
    {id:"profile:sitewide",name:"Sitewide",scope:"Shared Profile",constraints:[{path:"/funnel_step",type:"string",allowedValues:["3a","3b"],enforcement:"invariant"}]},
    {id:"frame:alternative",name:"Alternative shipping",scope:"Flow Page-instance",constraints:[{path:"/funnel_step",expectedValue:"3b",enforcement:"overridable",target:"event:purchase"}]},
  ],
  target:{id:"target:alternative",name:"Alternative shipping Purchase",activation:"automatic",priority:20,applicability:[{name:"Purchase Event",field:"eventName",operator:"equals",value:"Purchase"}]},
  revision:9,
});
const reloaded=JSON.parse(stored),compiled=compileLayeredSchema(reloaded.contributors,{eventId:"event:purchase",eventRole:"interaction"}),resolution=resolveLayeredTarget([{...reloaded.target,compiled}],{eventName:"Purchase"}),result=validateLayeredObservation({targetId:resolution.winner.id,targetName:resolution.winner.name,revision:reloaded.revision,compiled},{funnel_step:"3a"});
assert.equal(compiled.properties["/funnel_step"].expectedValue,"3b");
assert.equal(resolution.winner.id,"target:alternative");
assert.equal(result.effectiveSchemaRevision,9);
assert.equal(result.issues[0].code,"EXPECTED_VALUE");
assert.equal(result.flowCompletionClaim,undefined);
console.log("data-layer layered schema persistence tests passed");
