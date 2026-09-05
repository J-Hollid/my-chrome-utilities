import assert from "node:assert/strict";

const { createSchemaLifecycle } = await import(
  "../../../dist/data-layer-installed/schemas/lifecycle.js"
);
const { createSchemasInstalledLifecycleOwner } = await import(
  "../../../dist/data-layer-installed/schemas/installed-lifecycle-owner.js"
);

const lifecycle = createSchemaLifecycle();
const target = new EventTarget();
let actions = 0;
const act = () => { actions += 1; };

assert.equal(lifecycle.mount(), true);
const firstGeneration = lifecycle.generation();
lifecycle.listen(target, "change", act);

assert.equal(lifecycle.mount(), false, "a repeated mount is an idempotent no-op");
target.dispatchEvent(new Event("change"));

assert.equal(actions, 1, "one input runs one owned action");

assert.equal(lifecycle.dispose(), true);

assert.equal(lifecycle.isCurrent(firstGeneration), false);
target.dispatchEvent(new Event("change"));

assert.equal(actions, 1, "dispose removes the owned listener");

assert.equal(lifecycle.dispose(), false, "a repeated dispose is an idempotent no-op");

assert.equal(lifecycle.mount(), true);
lifecycle.listen(target, "change", act);
target.dispatchEvent(new Event("change"));

assert.equal(actions, 2, "a new generation owns one fresh listener set");
lifecycle.dispose();

assert.notEqual(firstGeneration, lifecycle.generation(),
  "a remount changes the direct lifecycle generation");

assert.match(String(lifecycle.generation()), /^\d+$/,
  "the direct lifecycle exposes a numeric generation");

assert.deepEqual([lifecycle.isCurrent(firstGeneration), actions], [false, 2],
  "the direct lifecycle rejects stale work and retains only owned actions");

const installedLifecycle=createSchemaLifecycle();
let projectListener,persistenceListener,layeredProfileDisposals=0;
const emptyElements={};
const installedOwner=createSchemasInstalledLifecycleOwner({lifecycle:installedLifecycle,route:{mount(){},dispose(){}},
  editorElements:emptyElements,propertyElements:emptyElements,subviews:[],
  ruleElements:{createRule:null,save:null,exportRules:null,cancelRevision:null,cancelDelete:null,elements:emptyElements},
  assignmentElements:{},createAssignment:null,libraryElements:{},editor:{editorBindings:()=>({}),propertyBindings:()=>({}),undoCopy(){}},
  propertyWorkflow:{cancel(){},navigate(){},updatePreview(){}},rule:{reload(){},render(){},dispose(){}},assignment:{},
  library:{activeSchemaId:undefined,schemas:[],reload(){},resetBehaviorState(){},setDraft(){}},validation:{recheck(){},render(){}},
  canonical:{hasEditor:()=>false},persistence:{settle(){},render(){}},projectHydration:{needs:()=>false,hydrate:async()=>{}},
  canonicalDomain:{dispose(){}},propertyDomain:{dispose(){}},libraryDomain:{dispose(){}},schemaPanel:null,schemaList:null,guidedRoot:null,
  exportChoices:null,exportReview:null,specificationBuilder:null,buildSpecification:null,buildHistoricalSpecification:null,
  promotionDialog:{close(){}},mountLayered:()=>({dispose(){layeredProfileDisposals+=1;}}),
  subscribe:(listener)=>{projectListener=listener;return()=>{projectListener=undefined;};},
  subscribePersistence:(listener)=>{persistenceListener=listener;return()=>{persistenceListener=undefined;};},
  render(){},renderProperty(){},updateTree(){},persistTreeScroll(){},navigateTree(){},rememberCanonicalScroll(){}});
installedOwner.mount();
installedOwner.dispose();

// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-006
assert.equal(persistenceListener,undefined,"disposal detaches the durable persistence port");

// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-007
assert.equal(layeredProfileDisposals,1,"Schemas disposes the layered Profile editor with its owner lifecycle");
const retainedSchemaListeners=[projectListener,persistenceListener].filter(Boolean);

// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-010
assert.deepEqual(retainedSchemaListeners,[],"Schemas removes every installed subscription it owns");
