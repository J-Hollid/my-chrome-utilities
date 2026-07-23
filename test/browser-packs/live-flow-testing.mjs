import {canonicalSchemaWithConstraint,createCanonicalSchema} from "../../dist/data-layer-canonical-schema.js";
import {projectLibrary,serializeProjectLibrary} from "../../dist/data-layer-project-library.js";
import {runRenderedWorkflow,workflowPreamble} from "./shared-harness.mjs";

let sequence=0;
const constraint=(path,values)=>({path,...values});
const canonical=(entityId,entityName,constraints)=>constraints.reduce(
  (document,item)=>canonicalSchemaWithConstraint(document,item,(kind)=>`${kind}:browser:${++sequence}`),
  createCanonicalSchema({id:`canonical:${entityId}`,contributorId:entityId,contributorName:entityName}),
);
const project={
  id:"project-retail",name:"Retail website",description:"Guided checkout validation",site:"shop.test",environments:["Production"],
  namingConventions:{property:"snake_case",event:"snake_case"},publicationPolicy:{warningsBlock:false,fixturesRequired:false},
  collections:{
    profiles:[{id:"profile:sitewide",name:"Sitewide",canonicalSchema:canonical("profile:sitewide","Sitewide",[constraint("/site",{presence:"required",type:"string"})])}],
    pageGroups:[{id:"group:checkout",name:"Checkout",canonicalSchema:canonical("group:checkout","Checkout",[constraint("/currency",{presence:"required",allowedValues:["EUR"]})])}],
    pages:[
      {id:"page:cart",name:"Cart",pageGroupIds:["group:checkout"],profileId:"profile:sitewide",pathname:"/cart",canonicalSchema:canonical("page:cart","Cart",[constraint("/cart_id",{presence:"required",type:"string"})])},
      {id:"page:confirmation",name:"Confirmation",pageGroupIds:["group:checkout"],profileId:"profile:sitewide",pathname:"/confirmation"},
    ],
    events:[{id:"event:view",name:"page_view",eventName:"page_view",canonicalSchema:canonical("event:view","page_view",[constraint("/event_name",{expectedValue:"page_view"})])}],
    applicabilitySets:[],flows:[{id:"flow:checkout",name:"Checkout journey"}],fixtures:[],schemaDrafts:[],assignments:[],
  },
  documentationFlowGraphs:{"flow:checkout":{
    pageGroupIds:["group:checkout"],
    pageFrames:[
      {id:"frame:cart",name:"Cart frame",pageId:"page:cart",pageGroupId:"group:checkout",localSchemaContributions:[constraint("/instance",{presence:"required"})]},
      {id:"frame:confirmation-a",name:"Confirmation A",pageId:"page:confirmation",pageGroupId:"group:checkout"},
      {id:"frame:confirmation-b",name:"Confirmation B",pageId:"page:confirmation",pageGroupId:"group:checkout"},
    ],
    occurrences:[{id:"occurrence:view",name:"Cart page_view",pageFrameId:"frame:cart",pageId:"page:cart",eventId:"event:view",localSchemaContributions:[constraint("/occurrence",{presence:"required",type:"boolean"})]}],
    relationships:[
      {id:"relationship:cart-view",sourceEndpoint:{kind:"page-frame",id:"frame:cart"},targetEndpoint:{kind:"event-occurrence",id:"occurrence:view"},sourcePort:"right",targetPort:"left",kind:"expected_next"},
      {id:"relationship:view-confirm",sourceEndpoint:{kind:"event-occurrence",id:"occurrence:view"},targetEndpoint:{kind:"page-frame",id:"frame:confirmation-a"},sourcePort:"top",targetPort:"bottom",kind:"alternative",label:"Success route"},
      {id:"relationship:confirm-repeat",sourceEndpoint:{kind:"page-frame",id:"frame:confirmation-a"},targetEndpoint:{kind:"page-frame",id:"frame:confirmation-b"},sourcePort:"right",targetPort:"left",kind:"expected_next"},
    ],
  }},releases:[],
};
const state={project,draft:{id:"draft:project-retail",status:"Saved",updatedAt:"2026-07-23T09:59:00.000Z"},history:{undo:[],redo:[]}};
const at="2026-07-23T09:59:00.000Z",revision=7,library=serializeProjectLibrary(projectLibrary([{state,revision,createdAt:at,lastModifiedAt:at}],project.id));
const events=[
  {type:"observed",id:"live-100",name:"page_view",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-23T10:00:00.000Z",pageUrl:"https://shop.test/cart",payload:{}},
  {type:"observed",id:"live-101",name:"page_view",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-23T10:00:01.000Z",pageUrl:"https://shop.test/cart",payload:{site:"shop",currency:"EUR",cart_id:"c1",instance:"retail"}},
  {type:"observed",id:"live-102",name:"page_view",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-23T10:00:02.000Z",pageUrl:"https://shop.test/cart",payload:{site:"shop",currency:"EUR",cart_id:"c1",instance:"retail",event_name:"page_view",occurrence:true}},
  {type:"observed",id:"live-103",name:"purchase",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-23T10:00:03.000Z",pageUrl:"https://shop.test/confirmation",payload:{}},
];
const session=JSON.stringify({session:{id:"session:flow",status:"active",freshBoundary:true,tabId:7,windowId:1,historyPath:"dataLayer",startUrl:"https://shop.test/cart",currentUrl:"https://shop.test/confirmation",timeline:events}});
const preload=`window.__flowErrors=[];addEventListener('error',event=>window.__flowErrors.push(event.message));addEventListener('unhandledrejection',event=>window.__flowErrors.push(String(event.reason)));localStorage.setItem('my-chrome-utilities.specification-project-library.v1',${JSON.stringify(library)});localStorage.setItem('dataLayerTestingSession',${JSON.stringify(session)});`;

await runRenderedWorkflow("live-flow-testing",`${workflowPreamble}
const pause=()=>new Promise(resolve=>setTimeout(resolve,25)),until=async(test)=>{for(let attempt=0;attempt<240;attempt++){try{if(test())return true;}catch{}await pause();}throw new Error('Timed out: '+q('#live-flow-test').textContent+' | '+JSON.stringify(window.__flowErrors));},click=text=>{const control=[...document.querySelectorAll('button')].find(button=>button.textContent===text);if(!control)throw new Error('Missing button '+text);control.click();return control;};
const installed=q('#open-live-flow-test').closest('#live-context-actions')!==null&&document.querySelectorAll('#open-live-flow-test').length===1;q('#open-live-flow-test').click();await until(()=>q('#live-flow-selector').options.length>1);const host=q('#live-flow-test'),guidance=host.textContent.includes('No Flow, event, or Assignment is selected automatically.'),flow=q('#live-flow-selector'),onlyActive=[...flow.options].map(option=>option.textContent).join('|')==='Choose Flow|Checkout journey'&&!flow.value;flow.value='flow:checkout';flow.dispatchEvent(new Event('change',{bubbles:true}));const start=q('#live-flow-start'),labels=[...start.options].map(option=>option.textContent),starts=labels.some(label=>label.includes('Cart · Checkout · frame:cart · Recommended root'))&&labels.filter(label=>label.includes('Confirmation · Checkout · frame:confirmation-')).length===2&&!labels.some(label=>label.includes('occurrence:view'));start.value='frame:cart';start.dispatchEvent(new Event('change',{bubbles:true}));const manualCandidates=host.textContent.includes('Eligible observed Page context')&&!host.querySelector('[aria-selected="true"]');click('Match live-101');const pageResult=host.textContent.includes('revision 2 · Valid');click('Cart to Cart page_view · expected_next');const reasons=['Captured before the previous match','Already matched in this run','Event identity does not match page_view'].every(reason=>host.textContent.includes(reason));click('Match live-102');const occurrence=host.textContent.includes('Cart page_view · live-102')&&host.textContent.includes('revision 2 · Valid');click('Success route · alternative');click('Match live-103');const invalid=host.textContent.includes('Confirmation · live-103')&&host.textContent.includes('revision 2 · Invalid');const defectAction=[...host.querySelectorAll('button')].filter(button=>button.textContent==='Create defect report').at(-1);defectAction.click();await until(()=>[...document.querySelectorAll('button')].some(button=>button.textContent==='Save defect'));click('Save defect');const linked=await until(()=>/defect defect:/.test(host.textContent));click('Complete selected path');const completed=host.textContent.includes('Completed selected path')&&host.textContent.includes('Not tested')&&/defect defect:/.test(host.textContent);q('#save-live-session').click();q('#save-live-session-name').value='Checkout Flow evidence';q('#save-live-session-name').dispatchEvent(new Event('input',{bubbles:true}));q('#save-live-session-form').requestSubmit();q('#data-layer-view-sessions').click();await until(()=>q('#saved-session-list').textContent.includes('Checkout Flow evidence'));click('Open in Live feed');q('#open-live-flow-test').click();await until(()=>q('#live-flow-test').textContent.includes('restored read-only'));const restored=q('#live-flow-test').textContent.includes('Completed selected path')&&q('#live-flow-test').textContent.includes('restored read-only; matching was not resumed')&&!q('#live-flow-test').querySelector('select')&&/defect defect:/.test(q('#live-flow-test').textContent);const stored=JSON.parse(localStorage.getItem('my-chrome-utilities.saved-session-library.v1')),savedSummary=stored.sessions[0].flowTests[0],durable=savedSummary.history.at(-1).effectiveSchemaRevision===2&&savedSummary.history.at(-1).issues.map(issue=>issue.path).sort().join('|')==='/currency|/site'&&savedSummary.history.at(-1).defectId?.startsWith('defect:');const {openIndexedDbProjectRepository}=await import('/data-layer-durable-project-repository.js'),activeProject=(await (await openIndexedDbProjectRepository()).loadProject('project-retail')).state.project,unchanged=activeProject.collections.assignments.length===0&&activeProject.documentationFlowGraphs['flow:checkout'].relationships.length===3;const evidence={installed,guidance,onlyActive,starts,manualCandidates,pageResult,reasons,occurrence,invalid,linked,completed,restored,durable,unchanged};return{passed:Object.values(evidence).every(Boolean),width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,evidence};`,{preload,fullPanel:true});
