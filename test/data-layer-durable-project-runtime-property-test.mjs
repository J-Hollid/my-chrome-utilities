import assert from "node:assert/strict";
import {createSpecificationProject,transactProject} from "../dist/data-layer-specification-project.js";
import {CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY,restoreCanonicalProjectState,serializeCanonicalProjectState} from "../dist/data-layer-specification-repository.js";
import {createMemoryDurableProjectRepository} from "../dist/data-layer-durable-project-repository.js";
import {createDurableProjectRuntime} from "../dist/data-layer-durable-project-runtime.js";
import {createProjectAssetBodyStaging} from "../dist/durable-project/project-asset-body-staging.js";

{
  let assetSeed=0x51a9e2d7;const assetRandom=()=>{assetSeed=(Math.imul(assetSeed,1664525)+1013904223)>>>0;return assetSeed;};for(let sample=0;sample<64;sample+=1){const staging=createProjectAssetBodyStaging(),projectId=`project-${sample}`,otherId=`other-${sample}`,expected=new Map();for(let step=0;step<24;step+=1){const digest=`body-${assetRandom()%7}`,identity={projectId,namespace:"fixture",digest},value=`${sample}:${step}:${assetRandom()}`;staging.stage(identity,new Blob([value]));expected.set(digest,value);if(assetRandom()%3===0){const attachment=staging.attach(projectId);if(assetRandom()%2===0){attachment.commit();expected.clear();}}if(assetRandom()%5===0){staging.discard(identity);expected.delete(digest);}}const attached=staging.attach(projectId),actual=new Map(await Promise.all(attached.bodies.map(async item=>[item.identity.digest,await item.body.text()])));assert.deepEqual(actual,expected,"staging conserves each latest project-scoped generation exactly once");assert.deepEqual(staging.attach(otherId).bodies,[],"randomized staging never crosses project identity");attached.commit();assert.deepEqual(staging.attach(projectId).bodies,[],"committing the selected generation clears the exact remainder");}
}

const dependencyKinds=["profiles","propertySets","events","flows","assignments"];
const subset=(mask)=>dependencyKinds.filter((_,index)=>(mask&(1<<index))!==0);
const legacy=()=>{const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};

for(let iteration=0;iteration<32;iteration+=1){
  const repository=createMemoryDurableProjectRepository(),projectId=`project:route-property:${iteration}`,state=createSpecificationProject({name:`Route property ${iteration}`,site:`route-${iteration}.example`,id:(kind)=>kind==="project"?projectId:`${kind}:${iteration}`});
  state.project.collections.pages.push({id:`page:${iteration}`,name:`Page ${iteration}`});
  state.project.collections.fixtures.push({id:`fixture:${iteration}`,name:`Fixture ${iteration}`,payload:{status:"before"}});
  state.project.documentationFlowGraphs={[`flow:${iteration}`]:{status:"before"}};
  state.project.releases.push({id:`release:${iteration}`,name:`Release ${iteration}`,revision:1,createdAt:"2026-07-23T00:00:00.000Z",snapshot:structuredClone(state.project.collections)});
  for(const kind of dependencyKinds)state.project.collections[kind].push({id:`${kind}:${iteration}`,name:`${kind} ${iteration}`,description:"before"});
  await repository.putProject(state,{draftSequence:iteration,active:true});
  const first=subset(iteration),second=subset((iteration*13+7)&31),firstCapabilities=iteration&7,secondCapabilities=(iteration*5+3)&7,capabilities=firstCapabilities|secondCapabilities,expected=new Set([...first,...second]),route={collectionKind:"pages",entityId:`page:${iteration}`},capabilityRoute=(mask)=>({includeFlowGraphs:Boolean(mask&1),includeFixtures:Boolean(mask&2),includeReleases:Boolean(mask&4)}),runtime=await createDurableProjectRuntime(repository,legacy(),{projectId,route:{...route,collectionKinds:first,...capabilityRoute(firstCapabilities)}});
  await runtime.ensureProjectRoute(projectId,{...route,collectionKinds:second,...capabilityRoute(secondCapabilities)});
  await runtime.ensureProjectRoute(projectId,route);
  const projected=restoreCanonicalProjectState(runtime.storage.getItem(CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY));
  for(const kind of dependencyKinds)assert.equal(Boolean(projected.project.collections[kind][0]?.placeholder),!expected.has(kind),`${kind} hydration follows the retained union at iteration ${iteration}`);
  assert.equal(Boolean(projected.project.documentationFlowGraphs?.[`flow:${iteration}`]),Boolean(capabilities&1),`Flow graph hydration is retained at iteration ${iteration}`);
  assert.equal(Boolean(projected.project.collections.fixtures[0]?.placeholder),!(capabilities&2),`Fixture hydration is retained at iteration ${iteration}`);
  assert.equal(projected.project.releases.length,capabilities&4?1:0,`Release hydration is retained at iteration ${iteration}`);
  const edited=transactProject(projected,`Edit retained kinds ${iteration}`,project=>({...project,...(capabilities&1?{documentationFlowGraphs:{...project.documentationFlowGraphs,[`flow:${iteration}`]:{status:`after ${iteration}`}}}:{}),collections:{...project.collections,...Object.fromEntries([...expected].map(kind=>[kind,project.collections[kind].map(entity=>({...entity,description:`after ${iteration}`}))]))}}));
  runtime.storage.setItem(CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY,serializeCanonicalProjectState(edited,iteration+1));
  await runtime.settled();
  const durable=(await repository.loadProject(projectId)).state.project;
  for(const kind of dependencyKinds)assert.equal(durable.collections[kind][0].description,expected.has(kind)?`after ${iteration}`:"before",`${kind} saves iff it was hydrated at iteration ${iteration}`);
  assert.equal(durable.documentationFlowGraphs[`flow:${iteration}`].status,capabilities&1?`after ${iteration}`:"before",`Flow graph saves iff it was hydrated at iteration ${iteration}`);
  assert.deepEqual(durable.collections.fixtures[0].payload,{status:"before"},`read-only Fixture hydration cannot widen a Page route's writable collections at iteration ${iteration}`);
}

console.log("durable project runtime property tests passed");
