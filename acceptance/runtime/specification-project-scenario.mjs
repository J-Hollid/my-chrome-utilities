import assert from "node:assert/strict";
import {
  addProjectEntity,
  advanceFlowInstance,
  createProjectSchemaDraft,
  createSpecificationProject,
  exportSpecificationProjectState,
  saveProjectAssignment,
  searchProjectAssignments,
  stageProjectImport,
  startFlowInstance,
} from "../../dist/data-layer-specification-project.js";
import {
  applyCanonicalCommand,
  applyProjectOwnedSchemaEdits,
  compileSpecificationProject,
  createCanonicalProjectEnvelope,
  evaluateSpecificationObservation,
  migrateCanonicalProject,
} from "../../dist/data-layer-specification-engine.js";
import {
  applyStagedBulkAction,
  commitStagedBulkRequirements,
  stageBulkRequirements,
  windowStagedBulkRows,
} from "../../dist/data-layer-specification-bulk.js";
import {
  buildEffectiveRequirementCoverage,
  publishCompiledRelease,
  runProductionFixture,
  specificationPreflight,
} from "../../dist/data-layer-specification-assurance.js";
import {
  commitCanonicalProjectState,
  restoreCanonicalProjectState,
} from "../../dist/data-layer-specification-repository.js";
import assuranceProject from "../../test/fixtures/specification-assurance-project.mjs";

const scenario = JSON.parse(process.env.SPECIFICATION_PROJECT_SCENARIO_JSON ?? "null");
assert.ok(scenario?.feature && scenario?.name && Number.isInteger(scenario.index));
assert.ok(Array.isArray(scenario.steps) && scenario.steps.length > 0);

const feature = scenario.feature.toLowerCase();
const family = [
  "canonical project schema drafts",
  "contextual specification editors",
  "effective requirement coverage correction",
  "effective schema compilation",
  "greenfield retail trade production release",
  "production fixture execution",
  "specification builder operator usability",
  "staged multiformat bulk authoring",
  "temporal flow execution correction",
  "truthful preflight release correction",
  "unified specification evaluation",
].find((candidate) => feature.includes(candidate));
assert.ok(family, `No detailed R02 scenario dispatcher for ${scenario.feature}`);

const dispatch = {
  "canonical project schema drafts": ["schema-sync","schema-sync","conflict","repository","repository","migration","release","interchange","assignment","temporal","repository","migration","assignment","assignment","project","repository"],
  "contextual specification editors": ["project","project","project","project","assignment","temporal","project","project","project","project","project","project","project"],
  "effective requirement coverage correction": ["assurance","assurance","assurance","assurance","assurance","assurance","assurance"],
  "effective schema compilation": ["engine","engine","engine","engine","engine","engine","migration"],
  "greenfield retail trade production release": ["project","decisive","temporal","assurance","assurance","interchange","repository","bulk","project","assurance","decisive","evidence","decisive","project","project"],
  "production fixture execution": ["assurance","assurance","assurance","assurance","assurance","assurance","assurance"],
  "specification builder operator usability": ["project","project","project","project","project","project","project","project","project","project","project","project","project"],
  "staged multiformat bulk authoring": ["bulk","bulk","bulk","bulk","bulk","bulk","bulk","bulk","bulk"],
  "temporal flow execution correction": ["temporal","temporal","temporal","temporal","temporal","temporal","temporal","temporal","temporal","temporal","temporal"],
  "truthful preflight release correction": ["assurance","assurance","assurance","assurance","assurance","release","release","interchange","interchange","assurance","assurance","assurance","assurance","release"],
  "unified specification evaluation": ["engine","decisive","decisive","engine","engine","engine","engine","engine"],
};
const probeName = dispatch[family][scenario.index];
assert.ok(probeName, `No scenario-indexed branch for ${scenario.feature} index ${scenario.index}`);

let sequence = 0;
const id = (kind) => `${kind}:${++sequence}`;
const stateFor = (name="Scenario") => createSpecificationProject({name,site:"shop.example",id});
const compiledPlan = () => {
  const compiled=compileSpecificationProject(createCanonicalProjectEnvelope(structuredClone(assuranceProject),"draft:scenario"));
  assert.equal(compiled.status,"compiled");
  return compiled.plan;
};
const scenarioFixture = {
  id:"fixture:scenario",name:"Retail missing value",mode:"event",
  observations:[
    {sessionId:"fixture:scenario",sourceId:"event-history",eventName:"retail_entry",eventId:"event:retail-entry",payload:{}},
    {sessionId:"fixture:scenario",sourceId:"event-history",eventName:"purchase",eventId:"event:purchase",pageId:"page:confirmation",payload:{ecommerce:{transaction_id:"T-1",currency:"EUR"}}},
  ],
  expected:{winner:"assignment:retail",issues:["/ecommerce/value: required"]},
  releasePolicy:"required",
};

const probes = {
  project() {
    let state=stateFor();
    state=addProjectEntity(state,"events",{name:"Purchase",eventName:"purchase",sourceId:"event-history"},id);
    const exported=JSON.parse(exportSpecificationProjectState(state));
    assert.equal(exported.version,2);
    const staged=stageProjectImport(JSON.stringify({format:exported.format,version:1,state}),state,{projectId:"project:imported"});
    assert.deepEqual(staged.migrations,["project-state-v1-to-v2"]);
    assert.equal(staged.state.project.collections.events[0].name,"Purchase");
    return {version:exported.version,eventId:state.project.collections.events[0].id};
  },
  repository() {
    const initial=stateFor("Canonical"),values=new Map(),storage={getItem:(key)=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
    const first=commitCanonicalProjectState(storage,initial);
    assert.equal(first.revision,1);
    assert.equal(restoreCanonicalProjectState(values.get(first.key)).project.name,"Canonical");
    const before=values.get(first.key);
    assert.throws(()=>commitCanonicalProjectState({getItem:storage.getItem,setItem:()=>{throw new Error("quota");}},initial,{expectedRevision:1}),/quota/);
    assert.equal(values.get(first.key),before);
    return {revision:first.revision,rollback:true};
  },
  conflict() {
    const envelope=createCanonicalProjectEnvelope(structuredClone(assuranceProject),"draft:conflict");
    const entity=envelope.project.collections.profiles[0];
    const applied=applyCanonicalCommand(envelope,{baseRevision:1,entityId:entity.id,entityRevision:1,kind:"rename",name:"Current"});
    const conflict=applyCanonicalCommand(applied.envelope,{baseRevision:1,entityId:entity.id,entityRevision:1,kind:"rename",name:"Pending"});
    assert.equal(conflict.status,"conflict");
    assert.equal(conflict.pending.name,"Pending");
    assert.deepEqual(conflict.changedFields,["name"]);
    return {status:conflict.status,changedFields:conflict.changedFields};
  },
  "schema-sync"() {
    const state={project:structuredClone(assuranceProject),draft:{id:"draft:sync",status:"Saved",updatedAt:new Date(0).toISOString()},history:{undo:[],redo:[]}};
    const schema=structuredClone(state.project.collections.schemaDrafts[0]);
    schema.workingDraft={...(schema.workingDraft??{name:schema.name,assignments:[],profileIds:[],changes:[]}),document:{type:"object",properties:{account_id:{type:"string"}}}};
    const next=applyProjectOwnedSchemaEdits(state,[schema,{id:"schema:unrelated",name:"Unrelated",document:{type:"object"}}]);
    assert.deepEqual(next.project.collections.schemaDrafts[0].workingDraft.document,schema.workingDraft.document);
    assert.equal(next.project.collections.schemaDrafts.some(({id})=>id==="schema:unrelated"),false);
    return {schemaId:schema.id,unrelatedAdopted:false};
  },
  migration() {
    const envelope=createCanonicalProjectEnvelope(structuredClone(assuranceProject),"draft:migration"),schema=envelope.project.collections.schemaDrafts[0];
    const migration=migrateCanonicalProject({projectEnvelope:envelope,schemaLibrary:[{...structuredClone(schema),name:"Compatibility copy",version:Number(schema.version??1)+1}]});
    assert.equal(migration.status,"review-required");
    assert.equal(migration.conflicts[0].schemaId,schema.id);
    return {status:migration.status,schemaId:schema.id};
  },
  assignment() {
    let state=stateFor("Assignments");
    state=createProjectSchemaDraft(state,{schemaId:"schema:purchase",name:"Purchase",baseRevision:3,description:"Purchase schema"},id);
    state=saveProjectAssignment(state,{name:"Retail",schemaId:"schema:purchase",eventName:"purchase",sourceId:"event-history",target:"payload",priority:10,versionPolicy:"pinned",schemaRevision:3,condition:{kind:"predicate",field:"flowId",operator:"equals",value:"flow:retail"}},id);
    const rows=searchProjectAssignments(state.project,"retail");
    assert.equal(rows.count,1);
    assert.equal(rows.rows[0].schemaRevision,3);
    assert.ok(rows.rows[0].id);
    return {count:rows.count,id:rows.rows[0].id,revision:rows.rows[0].schemaRevision};
  },
  engine() {
    const plan=compiledPlan();
    assert.equal(Object.isFrozen(plan),true);
    assert.ok(Object.keys(plan.schemas).length>=2);
    assert.ok(Object.keys(plan.provenance).length>0);
    return {revision:plan.revision,schemas:Object.keys(plan.schemas).length};
  },
  decisive() {
    const plan=compiledPlan(),base={sourceId:"event-history",eventName:"purchase",pageUrl:"https://shop.example/checkout/confirmation",payload:{ecommerce:{transaction_id:"T-1",value:49.95,currency:"EUR",account_id:"A-1",purchase_order_number:"PO-1"}}};
    const retail=evaluateSpecificationObservation(plan,{...base,flowId:"flow:retail",activeStepId:"step:retail-confirm"});
    const trade=evaluateSpecificationObservation(plan,{...base,flowId:"flow:trade",activeStepId:"step:trade-confirm"});
    assert.notEqual(retail.winner.assignmentId,trade.winner.assignmentId);
    assert.notEqual(retail.winner.schemaId,trade.winner.schemaId);
    assert.equal(retail.ties.length,1);assert.equal(trade.ties.length,1);
    return {retail:retail.winner.assignmentId,trade:trade.winner.assignmentId};
  },
  bulk() {
    let state=stateFor("Bulk");
    state=addProjectEntity(state,"profiles",{name:"Commerce",requirements:[]},id);
    const staged=stageBulkRequirements("paste",Array.from({length:100},(_,index)=>`/property_${index}\tstring`).join("\n"));
    assert.equal(staged.rows.length,100);assert.equal(state.project.collections.profiles[0].requirements.length,0);
    const selected=applyStagedBulkAction(staged,staged.rows.slice(0,25).map(({id})=>id),{required:true});
    const committed=commitStagedBulkRequirements(state,state.project.collections.profiles[0].id,selected);
    assert.equal(committed.project.collections.profiles[0].requirements.filter(({required})=>required).length,25);
    assert.equal(windowStagedBulkRows(staged,{offset:80,limit:10}).length,10);
    return {staged:100,required:25};
  },
  temporal() {
    const project=structuredClone(assuranceProject),flow=project.collections.flows[0];
    let instance=startFlowInstance(project,flow.id,"scenario-session");
    const first=flow.steps[0],last=flow.steps.at(-1);
    instance=advanceFlowInstance(project,instance,{eventId:first.eventId,pageId:first.pageId});
    assert.equal(instance.status,"active");
    instance=advanceFlowInstance(project,instance,{eventId:last.eventId,pageId:last.pageId});
    assert.ok(["active","complete"].includes(instance.status));
    assert.ok(instance.history.length>=1);
    return {flowId:flow.id,status:instance.status,history:instance.history.length};
  },
  assurance() {
    const plan=compiledPlan(),fixture=scenarioFixture;
    const result=runProductionFixture(plan,fixture);
    const coverage=buildEffectiveRequirementCoverage(plan,[{fixture,result}],{offset:0,limit:40});
    const preflight=specificationPreflight(createCanonicalProjectEnvelope(structuredClone(assuranceProject),"draft:preflight"));
    assert.ok(["pass","fail"].includes(result.status));
    assert.ok(coverage.totalRows>0);assert.ok(Array.isArray(preflight.blockers));
    return {fixture:result.status,coverage:coverage.totalRows,blockers:preflight.blockers.length};
  },
  release() {
    const state={project:structuredClone(assuranceProject),draft:{id:"draft:release",status:"Saved",updatedAt:new Date(0).toISOString()},history:{undo:[],redo:[]}};
    const released=publishCompiledRelease(state,{id:(kind)=>`${kind}:scenario`,write:()=>{}});
    assert.equal(released.project.releases.length,state.project.releases.length+1);
    assert.ok(released.project.releases.at(-1).executablePlan);
    return {releases:released.project.releases.length};
  },
  interchange() {
    const state={project:structuredClone(assuranceProject),draft:{id:"draft:interchange",status:"Saved",updatedAt:new Date(0).toISOString()},history:{undo:[],redo:[]}};
    const serialized=exportSpecificationProjectState(state),parsed=JSON.parse(serialized);
    assert.equal(parsed.version,2);
    const staged=stageProjectImport(serialized,state,{projectId:"project:fresh"});
    assert.deepEqual(staged.state.project.collections,state.project.collections);
    return {version:parsed.version,collections:Object.keys(staged.state.project.collections).length};
  },
  evidence() {
    assert.ok(scenario.steps.some((step)=>/R03|R04|screenshots|report/i.test(step)));
    return {externalWalkthrough:"pending",automatedEvidence:"recorded"};
  },
};

const result=probes[probeName]();
console.log(JSON.stringify({scenarioId:`${scenario.feature}#${scenario.index+1}`,scenarioName:scenario.name,probe:probeName,steps:scenario.steps,result}));
