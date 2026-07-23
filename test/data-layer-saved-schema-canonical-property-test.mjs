import assert from "node:assert/strict";
import {canonicalConstraints,canonicalPropertyPath} from "../dist/data-layer-canonical-schema.js";
import {compileLayeredSchema,validateLayeredObservation} from "../dist/data-layer-layered-schema.js";
import {savedSchemaCanonicalDocument} from "../dist/data-layer-saved-schema-canonical.js";
import {adoptSavedSchema,createSpecificationProject} from "../dist/data-layer-specification-project.js";

let seed=0x5a9ed123;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/0x100000000;};
const cases=[
  {type:"string",values:["News","Guide"]},
  {type:"number",values:[1.5,42]},
  {type:"integer",values:[1,42]},
  {type:"boolean",values:[true,false]},
];

for(let sample=0;sample<128;sample+=1){
  const selected=cases[Math.floor(random()*cases.length)],schema={
    id:`schema:property-${sample}`,name:`Property ${sample}`,version:1+Math.floor(random()*20),
    document:{type:"object",properties:{exact:{type:selected.type},allowed:{type:selected.type},conditional:{type:selected.type},required_action:{type:"string"},disabled_action:{type:"string"},unresolved_action:{type:"string"},partially_resolved_action:{type:"string"}}},
    attachedRules:[
      {id:`rule:exact-${sample}`,name:"Exact source",version:3,enabled:true,propertyPath:"/exact",operator:"exact-value",parameters:String(selected.values[0]),severity:"warning",message:"Exact message"},
      {id:`rule:allowed-${sample}`,name:"Allowed source",version:5,enabled:true,propertyPath:"/allowed",operator:"allowed-values",parameters:selected.values.map(String).join(","),severity:"error"},
      {id:`rule:conditional-${sample}`,name:"Conditional source",version:7,propertyPath:"/conditional",operator:"exact-value",parameters:String(selected.values[0]),conditionGroup:{operator:"All",predicates:[{propertyPath:"/allowed",operator:"Exists"}]},severity:"warning",message:"Conditional message"},
      {id:`rule:required-${sample}`,name:"Required action",version:1,enabled:true,propertyPath:"/required_action",operator:"required",conditionGroup:{operator:"All",predicates:[{propertyPath:"/exact",operator:"Equals",comparison:{type:selected.type,value:selected.values[0]}}]},severity:"error"},
      {id:`rule:disabled-${sample}`,name:"Disabled action",version:1,enabled:false,propertyPath:"/disabled_action",operator:"required",conditionGroup:{operator:"All",predicates:[{propertyPath:"/exact",operator:"Equals",comparison:{type:selected.type,value:selected.values[0]}}]},severity:"error"},
      {id:`rule:unresolved-${sample}`,name:"Unresolved action",version:1,enabled:true,propertyPath:"/unresolved_action",operator:"required",conditionGroup:{operator:"All",predicates:[{propertyPath:"/missing",operator:"Exists"}]},severity:"error"},
      {id:`rule:partial-${sample}`,name:"Partially resolved action",version:1,enabled:true,propertyPath:"/partially_resolved_action",operator:"required",conditionGroup:{operator:"All",predicates:[{propertyPath:"/exact",operator:"Equals",comparison:{type:selected.type,value:selected.values[0]}},{propertyPath:"/missing",operator:"Exists"}]},severity:"error"},
    ],
    documentation:{properties:{"/exact":{displayName:"Exact",description:"Exact description",comments:"Exact comments"}}},
  },before=JSON.stringify(schema);let sequence=0;
  const canonical=savedSchemaCanonicalDocument(schema,(kind)=>`${kind}:${sample}:${++sequence}`),byPath=Object.fromEntries(Object.values(canonical.nodes).map((node)=>[canonicalPropertyPath(canonical,node.id),node]));
  assert.equal(byPath["/exact"].expectedValue,selected.values[0],`sample ${sample} must preserve the exact value's type`);
  assert.deepEqual(byPath["/allowed"].allowedValues.map(({value})=>value),selected.values,`sample ${sample} must preserve allowed value types and order`);
  assert.equal(byPath["/conditional"].expectedValue,undefined,`sample ${sample} must not project a conditional exact value as unconditional`);
  assert.equal(byPath["/required_action"].presence.mode,"required-when",`sample ${sample} must map conditional required presence`);
  assert.deepEqual(byPath["/required_action"].presence.condition,{kind:"all",children:[{kind:"predicate",propertyId:byPath["/exact"].id,operator:"Equals",value:selected.values[0]}]});
  assert.equal(byPath["/disabled_action"].presence.mode,"optional",`sample ${sample} must not project disabled required rules`);
  assert.equal(byPath["/unresolved_action"].presence.mode,"optional",`sample ${sample} must not broaden an unresolved condition to unconditional required presence`);
  assert.equal(byPath["/partially_resolved_action"].presence.mode,"optional",`sample ${sample} must not project a partially resolved All condition`);
  assert.equal("condition" in byPath["/partially_resolved_action"].rules[0],false,`sample ${sample} must not retain a weakened partial condition`);
  assert.deepEqual(byPath["/exact"].documentation,{displayText:"Exact",description:"Exact description",comments:"Exact comments",example:{method:"blank"}});
  assert.deepEqual(byPath["/exact"].rules[0].provenance,{source:"saved-schema",sourceId:schema.id,revision:schema.version});
  assert.equal(byPath["/exact"].rules[0].enabled,true);
  assert.equal(byPath["/allowed"].rules[0].severity,"error");
  assert.equal("message" in byPath["/allowed"].rules[0],false,"an absent optional issue message must remain absent");
  const requiredRule=byPath["/required_action"].rules[0],requiredMetadata=(({id,name,revision,enabled,operator,severity,message,provenance})=>({id,name,revision,enabled,operator,severity,message,provenance}))(requiredRule);
  assert.deepEqual(requiredMetadata,{id:`rule:required-${sample}`,name:"Required action",revision:1,enabled:true,operator:"required",severity:"error",message:undefined,provenance:{source:"saved-schema",sourceId:schema.id,revision:schema.version}});
  const compiled=compileLayeredSchema([{id:schema.id,name:schema.name,scope:"Shared Profile",constraints:canonicalConstraints(canonical)}],{eventId:"event:test",eventRole:"interaction"}),invalid=validateLayeredObservation({targetId:canonical.id,targetName:schema.name,revision:canonical.revision,compiled},{exact:selected.values[0]}),valid=validateLayeredObservation({targetId:canonical.id,targetName:schema.name,revision:canonical.revision,compiled},{exact:selected.values[0],required_action:"handled"}),notApplicable=validateLayeredObservation({targetId:canonical.id,targetName:schema.name,revision:canonical.revision,compiled},{exact:selected.values[1]});
  assert.ok(invalid.issues.some(({path,code})=>path==="/required_action"&&code==="REQUIRED"));
  assert.equal(valid.issues.some(({path})=>path==="/required_action"),false);
  assert.equal(notApplicable.issues.some(({path})=>path==="/required_action"),false);
  assert.equal(JSON.stringify(schema),before,`sample ${sample} must leave the immutable source unchanged`);

  let projectSequence=0;
  const projectId=(kind)=>`${kind}:conservation:${sample}:${++projectSequence}`;
  const initial=createSpecificationProject({name:`Conservation ${sample}`,site:`site-${sample}.example`,id:projectId});
  const collidingId=`profile:${schema.id}`,occupiedProfiles=Array.from({length:1+(sample%4)},(_,collisionIndex)=>{
    const id=collisionIndex===0?collidingId:`${collidingId}:saved-schema-contributor${collisionIndex===1?"":`-${collisionIndex}`}`;
    return{id,name:`Unrelated Profile ${sample}.${collisionIndex}`,requirements:[{path:`/unrelated_${sample}_${collisionIndex}`,type:"boolean",required:true}]};
  }),referencingAssignments=occupiedProfiles.map((profile,collisionIndex)=>({
    id:`assignment:unrelated-${sample}-${collisionIndex}`,
    name:`Unrelated assignment ${sample}.${collisionIndex}`,
    targetId:profile.id,
    targetKind:"Shared Profile",
    eventName:`unrelated_${sample}_${collisionIndex}`,
    sourceId:`source:unrelated-${sample}-${collisionIndex}`,
    target:"payload",
    priority:(sample+collisionIndex)%7,
  })),collisionState={
    ...initial,
    project:{...initial.project,collections:{
      ...initial.project.collections,
      profiles:occupiedProfiles,
      assignments:referencingAssignments,
    }},
  },beforeCollections=structuredClone(collisionState.project.collections),adoptedState=adoptSavedSchema(collisionState,{...schema,published:true}),repeatAdoption=adoptSavedSchema(collisionState,{...schema,published:true}),adoptedProfile=adoptedState.project.collections.profiles.find(({sourceIdentity})=>sourceIdentity===schema.id);
  assert.deepEqual(adoptedState.project.collections.profiles.slice(0,occupiedProfiles.length),beforeCollections.profiles,`sample ${sample} must conserve every unrelated Profile`);
  assert.deepEqual({...adoptedState.project.collections,profiles:beforeCollections.profiles},{...beforeCollections,profiles:beforeCollections.profiles},`sample ${sample} must conserve every pre-existing collection reference`);
  assert.ok(adoptedProfile,`sample ${sample} must make the adopted contributor independently addressable`);
  assert.equal(occupiedProfiles.some(({id})=>id===adoptedProfile.id),false,`sample ${sample} must allocate a distinct Profile identity`);
  assert.equal(repeatAdoption.project.collections.profiles.find(({sourceIdentity})=>sourceIdentity===schema.id).id,adoptedProfile.id,`sample ${sample} must allocate collision identities deterministically`);
  assert.equal(adoptedProfile.sourceIdentity,schema.id);
  assert.equal(adoptedProfile.sourceRevision,schema.version);
  assert.equal(adoptedProfile.canonicalSchema.contributorId,adoptedProfile.id,`sample ${sample} must bind canonical content to the adopted contributor`);
  assert.deepEqual(adoptedState.project.collections.assignments.map(({targetId})=>targetId),occupiedProfiles.map(({id})=>id),`sample ${sample} must not redirect unrelated assignments`);
}

console.log("saved-schema canonical property tests passed");
