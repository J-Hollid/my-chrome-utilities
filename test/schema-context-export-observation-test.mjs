import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";
import {createCanonicalSchema,applyCanonicalCommand} from "../dist/data-layer-canonical-schema.js";
import {createContextExportSnapshot} from "../dist/schema-context-export/snapshot.js";
import {ContextExportSession} from "../dist/schema-context-export/session.js";
import {exportJsonSchemaResource,exportJsonSchemaBundle} from "../dist/data-layer-json-schema-export.js";

let canonical=createCanonicalSchema({id:"export",contributorId:"profile",contributorName:"Sitewide"});
const add=(name,type,parentId)=>{const result=applyCanonicalCommand(canonical,{kind:"add",baseRevision:canonical.revision,name,type,parentId,id:()=>crypto.randomUUID()});assert.equal(result.status,"applied");canonical=result.document;return Object.values(canonical.nodes).find(node=>node.name===name).id;};
const kind=add("kind","string"),currency=add("currency","string"),amount=add("amount","number"),products=add("products","array");
canonical.nodes[products].itemType="object";const name=add("name","string",products),matrix=add("matrix","array"),code=add("code","string"),tags=add("tags","array"),debug=add("debug","boolean"),credentials=add("credentials","string");
canonical.nodes[matrix].itemSchema={id:"matrix-item",type:"array",items:{id:"number-item",type:"number"}};
canonical.nodes[tags].itemType="string";canonical.nodes[name].presence={mode:"required"};
canonical.nodes[currency].presence={mode:"required"};canonical.nodes[currency].allowedValues=[{id:"EUR",value:"EUR"},{id:"USD",value:"USD"}];
canonical.nodes[amount].rules=[{id:"amount-range",kind:"range",minimum:0,maximum:1000,severity:"error"}];
canonical.nodes[amount].documentation.description="Total";canonical.nodes[amount].documentation.example={method:"custom",value:12.5};
canonical.nodes[products].concept="ecommerce";
canonical.nodes[code].rules=[{id:"code-pattern",kind:"pattern",pattern:"^[A-Z]+$",severity:"error"},{id:"code-length",kind:"cardinality",maxItems:8,severity:"error"}];
canonical.nodes[tags].rules=[{id:"tags-count",kind:"cardinality",minItems:1,maxItems:3,severity:"error"}];
canonical.nodes[debug].presence={mode:"forbidden"};canonical.onlyDefinedFields=true;
let source={key:"profile",name:"Sitewide",role:"Shared Profile",context:"Shop",version:"Draft",canonical};
const snapshot=createContextExportSnapshot(source),document=snapshot.document,validate=new Ajv2020({strict:false}).compile(document);
const facets={};
const facet=(label,representation,positive,negative)=>{assert.equal(validate({currency:"EUR",...positive}),true,label);assert.equal(validate({currency:"EUR",...negative}),false,label);facets[label]={representation,document};};
assert.ok(document.required.includes("currency"));assert.deepEqual(document.properties.currency.enum,["EUR","USD"]);
facet("required String currency with allowed values EUR USD","parent required and string enum EUR USD",{currency:"EUR"},{currency:"GBP"});
assert.ok(document.properties.products.items.required.includes("name"));
facet("products array with required String name per object","items object with properties name and item required name",{products:[{name:"Book"}]},{products:[{}]});
facet("nested arrays containing Number items","recursive items schemas with numeric leaf type",{matrix:[[1]]},{matrix:[["1"]]});
facet("Number amount with minimum 0 and maximum 1000","numeric minimum 0 and maximum 1000",{amount:0},{amount:1001});
facet("String code with pattern ^[A-Z]+$ and maximum length 8","pattern ^[A-Z]+$ and maxLength 8",{code:"ABCDEFGH"},{code:"ABCDEFGHI"});assert.equal(validate({currency:"EUR",code:"lower"}),false);
facet("tags array with minimum 1 and maximum 3 items","minItems 1 and maxItems 3",{tags:["a"]},{tags:[]});assert.equal(validate({currency:"EUR",tags:["a","b","c","d"]}),false);
facet("forbidden debug and Only defined fields","forbidden debug and closed declared object boundaries",{}, {debug:true});assert.equal(validate({currency:"EUR",unknown:true}),false);
assert.equal(document.properties.amount.description,"Total");assert.deepEqual(document.properties.amount.examples,[12.5]);
facets["description Total and Number example 12.5"]={representation:"description Total and examples containing numeric 12.5",document};
assert.equal(document.properties.products["x-concept"],"ecommerce");assert.equal(document.properties.products.items["x-concept"],undefined);
facets["concept ecommerce on products only"]={representation:"annotation x-concept ecommerce only on products",document};
canonical.nodes[currency].presence={mode:"required-when",condition:{kind:"predicate",propertyId:kind,operator:"Equals",value:"purchase"}};
const conditional=createContextExportSnapshot(source),checkConditional=new Ajv2020({strict:false}).compile(conditional.document);
assert.equal(checkConditional({kind:"view"}),true);assert.equal(checkConditional({kind:"purchase"}),false);assert.equal(checkConditional({kind:"purchase",currency:"EUR"}),true);
facets["currency required only when kind equals purchase"]={representation:"if and then that test kind and require currency conditionally",document:conditional.document};

const states={};
const blocked=(label,change,pattern)=>{const candidate=structuredClone(source);change(candidate);let reason;try{createContextExportSnapshot(candidate);}catch(error){reason=error.message;}assert.match(reason??"",pattern);states[label]={availability:"disabled",reason};};
blocked("unconfirmed property edits",source=>source.unconfirmed=true,/Confirm or cancel/);
blocked("a durable save in progress",source=>source.pending=true,/Wait.*save/);
blocked("conflicting effective property types",source=>source.canonical.nodes[amount].provenance.push({state:"conflict"}),/amount.*conflict/);
blocked("an array with no item type",source=>delete source.canonical.nodes[tags].itemType,/tags.*item type/);
blocked("a broken required schema reference",source=>source.canonical.nodes[currency].presence.condition.propertyId="missing",/reference/);
const empty=createContextExportSnapshot({...source,canonical:createCanonicalSchema({id:"empty",contributorId:"empty",contributorName:"Empty"})});
assert.deepEqual(empty.document.properties,{});states["no properties and no schema errors"]={availability:"enabled",reason:"valid empty schema"};
createContextExportSnapshot(source);states["missing Fixture and Assignment warnings"]={availability:"enabled",reason:"schema is valid despite those warnings"};

const changes={};let copies=0,downloads=0;
const session=new ContextExportSession(()=>source,{copy:async()=>{copies++;},download:async()=>{downloads++;}});
canonical.nodes[amount].rules.push({id:"custom",name:"Partner amount",kind:"custom",severity:"error"});
for(const label of ["an effective parent value changes","the selected schema context changes","a new accepted Draft is saved","only property search changes"]){
  session.refresh();session.confirm();
  if(label==="only property search changes"){canonical.selectedPropertyId=credentials;canonical.view="table";assert.equal(session.stale,false);await session.copy();changes[label]={availability:"enabled",confirmation:!session.needsConfirmation};}
  else{if(label==="the selected schema context changes")source.key="another";else canonical.revision++;assert.equal(session.stale,true);await assert.rejects(session.copy(),/Refresh/);session.refresh();assert.equal(session.needsConfirmation,true);changes[label]={availability:"disabled",confirmationReset:true};}
}
const compatibility={};
for(const warning of [false,true]){
  canonical.nodes[amount].rules=warning?[{id:"warning",kind:"range",minimum:0,severity:"warning",message:"Use a positive total"}]:[{id:"compatible",kind:"range",minimum:0,severity:"error"},{id:"custom",name:"Partner amount",kind:"custom",severity:"error"}];
  const before=JSON.stringify(source),review=new ContextExportSession(()=>source,{copy:async()=>{copies++;},download:async()=>{downloads++;}}),snap=review.refresh(),initial=[copies,downloads];
  assert.equal(review.needsConfirmation,true);review.close();await assert.rejects(review.copy(),/closed/);assert.deepEqual([copies,downloads],initial);
  const confirmed=new ContextExportSession(()=>source,{copy:async()=>{copies++;},download:async()=>{downloads++;}});confirmed.refresh();confirmed.confirm();await confirmed.copy();await confirmed.download();assert.equal(JSON.stringify(source),before);
  assert.equal(snap.compatibility.omitted.length,warning?0:1);assert.equal(new Ajv2020({strict:false}).compile(snap.document)({amount:-1}),false);
  compatibility[warning?"warning rule with a custom issue message":"unsupported active validation rule"]={omitted:snap.compatibility.omitted.length,review:snap.compatibility,cancelled:true,unchanged:true};
}
const published={id:"saved",name:"Saved",version:4,published:true,assignments:[],document:{type:"object",properties:{published:{type:"string"}}},workingDraft:{document:{type:"object",properties:{draft:{type:"number"}}}}};
const resource=exportJsonSchemaResource(published,[published]),bundle=exportJsonSchemaBundle([published]),draft=createContextExportSnapshot({...source,canonical:undefined,schema:{...published,document:published.workingDraft.document},version:"Draft"});
assert.match(resource.document.$id,/revisions\/4$/);assert.ok(resource.document.properties.published);assert.ok(bundle.resourceIds.includes(resource.document.$id));assert.equal(draft.document.$id,undefined);assert.ok(draft.document.properties.draft);
assert.equal(snapshot.text,`${JSON.stringify(document,null,2)}\n`);assert.equal(document.properties.credentials.type,"string");assert.match(snapshot.filename,/^[a-z0-9-]+\.schema\.json$/);
console.log(JSON.stringify({schemaContextExportModel:{facets,states,changes,compatibility,regression:{resource:resource.document,bundle:bundle.resourceIds,draft:draft.document},format:{text:snapshot.text,filename:snapshot.filename}}}));
