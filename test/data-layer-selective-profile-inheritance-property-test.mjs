import assert from "node:assert/strict";
import {copyProfileInheritanceRecipe,createProfileInheritanceRecipe,profileInheritanceImpact,profileInheritanceSelection,selectiveProfileContribution} from "../dist/data-layer-selective-profile-inheritance.js";

let seed=0x51ec71;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/0x100000000;};
const node=(id,name,order,{parentId,concept,rules=[]}={})=>({id,name,type:parentId?"string":"object",order,...(parentId?{parentId}:{}),...(concept?{concept}:{}),presence:{mode:"optional"},allowedValues:[],rules,documentation:{displayText:name,description:`Description ${name}`,comments:"",example:{method:"custom",value:name}},provenance:[{source:"created",contributorId:"profile:property",contributorName:"Master",scope:"Shared Profile"}],overrideReferences:[]});

for(let run=0;run<180;run+=1){
  const root=node(`root:${run}`,`root_${run}`,0,{concept:"structure"}),children=Array.from({length:4+Math.floor(random()*8)},(_,index)=>node(`property:${run}:${index}`,`field_${index}`,index,{parentId:root.id,concept:index%2?"live":"pinned"})),document={id:`canonical:${run}`,revision:1,state:"Draft",contributorId:"profile:property",contributorName:"Master",rootIds:[root.id],nodes:Object.fromEntries([root,...children].map((item)=>[item.id,item])),view:"tree",changes:[]},recipe=createProfileInheritanceRecipe({id:`recipe:${run}`,profileId:"profile:property",targetId:`page:${run}`,startingPoint:"empty",sourceRevision:1}),selected=children[Math.floor(random()*children.length)],excluded=children.find(({id})=>id!==selected.id),configured={...recipe,conceptSelections:["live"],propertySelections:[selected.id],excludedPropertyIds:[excluded.id]},sourceBytes=JSON.stringify(document),selection=profileInheritanceSelection(document,configured),contribution=selectiveProfileContribution(document,configured);
  assert.equal(JSON.stringify(document),sourceBytes,"selection and contribution conserve source bytes");
  assert.equal(selection.effectivePropertyIds.includes(root.id),true,"every nested selection closes structurally");
  assert.equal(selection.directPropertyIds.includes(excluded.id),false,"explicit exclusion wins over live concepts and pins");
  assert.equal(JSON.stringify(JSON.parse(JSON.stringify(configured))),JSON.stringify(configured),"recipes round-trip without source definitions");
  assert.equal(JSON.stringify(configured).includes('"nodes"'),false);
  assert.equal(contribution.constraints.length,selection.effectivePropertyIds.length);
  const added=node(`property:${run}:new`,`new_live_${run}`,children.length,{parentId:root.id,concept:"live"}),grown={...document,revision:2,nodes:{...document.nodes,[added.id]:added}},grownSelection=profileInheritanceSelection(grown,configured);
  assert.equal(grownSelection.directPropertyIds.includes(added.id),true,"live concepts synchronize additions");
  const pinnedOnly={...configured,conceptSelections:[]};assert.equal(profileInheritanceSelection(grown,pinnedOnly).directPropertyIds.includes(added.id),false,"pinned identities do not absorb additions");
  const renamed={...grown,revision:3,nodes:{...grown.nodes,[selected.id]:{...grown.nodes[selected.id],name:`renamed_${run}`}}},renameImpact=profileInheritanceImpact(grown,renamed,configured);assert.equal(renameImpact.changedPaths.some(({propertyId})=>propertyId===selected.id),true,"stable ids report renamed paths");
  const deleted={...renamed,revision:4,nodes:Object.fromEntries(Object.entries(renamed.nodes).filter(([id])=>id!==selected.id))},deleteImpact=profileInheritanceImpact(renamed,deleted,configured);assert.equal(deleteImpact.removedPropertyIds.includes(selected.id),true,"deleted pins become repairable missing identities");
  const copy=copyProfileInheritanceRecipe(configured,{id:`copy:${run}`,targetId:`event:${run}`});copy.propertySelections.push(added.id);assert.equal(configured.propertySelections.includes(added.id),false,"copied recipes remain independent");
}

console.log("selective profile inheritance property tests passed");
