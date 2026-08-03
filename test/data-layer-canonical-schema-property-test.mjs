import assert from "node:assert/strict";
import {
  addCanonicalProperty,
  applyCanonicalCommand,
  canonicalPropertyPath,
  canonicalSchemaWithConstraint,
  canonicalTableRows,
  createCanonicalRepository,
  createCanonicalSchema,
  migrateLegacyProfile,
  renameCanonicalProperty,
  resolveCanonicalMigrationConflict,
} from "../dist/data-layer-canonical-schema.js";
import {repairCanonicalBooleanAllowedValues} from "../dist/data-layer-canonical-schema-facets.js";
import {addProjectEntity,createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {commitStagedBulkRequirements,stageBulkRequirements} from "../dist/data-layer-specification-bulk.js";

let seed=0x5eed1234;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/0x100000000);
const word=(prefix)=>`${prefix}_${Math.floor(random()*1_000_000)}`;

for(let example=0;example<200;example+=1){
  let sequence=0;
  const id=(kind)=>`${kind}:${example}:${++sequence}`;
  let document=createCanonicalSchema({id:`schema:${example}`,contributorId:`profile:${example}`,contributorName:`Profile ${example}`});
  const rootName=word("root"),childName=word("child"),renamedRoot=word("renamed");
  ({document}=addCanonicalProperty(document,{baseRevision:document.revision,name:rootName,type:"object",id}));
  const rootId=document.selectedPropertyId;
  ({document}=addCanonicalProperty(document,{baseRevision:document.revision,parentId:rootId,name:childName,type:"string",id}));
  const childId=document.selectedPropertyId,beforeRevision=document.revision;
  ({document}=renameCanonicalProperty(document,{baseRevision:document.revision,propertyId:rootId,name:renamedRoot}));

  assert.equal(document.nodes[childId].id,childId,"ancestor rename preserves descendant identity");
  assert.equal(canonicalPropertyPath(document,childId),`/${renamedRoot}/${childName}`);
  assert.equal(document.revision,beforeRevision,"Draft commands preserve the publication-only Schema revision");
  assert.deepEqual(new Set(canonicalTableRows(document).map(({id})=>id)).size,Object.keys(document.nodes).length);

  const repository=createCanonicalRepository(document),baseRevision=document.revision;
  const firstName=word("first"),secondName=word("second");
  assert.equal(repository.dispatch({kind:"add",baseRevision,name:firstName,type:"string",id}).status,"applied");
  assert.equal(repository.dispatch({kind:"add",baseRevision,name:secondName,type:"string",id}).status,"applied");
  const current=repository.current(),names=Object.values(current.nodes).map(({name})=>name);
  assert.equal(names.filter((name)=>name===firstName).length,1);
  assert.equal(names.filter((name)=>name===secondName).length,1);
  assert.equal(current.revision,baseRevision);
  assert.equal(Object.hasOwn(current,"changes"),false);
}

for(let example=0;example<200;example+=1){
  const values=example%2===0?["true","false"]:["false","true"],node={
    id:`property:boolean-repair:${example}`,name:`enabled_${example}`,order:example,type:"string",presence:{mode:"optional"},
    allowedValues:values.map((value,index)=>({id:`allowed:${example}:${index}`,value,provenance:[{source:"created",label:`Source ${example}:${index}`}]})),
    rules:[],documentation:{displayText:`Enabled ${example}`,description:`Description ${example}`,comments:`Comment ${example}`,example:{method:"blank"}},
    provenance:[{source:"created"}],overrideReferences:[],
  },before=structuredClone(node),repair=repairCanonicalBooleanAllowedValues(node,"boolean"),repeat=repairCanonicalBooleanAllowedValues({...node,type:"boolean",allowedValues:repair.allowedValues},"boolean");
  assert.deepEqual(node,before,"Boolean repair planning must not mutate the source property");
  assert.deepEqual(repair.allowedValues.map(({id,value,provenance})=>({id,value,provenance})),before.allowedValues.map(({id,value,provenance})=>({id,value:value==="true",provenance})),"Boolean repair preserves allowed-value identity and metadata across generated orderings");
  assert.equal(repair.repairCount,2);
  assert.equal(repeat.repairCount,0,"Boolean repair is idempotent");
  assert.equal(repeat.allowedValues,repair.allowedValues,"an idempotent repair preserves the stable allowed-value collection");

  const document={...createCanonicalSchema({id:`schema:boolean-repair:${example}`,contributorId:`profile:boolean-repair:${example}`,contributorName:`Boolean repair ${example}`}),rootIds:[node.id],nodes:{[node.id]:node}},result=applyCanonicalCommand(document,{kind:"type",baseRevision:0,propertyId:node.id,type:"boolean"});
  assert.equal(result.status,"applied");
  assert.equal(result.document.revision,0,"Boolean repair leaves the publication-only Schema revision unchanged");
  assert.deepEqual(result.document.nodes[node.id].allowedValues,repair.allowedValues);

  const invalid={...node,allowedValues:[...node.allowedValues,{id:`allowed:${example}:invalid`,value:`other_${example}`}]},invalidBytes=JSON.stringify(invalid),invalidDocument={...document,nodes:{[node.id]:invalid}},blocked=applyCanonicalCommand(invalidDocument,{kind:"type",baseRevision:0,propertyId:node.id,type:"boolean"});
  assert.equal(blocked.status,"conflict");
  assert.match(blocked.message,new RegExp(`other_${example} is not a Boolean`));
  assert.equal(JSON.stringify(invalid),invalidBytes,"a blocked generated repair conserves the source property bytes");
  assert.equal(blocked.document,invalidDocument,"a blocked generated repair returns the unchanged document");
}

for(let example=0;example<100;example+=1){
  let sequence=0;
  const id=(kind)=>`${kind}:migration:${example}:${++sequence}`;
  const name=word("legacy"),path=`/${name}`,requiredValue=word("required");
  const legacy={
    id:`event:migration:${example}`,name:`Legacy ${example}`,
    requirements:[{path,type:"string",required:true,allowedValues:[requiredValue],description:`Requirement ${example}`,examples:[requiredValue],rules:[{id:`rule:requirement:${example}`,kind:"pattern",pattern:"^R",severity:"error",message:"Requirement rule"}]}],
    structuredDraft:{document:{type:"object",properties:{[name]:{type:"number",presence:"optional",enum:[example],description:`Draft ${example}`,examples:[example],minimum:example,maximum:example+10}}}},
    schemaConstraints:[{path,type:"string",patterns:["^C"],documentation:`Requirement ${example}`,examples:[requiredValue]}],
  };
  const legacySnapshot=structuredClone(legacy),plan=migrateLegacyProfile(legacy,{id}),planSnapshot=structuredClone(plan);
  const repeat=migrateLegacyProfile(legacy,{id:(kind)=>`${kind}:repeat:${example}`});
  assert.deepEqual(legacy,legacySnapshot,"migration planning must not mutate legacy contributors");
  assert.equal(plan.byPath[path],`property:${legacy.id}:${encodeURIComponent(path)}`);
  assert.equal(repeat.byPath[path],plan.byPath[path],"migrated property identity must be stable across reviews");
  assert.deepEqual(repeat.conflicts.map(({id})=>id),plan.conflicts.map(({id})=>id),"migration conflict identity must be stable across reviews");
  assert.deepEqual(new Set(plan.conflicts.map(({facet})=>facet)),new Set(["type","presence","allowed values","description","example"]));

  let resolved=plan;
  for(const conflict of [...plan.conflicts])resolved=resolveCanonicalMigrationConflict(resolved,conflict.id,conflict.choices[0].id);
  const node=resolved.document.nodes[resolved.byPath[path]];
  assert.deepEqual(plan,planSnapshot,"resolving migration conflicts must not mutate the prior review plan");
  assert.equal(resolved.conflicts.length,0);
  assert.equal(node.type,"string");
  assert.equal(node.presence.mode,"required");
  assert.deepEqual(node.allowedValues.map(({value})=>value),[requiredValue]);
  assert.equal(node.documentation.description,`Requirement ${example}`);
  assert.equal(node.documentation.example.value,requiredValue);
  assert.ok(node.rules.some(({id})=>id===`rule:requirement:${example}`));
  assert.ok(node.rules.some(({kind,pattern})=>kind==="pattern"&&pattern==="^C"));
  assert.ok(node.rules.some(({kind,minimum,maximum})=>kind==="range"&&minimum===example&&maximum===example+10));
  assert.ok(node.rules.filter(({id})=>id!==`rule:requirement:${example}`).every(({id})=>id.startsWith("json-facet:")),"schema facets must remain distinguishable from attached rules during round-trip");
}

for(let example=0;example<100;example+=1){
  let sequence=0;const id=(kind)=>`${kind}:bulk-transition:${example}:${++sequence}`;let state=createSpecificationProject({name:`Bulk transition ${example}`,site:`bulk-${example}.example`,id});state=addProjectEntity(state,"profiles",{name:`Profile ${example}`,requirements:[]},id);const profileId=state.project.collections.profiles[0].id,isObject=example%2===0,initialRows=isObject?[{path:"/container",type:"object"},{path:`/container/child_${example}`,type:"string"}]:[{path:"/container",type:"array",itemType:"string"}],initial=commitStagedBulkRequirements(state,profileId,stageBulkRequirements("json",JSON.stringify(initialRows))),canonical=initial.project.collections.profiles[0].canonicalSchema,nextConstraint=isObject?{path:"/container",type:["string","number","boolean"][example%3]}:{path:"/container",type:"array",itemType:["number","boolean","object"][example%3]},snapshot=structuredClone(initial);
  assert.throws(()=>canonicalSchemaWithConstraint(canonical,nextConstraint,id),/Cannot update canonical property \/container/,"the sequential command must reject generated destructive transitions");
  assert.throws(()=>commitStagedBulkRequirements(initial,profileId,stageBulkRequirements("json",JSON.stringify([nextConstraint]))),/Cannot update canonical property \/container/,"the bounded batch must match sequential transition safety for generated object and array shapes");
  assert.deepEqual(initial,snapshot,"rejected generated bulk transitions must conserve the input project");
}

console.log("data-layer canonical schema property tests passed");
