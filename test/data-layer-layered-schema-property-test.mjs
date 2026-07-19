import assert from "node:assert/strict";
import {compileLayeredSchema,resolveLayeredTarget} from "../dist/data-layer-layered-schema.js";

let seed=0x51a7e;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/0x100000000;};
const pickSubset=(values)=>values.filter(()=>random()>=0.5);

for(let iteration=0;iteration<200;iteration+=1){
  const universe=Array.from({length:2+Math.floor(random()*7)},(_,index)=>`value-${iteration}-${index}`),selected=pickSubset(universe),narrowed=selected.length?selected:[universe[0]];
  const contributors=[
    {id:`base:${iteration}`,name:"Base",scope:"Shared Profile",constraints:[{path:"/choice",type:"string",allowedValues:universe}]},
    {id:`specific:${iteration}`,name:"Specific",scope:"Event",constraints:[{path:"/choice",allowedValues:narrowed}]},
    {id:`excluded:${iteration}`,name:"Excluded",scope:"Page",constraints:[{path:"/excluded",type:"number",target:"other-event"}]},
  ],context={eventId:"selected-event",eventRole:"interaction"},first=compileLayeredSchema(contributors,context),roundTrip=compileLayeredSchema(JSON.parse(JSON.stringify(contributors)),context);
  assert.equal(first.status,"ready");
  assert.deepEqual(first.properties["/choice"].allowedValues,narrowed,"a valid specific subset is conserved exactly");
  assert.equal("/excluded" in first.properties,false,"a non-targeted contribution never leaks into the effective schema");
  assert.deepEqual(roundTrip,first,"JSON persistence preserves deterministic compilation");

  const priority=1+Math.floor(random()*50),compiled=first,automatic={id:`auto:${iteration}`,name:"Automatic",activation:"automatic",priority,applicability:[],compiled},lower={...automatic,id:`lower:${iteration}`,name:"Lower",priority:priority-1},documentation={...automatic,id:`docs:${iteration}`,name:"Docs",activation:"documentation-only",priority:priority+100},resolution=resolveLayeredTarget([lower,documentation,automatic],{});
  assert.equal(resolution.winner?.id,automatic.id,"the unique highest automatic priority wins");
  assert.equal(resolution.candidates.some(({id})=>id===documentation.id),false,"documentation-only targets never enter automatic candidates");
}

console.log("data-layer layered schema property tests passed");
