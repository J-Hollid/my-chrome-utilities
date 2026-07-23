import assert from "node:assert/strict";
import {adoptSavedSchema,commitSavedSchemaSynchronization,createSpecificationProject,stageSavedSchemaSynchronization,transactProject} from "../dist/data-layer-specification-project.js";
import {canonicalSchemaWithConstraint,canonicalTableRows} from "../dist/data-layer-canonical-schema.js";

let sequence=0;
const id=(kind)=>`${kind}:${++sequence}`,source={id:"schema:sitewide",name:"Sitewide",version:4,published:true,document:{type:"object",properties:{checkout:{type:"object",properties:{funnel_step:{type:"string",enum:["3a","3b"]}}}}},rules:[{name:"checkout"}],documentation:"Site contract",examples:[{checkout:{funnel_step:"3b"}}],assignments:[]},libraryBytes=JSON.stringify(source);
const state=adoptSavedSchema(createSpecificationProject({name:"Shop",site:"shop.example",id}),source),profile=state.project.collections.profiles[0];
assert.equal(profile.name,"Sitewide");
assert.equal(profile.sourceIdentity,source.id);
assert.equal(profile.sourceRevision,4);
assert.deepEqual(profile.adoptionProvenance,{kind:"saved-schema-library",schemaId:source.id,revision:4});
assert.equal(profile.canonicalSchema.source.identity,source.id);
assert.equal(profile.canonicalSchema.source.revision,4);
assert.deepEqual(Object.values(profile.canonicalSchema.nodes).map(({name,type})=>({name,type})),[
  {name:"checkout",type:"object"},{name:"funnel_step",type:"string"},
]);
assert.deepEqual(Object.values(profile.canonicalSchema.nodes).find(({name})=>name==="funnel_step").allowedValues.map(({value})=>value),["3a","3b"]);
const {definitionsByNodeId,...sourceContent}=profile.canonicalSchema.sourceContent;
assert.deepEqual(sourceContent,{document:source.document,rules:source.rules,documentation:source.documentation,examples:source.examples});
assert.equal(Object.keys(definitionsByNodeId).length,2,"adoption retains source definitions by stable canonical identity");
assert.equal("structuredSchema" in profile,false);
assert.equal("structuredDraft" in profile,false);
assert.equal("schemaConstraints" in profile,false);
assert.deepEqual(profile.requirements,[]);
assert.equal(JSON.stringify(source),libraryBytes,"adoption must not change Saved Schema Library bytes");
assert.equal(state.project.collections.profiles.length,1);
assert.equal("schemaDrafts" in state.project.collections,false,"adoption must not create a competing editable draft collection");

const openedArticle={
  id:"schema:opened-article",name:"Opened Article",version:4,published:true,assignments:[],
  document:{type:"object",properties:{article_type:{type:"string"},audience:{type:"string"}}},
  documentation:{properties:{
    "/article_type":{displayName:"Article type",description:"Editorial classification",comments:"CMS taxonomy"},
    "/audience":{displayName:"Audience",description:"Intended readers",comments:"Access policy"},
  }},
  rules:[
    {id:"rule:required-article-type",name:"Required article type",version:3,propertyPath:"/article_type",operator:"exact-value",parameters:"News",severity:"warning",message:"Use the required article type"},
    {id:"rule:supported-audiences",name:"Supported audiences",version:5,propertyPath:"/audience",operator:"allowed-values",allowedValues:["Public","Subscriber"],severity:"warning",message:"Choose a supported audience"},
  ],
};
const openedArticleBytes=JSON.stringify(openedArticle),adoptedOpenedArticle=adoptSavedSchema(createSpecificationProject({name:"Shop",site:"shop.example",id}),openedArticle),adoptedProfile=adoptedOpenedArticle.project.collections.profiles[0],rows=canonicalTableRows(adoptedProfile.canonicalSchema),articleType=rows.find(({path})=>path==="/article_type").node,audience=rows.find(({path})=>path==="/audience").node;
assert.deepEqual(articleType.documentation,{displayText:"Article type",description:"Editorial classification",comments:"CMS taxonomy",example:{method:"blank"}});
assert.equal(articleType.expectedValue,"News","an unconditional exact-value rule supplies the canonical Expected value");
assert.deepEqual(audience.documentation,{displayText:"Audience",description:"Intended readers",comments:"Access policy",example:{method:"blank"}});
assert.deepEqual(audience.allowedValues.map(({value})=>value),["Public","Subscriber"],"an unconditional allowed-values rule supplies typed canonical values");
assert.deepEqual(articleType.rules.find(({id})=>id==="rule:required-article-type"),{
  id:"rule:required-article-type",kind:"custom",severity:"warning",message:"Use the required article type",name:"Required article type",revision:3,operator:"exact-value",provenance:{source:"saved-schema",sourceId:openedArticle.id,revision:openedArticle.version},
});
assert.equal(audience.rules.find(({id})=>id==="rule:supported-audiences").revision,5);
assert.deepEqual(structuredClone(adoptedProfile.canonicalSchema).nodes,adoptedProfile.canonicalSchema.nodes,"persisted canonical facets survive a project reload without repair");
assert.equal(JSON.stringify(openedArticle),openedArticleBytes,"lossless adoption must leave the Saved Schema Library source byte-identical");

let synchronized=adoptSavedSchema(createSpecificationProject({name:"Sync",site:"shop.example",id}),{
  id:"schema:purchase",name:"Purchase",version:3,published:true,assignments:[],
  document:{type:"object",properties:{currency:{type:"string",enum:["EUR"]},order_id:{type:"string"}}},
});
const synchronizedProfile=synchronized.project.collections.profiles[0],locallyEdited=canonicalSchemaWithConstraint(
  synchronizedProfile.canonicalSchema,
  {path:"/currency",type:"string",allowedValues:["EUR","GBP"]},
  (kind)=>`local:${kind}:${++sequence}`,
);
synchronized=transactProject(synchronized,"Keep GBP locally",(project)=>({...project,collections:{...project.collections,profiles:project.collections.profiles.map((candidate)=>candidate.id===synchronizedProfile.id?{...candidate,canonicalSchema:locallyEdited}:candidate)}}));
const revision4={id:"schema:purchase",name:"Purchase",version:4,published:true,assignments:[],document:{type:"object",properties:{currency:{type:"string",enum:["EUR","USD"]},order_id:{type:"string"},value:{type:"number"}}}};
const synchronizationReview=stageSavedSchemaSynchronization(synchronized,revision4);
assert.equal(synchronizationReview.fromRevision,3);
assert.equal(synchronizationReview.toRevision,4);
assert.ok(synchronizationReview.localOverrides.some((path)=>path.startsWith("/properties/currency")));
synchronized=commitSavedSchemaSynchronization(synchronized,synchronizationReview);
const synchronizedResult=synchronized.project.collections.profiles[0],synchronizedRows=canonicalTableRows(synchronizedResult.canonicalSchema);
assert.equal(synchronizedResult.sourceRevision,4);
assert.equal(synchronizedResult.canonicalSchema.source.revision,4);
assert.deepEqual(synchronizedRows.find(({path})=>path==="/currency").node.allowedValues.map(({value})=>value),["EUR","GBP"],"local canonical facets survive source synchronization");
assert.equal(synchronizedRows.find(({path})=>path==="/value").node.type,"number","new source properties enter the active canonical contributor");
assert.deepEqual(synchronizedResult.canonicalSchema.sourceContent.document,revision4.document,"source content advances to the immutable revision");
assert.equal("workingDraft" in synchronizedResult,false);
assert.equal("sourceLineage" in synchronizedResult,false);
console.log("data-layer layered schema adoption tests passed");
