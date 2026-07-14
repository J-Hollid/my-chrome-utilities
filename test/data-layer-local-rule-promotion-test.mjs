import assert from "node:assert/strict";
import { localRulePromotionAvailability, persistLocalRulePromotion, promoteLocalRule, reviewLocalRulePromotion, validateLocalRulePromotion } from "../dist/data-layer-local-rule-promotion.js";
import { validateWithSchema } from "../dist/data-layer-schema-verification.js";

const conditionGroup={operator:"All",predicates:[{propertyPath:"/site",operator:"Equals",comparison:{type:"string",value:"consumer"},detectedType:"string"}]};
const local40={id:"local-40",name:"Known page types",version:1,propertyPath:"/page_type",operator:"exact-value",parameters:"product"};
const local41={id:"local-41",name:"Known page types",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product","content"],applicableType:"string",severity:"warning",message:"Use a known page type",conditionGroup,enabled:true};
const local42={id:"local-42",name:"Other page types",version:1,propertyPath:"/page_type",operator:"regular-expression",parameters:"^product"};
const publishedRule={...local41,allowedValues:["product"]};
const assignment={sourceId:"history",eventName:"page_view",target:"payload",versionPolicy:"follow latest",enabled:true};
const document={type:"object",properties:{page_type:{type:"string"},site:{type:"string"}}};
const schema={id:"schema:page-view",name:"Page view",version:3,published:true,document,assignments:[assignment],attachedRules:[publishedRule],workingDraft:{baseVersion:3,sourceVersion:3,document,assignments:[assignment],attachedRules:[local40,local41,local42],pendingChanges:["Document page ownership"]}};
const input={schema,reusableRules:[],propertyPath:"/page_type",sourceRuleId:"local-41"};

assert.deepEqual(localRulePromotionAvailability(input),{available:true});
assert.equal(localRulePromotionAvailability({...input,sourceRuleId:"missing"}).available,false);
assert.equal(localRulePromotionAvailability({...input,reusableRules:[{...local41,id:"local-41",kind:"Allowed values",version:2}]}).available,false);
assert.equal(localRulePromotionAvailability({...input,schema:{...schema,workingDraft:undefined}}).available,true);

const review=reviewLocalRulePromotion(input);
assert.deepEqual(review.source,{schema:{id:schema.id,name:"Page view",version:3},propertyPath:"/page_type",rule:{id:"local-41",name:"Known page types",version:1,operator:"allowed-values",allowedValues:["product","content"],applicableType:"string",severity:"warning",message:"Use a known page type",conditionGroup,enabled:true}});
assert.deepEqual(review.equivalentRules,[]);
assert.deepEqual(validateLocalRulePromotion(review,{action:"create",name:""}),{ready:false,assistance:"Enter a reusable rule name"});
assert.deepEqual(validateLocalRulePromotion(review,{action:"create",name:"Approved page types"}),{ready:true,assistance:"Review and confirm promotion",duplicateDefinitionWarning:false});

const promoted=promoteLocalRule({...input,action:"create",name:"Approved page types",description:"Known storefront page types",examples:"product, content",createId:()=>"reusable-51"});
assert.equal(promoted.changed,true);
assert.deepEqual(promoted.reusableRules,[{id:"reusable-51",name:"Approved page types",kind:"Allowed values",version:1,operator:"allowed-values",allowedValues:["product","content"],applicableType:"string",severity:"warning",message:"Use a known page type",conditionGroup,enabled:true,description:"Known storefront page types",examples:"product, content",attachments:[schema.id],revisionHistory:[]}]);
assert.deepEqual(promoted.schema.workingDraft.attachedRules[1],{...local41,id:"reusable-51",name:"Approved page types",version:1});
assert.deepEqual(promoted.schema.workingDraft.attachedRules[0],local40); assert.deepEqual(promoted.schema.workingDraft.attachedRules[2],local42);
assert.deepEqual(promoted.schema.workingDraft.pendingChanges,["Document page ownership","Promote local rule local-41 to reusable rule reusable-51"]);
assert.deepEqual(promoted.schema.attachedRules,[publishedRule]);

const equivalent={...promoted.reusableRules[0],id:"reusable-50",name:"Approved page types",version:2};
const equivalentReview=reviewLocalRulePromotion({...input,reusableRules:[equivalent]});
assert.deepEqual(equivalentReview.equivalentRules.map(({id,version})=>[id,version]),[["reusable-50",2]]);
assert.deepEqual(validateLocalRulePromotion(equivalentReview,{action:"use-existing",reusableRuleId:"reusable-50"}),{ready:true,assistance:"Use equivalent reusable rule revision 2",duplicateDefinitionWarning:false});
assert.deepEqual(validateLocalRulePromotion(equivalentReview,{action:"create",name:"Consumer page types"}),{ready:true,assistance:"Review and confirm promotion",duplicateDefinitionWarning:true});
const reused=promoteLocalRule({...input,reusableRules:[equivalent],action:"use-existing",reusableRuleId:"reusable-50"});
assert.deepEqual(reused.reusableRules,[equivalent]); assert.equal(reused.schema.workingDraft.attachedRules[1].id,"reusable-50"); assert.equal(reused.schema.workingDraft.attachedRules[1].version,2);

const differentlyDefined={...equivalent,allowedValues:["landing"],attachments:[]};
const conflictReview=reviewLocalRulePromotion({...input,reusableRules:[differentlyDefined]});
assert.deepEqual(validateLocalRulePromotion(conflictReview,{action:"create",name:" approved PAGE types "}),{ready:false,assistance:"Open or use the existing differently defined rule"});

const draftSchema=(candidate)=>({...candidate,attachedRules:candidate.workingDraft.attachedRules});
const event=(page_type,site="consumer")=>({sourceId:"history",eventName:"page_view",payload:{...(page_type===undefined?{}:{page_type}),site},rawInput:[]});
const before=draftSchema(schema),after=draftSchema(promoted.schema);
for(const [value,site] of [["product","consumer"],["unknown","consumer"],["unknown","business"]]){
  const prior=validateWithSchema(event(value,site),before,[before]); const next=validateWithSchema(event(value,site),after,[after]);
  assert.deepEqual(next.evaluations.map(({status,severity,message})=>[status,severity,message]),prior.evaluations.map(({status,severity,message})=>[status,severity,message]));
}

const sameName={...local40,id:"local-same-name",name:"Known page types"};
const identitySchema={...schema,workingDraft:{...schema.workingDraft,attachedRules:[sameName,local41]}};
const identityPromotion=promoteLocalRule({schema:identitySchema,reusableRules:[],propertyPath:"/page_type",sourceRuleId:"local-41",action:"create",name:"Consumer page types",createId:()=>"reusable-51"});
assert.deepEqual(identityPromotion.schema.workingDraft.attachedRules[0],sameName); assert.equal(identityPromotion.schema.workingDraft.attachedRules[1].id,"reusable-51");

const sourceConfigurations=[
  {...local41,operator:"allowed-values",allowedValues:[1],applicableType:"number"},
  {...local41,operator:"numeric-range",parameters:"0,100",allowedValues:undefined,applicableType:"number"},
  {...local41,operator:"required",allowedValues:undefined,parameters:undefined,conditionGroup:{operator:"All",predicates:[{propertyPath:"/page_type",operator:"Equals",comparison:{type:"string",value:"product"},detectedType:"string"}]}},
  {...local41,operator:"regular-expression",parameters:"^SKU-",allowedValues:undefined,enabled:false},
];
for(const source of sourceConfigurations){const configuredSchema={...schema,workingDraft:{...schema.workingDraft,attachedRules:[source]}};const result=promoteLocalRule({schema:configuredSchema,reusableRules:[],propertyPath:"/page_type",sourceRuleId:"local-41",action:"create",name:"Promoted",createId:()=>"reusable-51"});assert.deepEqual(result.schema.workingDraft.attachedRules[0],{...source,id:"reusable-51",name:"Promoted",version:1});}

for(const failureKey of ["rules","schemas"]){
  const values=new Map([["schemas","before schemas"],["rules","before rules"]]); let failed=false;
  const storage={getItem:(key)=>values.get(key)??null,removeItem:(key)=>values.delete(key),setItem:(key,value)=>{if(key===failureKey&&!failed){failed=true;throw new Error(`${key} unavailable`);}values.set(key,value);}};
  assert.throws(()=>persistLocalRulePromotion(storage,{schemaKey:"schemas",schemaValue:"after schemas",ruleKey:"rules",ruleValue:"after rules"}),new RegExp(`${failureKey} unavailable`));
  assert.deepEqual(Object.fromEntries(values),{schemas:"before schemas",rules:"before rules"});
}
{
  const values=new Map(); const storage={getItem:(key)=>values.get(key)??null,removeItem:(key)=>values.delete(key),setItem:(key,value)=>values.set(key,value)};
  persistLocalRulePromotion(storage,{schemaKey:"schemas",schemaValue:"after schemas",ruleKey:"rules",ruleValue:"after rules"});
  assert.deepEqual(Object.fromEntries(values),{rules:"after rules",schemas:"after schemas"});
}

console.log("data-layer local-rule promotion tests passed");
