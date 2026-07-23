import assert from "node:assert/strict";
import {adoptSavedSchema,createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {canonicalTableRows} from "../dist/data-layer-canonical-schema.js";

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
console.log("data-layer layered schema adoption tests passed");
