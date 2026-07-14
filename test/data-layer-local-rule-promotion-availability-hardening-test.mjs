import assert from "node:assert/strict";
import {
  localRulePromotionAvailability,
  promoteLocalRule,
  reviewLocalRulePromotion,
} from "../dist/data-layer-local-rule-promotion.js";

const document={type:"object",properties:{"/page_type":{type:"string"},"/page_name":{type:"string"}}};
const assignment={sourceId:"history",eventName:"pageview",target:"payload",enabled:true};
const first={id:"local-40",name:"Required page type",version:1,propertyPath:"/page_type",operator:"required",enabled:true};
const selected={id:"local-rule:generated-41",name:"Known page types",version:1,propertyPath:"//page_type/",operator:"allowed-values",allowedValues:["product","content"],applicableType:"string",severity:"warning",message:"Use a known page type",enabled:true};
const schema={id:"schema:page-view",name:"Page view",version:3,published:true,document,assignments:[assignment],attachedRules:[first,selected]};
const base={schema,reusableRules:[],propertyPath:"/page_type",sourceRuleId:selected.id};

assert.deepEqual(localRulePromotionAvailability(base),{available:true});
assert.equal(schema.workingDraft,undefined,"rendering availability must not create a working draft");
const review=reviewLocalRulePromotion(base);
assert.equal(review.source.createsWorkingDraft,true);
assert.deepEqual(review.source.rule,{
  id:selected.id,name:selected.name,version:1,operator:"allowed-values",allowedValues:["product","content"],applicableType:"string",severity:"warning",message:"Use a known page type",enabled:true,
});
assert.deepEqual(schema.attachedRules,[first,selected],"review must leave the published revision byte-for-byte unchanged");

const promoted=promoteLocalRule({...base,action:"create",name:"Approved page types",createId:()=>"reusable-51"});
assert.equal(promoted.schema.version,3);
assert.deepEqual(promoted.schema.attachedRules,[first,selected]);
assert.deepEqual(promoted.schema.workingDraft.attachedRules,[first,{...selected,id:"reusable-51",name:"Approved page types",version:1}]);
assert.deepEqual(promoted.schema.workingDraft.pendingChanges,[`Promote local rule ${selected.id} to reusable rule reusable-51`]);
assert.deepEqual(promoted.reusableRules[0].attachments,[schema.id]);

const draftSchema={...schema,workingDraft:{baseVersion:3,sourceVersion:3,document,assignments:[assignment],attachedRules:[first,selected],pendingChanges:[]}};
assert.deepEqual(localRulePromotionAvailability({...base,schema:draftSchema}),{available:true});

const reusable={...selected,id:"reusable-known",name:"Approved page types",kind:"Allowed values",attachments:[schema.id]};
assert.equal(localRulePromotionAvailability({...base,reusableRules:[{...reusable,id:selected.id}]}).available,false);
assert.equal(localRulePromotionAvailability({...base,sourceRuleId:"inherited-local"}).available,false);
assert.equal(localRulePromotionAvailability({...base,editorContext:"read-only"}).available,false);

const newSchema={id:"schema:provisional",name:"New schema",version:1,document,assignments:[],attachedRules:[selected]};
const newInput={schema:newSchema,reusableRules:[],propertyPath:"/page_type",sourceRuleId:selected.id,editorContext:"new-schema"};
assert.deepEqual(localRulePromotionAvailability(newInput),{available:true});
const promotedNew=promoteLocalRule({...newInput,action:"create",name:"Approved page types",createId:()=>"reusable-new"});
assert.equal(promotedNew.schema.workingDraft,undefined);
assert.deepEqual(promotedNew.schema.attachedRules,[{...selected,id:"reusable-new",name:"Approved page types",version:1}]);
assert.deepEqual(promotedNew.reusableRules[0].attachments,[],"discarding a provisional schema must not leave a dangling library attachment");

const publishedAgain={...promoted.schema,version:4,attachedRules:[...promoted.schema.workingDraft.attachedRules,{id:"local-42",name:"Required page name",version:1,propertyPath:"/page_name",operator:"required"}],workingDraft:undefined};
assert.equal(localRulePromotionAvailability({...base,schema:publishedAgain,propertyPath:"/page_name",sourceRuleId:"local-42",reusableRules:promoted.reusableRules}).available,true);
assert.equal(localRulePromotionAvailability({...base,schema:publishedAgain,sourceRuleId:"reusable-51",reusableRules:promoted.reusableRules}).available,false);

console.log("data-layer local-rule promotion availability hardening tests passed");
