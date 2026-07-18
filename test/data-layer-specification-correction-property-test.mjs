import assert from "node:assert/strict";
import {
  compileSpecificationProject,
  createCanonicalProjectEnvelope,
  evaluateSpecificationObservation,
} from "../dist/data-layer-specification-engine.js";
import {
  runProductionFixture,
  specificationPreflight,
} from "../dist/data-layer-specification-assurance.js";
import {
  entityPurposeGuidance,
  projectAuthoringGuidance,
  projectImpactPreview,
} from "../dist/data-layer-specification-guidance.js";
import {
  applyCapturedValidationToProfile,
  capturedValidationDestinationChoices,
  createFixtureFromCapturedValidation,
} from "../dist/data-layer-specification-project.js";
import {
  CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY,
  subscribeCanonicalProjectChanges,
} from "../dist/data-layer-specification-repository.js";
import baseProject from "./fixtures/specification-assurance-project.mjs";

for (let sample=0; sample<200; sample+=1) {
  const project=structuredClone(baseProject);
  project.id=`project:property-${sample}`;
  project.name=`Property project ${sample}`;
  const envelope=createCanonicalProjectEnvelope(project,`draft:${sample}`);
  const firstCompilation=compileSpecificationProject(envelope);
  const secondCompilation=compileSpecificationProject(structuredClone(envelope));
  assert.equal(firstCompilation.status,"compiled");
  assert.equal(secondCompilation.status,"compiled");
  assert.equal(firstCompilation.plan.contentIdentity,secondCompilation.plan.contentIdentity,
    "canonical clones must compile to the same plan identity");

  const transactionId=`T-${sample}`;
  const observations=[
    {sessionId:`session:${sample}`,sourceId:"event-history",eventName:"retail_entry",eventId:"event:retail-entry",payload:{}},
    {sessionId:`session:${sample}`,sourceId:"event-history",eventName:"purchase",eventId:"event:purchase",pageId:"page:confirmation",payload:{ecommerce:{transaction_id:transactionId,value:sample+0.5,currency:"EUR"}}},
  ];
  const firstResult=evaluateSpecificationObservation(firstCompilation.plan,observations[1]);
  const secondResult=evaluateSpecificationObservation(firstCompilation.plan,structuredClone(observations[1]));
  assert.equal(firstResult.resultIdentity,secondResult.resultIdentity,
    "equivalent observations must have stable result identities");

  const fixture={id:`fixture:${sample}`,name:`Retail proof ${sample}`,observations,expected:{winner:"assignment:retail",issues:[]},releasePolicy:"required"};
  assert.notEqual(runProductionFixture(firstCompilation.plan,fixture).status,"blocked",
    "an observation-bearing assertion must always be executable");
  assert.deepEqual(runProductionFixture(firstCompilation.plan,{...fixture,observations:[]}).blockers,
    ["Add at least one observation."],"assertions without observations must be blocked");
  assert.deepEqual(runProductionFixture(firstCompilation.plan,{...fixture,expected:{}}).blockers,
    ["Add at least one expected assertion."],"observations without assertions must be blocked");

  const provingProject=structuredClone(project);
  provingProject.collections.fixtures=[fixture];
  const evidenceCompilation=compileSpecificationProject(
    createCanonicalProjectEnvelope(provingProject,`draft:${sample}`));
  assert.equal(evidenceCompilation.status,"compiled");
  assert.notEqual(evidenceCompilation.plan.contentIdentity,firstCompilation.plan.contentIdentity,
    "adding Fixture evidence must change the complete plan envelope identity");
  assert.equal(evidenceCompilation.plan.evaluatorContentIdentity,firstCompilation.plan.evaluatorContentIdentity,
    "adding Fixture evidence must preserve the executable evaluator identity");
  assert.equal(
    evaluateSpecificationObservation(evidenceCompilation.plan,observations[1]).resultIdentity,
    firstResult.resultIdentity,
    "the same observation must retain its evaluator result identity after evidence-only changes");
  const firstPreflight=specificationPreflight(createCanonicalProjectEnvelope(provingProject,`draft:${sample}`));
  const secondPreflight=specificationPreflight(createCanonicalProjectEnvelope(structuredClone(provingProject),`draft:${sample}`));
  assert.equal(firstPreflight.contentIdentity,secondPreflight.contentIdentity,
    "equivalent project evidence must have a stable preflight identity");

  const guidance=projectAuthoringGuidance(project);
  guidance.tasks[0].label="mutated caller copy";
  assert.notEqual(projectAuthoringGuidance(project).tasks[0].label,"mutated caller copy",
    "authoring guidance must not retain caller mutations");
  const entityGuidance=entityPurposeGuidance(sample%2===0?"Profile":"Fixture");
  entityGuidance.prerequisites.push("caller mutation");
  assert.equal(entityPurposeGuidance(sample%2===0?"Profile":"Fixture").prerequisites.includes("caller mutation"),false,
    "entity guidance must return independent values");
  const affected=[`entity:${sample}`],impact=projectImpactPreview("edit",affected);
  affected.push("later mutation");
  assert.deepEqual(impact.affectedEntities,[`entity:${sample}`],
    "impact previews must conserve their original affected-entity set");

  const capturedEvent=project.collections.events[sample%project.collections.events.length];
  const destinations=capturedValidationDestinationChoices(project,{
    eventName:capturedEvent.eventName,
    sourceId:capturedEvent.sourceId,
  });
  assert.deepEqual(destinations.events,
    [{id:capturedEvent.id,name:capturedEvent.name}],
    "continuation choices must expose only canonically matching named Events");
  assert.deepEqual(destinations.pages,
    project.collections.pages.map(({id,name})=>({id,name})),
    "continuation choices must conserve canonical Page identities and names");
  assert.equal(destinations.flowSteps.length,
    project.collections.flows.flatMap(({steps=[]})=>steps).length,
    "continuation choices must conserve all named Flow steps");
  const payload={sample,nested:{currency:"EUR"}};
  const evaluated={resultIdentity:`result:property-${sample}`,
    winner:{schemaId:"schema:retail",schemaRevision:3},issueDetails:[]};
  const fixtureState=createFixtureFromCapturedValidation(
    {project,draft:{id:`draft:${sample}`,status:"Saved",updatedAt:"2026-07-18T00:00:00Z"},history:{undo:[],redo:[]}},
    {name:destinations.suggestedFixtureName,captureId:`capture:${sample}`,
      sourceId:capturedEvent.sourceId,eventName:capturedEvent.eventName,payload,
      schemaId:"schema:retail",eventId:capturedEvent.id,
      pageId:destinations.pages[0]?.id,flowStepId:destinations.flowSteps[0]?.id,
      profileId:destinations.profiles[0]?.id,
      evaluated},
    (kind)=>`${kind}:property-${sample}`,
  );
  payload.nested.currency="mutated";
  const continuedFixture=fixtureState.project.collections.fixtures[0];
  assert.equal(project.collections.fixtures.length,0,
    "captured continuation must not mutate the prior project revision");
  assert.equal(continuedFixture.observations[0].payload.nested.currency,"EUR",
    "captured continuation must own an independent observation payload");
  assert.equal(continuedFixture.evaluationResultIdentity,evaluated.resultIdentity,
    "captured Fixtures must retain the production evaluator result identity");
  assert.deepEqual(
    {eventId:continuedFixture.eventId,pageId:continuedFixture.pageId,
      flowStepId:continuedFixture.flowStepId,profileIds:continuedFixture.profileIds},
    {eventId:capturedEvent.id,pageId:destinations.pages[0]?.id,
      flowStepId:destinations.flowSteps[0]?.id,profileIds:[destinations.profiles[0]?.id]},
    "captured Fixtures must conserve the reviewed canonical destination identities");
  const profiledState=applyCapturedValidationToProfile(
    {project,draft:{id:`draft:${sample}`,status:"Saved",updatedAt:"2026-07-18T00:00:00Z"},history:{undo:[],redo:[]}},
    {captureId:`capture:${sample}`,profileId:"profile:retail",schemaId:"schema:retail",evaluated},
  );
  assert.equal(project.collections.profiles[0].requirements.some(({evaluationResultIdentity})=>evaluationResultIdentity),false,
    "Profile continuation must not mutate the prior project revision");
  assert.equal(profiledState.project.collections.profiles[0].requirements.every(
    ({origin,evaluationResultIdentity})=>origin===`captured-validation:capture:${sample}`&&evaluationResultIdentity===evaluated.resultIdentity),true,
    "continued Profile requirements must retain capture and evaluator provenance");

  let listener;
  let notifications=0;
  const target={
    addEventListener:(_type,next)=>{listener=next;},
    removeEventListener:(_type,next)=>{assert.equal(next,listener);listener=undefined;},
  };
  const unsubscribe=subscribeCanonicalProjectChanges(target,({revision,state})=>{
    notifications+=1;
    assert.equal(revision,envelope.revision);
    assert.equal(state.project.id,project.id);
  });
  listener({key:`unrelated:${sample}`,newValue:JSON.stringify(envelope)});
  listener({key:CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY,newValue:null});
  assert.equal(notifications,0,"irrelevant storage events must not notify subscribers");
  listener({key:CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY,newValue:JSON.stringify(envelope)});
  assert.equal(notifications,1,"one canonical storage event must produce one notification");
  unsubscribe();
  assert.equal(listener,undefined,"unsubscribe must remove the registered listener");
}

console.log("Specification correction properties: 200 generated cases passed");
