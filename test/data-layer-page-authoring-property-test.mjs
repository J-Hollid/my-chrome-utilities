import assert from "node:assert/strict";
import {savePageDetails,testPageRecognition} from "../dist/data-layer-page-authoring.js";
import {createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";

let seed=0x5a6ed17;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0x100000000;};
const token=()=>Math.floor(random()*0x100000000).toString(36);

for(let example=0;example<160;example+=1){
  const suffix=token(),pageId=`page:${suffix}`,siblingId=`page:sibling:${suffix}`,groupId=`group:${suffix}`;
  const initial=createSpecificationProject({name:`Project ${suffix}`,site:`${suffix}.example`,id:(kind)=>`${kind}:${suffix}`}),page={
    id:pageId,name:`Original ${suffix}`,eventName:`old_${suffix}`,pathname:`/old/${suffix}`,
    environment:"Production",host:`${suffix}.example`,query:"campaign=old",hash:"old",spa:true,
    expectedEventIds:[`event:${suffix}`],applicabilitySetId:`set:${suffix}`,pageGroupIds:[groupId],
    profileInheritanceRecipes:[{id:`recipe:${suffix}`,profileId:`profile:${suffix}`,targetId:pageId}],
    canonicalSchema:{id:`schema:${suffix}`,contributorId:pageId,contributorName:`Original ${suffix}`,revision:example+1,nodes:{}},
    localSchemaContributions:[{path:`/property_${suffix}`,expectedValue:suffix}],
  },sibling={id:siblingId,name:`Sibling ${suffix}`,eventName:`sibling_${suffix}`},state={...initial,project:{...initial.project,collections:{...initial.project.collections,pages:[page,sibling]},documentationFlowGraphs:{[`flow:${suffix}`]:{pageFrames:[{id:`frame:${suffix}`,pageId}]}}}},before=structuredClone(state);
  const name=`Page ${suffix}`,description=`Description ${token()}`,eventName=`pageview_${token()}`,pathname=`/checkout/${token()}`,
    saved=savePageDetails(state,pageId,{name:`  ${name}  `,description:`\n ${description} \t`,eventName:` ${eventName} `,pathname:` ${pathname} `}),savedPage=saved.project.collections.pages[0];

  assert.deepEqual(state,before,`sample ${example} does not mutate its input`);
  assert.deepEqual({name:savedPage.name,description:savedPage.description,eventName:savedPage.eventName,pathname:savedPage.pathname},{name,description,eventName,pathname},`sample ${example} normalizes Page details`);
  for(const key of["environment","host","query","hash","spa","expectedEventIds","applicabilitySetId"])assert.equal(key in savedPage,false,`sample ${example} removes obsolete ${key}`);
  assert.deepEqual(savedPage.pageGroupIds,page.pageGroupIds,`sample ${example} conserves memberships`);
  assert.deepEqual(savedPage.profileInheritanceRecipes,page.profileInheritanceRecipes,`sample ${example} conserves inheritance recipes`);
  assert.deepEqual(savedPage.canonicalSchema,page.canonicalSchema,`sample ${example} conserves canonical schema`);
  assert.deepEqual(savedPage.localSchemaContributions,page.localSchemaContributions,`sample ${example} conserves local schema`);
  assert.deepEqual(saved.project.collections.pages[1],sibling,`sample ${example} conserves sibling Pages`);
  assert.deepEqual(saved.project.documentationFlowGraphs,state.project.documentationFlowGraphs,`sample ${example} conserves Flow placement`);
  assert.deepEqual(undoProjectTransaction(saved).project,state.project,`sample ${example} is exactly undoable`);
  assert.deepEqual(savePageDetails(saved,pageId,{name,description,eventName,pathname}).project,saved.project,`sample ${example} is project-idempotent`);

  const protocol=example%2?"https":"http",host=`${token()}.example`,candidate=`${protocol}://${host}${pathname}?sample=${token()}#${token()}`;
  assert.equal(testPageRecognition(pathname,candidate),`matches exact pathname ${pathname}`,`sample ${example} ignores host, query, and hash`);
  assert.equal(testPageRecognition(pathname,`${protocol}://${host}${pathname}/extra`),`does not match ${pathname}`,`sample ${example} requires the exact pathname`);
}

assert.equal(testPageRecognition(undefined,"https://example.test/checkout"),"No Exact URL path configured");
assert.equal(testPageRecognition("/checkout","checkout"),"Enter a full URL");
assert.equal(testPageRecognition("/checkout","file:///checkout"),"Enter a full URL");

console.log("page authoring properties passed");
