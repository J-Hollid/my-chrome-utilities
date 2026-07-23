import assert from "node:assert/strict";
import {createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";
import {
  createProjectCollectionEntity as createEntity,
  inspectProjectEntityRemoval,
  projectCollectionDefinitions,
  removeProjectCollectionEntity,
} from "../dist/data-layer-project-entity-lifecycle.js";

let seed=0x1ec7c1e;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0x100000000;};
const kinds=Object.keys(projectCollectionDefinitions);
const createProjectCollectionEntity=(state,kind,name,id,attributes={})=>createEntity(
  state,kind,name,id,kind==="pages"?{eventName:`pageview_${name.trim().replaceAll(" ","_")}`,...attributes}:attributes,
);

for(let example=0;example<120;example+=1){
  const kind=kinds[example%kinds.length],suffix=`${example}-${Math.floor(random()*1_000_000)}`,name=`  Entity ${suffix}  `;
  let sequence=0;
  const id=(prefix)=>`${prefix}:${suffix}:${sequence++}`;
  const initial=createSpecificationProject({name:`Project ${suffix}`,site:`${suffix}.example`,id});
  if(kind==="assignments")initial.project.collections.profiles.push({id:`profile:${suffix}`,name:"Target profile",requirements:[]});
  const untouched=Object.fromEntries(kinds.filter((candidate)=>candidate!==kind).map((candidate)=>[candidate,JSON.stringify(initial.project.collections[candidate])]));
  const created=createProjectCollectionEntity(initial,kind,name,id,kind==="assignments"?{targetKind:"Shared Profile",targetId:`profile:${suffix}`}:{}),entity=created.project.collections[kind][0];

  assert.equal(entity.name,`Entity ${suffix}`,"creation trims the human name");
  assert.equal(created.project.collections[kind].length,1);
  assert.equal(created.history.undo.length,initial.history.undo.length+1,"creation is one undoable transaction");
  for(const [candidate,bytes] of Object.entries(untouched))assert.equal(JSON.stringify(created.project.collections[candidate]),bytes,`creation preserves ${candidate}`);
  if(kind==="flows")assert.deepEqual(entity.steps,[],"top-level Flow creation never invents executable steps");
  if(kind==="pages")assert.equal(entity.eventName,`pageview_Entity_${suffix}`,"Page creation conserves its observed event identity");
  if(["profiles","pageGroups","pages"].includes(kind)){
    assert.equal(entity.canonicalSchema.contributorId,entity.id,`${kind} canonical ownership follows the stable entity identity`);
    assert.equal(entity.canonicalSchema.contributorName,entity.name,`${kind} canonical ownership follows the normalized human name`);
  }

  const review=inspectProjectEntityRemoval(created,kind,entity.id);
  assert.equal(review.blocked,false);
  const removed=removeProjectCollectionEntity(created,kind,entity.id);
  assert.equal(removed.project.collections[kind].length,0);
  assert.deepEqual(undoProjectTransaction(removed).project.collections[kind][0],entity,"Undo restores the complete stable entity");
  assert.throws(()=>createProjectCollectionEntity(created,kind,`entity ${suffix}`,id),/unique/,"names are unique without case sensitivity");
}

const referenced=createSpecificationProject({name:"References",site:"refs.example",id:(kind)=>`${kind}:refs`});
assert.throws(()=>createEntity(referenced,"pages","Page",()=>"page:new"),/Observed event name is required/);
assert.throws(()=>createProjectCollectionEntity(referenced,"pages","Page",()=>"page:new",{pageGroupIds:["missing-group"]}),/unknown project reference/);
assert.throws(()=>createProjectCollectionEntity(referenced,"fixtures","Fixture",()=>"fixture:new",{eventId:"missing-event"}),/does not exist/);
assert.throws(()=>createProjectCollectionEntity(referenced,"fixtures","Fixture",()=>"fixture:new",{mode:"magic"}),/unsupported value/);

console.log("data-layer project entity lifecycle properties passed");
