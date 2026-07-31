import assert from "node:assert/strict";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {savePageDetails} from "../dist/data-layer-page-authoring.js";

let sequence=0;const id=(kind)=>`${kind}:page-authoring:${sequence++}`;
const initial=createSpecificationProject({name:"Retail website",site:"retail.example.com",id}),cart={
  id:"page:cart",name:"Cart",description:"Old",eventName:"old_view",pathname:"/checkout/cart",
  environment:"Production",host:"shop.example",query:"x=1",hash:"basket",spa:true,
  expectedEventIds:["event:add"],applicabilitySetId:"applicability:retail",pageGroupIds:["group:checkout"],
  profileInheritanceRecipes:[{id:"recipe:sitewide",profileId:"profile:sitewide",targetId:"page:cart"}],
  canonicalSchema:{id:"schema:cart",contributorId:"page:cart",contributorName:"Cart",revision:3,nodes:{}},
},state={...initial,project:{...initial.project,collections:{...initial.project.collections,pages:[cart]},documentationFlowGraphs:{"flow:checkout":{pageFrames:[{id:"frame:cart",pageId:"page:cart"}]}}}};

const saved=savePageDetails(state,"page:cart",{name:"  Cart  ",description:"  Checkout basket  "}),page=saved.project.collections.pages[0];
assert.equal(page.name,"Cart");assert.equal(page.description,"Checkout basket");
for(const key of["eventName","pathname","environment","host","query","hash","spa","expectedEventIds","applicabilitySetId"])assert.equal(key in page,false,`${key} is removed from durable Page details`);
assert.deepEqual(page.pageGroupIds,cart.pageGroupIds);assert.deepEqual(page.profileInheritanceRecipes,cart.profileInheritanceRecipes);assert.deepEqual(page.canonicalSchema,cart.canonicalSchema);assert.deepEqual(saved.project.documentationFlowGraphs,state.project.documentationFlowGraphs);
assert.doesNotThrow(()=>savePageDetails(state,"page:cart",{name:"Cart",description:""}));
console.log("page authoring unit tests passed");
