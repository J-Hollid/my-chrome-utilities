import assert from "node:assert/strict";
import {
  applyCanonicalCommand,
  applyCanonicalSchemaDraftEdits,
  compileSpecificationProject,
  createCanonicalProjectEnvelope,
  evaluateSpecificationObservation,
  migrateCanonicalProject,
} from "../dist/data-layer-specification-engine.js";

const project={
  id:"project:shop",name:"Shop",description:"",site:"shop.example",environments:["Production"],
  namingConventions:{property:"snake_case",event:"snake_case"},publicationPolicy:{warningsBlock:false,fixturesRequired:false},releases:[],
  collections:{
    profiles:[
      {id:"profile:base",name:"Base",requirements:[{path:"/event",type:"string",required:true}]},
      {id:"profile:retail",name:"Retail",requirements:[{path:"/ecommerce/transaction_id",type:"string",required:true},{path:"/ecommerce/value",type:"number",required:true}]},
      {id:"profile:trade",name:"Trade",requirements:[{path:"/ecommerce/transaction_id",type:"string",required:true},{path:"/ecommerce/account_id",type:"string",required:true}]},
    ],
    pages:[{id:"page:confirmation",name:"Confirmation",matcher:{pathname:"/checkout/confirmation"}}],pageGroups:[],
    events:[{id:"event:purchase",name:"Purchase",sourceId:"event-history",eventName:"purchase"}],
    applicabilitySets:[
      {id:"app:retail",name:"Retail confirmation",priority:10,condition:{kind:"all",conditions:[{kind:"predicate",field:"flowId",operator:"equals",value:"flow:retail"}]}},
      {id:"app:trade",name:"Trade confirmation",priority:10,condition:{kind:"all",conditions:[{kind:"predicate",field:"flowId",operator:"equals",value:"flow:trade"}]}},
    ],
    flows:[
      {id:"flow:retail",name:"Retail",steps:[{id:"step:retail-confirm",name:"Confirmation",pageId:"page:confirmation",eventId:"event:purchase",minimum:1,maximum:1,profileIds:["profile:base","profile:retail"]}]},
      {id:"flow:trade",name:"Trade",steps:[{id:"step:trade-confirm",name:"Confirmation",pageId:"page:confirmation",eventId:"event:purchase",minimum:1,maximum:1,profileIds:["profile:base","profile:trade"]}]},
    ],fixtures:[],
    schemaDrafts:[
      {id:"schema:retail",name:"Retail schema",version:3,published:true,document:{type:"object"},assignments:[],workingDraft:{name:"Retail schema",document:{type:"object"},assignments:[],profileIds:["profile:base","profile:retail"],changes:[]}},
      {id:"schema:trade",name:"Trade schema",version:4,published:true,document:{type:"object"},assignments:[],workingDraft:{name:"Trade schema",document:{type:"object"},assignments:[],profileIds:["profile:base","profile:trade"],changes:[]}},
    ],
    assignments:[
      {id:"assignment:retail",name:"Retail",schemaDraftId:"schema:retail",applicabilitySetId:"app:retail",eventId:"event:purchase",versionPolicy:"pinned",schemaRevision:3,priority:10},
      {id:"assignment:trade",name:"Trade",schemaDraftId:"schema:trade",applicabilitySetId:"app:trade",eventId:"event:purchase",versionPolicy:"pinned",schemaRevision:4,priority:10},
    ],
  },
};

const envelope=createCanonicalProjectEnvelope(project,"draft:1");
assert.equal(envelope.revision,1);assert.equal(envelope.entityRevisions["profile:base"],1);
const renamed=applyCanonicalCommand(envelope,{baseRevision:1,entityId:"profile:base",entityRevision:1,kind:"rename",name:"Sitewide"});
assert.equal(renamed.status,"applied");assert.equal(renamed.envelope.revision,2);assert.equal(renamed.envelope.project.collections.profiles[0].name,"Sitewide");
const stale=applyCanonicalCommand(renamed.envelope,{baseRevision:1,entityId:"profile:base",entityRevision:1,kind:"rename",name:"Old name"});
assert.equal(stale.status,"conflict");assert.equal(stale.envelope.project.collections.profiles[0].name,"Sitewide");assert.equal(stale.pending.name,"Old name");assert.deepEqual(stale.changedFields,["name"]);

const legacySchema={id:"schema:retail",name:"Retail schema library copy",version:5,published:true,document:{type:"object",properties:{legacy:{type:"string"}}},assignments:[]};
const migration=migrateCanonicalProject({projectEnvelope:envelope,schemaLibrary:[legacySchema]});
assert.equal(migration.status,"review-required");assert.equal(migration.conflicts[0].schemaId,"schema:retail");assert.equal(migration.sourceProject.collections.schemaDrafts[0].version,3);assert.equal(migration.sourceLibrary[0].version,5);
const projectState={project:structuredClone(project),draft:{id:"draft:1",status:"Saved",updatedAt:"2026-07-18T00:00:00.000Z"},history:{undo:[],redo:[]}},editedRetail=structuredClone(project.collections.schemaDrafts[0]);
editedRetail.workingDraft.document={type:"object",properties:{ecommerce:{type:"object",properties:{transaction_id:{type:"string"}}}}};
const unrelatedSchema={...legacySchema,id:"schema:legacy"},synchronized=applyCanonicalSchemaDraftEdits(projectState,[editedRetail,unrelatedSchema]);
assert.deepEqual(synchronized.project.collections.schemaDrafts[0].workingDraft.document,editedRetail.workingDraft.document);assert.equal(synchronized.project.collections.schemaDrafts.some(({id})=>id==="schema:legacy"),false);assert.deepEqual(synchronized.project.collections.schemaDrafts[0].document,{type:"object"},"published project schema must remain immutable");

const compiled=compileSpecificationProject(envelope);
assert.equal(compiled.status,"compiled");assert.equal(Object.isFrozen(compiled.plan),true);assert.equal(compiled.plan.schemas["schema:retail"].revision,3);
assert.match(compiled.plan.contentIdentity,/^plan:/);assert.equal(compileSpecificationProject(envelope).plan.contentIdentity,compiled.plan.contentIdentity,"unchanged canonical input must compile to the same content identity");
assert.deepEqual(compiled.plan.schemas["schema:retail"].required,["event","ecommerce"]);
assert.deepEqual(compiled.plan.provenance["schema:retail:/ecommerce/transaction_id"].map(({profileId})=>profileId),["profile:retail"]);

const compatibleProject=structuredClone(project);compatibleProject.collections.profiles[1].requirements.push({path:"/ecommerce/currency",type:"string",required:true,allowedValues:["EUR","USD","GBP"],description:"ISO currency",examples:["EUR"]},{path:"/ecommerce/coupon",type:"string",forbidden:true},{path:"/ecommerce/items",type:"array",rules:[{id:"rule:items",operator:"item-count",parameters:"1,10",severity:"error",message:"Use 1 through 10 items"}]});compatibleProject.collections.profiles.splice(2,0,{id:"profile:eur",name:"Euro checkout",requirements:[{path:"/ecommerce/currency",type:"string",allowedValues:["EUR","USD"],rules:[{id:"rule:uppercase",operator:"regular-expression",parameters:"^[A-Z]{3}$"}]}]});compatibleProject.collections.schemaDrafts[0].workingDraft.profileIds.push("profile:eur");
const compatible=compileSpecificationProject(createCanonicalProjectEnvelope(compatibleProject,"draft:compatible"));assert.equal(compatible.status,"compiled");const currency=compatible.plan.schemas["schema:retail"].document.properties.ecommerce.properties.currency;assert.deepEqual(currency.enum,["EUR","USD"]);assert.equal(currency.description,"ISO currency");assert.deepEqual(currency.examples,["EUR"]);assert.equal(currency["x-rules"][0].id,"rule:uppercase");
const conflictingProject=structuredClone(compatibleProject);conflictingProject.collections.profiles.find(({id})=>id==="profile:eur").requirements[0].type="number";const conflicting=compileSpecificationProject(createCanonicalProjectEnvelope(conflictingProject,"draft:conflict"));assert.equal(conflicting.status,"blocked");assert.equal(conflicting.diagnostics.some(({code,field})=>code==="profile-conflict"&&field==="/ecommerce/currency"),true);

const invalid=evaluateSpecificationObservation(compatible.plan,{sourceId:"event-history",eventName:"purchase",flowId:"flow:retail",payload:{event:"purchase",ecommerce:{transaction_id:42,value:49.95,currency:"JPY",coupon:"SUMMER",items:[]}}});
assert.deepEqual(invalid.issueDetails.filter(({path})=>path.startsWith("/ecommerce")).map(({path,code,expected,actual,severity})=>({path,code,expected,actual,severity})),[
  {path:"/ecommerce/transaction_id",code:"type",expected:"string",actual:"number",severity:"error"},
  {path:"/ecommerce/currency",code:"enum",expected:"EUR or USD",actual:"JPY",severity:"error"},
  {path:"/ecommerce/coupon",code:"forbidden",expected:"absent",actual:"SUMMER",severity:"error"},
  {path:"/ecommerce/items",code:"item-count",expected:"1 through 10 items",actual:"[]",severity:"error"},
]);
assert.ok(invalid.issueDetails.every(({provenance,field})=>provenance.length>0&&field.startsWith("profiles/")),"every issue must retain contributing requirement provenance and an exact authoring deep-link");

const observation={sourceId:"event-history",eventName:"purchase",pageUrl:"https://shop.example/checkout/confirmation",payload:{event:"purchase",ecommerce:{transaction_id:"T-1",value:49.95}},flowId:"flow:retail",activeStepId:"step:retail-confirm"};
const first=evaluateSpecificationObservation(compiled.plan,observation),second=evaluateSpecificationObservation(compiled.plan,structuredClone(observation));
assert.deepEqual(first,second);assert.equal(first.winner.assignmentId,"assignment:retail");assert.equal(first.winner.schemaRevision,3);assert.deepEqual(first.effectiveProfiles,["profile:base","profile:retail"]);assert.deepEqual(first.issues,[]);assert.equal(first.candidates.find(({assignmentId})=>assignmentId==="assignment:trade").rejectionReasons.includes("applicability did not match"),true);
assert.equal(first.planContentIdentity,compiled.plan.contentIdentity);assert.match(first.resultIdentity,/^result:/);
const withRecordedFixture=structuredClone(project);withRecordedFixture.collections.fixtures.push({id:"fixture:captured",name:"Captured purchase",observations:[observation],expected:{status:"pass",issueCodes:[]},evaluationResultIdentity:first.resultIdentity});const replayPlan=compileSpecificationProject({...createCanonicalProjectEnvelope(withRecordedFixture,"draft:2"),revision:2});assert.equal(replayPlan.status,"compiled");const replay=evaluateSpecificationObservation(replayPlan.plan,observation);assert.equal(replay.resultIdentity,first.resultIdentity,"recording a Fixture and advancing repository revision must not change executable evaluator identity");
const withCapturedEvidence=structuredClone(withRecordedFixture);withCapturedEvidence.collections.profiles[1].requirements=withCapturedEvidence.collections.profiles[1].requirements.map((requirement)=>({...requirement,origin:"captured-validation:capture-17",evaluationResultIdentity:first.resultIdentity}));const evidencePlan=compileSpecificationProject({...createCanonicalProjectEnvelope(withCapturedEvidence,"draft:3"),revision:3});assert.equal(evidencePlan.status,"compiled");const evidenceReplay=evaluateSpecificationObservation(evidencePlan.plan,observation);assert.equal(evidenceReplay.resultIdentity,first.resultIdentity,"attaching captured evidence without changing the effective evaluation must retain exact evaluator identity");

const dangling=structuredClone(envelope);dangling.project.collections.flows[0].steps[0].eventId="event:missing";
const blocked=compileSpecificationProject(dangling);assert.equal(blocked.status,"blocked");assert.deepEqual(blocked.diagnostics[0],{code:"dangling-reference",entityId:"step:retail-confirm",field:"eventId",referenceId:"event:missing"});

console.log("data-layer specification engine tests passed");
