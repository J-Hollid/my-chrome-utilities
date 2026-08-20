import assert from "node:assert/strict";

import {canonicalMoveDestinations} from "../dist/canonical-schema-focused/structure.js";

const nodes={
  alpha:{id:"alpha",name:"Alpha",order:0,type:"object",structureOwned:true,presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}},provenance:[],overrideReferences:[]},
  bravo:{id:"bravo",name:"Bravo",order:1,type:"object",structureOwned:true,presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}},provenance:[],overrideReferences:[]},
  bravoChild:{id:"bravoChild",name:"Bravo child",parentId:"bravo",order:0,type:"string",structureOwned:true,presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}},provenance:[],overrideReferences:[]},
  charlie:{id:"charlie",name:"Charlie",order:2,type:"object",structureOwned:true,presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}},provenance:[],overrideReferences:[]},
  charlieChild:{id:"charlieChild",name:"Charlie child",parentId:"charlie",order:0,type:"string",structureOwned:true,presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}},provenance:[],overrideReferences:[]},
  inherited:{id:"inherited",name:"Inherited",order:3,type:"object",inheritedDefinition:{type:"object"},structureOwned:false,presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}},provenance:[],overrideReferences:[]},
  inheritedChild:{id:"inheritedChild",name:"Inherited child",parentId:"inherited",order:0,type:"string",presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}},provenance:[],overrideReferences:[]},
};
const document={id:"canonical:test",revision:1,nodes,rootIds:["alpha","bravo","charlie","inherited"],changes:[],selectedPropertyId:"bravo"};
const destinations=canonicalMoveDestinations(document,nodes.bravo);
assert.ok(destinations.some(({parentId,itemId})=>parentId==="charlie"&&itemId==="charlieChild"));
assert.ok(!destinations.some(({parentId,itemId})=>parentId==="bravo"||itemId==="bravoChild"),
  "the moving node and descendants are excluded");
assert.ok(!destinations.some(({parentId})=>parentId==="inherited"),
  "inherited-only parents are not legal destinations");

console.log("canonical schema hierarchy reorder tests passed");
