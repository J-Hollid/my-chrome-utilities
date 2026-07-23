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
    events:[{id:"event:view",name:"page_view",eventName:"page_view",sourceId:"history",canonicalSchema:canonical("event:view","page_view",[constraint("/event_name",{expectedValue:"page_view"})])}],
    applicabilitySets:[],flows:[{id:"flow:checkout",name:"Checkout journey"}],fixtures:[],assignments:[],
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
      {id:"relationship:view-confirm-b",sourceEndpoint:{kind:"event-occurrence",id:"occurrence:view"},targetEndpoint:{kind:"page-frame",id:"frame:confirmation-b"},sourcePort:"right",targetPort:"left",kind:"alternative",label:"Skip route"},
      {id:"relationship:confirm-merge",sourceEndpoint:{kind:"page-frame",id:"frame:confirmation-a"},targetEndpoint:{kind:"page-frame",id:"frame:confirmation-b"},sourcePort:"bottom",targetPort:"top",kind:"merge"},
      {id:"relationship:confirm-retry",sourceEndpoint:{kind:"page-frame",id:"frame:confirmation-a"},targetEndpoint:{kind:"event-occurrence",id:"occurrence:view"},sourcePort:"top",targetPort:"bottom",kind:"alternative",label:"Retry event"},
    ],
  }},releases:[],
};
const state={project,draft:{id:"draft:project-retail",status:"Saved",updatedAt:"2026-07-23T09:59:00.000Z"},history:{undo:[],redo:[]}};
const inactiveProject=structuredClone(project);inactiveProject.id="project-trade";inactiveProject.name="Trade portal";inactiveProject.collections.flows=[{id:"flow:trade",name:"Trade journey"}];inactiveProject.documentationFlowGraphs={"flow:trade":structuredClone(project.documentationFlowGraphs["flow:checkout"])};
const inactiveState={...state,project:inactiveProject,draft:{...state.draft,id:"draft:project-trade"}};
const at="2026-07-23T09:59:00.000Z",revision=7,library=serializeProjectLibrary(projectLibrary([{state,revision,createdAt:at,lastModifiedAt:at},{state:inactiveState,revision,createdAt:at,lastModifiedAt:at}],project.id));
const events=[
  {type:"observed",id:"live-100",name:"page_view",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-23T10:00:00.000Z",pageUrl:"https://shop.test/cart",payload:{}},
  {type:"observed",id:"live-101",name:"page_view",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-23T10:00:01.000Z",pageUrl:"https://shop.test/cart",payload:{site:"shop",currency:"EUR",cart_id:"c1",instance:"retail"}},
  {type:"observed",id:"live-102",name:"page_view",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-23T10:00:02.000Z",pageUrl:"https://shop.test/confirmation",payload:{site:"shop",currency:"EUR",event_name:"page_view",occurrence:true}},
  {type:"observed",id:"live-103",name:"purchase",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-23T10:00:03.000Z",pageUrl:"https://shop.test/confirmation",payload:{}},
];
const session=JSON.stringify({session:{id:"session:flow",status:"active",freshBoundary:true,tabId:7,windowId:1,historyPath:"dataLayer",startUrl:"https://shop.test/cart",currentUrl:"https://shop.test/confirmation",timeline:events}});
const preload=`window.__flowErrors=[];addEventListener('error',event=>window.__flowErrors.push(event.message));addEventListener('unhandledrejection',event=>window.__flowErrors.push(String(event.reason)));localStorage.setItem('my-chrome-utilities.specification-project-library.v1',${JSON.stringify(library)});localStorage.setItem('dataLayerTestingSession',${JSON.stringify(session)});`;
const outlineProject=structuredClone(project);
outlineProject.collections.pages=[
  {id:"page:cart",name:"Cart",pageGroupIds:["group:checkout"],profileId:"profile:sitewide",canonicalSchema:canonical("outline:page:cart","Cart",[constraint("/cart_id",{presence:"required",type:"string"})])},
  {id:"page:payment",name:"Payment",pageGroupIds:["group:checkout"],profileId:"profile:sitewide",canonicalSchema:canonical("outline:page:payment","Payment",[constraint("/payment_id",{presence:"required",type:"string"}),constraint("/oForm/formStepName",{expectedValue:"payment"})])},
  {id:"page:confirmation",name:"Confirmation",pageGroupIds:["group:checkout"],profileId:"profile:sitewide",canonicalSchema:canonical("outline:page:confirmation","Confirmation",[constraint("/confirmation_id",{presence:"required",type:"string"})])},
];
outlineProject.collections.events=[
  {id:"event:paypal",name:"PayPal",eventName:"paypal",canonicalSchema:canonical("outline:event:paypal","PayPal",[constraint("/paypal",{presence:"required",type:"string"})])},
  {id:"event:add-payment",name:"add_payment_info",eventName:"add_payment_info",canonicalSchema:canonical("outline:event:add-payment","add_payment_info",[constraint("/event_name",{expectedValue:"add_payment_info"})])},
];
outlineProject.documentationFlowGraphs={"flow:checkout":{
  pageGroupIds:["group:checkout"],
  pageFrames:[
    {id:"frame:cart",name:"Cart frame",pageId:"page:cart",pageGroupId:"group:checkout"},
    {id:"frame:payment",name:"Payment frame",pageId:"page:payment",pageGroupId:"group:checkout"},
    {id:"frame:confirmation",name:"Confirmation frame",pageId:"page:confirmation",pageGroupId:"group:checkout"},
  ],
  occurrences:[
    {id:"occurrence:paypal",name:"Cart PayPal",pageFrameId:"frame:cart",pageId:"page:cart",eventId:"event:paypal",localSchemaContributions:[constraint("/paypal_route",{presence:"required",type:"string"})]},
    {id:"occurrence:add-payment",name:"Payment add_payment_info",pageFrameId:"frame:payment",pageId:"page:payment",eventId:"event:add-payment",localSchemaContributions:[constraint("/method",{presence:"required",type:"string"})]},
  ],
  relationships:[
    {id:"relationship:cart-payment",sourceEndpoint:{kind:"page-frame",id:"frame:cart"},targetEndpoint:{kind:"page-frame",id:"frame:payment"},sourcePort:"right",targetPort:"left",kind:"expected_next"},
    {id:"relationship:cart-paypal",sourceEndpoint:{kind:"page-frame",id:"frame:cart"},targetEndpoint:{kind:"event-occurrence",id:"occurrence:paypal"},sourcePort:"top",targetPort:"bottom",kind:"alternative",label:"PayPal route"},
    {id:"relationship:cart-confirmation",sourceEndpoint:{kind:"page-frame",id:"frame:cart"},targetEndpoint:{kind:"page-frame",id:"frame:confirmation"},sourcePort:"bottom",targetPort:"top",kind:"merge"},
    {id:"relationship:payment-add",sourceEndpoint:{kind:"page-frame",id:"frame:payment"},targetEndpoint:{kind:"event-occurrence",id:"occurrence:add-payment"},sourcePort:"right",targetPort:"left",kind:"expected_next"},
  ],
}};
const outlineState={...state,project:outlineProject,draft:{...state.draft,id:"draft:outline"}};
const outlineLibrary=serializeProjectLibrary(projectLibrary([{state:outlineState,revision,createdAt:at,lastModifiedAt:at}],outlineProject.id));
const outlineEvents=[
  {type:"observed",id:"live-100",name:"pageview",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-23T10:00:00.000Z",pageUrl:"https://shop.test/payment",payload:{site:"shop",currency:"EUR",payment_id:"payment-1",oForm:{formStepName:"review"}}},
  {type:"observed",id:"live-101",name:"page_view",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-23T10:00:01.000Z",pageUrl:"https://shop.test/cart",payload:{site:"shop",currency:"EUR",cart_id:"cart-1"}},
  {type:"observed",id:"live-102",name:"add_payment_info",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-23T10:00:02.000Z",pageUrl:"https://shop.test/payment",payload:{site:"shop",currency:"EUR",payment_id:"payment-1",event_name:"add_payment_info",method:"card"}},
];
const outlineSession=JSON.stringify({session:{id:"session:outline",status:"active",freshBoundary:true,tabId:7,windowId:1,historyPath:"dataLayer",startUrl:"https://shop.test/cart",currentUrl:"https://shop.test/payment",timeline:outlineEvents}});
const outlinePreload=`localStorage.setItem('my-chrome-utilities.specification-project-library.v1',${JSON.stringify(outlineLibrary)});localStorage.setItem('dataLayerTestingSession',${JSON.stringify(outlineSession)});`;

await runRenderedWorkflow("live-flow-testing",`${workflowPreamble}
const pause=()=>new Promise(resolve=>setTimeout(resolve,25));
const until=async(test)=>{for(let attempt=0;attempt<240;attempt++){try{if(test())return true;}catch{}await pause();}throw new Error('Timed out: '+q('#live-flow-test').textContent+' | '+JSON.stringify(window.__flowErrors));};
const click=text=>{const control=[...document.querySelectorAll('button')].find(button=>button.textContent===text);if(!control)throw new Error('Missing button '+text);control.click();return control;};
await until(()=>q('#live-flow-selector')?.options.length===2);
const host=q('#live-flow-test'),feed=()=>[...document.querySelectorAll('[data-event-id]')].map(row=>row.getAttribute('data-event-id')).join('|'),feedBefore=feed();
const integrated=host.closest('#live-context-actions')!==null&&!document.querySelector('#open-live-flow-test')&&!document.querySelector('#live-flow-run-history')&&![...document.querySelectorAll('button')].some(button=>button.textContent.startsWith('Match '));
const guidance=host.textContent.includes('event feed remains unchanged')&&host.textContent.includes('no Assignment is selected automatically');
const flow=q('#live-flow-selector'),onlyActive=[...flow.options].map(option=>option.textContent).join('|')==='No Flow selected|Checkout journey'&&!host.textContent.includes('Trade journey');
const {openIndexedDbProjectRepository}=await import('/data-layer-durable-project-repository.js'),repository=await openIndexedDbProjectRepository(),hashTargets=[['projectEntities','project-retail:profiles:profile:sitewide'],['projectEntities','project-retail:pageGroups:group:checkout'],['projectEntities','project-retail:pages:page:cart'],['projectEntities','project-retail:pages:page:confirmation'],['projectEntities','project-retail:events:event:view'],['flowGraphs','project-retail:flow:checkout']],beforeHashes=Object.fromEntries(await Promise.all(hashTargets.map(async([store,key])=>[store+'/'+key,await repository.hashRecord(store,key)]))),beforeProjectHash=await repository.hashProject('project-retail');
flow.value='flow:checkout';flow.dispatchEvent(new Event('change',{bubbles:true}));
q('[data-event-id="live-101"]').click();await until(()=>q('#live-flow-step-selector'));
const initial=q('#live-flow-step-selector'),initialOptions=[...initial.options].map(option=>option.textContent),rootFirst=initialOptions.slice(1).join('|')==='Cart · Root Page frame · frame:cart|Confirmation A · Page frame · frame:confirmation-a|Confirmation B · Page frame · frame:confirmation-b'&&!initialOptions.some(label=>label.includes('occurrence:view'));
initial.value='frame:cart';click('Link event to Flow step');await until(()=>q('#live-event-inspector').textContent.includes('Manual Flow test results'));
const firstLinked=q('#live-event-inspector').textContent.includes('Checkout journey · Cart · Manual Flow test · Valid')&&q('#live-event-inspector').textContent.includes('Recorded graph step frame:cart');
q('#back-to-events').click();
q('[data-event-id="live-100"]').click();await until(()=>q('#live-flow-step-selector'));
const next=q('#live-flow-step-selector'),outgoingOnly=[...next.options].slice(1).map(option=>option.value).join('|')==='occurrence:view'&&q('#live-flow-event-link').textContent.includes('direct outgoing relationship target');
next.value='occurrence:view';click('Link event to Flow step');await until(()=>q('#live-event-inspector').textContent.includes('Manual Flow test results'));
const earlierCaptureLinked=q('#live-event-inspector').textContent.includes('Cart page_view')&&q('#live-event-inspector').textContent.includes('Invalid')&&Boolean(q('.live-flow-create-defect'));
const clipboard={plain:[]};Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value)=>clipboard.plain.push(value)}});q('.live-flow-create-defect').click();await until(()=>[...document.querySelectorAll('button')].some(button=>button.textContent==='Save defect'));
const ordinaryDefectAdapter=q('[aria-label="Final report preview"]').textContent.includes('Flow test evidence')&&q('[aria-label="Final report preview"]').textContent.includes('occurrence:view');
click('Copy for Jira Cloud');await until(()=>clipboard.plain.length===1);click('Save defect');await until(()=>JSON.parse(localStorage.getItem('my-chrome-utilities.defect-library.v1')).defects.length===1);
const defectSaved=clipboard.plain[0].includes('occurrence:view')&&JSON.parse(localStorage.getItem('my-chrome-utilities.defect-library.v1')).defects[0].report.event.flowContext.selectedStepId==='occurrence:view';
q('[data-event-id="live-101"]').click();await until(()=>q('#live-flow-event-link')?.textContent.includes('Recorded graph step frame:cart'));
const reviewStable=!document.querySelector('#live-flow-step-selector')&&q('#live-flow-event-link').textContent.includes('does not change the current traversal step');
q('#back-to-events').click();q('[data-event-id="live-102"]').click();await until(()=>q('#live-flow-step-selector'));
const branch=q('#live-flow-step-selector'),branchChoices=[...branch.options].slice(1).map(option=>option.value).join('|'),cursorStable=branchChoices==='frame:confirmation-a|frame:confirmation-b';
branch.value='frame:confirmation-a';click('Link event to Flow step');await until(()=>q('#live-flow-event-link')?.textContent.includes('frame:confirmation-a'));q('#back-to-events').click();
const feedConserved=feed()===feedBefore&&q('[data-event-id="live-100"]')&&q('[data-event-id="live-103"]')&&!document.querySelector('#live-flow-candidates');
q('#save-live-session').click();q('#save-live-session-name').value='Checkout Flow evidence';q('#save-live-session-name').dispatchEvent(new Event('input',{bubbles:true}));q('#save-live-session-form').requestSubmit();q('#data-layer-view-sessions').click();await until(()=>q('#saved-session-list').textContent.includes('Checkout Flow evidence'));click('Open in Live feed');await until(()=>q('#live-flow-test').textContent.includes('Saved session evidence'));
const restoredContext=q('#live-flow-test').textContent.includes('Selected Flow: Checkout journey')&&q('#live-flow-test').textContent.includes('current step frame:confirmation-a')&&!document.querySelector('#live-flow-selector');
q('[data-event-id="live-100"]').click();await until(()=>q('#live-flow-event-link')?.textContent.includes('Recorded graph step occurrence:view'));
const restoredLink=q('#live-flow-event-link').textContent.includes('Manual Flow test')&&q('#live-flow-event-link').textContent.includes('Invalid');
const stored=JSON.parse(localStorage.getItem('my-chrome-utilities.saved-session-library.v1')),savedSummary=stored.sessions[0].flowTests[0],durable=savedSummary.label==='Manual Flow test evidence'&&savedSummary.currentStepId==='frame:confirmation-a'&&savedSummary.history.map(entry=>entry.eventId).join('|')==='live-101|live-100|live-102'&&savedSummary.history.find(entry=>entry.eventId==='live-100').defectId?.startsWith('defect:')&&savedSummary.history.every(entry=>!('contributors' in entry)&&/^flow-schema:[0-9a-f]{8}$/.test(entry.effectiveSchemaRevisionIdentity));
const afterHashes=Object.fromEntries(await Promise.all(hashTargets.map(async([store,key])=>[store+'/'+key,await repository.hashRecord(store,key)]))),activeProject=(await repository.loadProject('project-retail')).state.project,unchanged=beforeProjectHash===await repository.hashProject('project-retail')&&Object.keys(beforeHashes).every(key=>beforeHashes[key]===afterHashes[key])&&activeProject.collections.assignments.length===0;
const evidence={integrated,guidance,onlyActive,rootFirst,firstLinked,outgoingOnly,earlierCaptureLinked,ordinaryDefectAdapter,defectSaved,reviewStable,cursorStable,feedConserved,restoredContext,restoredLink,durable,unchanged};return{passed:Object.values(evidence).every(Boolean),width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,evidence};`,{preload,fullPanel:true});

const outlineObservation=await runRenderedWorkflow("live-flow-testing-outline",`${workflowPreamble}
const pause=()=>new Promise(resolve=>setTimeout(resolve,25)),until=async(test,label='outline evidence')=>{for(let attempt=0;attempt<240;attempt++){try{if(test())return true;}catch{}await pause();}throw new Error('Timed out waiting for '+label);},click=text=>{const control=[...document.querySelectorAll('button')].find(button=>button.textContent===text);if(!control)throw new Error('Missing button '+text);control.click();return control;};
await until(()=>q('#live-flow-selector')?.options.length===2);const flow=q('#live-flow-selector');flow.value='flow:checkout';flow.dispatchEvent(new Event('change',{bubbles:true}));
q('[data-event-id="live-101"]').click();await until(()=>q('#live-flow-step-selector'));let selector=q('#live-flow-step-selector');selector.value='frame:cart';click('Link event to Flow step');await until(()=>q('#live-flow-event-link')?.textContent.includes('frame:cart'));q('#back-to-events').click();
q('[data-event-id="live-100"]').click();await until(()=>q('#live-flow-step-selector'));selector=q('#live-flow-step-selector');const relationshipRows=[...selector.options].slice(1).map(option=>{const [name,relationship_kind,display_name,id]=option.textContent.split(' · ');return{relationship_kind,next_step:id.startsWith('frame:')?name+' Page frame':name+' Event occurrence',label_state:display_name==='Cart to '+name?'no label':'label '+display_name,display_name};});
selector.value='frame:payment';click('Link event to Flow step');await until(()=>q('#live-flow-event-link')?.textContent.includes('frame:payment'));
const relationshipChoicesBefore=q('#live-flow-event-link').textContent;const outlineClipboard=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value)=>outlineClipboard.push(value)}});
q('.live-flow-create-defect').click();await until(()=>q('#live-event-inspector h4')?.textContent==='Defect report: Checkout journey · Payment · pageview');
const relationshipIssue=q('label[for="defect-issue-formStepName"]')?.textContent??'',relationshipAssistance=q('[aria-label="formStepName expected-result assistance"]')?.textContent??'',relationshipPreview=q('[aria-label="Final report preview"]')?.textContent??'';
const relationshipDefectUi=relationshipIssue.includes('observed "review"')&&relationshipIssue.includes('expected "payment"')&&relationshipIssue.includes('rule EXPECTED_VALUE')&&relationshipAssistance.includes('Use Payment Flow-step expectation')&&relationshipAssistance.includes('effective schema revision')&&!/generic constraint|manually selected Flow step/i.test(relationshipIssue+relationshipAssistance)&&relationshipPreview.includes('path Cart to Payment');
click('Copy for Jira Cloud');await until(()=>outlineClipboard.length===1);click('Save defect');await until(()=>JSON.parse(localStorage.getItem('my-chrome-utilities.defect-library.v1')).defects.length===1);
const relationshipStored=JSON.parse(localStorage.getItem('my-chrome-utilities.defect-library.v1')).defects[0].report,relationshipSnapshot=relationshipStored.event.flowContext,relationshipDurable=relationshipSnapshot.flowId==='flow:checkout'&&relationshipSnapshot.selectedStepId==='frame:payment'&&relationshipSnapshot.eventId==='live-100'&&relationshipSnapshot.eventStepLink.eventId==='live-100'&&relationshipSnapshot.linkEvidence.label==='path Cart to Payment'&&relationshipSnapshot.effectiveTarget.name==='Payment'&&relationshipSnapshot.effectiveSchemaRevision>0&&relationshipSnapshot.provenance.some(item=>item.scope==='Flow Page-instance')&&outlineClipboard[0].includes('path Cart to Payment')&&outlineClipboard[0].includes(relationshipSnapshot.effectiveSchemaRevisionIdentity);
click('Back to captured event');await until(()=>q('#live-flow-event-link')?.textContent.includes('frame:payment'));const relationshipPathStable=q('#live-flow-event-link').textContent===relationshipChoicesBefore;q('#back-to-events').click();
q('[data-event-id="live-102"]').click();await until(()=>q('#live-flow-step-selector'));selector=q('#live-flow-step-selector');selector.value='occurrence:add-payment';click('Link event to Flow step');await until(()=>q('#live-flow-event-link')?.textContent.includes('occurrence:add-payment'));
q('#save-live-session').click();q('#save-live-session-name').value='Outline evidence';q('#save-live-session-name').dispatchEvent(new Event('input',{bubbles:true}));q('#save-live-session-form').requestSubmit();const summary=JSON.parse(localStorage.getItem('my-chrome-utilities.saved-session-library.v1')).sessions[0].flowTests[0],payment=summary.history.find(entry=>entry.stepId==='frame:payment'),occurrence=summary.history.find(entry=>entry.stepId==='occurrence:add-payment'),initial=summary.history.find(entry=>entry.stepId==='frame:cart'),pageScopes=payment.provenance.map(({scope})=>scope).join('|'),occurrenceScopes=occurrence.provenance.map(({scope})=>scope).join('|');
let resetFlow=q('#live-flow-selector');resetFlow.value='';resetFlow.dispatchEvent(new Event('change',{bubbles:true}));resetFlow=q('#live-flow-selector');resetFlow.value='flow:checkout';resetFlow.dispatchEvent(new Event('change',{bubbles:true}));q('#back-to-events').click();q('[data-event-id="live-100"]').click();await until(()=>q('#live-flow-step-selector'));selector=q('#live-flow-step-selector');selector.value='frame:payment';click('Link event to Flow step');await until(()=>q('#live-event-inspector').textContent.includes('Started at Payment')||q('#live-flow-event-link')?.textContent.includes('frame:payment'));
const defectButtons=[...document.querySelectorAll('.live-flow-create-defect')];defectButtons.at(-1).click();await until(()=>q('#live-event-inspector h4')?.textContent==='Defect report: Checkout journey · Payment · pageview');const initialPreview=q('[aria-label="Final report preview"]')?.textContent??'',initialUi=initialPreview.includes('Started at Payment');
click('Copy for Jira Cloud');await until(()=>outlineClipboard.length===2,'initial clipboard');click('Save defect');await until(()=>JSON.parse(localStorage.getItem('my-chrome-utilities.defect-library.v1')).defects.length===2||[...document.querySelectorAll('button')].some(button=>button.textContent==='Save separately'),'initial save result');if(JSON.parse(localStorage.getItem('my-chrome-utilities.defect-library.v1')).defects.length<2)click('Save separately');await until(()=>JSON.parse(localStorage.getItem('my-chrome-utilities.defect-library.v1')).defects.length===2,'initial separate save');const initialStored=JSON.parse(localStorage.getItem('my-chrome-utilities.defect-library.v1')).defects.find(defect=>defect.report.event.flowContext.linkEvidence.kind==='start')?.report,initialDurable=initialStored?.event.flowContext.linkEvidence.label==='Started at Payment'&&outlineClipboard[1].includes('Started at Payment');
const outlineRows=[...relationshipRows,...(pageScopes==='Shared Profile|Page Group|Page|Flow Page-instance'?[{flow_step:'Payment Page frame',effective_schema:'its Shared Profiles, ordered Page Groups, Page, and Flow Page-instance contribution'}]:[]),...(occurrenceScopes==='Shared Profile|Event|Page Group|Page|Flow Page-instance|Event-occurrence'?[{flow_step:'Payment add_payment_info occurrence',effective_schema:'its Page-instance branch, Event branch, and Event-occurrence contribution'}]:[]),...(Date.parse(payment.captureTime)<Date.parse(initial.captureTime)?[{capture_order:'before'}]:[]),...(Date.parse(occurrence.captureTime)>Date.parse(initial.captureTime)?[{capture_order:'after'}]:[]),...(relationshipDefectUi&&relationshipDurable&&relationshipPathStable?[{link_evidence:'relationship Cart to Payment',displayed_link_evidence:'path Cart to Payment'}]:[]),...(initialUi&&initialDurable?[{link_evidence:'initial selection at Payment',displayed_link_evidence:'Started at Payment'}]:[])];return{passed:outlineRows.length===9,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,outlineRows};`,{preload:outlinePreload,fullPanel:true});

const noActiveLibrary=serializeProjectLibrary(projectLibrary([{state,revision,createdAt:at,lastModifiedAt:at},{state:inactiveState,revision,createdAt:at,lastModifiedAt:at}]));
const noProjectPreload=`localStorage.setItem('my-chrome-utilities.specification-project-library.v1',${JSON.stringify(noActiveLibrary)});localStorage.removeItem('my-chrome-utilities.specification-project.v1');`;
await runRenderedWorkflow("live-flow-testing-no-project",`${workflowPreamble}
const pause=()=>new Promise(resolve=>setTimeout(resolve,25)),until=async(test)=>{for(let attempt=0;attempt<240;attempt++){if(test())return true;await pause();}throw new Error('Timed out waiting for no-project recovery');},click=text=>{const control=[...document.querySelectorAll('button')].find(button=>button.textContent===text);if(!control)throw new Error('Missing button '+text);control.click();return control;};
await until(()=>q('#live-flow-test').textContent.includes('No active project'));const absentStorage=localStorage.getItem('my-chrome-utilities.specification-project.v1')===null&&!q('#live-flow-test').querySelector('select')&&!document.querySelector('#open-live-flow-test'),actions=['Open project','Create project'].every(text=>[...q('#live-flow-test').querySelectorAll('button')].some(button=>button.textContent===text));click('Open project');await until(()=>document.activeElement?.id==='project-library-search');const openRecovery=document.activeElement?.id==='project-library-search';click('Create project');await until(()=>document.querySelector('dialog[open]')?.textContent.includes('Create project'));const createRecovery=Boolean(document.querySelector('dialog[open]')?.textContent.includes('Create project'));const evidence={absentStorage,actions,openRecovery,createRecovery};return{passed:Object.values(evidence).every(Boolean),width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,evidence};`,{preload:noProjectPreload,fullPanel:true});
console.log(JSON.stringify({liveFlowTesting:{installedBoundary:true,outlineRows:outlineObservation.outlineRows}}));
