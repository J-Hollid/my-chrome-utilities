import assert from "node:assert/strict";
import { SchemaRulePromotionWorkflow } from "../../../dist/data-layer-installed/schemas/rule-promotion-workflow.js";

const local={id:"local:one",name:"Required",version:1,propertyPath:"/name",operator:"required",enabled:true},schema={id:"schema:one",name:"One",version:1,document:{type:"object",properties:{name:{type:"string"}}},assignments:[],attachedRules:[local]},reviews=[];
const behavior={activeSchemaId:()=>undefined,schemas:()=>[],draft:()=>schema,detail:null,result(){},promotionDialog:{open(review){reviews.push(review);}},renderAll(){},renderDraft(){},scheduleFrame(run){run();},root:{querySelectorAll(){return[];}}};
const workflow=new SchemaRulePromotionWorkflow({behavior:()=>behavior,rules:()=>[],replaceRules(){},persist(){},render(){}});

assert.equal(workflow.open("/name",local.id),true);const first=reviews[0];

assert.equal(workflow.pendingState().generation,1);

assert.equal(workflow.open("/name",local.id),true);

const pendingProjection=workflow.pendingState();
assert.equal(pendingProjection.generation,2);
pendingProjection.generation=20;
assert.equal(workflow.pendingState().generation,2,"callers cannot mutate a promotion through its projection");
assert.equal(workflow.pending,undefined,"the promotion transaction is private");
assert.throws(()=>first.confirm({action:"create",name:"Reusable"}),/stale/);workflow.dispose();

assert.equal(workflow.pendingState(),undefined);

const promotionLocal={id:"local:email",name:"Email required",version:1,propertyPath:"/checkout/email",operator:"required",enabled:true};
let promotionSchemas=[{id:"schema:checkout",name:"Checkout",version:1,
  document:{type:"object",properties:{checkout:{type:"object",properties:{email:{type:"string"}}}}},assignments:[],
  workingDraft:{baseVersion:1,sourceVersion:1,document:{type:"object",properties:{checkout:{type:"object",properties:{email:{type:"string"}}}}},
    assignments:[],attachedRules:[promotionLocal],pendingChanges:[]}}];
let promotionRules=[];
let promotionReview;
const promotionBehavior={activeSchemaId:()=>"schema:checkout",schemas:()=>promotionSchemas,draft:()=>promotionSchemas[0],detail:null,result(){},
  promotionDialog:{open(review){promotionReview=review;}},renderAll(){},renderDraft(){},scheduleFrame(run){run();},root:{querySelectorAll(){return[];}},
  commitPromotion:async(_schemaId,_previousSchemas,_previousRules,nextSchemas,nextRules)=>{
    promotionSchemas=structuredClone(nextSchemas);promotionRules=structuredClone(nextRules);
  }};
const promotionWorkflow=new SchemaRulePromotionWorkflow({behavior:()=>promotionBehavior,rules:()=>promotionRules,
  replaceRules:(next)=>{promotionRules=structuredClone(next);},persist(){},render(){}});

// retired-schema-assertion: guided-selection-continuation-promotion-037
assert.equal(promotionWorkflow.open("/checkout/email","local:email"),true);
const promotionCompletion=Promise.resolve(promotionReview.confirm({action:"create",name:"Reusable email"}));
const promotedRuleId=promotionRules.find(({name})=>name==="Reusable email")?.id;

// retired-schema-assertion: guided-selection-continuation-promotion-038
assert.match(promotedRuleId,/^reusable-/);
const finishPromotion=await promotionCompletion;
finishPromotion?.();

// retired-schema-assertion: guided-selection-continuation-promotion-039
assert.equal(promotionSchemas[0].workingDraft.attachedRules.some(({id})=>id===promotedRuleId),true);
