import assert from "node:assert/strict";
import { SchemaRulePromotionWorkflow } from "../../../dist/data-layer-installed/schemas/rule-promotion-workflow.js";

const local={id:"local:one",name:"Required",version:1,propertyPath:"/name",operator:"required",enabled:true},schema={id:"schema:one",name:"One",version:1,document:{type:"object",properties:{name:{type:"string"}}},assignments:[],attachedRules:[local]},reviews=[];
const behavior={activeSchemaId:()=>undefined,schemas:()=>[],draft:()=>schema,detail:null,result(){},promotionDialog:{open(review){reviews.push(review);}},renderAll(){},renderDraft(){},scheduleFrame(run){run();},root:{querySelectorAll(){return[];}}};
const workflow=new SchemaRulePromotionWorkflow({behavior:()=>behavior,rules:()=>[],replaceRules(){},persist(){},render(){}});
// retired-schema-assertion: rule-revision-attachment-sync-deletion-010
assert.equal(workflow.open("/name",local.id),true);const first=reviews[0];
// retired-schema-assertion: guided-selection-continuation-promotion-039
assert.equal(workflow.pending.generation,1);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-018
assert.equal(workflow.open("/name",local.id),true);
// retired-schema-assertion: guided-selection-continuation-promotion-040
assert.equal(workflow.pending.generation,2);
assert.throws(()=>first.confirm({action:"create",name:"Reusable"}),/stale/);workflow.dispose();
// retired-schema-assertion: guided-selection-continuation-promotion-041
assert.equal(workflow.pending,undefined);
