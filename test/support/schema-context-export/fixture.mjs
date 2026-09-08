/** Run inside the extension. Seed through the production repository and commands. */
export async function seedContextExportProject(){
  const api=await import("/data-layer-canonical-schema.js");
  const {createSpecificationProject}=await import("/data-layer-specification-project.js");
  const {openIndexedDbProjectRepository}=await import("/data-layer-durable-project-repository.js");
  let sequence=0;const id=kind=>`${kind}:export:${++sequence}`;
  let canonical=api.createCanonicalSchema({id:"canonical:sitewide",contributorId:"profile:sitewide",contributorName:"Sitewide"});
  const add=(name,type,parentId)=>{const result=api.applyCanonicalCommand(canonical,{kind:"add",baseRevision:canonical.revision,name,type,...(parentId?{parentId}:{}),id});if(result.status!=="applied")throw new Error("Fixture property command failed");canonical=result.document;return Object.values(canonical.nodes).find(node=>node.name===name).id;};
  const kind=add("kind","string"),amount=add("amount","number"),currency=add("currency","string"),products=add("products","array");
  canonical.nodes[products].itemType="object";const name=add("name","string",products),tracking=add("tracking","boolean");
  for(const propertyId of [kind,amount,products,name])canonical.nodes[propertyId].presence={mode:"required"};
  canonical.nodes[currency].presence={mode:"required-when",condition:{kind:"predicate",propertyId:kind,operator:"Equals",value:"purchase"}};
  canonical.nodes[currency].allowedValues=[{id:"eur",value:"EUR"},{id:"usd",value:"USD"}];
  canonical.nodes[amount].rules=[{id:"amount-range",kind:"range",minimum:0,maximum:1000,severity:"error"}];
  canonical.onlyDefinedFields=true;canonical.nodes[products].concept="ecommerce";
  const state=createSpecificationProject({name:"Shop export",site:"shop.example",id:kind=>kind==="project"?"project:export":id(kind)});
  state.project.eventTransport={observationHistoryPath:"queue.history",defaultPushPath:"dataLayer",observationSources:[{id:"event-history",name:"History array",path:"queue.history",enabled:true}]};
  state.project.collections.profiles=[{id:"profile:sitewide",name:"Sitewide",canonicalSchema:canonical}];
  state.project.collections.propertySets=[{id:"set:checkout",name:"Checkout properties",profileId:"profile:sitewide",localSchemaContributions:[{path:"/checkoutId",type:"string"}]}];
  state.project.collections.pages=[{id:"page:cart",name:"Cart",profileId:"profile:sitewide",excludedPropertyIds:[tracking],localSchemaContributions:[{path:"/cartCode",type:"string"}]}];
  state.project.collections.events=[{id:"event:purchase",name:"Purchase",profileId:"profile:sitewide",localSchemaContributions:[{path:"/purchaseCode",type:"string"}]}];
  state.project.collections.flows=[{id:"flow:checkout",name:"Checkout"}];
  const range=minimum=>({path:"/amount",rules:[{id:"amount-range",kind:"range",minimum,maximum:1000,severity:"error"}]});
  state.project.documentationFlowGraphs={"flow:checkout":{version:2,pageFrames:[{id:"frame:cart",name:"Cart step",pageId:"page:cart",position:{x:20,y:20},localSchemaContributions:[range(5)]}],occurrences:[{id:"occurrence:purchase",name:"Purchase occurrence",pageId:"page:cart",pageFrameId:"frame:cart",eventId:"event:purchase",position:{x:20,y:80},localSchemaContributions:[range(10)],excludedPropertyIds:[tracking]}],relationships:[]}};
  const repository=await openIndexedDbProjectRepository();
  await repository.putProject(state,{active:true,draftToken:"context-export-initial",draftSequence:1});
  await repository.saveSavedSchema({schema:{id:"schema:export",name:"Saved purchase",version:4,published:true,assignments:[],document:{type:"object",properties:{published:{type:"string"}}},workingDraft:{baseVersion:4,sourceVersion:4,document:{type:"object",required:["draft"],properties:{draft:{type:"number"}}},assignments:[],pendingChanges:["Accepted Draft property"]}},label:"Create export fixture schema"});
  return {projectId:state.project.id,tracking};
}
