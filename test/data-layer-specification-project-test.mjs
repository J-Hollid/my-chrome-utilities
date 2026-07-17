import assert from "node:assert/strict";
import {
  addProjectEntity,
  addFlowStep,
  applyBulkRequirement,
  advanceFlowInstance,
  buildCoverageMatrix,
  buildReleaseReview,
  commitBulkProperties,
  commitStagedProjectImport,
  composeRequirementProfiles,
  createSpecificationProject,
  createProjectSchemaDraft,
  exportDocumentation,
  exportSpecificationProjectState,
  exportSpecificationProject,
  importSpecificationProject,
  migrateLegacyLibrary,
  projectPreflight,
  publishProjectRelease,
  redoProjectTransaction,
  reorderFlowStep,
  resolveApplicability,
  runProjectFixture,
  saveProjectAssignment,
  searchProjectAssignments,
  stageProjectImport,
  startFlowInstance,
  transactProject,
  undoProjectTransaction,
  restoreReleaseAsDraft,
} from "../dist/data-layer-specification-project.js";

let sequence = 0;
const id = (kind) => `${kind}-${++sequence}`;
let state = createSpecificationProject({
  name:"Shop data specification",
  description:"Retail and Trade",
  site:"shop.example",
  environments:["Production","Staging"],
  id,
});
assert.equal(state.project.name,"Shop data specification");
assert.equal(state.project.currentRelease,undefined);
assert.equal(state.draft.status,"Saved");
assert.deepEqual(Object.keys(state.project.collections),["profiles","pages","pageGroups","events","applicabilitySets","flows","fixtures","schemaDrafts","assignments"]);

const add = (kind, entity) => { state = addProjectEntity(state, kind, entity, id); return state.project.collections[kind].at(-1); };
const sitewide = add("profiles",{name:"Sitewide",requirements:[{path:"/page_type",type:"string",required:true}]});
const commerce = add("profiles",{name:"Commerce",requirements:[{path:"/ecommerce/value",type:"number",required:true}]});
const retail = add("profiles",{name:"Retail confirmation",requirements:[{path:"/currency",type:"string",allowedValues:["EUR","USD"]}]});
const trade = add("profiles",{name:"Trade account",requirements:[{path:"/account_id",type:"string",required:true}]});
const purchase = add("events",{name:"Purchase",sourceId:"event-history",eventName:"purchase",target:"payload",profileIds:[commerce.id]});
const confirmation = add("pages",{name:"Checkout confirmation",profileIds:[sitewide.id],applicabilityIds:[]});
const retailMatcher = add("applicabilitySets",{name:"Retail confirmation",priority:10,profileIds:[retail.id],condition:{kind:"all",conditions:[{kind:"predicate",field:"pathname",operator:"equals",value:"/checkout/confirmation"},{kind:"predicate",field:"eventName",operator:"equals",value:"purchase"},{kind:"predicate",field:"flowId",operator:"equals",value:"retail"}]}});
const tradeMatcher = add("applicabilitySets",{name:"Trade confirmation",priority:10,profileIds:[trade.id],condition:{kind:"all",conditions:[{kind:"predicate",field:"pathname",operator:"equals",value:"/checkout/confirmation"},{kind:"predicate",field:"eventName",operator:"equals",value:"purchase"},{kind:"predicate",field:"flowId",operator:"equals",value:"trade"}]}});
const retailFlow = add("flows",{name:"Retail",steps:[{id:"retail-product",name:"Product",eventId:purchase.id,minimum:1,maximum:10},{id:"retail-upsell",name:"Upsell",optional:true},{id:"retail-confirm",name:"Confirmation",eventId:purchase.id,profileIds:[retail.id],applicabilityId:retailMatcher.id}]});
const tradeFlow = add("flows",{name:"Trade",steps:[{id:"trade-account",name:"Account",profileIds:[trade.id]},{id:"trade-confirm",name:"Confirmation",eventId:purchase.id,applicabilityId:tradeMatcher.id}]});
assert.equal(new Set([sitewide.id,commerce.id,retail.id,trade.id,purchase.id,confirmation.id,retailFlow.id,tradeFlow.id]).size,8);

const composed = composeRequirementProfiles([sitewide,commerce,retail]);
assert.deepEqual(composed.requirements.map(({path})=>path),["/page_type","/ecommerce/value","/currency"]);
assert.deepEqual(composed.requirements.map(({origin})=>origin),[sitewide.id,commerce.id,retail.id]);
const conflict = composeRequirementProfiles([{id:"a",name:"A",requirements:[{path:"/x",type:"string"}]},{id:"b",name:"B",requirements:[{path:"/x",type:"number"}]}]);
assert.equal(conflict.conflicts[0].path,"/x");

assert.equal(resolveApplicability(state.project,{host:"shop.example",pathname:"/checkout/confirmation",eventName:"purchase",flowId:"retail"}).winner.id,retailMatcher.id);
assert.equal(resolveApplicability(state.project,{host:"shop.example",pathname:"/checkout/confirmation",eventName:"purchase",flowId:"trade"}).winner.id,tradeMatcher.id);
const ambiguous = add("applicabilitySets",{name:"Ambiguous",priority:10,condition:{kind:"all",conditions:[{kind:"predicate",field:"pathname",operator:"equals",value:"/checkout/confirmation"},{kind:"predicate",field:"eventName",operator:"equals",value:"purchase"}]}});
assert.equal(resolveApplicability(state.project,{pathname:"/checkout/confirmation",eventName:"purchase",flowId:"retail"}).ties.length,2);

const properties = Array.from({length:100},(_,index)=>({path:`/property_${index+1}`,type:index===49?"invalid":"string"}));
const staged = commitBulkProperties(state,sitewide.id,properties);
assert.equal(staged.errors.length,1);
state = commitBulkProperties(state,sitewide.id,properties.map((property)=>property.type==="invalid"?{...property,type:"number"}:property)).state;
assert.equal(state.project.collections.profiles.find(({id:profileId})=>profileId===sitewide.id).requirements.length,101);
state = applyBulkRequirement(state,sitewide.id,["/property_1","/property_2"],{required:true});
assert.equal(state.project.collections.profiles.find(({id:profileId})=>profileId===sitewide.id).requirements.filter(({path,required})=>required&&["/property_1","/property_2"].includes(path)).length,2);
state = undoProjectTransaction(state);
assert.equal(state.project.collections.profiles.find(({id:profileId})=>profileId===sitewide.id).requirements.find(({path})=>path==="/property_1").required,undefined);
state = redoProjectTransaction(state);
assert.equal(state.project.collections.profiles.find(({id:profileId})=>profileId===sitewide.id).requirements.find(({path})=>path==="/property_1").required,true);

const snapshot = JSON.stringify(state.project);
state = transactProject(state,"link page and event",(project)=>({...project,collections:{...project.collections,pages:project.collections.pages.map((page)=>page.id===confirmation.id?{...page,eventIds:[purchase.id]}:page)}}));
assert.deepEqual(state.project.collections.pages.find(({id:pageId})=>pageId===confirmation.id).eventIds,[purchase.id]);
state = undoProjectTransaction(state);
assert.equal(JSON.stringify(state.project),snapshot);
state = redoProjectTransaction(state);

const fixture = add("fixtures",{name:"Retail confirmation passes",flowId:retailFlow.id,context:{pathname:"/checkout/confirmation",eventName:"purchase",flowId:"retail"},payload:{page_type:"confirmation",property_1:"one",property_2:"two",ecommerce:{value:12},currency:"EUR"},profileIds:[sitewide.id,commerce.id,retail.id],expect:"pass"});
assert.equal(runProjectFixture(state.project,fixture).status,"fail");
assert.ok(projectPreflight(state.project).blockers.some(({kind})=>kind==="ambiguous-applicability"));
state = transactProject(state,"remove ambiguity",(project)=>({...project,collections:{...project.collections,applicabilitySets:project.collections.applicabilitySets.filter(({id:matcherId})=>matcherId!==ambiguous.id)}}));
assert.equal(runProjectFixture(state.project,fixture).status,"pass");
assert.equal(projectPreflight(state.project).blockers.length,0);

const beforeFailure = JSON.stringify(state);
assert.throws(()=>publishProjectRelease(state,{id,write:()=>{throw new Error("disk full");}}),/disk full/);
assert.equal(JSON.stringify(state),beforeFailure);
state = publishProjectRelease(state,{id,write:()=>{}});
assert.equal(state.project.releases.length,1);
assert.equal(state.project.currentRelease,state.project.releases[0].id);
assert.equal(state.draft,undefined);

const exported = exportSpecificationProject(state.project);
const imported = importSpecificationProject(exported,{existingProjects:[],id});
assert.deepEqual(imported.project,state.project);

const legacy = {schemas:[{id:"schema-1",name:"Page",version:3,assignments:[{id:"assignment-1",eventName:"page_view",sourceId:"history",target:"payload"}]}],rules:[{id:"rule-1",name:"Required",version:2}]};
const migrated = migrateLegacyLibrary(legacy,{id});
assert.equal(migrated.issues.length,0);
assert.equal(migrated.project.compatibility.legacySnapshot,JSON.stringify(legacy));
assert.equal(migrated.project.collections.events[0].eventName,"page_view");

const documentation = exportDocumentation(state.project,{fields:["path","type","provenance","whereUsed"],include:{applicability:false,flows:false,fixtures:false,releases:true}});
assert.match(documentation.preview,/\/page_type/);
assert.equal(documentation.preview,documentation.clipboard);
assert.deepEqual(documentation.lossyCategories,["applicability","flows","fixtures"]);
assert.match(documentation.preview,/Full-fidelity Specification Project/);
assert.equal(state.project.collections.profiles.find(({id:profileId})=>profileId===sitewide.id).requirements.length,101);

let flowInstance = startFlowInstance(state.project,retailFlow.id,"tab-1");
flowInstance = advanceFlowInstance(state.project,flowInstance,{eventId:purchase.id,pageId:confirmation.id});
assert.equal(flowInstance.occurrences["retail-product"],1);
assert.equal(flowInstance.currentStepId,"retail-product");
flowInstance = advanceFlowInstance(state.project,flowInstance,{eventId:purchase.id,pageId:confirmation.id});
assert.equal(flowInstance.occurrences["retail-product"],2);
assert.equal(resolveApplicability(state.project,{pathname:"/checkout/confirmation",eventName:"purchase",flowId:flowInstance.selector}).winner.id,retailMatcher.id);

const releaseOne = state.project.releases[0];
let restored = restoreReleaseAsDraft(state,releaseOne.id,id);
assert.equal(restored.project.currentRelease,releaseOne.id);
assert.equal(restored.draft.restoredFromRelease,releaseOne.id);
restored = transactProject(restored,"rename Purchase",(project)=>({...project,collections:{...project.collections,events:project.collections.events.map((event)=>event.id===purchase.id?{...event,name:"Order completed"}:event)}}));
const review = buildReleaseReview(state.project,restored.project);
assert.ok(review.sections.some(({kind})=>kind==="renamed"&&String(kind)));
assert.ok(review.affectedConsumers.some(({id:consumerId})=>consumerId===purchase.id));

const fullFidelity = exportSpecificationProjectState(restored);
const stagedImport = stageProjectImport(fullFidelity,state);
assert.equal(stagedImport.blockers.length,1);
assert.equal(stagedImport.blockers[0].kind,"project-id-collision");
assert.equal(JSON.stringify(state.project),JSON.stringify(JSON.parse(exportSpecificationProject(state.project)).project));
const remapped = stageProjectImport(fullFidelity,state,{projectId:id("project")});
assert.equal(remapped.blockers.length,0);
const importedState = commitStagedProjectImport(state,remapped,{write:()=>{}});
assert.notEqual(importedState.project.id,state.project.id);
assert.deepEqual(importedState.project.collections,restored.project.collections);
assert.throws(()=>commitStagedProjectImport(state,remapped,{write:()=>{throw new Error("quota");}}),/quota/);
assert.equal(state.project.currentRelease,releaseOne.id);

const coverage = buildCoverageMatrix(restored.project,{rowLimit:40});
assert.ok(coverage.totalRows>=restored.project.collections.profiles.length);
assert.ok(coverage.rows.length<=40);
assert.ok(coverage.rows.every((row)=>row.issueLink.startsWith("?kind=")));

let integrated = createSpecificationProject({name:"Integrated lifecycle",site:"shop.example",id});
integrated = createProjectSchemaDraft(integrated,{schemaId:"schema-sitewide",name:"Sitewide page context",baseRevision:1,description:"Shared envelope"},id);
const publishedBeforeAssignments = JSON.stringify(integrated.project.collections.schemaDrafts[0].publishedRevision);
const nestedConditions = {kind:"all",conditions:[{kind:"predicate",field:"payload.funnel_id",operator:"equals",value:"retail"},{kind:"not",conditions:[{kind:"predicate",field:"payload.account_type",operator:"equals",value:"trade"}]}]};
integrated = saveProjectAssignment(integrated,{name:"Retail",schemaId:"schema-sitewide",eventName:"purchase",sourceId:"event-history",target:"payload",priority:10,versionPolicy:"pinned",schemaRevision:1,condition:nestedConditions},id);
integrated = saveProjectAssignment(integrated,{name:"Trade",schemaId:"schema-sitewide",eventName:"purchase",sourceId:"event-history",target:"payload",priority:10,versionPolicy:"follow latest",condition:{kind:"all",conditions:[{kind:"predicate",field:"payload.account_type",operator:"equals",value:"trade"}]}},id);
assert.equal(new Set(integrated.project.collections.assignments.map(({id:assignmentId})=>assignmentId)).size,2);
assert.equal(integrated.project.collections.assignments[0].schemaRevision,1);
assert.equal(JSON.stringify(integrated.project.collections.schemaDrafts[0].publishedRevision),publishedBeforeAssignments);
const retailAssignment = integrated.project.collections.assignments[0];
integrated = saveProjectAssignment(integrated,{...retailAssignment,priority:20},id);
assert.equal(integrated.project.collections.assignments[0].id,retailAssignment.id);
assert.deepEqual(integrated.project.collections.assignments[0].condition,nestedConditions);
assert.throws(()=>saveProjectAssignment(integrated,{name:"Blank",schemaId:"",eventName:"",sourceId:"",target:"",priority:0,versionPolicy:"follow latest"},id),/routing fields/);
assert.deepEqual(searchProjectAssignments(integrated.project,"retail"),{rows:[integrated.project.collections.assignments[0]],count:1,empty:false,conflicts:[]});

let structured = createSpecificationProject({name:"Structured flows",site:"shop.example",id});
structured = addProjectEntity(structured,"flows",{name:"Retail checkout",steps:[]},id);
const structuredFlow = structured.project.collections.flows[0];
structured = addFlowStep(structured,structuredFlow.id,{name:"Product",eventId:"purchase",pageId:"product",minimum:1,maximum:5,optional:false,branch:"checkout",transition:{from:"entry",to:"product"}},id);
structured = addFlowStep(structured,structuredFlow.id,{name:"Confirmation",eventId:"purchase",pageId:"confirmation",minimum:1,maximum:1,optional:false,branch:"checkout",transition:{from:"product",to:"confirmation"}},id);
structured = reorderFlowStep(structured,structuredFlow.id,1,0);
assert.deepEqual(structured.project.collections.flows[0].steps.map(({name})=>name),["Confirmation","Product"]);
assert.equal(structured.project.collections.flows[0].steps[1].maximum,5);

let retailInstance=startFlowInstance(state.project,retailFlow.id,"retail-tab"),tradeInstance=startFlowInstance(state.project,tradeFlow.id,"trade-tab");
retailInstance=advanceFlowInstance(state.project,retailInstance,{eventId:purchase.id,pageId:confirmation.id});tradeInstance=advanceFlowInstance(state.project,tradeInstance,{pageId:confirmation.id});
const retailFinal=resolveApplicability(state.project,{pathname:"/checkout/confirmation",eventName:"purchase",flowId:retailInstance.selector}),tradeFinal=resolveApplicability(state.project,{pathname:"/checkout/confirmation",eventName:"purchase",flowId:tradeInstance.selector});
assert.equal(retailFinal.winner.id,retailMatcher.id);assert.equal(tradeFinal.winner.id,tradeMatcher.id);assert.deepEqual(state.project.collections.applicabilitySets.find(({id:matcherId})=>matcherId===retailFinal.winner.id).profileIds,[retail.id]);assert.deepEqual(state.project.collections.applicabilitySets.find(({id:matcherId})=>matcherId===tradeFinal.winner.id).profileIds,[trade.id]);

console.log("data-layer Specification Project tests passed");
