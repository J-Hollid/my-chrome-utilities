import assert from "node:assert/strict";
import {
  addCanonicalProperty,
  applyCanonicalCommand,
  canonicalConstraints,
  canonicalPropertyPath,
  canonicalSchemaFromJsonSchema,
  canonicalTableRows,
  changeCanonicalPropertyType,
  createCanonicalRepository,
  createCanonicalSchema,
  evaluateCanonicalPredicate,
  migrateLegacyProfile,
  renameCanonicalProperty,
  setCanonicalProperty,
} from "../dist/data-layer-canonical-schema.js";
import {confirmCanonicalMigration,createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";
import {bindCanonicalPropertySearch} from "../dist/data-layer-canonical-schema-ui.js";

let sequence=0;
const id=(kind)=>`${kind}:${++sequence}`;
let document=createCanonicalSchema({id:"schema:sitewide",contributorId:"profile:sitewide",contributorName:"Sitewide"});
assert.equal(document.revision,0);
assert.deepEqual(document.rootIds,[]);

({document}=addCanonicalProperty(document,{baseRevision:0,name:"commerce",type:"object",id}));
const commerce=document.rootIds[0];
({document}=addCanonicalProperty(document,{baseRevision:1,parentId:commerce,name:"transaction",type:"object",id}));
const transaction=Object.values(document.nodes).find(({name})=>name==="transaction").id;
({document}=addCanonicalProperty(document,{baseRevision:2,parentId:transaction,name:"transaction_id",type:"string",id}));
const transactionId=Object.values(document.nodes).find(({name})=>name==="transaction_id").id;
assert.equal(canonicalPropertyPath(document,transactionId),"/commerce/transaction/transaction_id");
({document}=renameCanonicalProperty(document,{baseRevision:3,propertyId:transaction,name:"order"}));
assert.equal(canonicalPropertyPath(document,transactionId),"/commerce/order/transaction_id");
assert.equal(document.nodes[transactionId].id,transactionId);

const predicate={kind:"all",children:[
  {kind:"any",children:[
    {kind:"predicate",propertyId:transactionId,operator:"Equals",value:"A-1"},
    {kind:"predicate",propertyId:commerce,operator:"Exists"},
  ]},
  {kind:"not",children:[{kind:"predicate",propertyId:transactionId,operator:"Equals",value:"denied"}]},
]};
({document}=setCanonicalProperty(document,{baseRevision:4,propertyId:transactionId,patch:{
  presence:{mode:"required-when",condition:predicate},
  allowedValues:[{id:"value:one",value:"A-1"},{id:"value:two",value:"A-2"}],
  rules:[{id:"rule:one",kind:"pattern",pattern:"^A-",severity:"error",message:"Use an order identifier",condition:predicate,reusableRuleId:"rule:identifier"}],
  documentation:{displayText:"Transaction ID",description:"Order identifier",comments:"Owned by commerce",example:{method:"allowed-value",value:"A-1"}},
}}));
const evidence=evaluateCanonicalPredicate(predicate,document,{[transactionId]:"A-1",[commerce]:{}});
assert.equal(evidence.matched,true);
assert.ok(evidence.branches.some(({matched})=>!matched));
assert.equal(canonicalTableRows(document).find(({id})=>id===transactionId).path,"/commerce/order/transaction_id");
assert.deepEqual(canonicalConstraints(document).map(({path,presence})=>({path,presence})),[
  {path:"/commerce",presence:undefined},
  {path:"/commerce/order",presence:undefined},
  {path:"/commerce/order/transaction_id",presence:"required"},
]);

const impact=changeCanonicalPropertyType(document,{baseRevision:5,propertyId:commerce,type:"string"});
assert.equal(impact.status,"confirmation-required");
assert.match(impact.impact,/child definitions and documentation removed/);
assert.equal(document.nodes[commerce].type,"object");
const destructive=changeCanonicalPropertyType(document,{baseRevision:5,propertyId:commerce,type:"string",confirmed:true});
assert.equal(destructive.status,"applied");
assert.equal(destructive.document.nodes[commerce].type,"string");
assert.equal(destructive.document.nodes[transaction],undefined);
assert.equal(destructive.document.nodes[transactionId],undefined);

const duplicated=applyCanonicalCommand(document,{kind:"duplicate",baseRevision:document.revision,propertyId:transaction,id});
assert.equal(duplicated.status,"applied");
const transactionCopy=Object.values(duplicated.document.nodes).find(({name})=>name==="order copy");
assert.ok(transactionCopy);
assert.ok(Object.values(duplicated.document.nodes).some(({name,parentId})=>name==="transaction_id"&&parentId===transactionCopy.id));
const deletedCopy=applyCanonicalCommand(duplicated.document,{kind:"delete",baseRevision:duplicated.document.revision,propertyId:transactionCopy.id});
assert.equal(deletedCopy.status,"applied");
assert.equal(deletedCopy.document.nodes[transactionCopy.id],undefined);
assert.equal(Object.values(deletedCopy.document.nodes).some(({parentId})=>parentId===transactionCopy.id),false);

const repository=createCanonicalRepository(document);
const observed=[];
repository.subscribe((next)=>observed.push(next.revision));
const builder=repository.dispatch({kind:"add",baseRevision:5,name:"article_author",type:"string",id});
assert.equal(builder.status,"applied");
const stale=repository.dispatch({kind:"add",baseRevision:5,name:"article_category",type:"string",id});
assert.equal(stale.status,"rebased");
assert.equal(repository.current().revision,7);
assert.deepEqual(Object.values(repository.current().nodes).filter(({name})=>name.startsWith("article_")).map(({name})=>name),["article_author","article_category"]);
assert.equal(repository.dispatch({kind:"rename",baseRevision:7,propertyId:transactionId,name:"identifier"}).status,"applied");
const conflict=repository.dispatch({kind:"rename",baseRevision:7,propertyId:transactionId,name:"reference"});
assert.equal(conflict.status,"conflict");
assert.equal(conflict.propertyId,transactionId);
assert.deepEqual(observed,[6,7,8]);

const legacyState=createSpecificationProject({name:"Legacy",site:"shop.example",id});
legacyState.project.collections.profiles.push({
  id:"profile:legacy",name:"Legacy",requirements:[{path:"/article_name",type:"string",required:true,description:"Article"}],
  structuredDraft:{document:{type:"object",properties:{article_name:{type:"string",description:"Article"},article_type:{type:"string",enum:["News","Guide"]}}}},
  schemaConstraints:[{path:"/article_name",type:"number"},{path:"/article_type",patterns:["^[A-Z]"]}],
});
const before=JSON.stringify(legacyState.project);
const plan=migrateLegacyProfile(legacyState.project.collections.profiles[0],{id});
assert.deepEqual(plan.document.nodes[plan.byPath["/article_name"]].provenance.map(({source})=>source),["requirements","structured-draft","path-constraint"]);
assert.ok(plan.conflicts.some(({path})=>path==="/article_name"));
assert.throws(()=>confirmCanonicalMigration(legacyState,plan),/Resolve 1 canonical migration conflict/);
plan.document.nodes[plan.byPath["/article_name"]].type="string";
plan.conflicts.length=0;
const migrated=confirmCanonicalMigration(legacyState,plan);
const profile=migrated.project.collections.profiles[0];
assert.ok(profile.canonicalSchema);
assert.equal("structuredDraft" in profile,false);
assert.equal("schemaConstraints" in profile,false);
assert.deepEqual(profile.requirements,[]);
assert.equal(JSON.stringify(undoProjectTransaction(migrated).project),before);

const command=applyCanonicalCommand(document,{kind:"rename",baseRevision:document.revision,propertyId:transactionId,name:"reference"});
assert.equal(command.status,"applied");
assert.equal(command.document.nodes[transactionId].name,"reference");

const adopted=canonicalSchemaFromJsonSchema({
  id:"canonical:opened-article",
  contributorId:"profile:opened-article",
  contributorName:"Opened Article",
  sourceIdentity:"schema:opened-article",
  sourceRevision:4,
  document:{type:"object",properties:{article_type:{type:"string"},metadata:{type:"object",properties:{article_name:{type:"string"}}}}},
  idFactory:id,
});
assert.equal(adopted.selectedPropertyId,adopted.rootIds[0],"an adopted workspace starts on its first root property");
assert.equal(adopted.nodes[adopted.selectedPropertyId].name,"article_type");
assert.ok(Object.values(adopted.nodes).every(({provenance})=>provenance.every(({source,sourceId,revision})=>source==="saved-schema"&&sourceId==="schema:opened-article"&&revision===4)));

class SearchControl extends EventTarget{
  value="";selectionStart=0;selectionEnd=0;isConnected=true;
  type(text){this.value=this.value.slice(0,this.selectionStart)+text+this.value.slice(this.selectionEnd);this.selectionStart=this.selectionEnd=this.value.length;this.dispatchEvent(new Event("input"));}
}
const search=new SearchControl(),searchObservations=[];
bindCanonicalPropertySearch(search,(query)=>searchObservations.push({query,control:search,start:search.selectionStart,end:search.selectionEnd}));
for(const character of "article_n")search.type(character);
assert.deepEqual(searchObservations.map(({query})=>query),["a","ar","art","arti","artic","articl","article","article_","article_n"]);
assert.ok(searchObservations.every(({control,start,end},index)=>control===search&&control.isConnected&&start===index+1&&end===index+1));
search.selectionStart=7;search.selectionEnd=12;search.type("_name");
assert.equal(search.value,"article_name");
search.value="article_type";search.selectionStart=search.selectionEnd=12;search.dispatchEvent(new Event("compositionstart"));search.dispatchEvent(new Event("compositionupdate"));search.dispatchEvent(new Event("input"));search.dispatchEvent(new Event("compositionend"));
assert.equal(searchObservations.at(-1).query,"article_type");
search.value="";search.selectionStart=search.selectionEnd=0;search.dispatchEvent(new Event("input"));
assert.equal(searchObservations.at(-1).query,"");
assert.equal(search.isConnected,true);

console.log("data-layer canonical schema authoring tests passed");
