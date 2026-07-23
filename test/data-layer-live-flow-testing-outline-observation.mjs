import assert from "node:assert/strict";
import {
  createLiveFlowTest,
  liveFlowEventStepChoices,
  linkLiveFlowEvent,
  selectLiveFlow,
} from "../dist/data-layer-live-flow-testing.js";
import { createManualFlowDefectEvent } from "../dist/data-layer-live-flow-defect-report.js";
import { createDefectReport } from "../dist/data-layer-defect-report.js";
import { defectCapturedEvent } from "../dist/data-layer-defect-report-browser.js";
import { generateReportDetails, renderJiraReport } from "../dist/data-layer-defect-report-export.js";
import {
  canonicalSchemaWithConstraint,
  createCanonicalSchema,
} from "../dist/data-layer-canonical-schema.js";

let sequence=0;
const canonical=(entityId,name,path)=>canonicalSchemaWithConstraint(
  createCanonicalSchema({
    id:`canonical:${entityId}`,
    contributorId:entityId,
    contributorName:name,
  }),
  {path,presence:"required",type:"string"},
  (kind)=>`${kind}:outline:${++sequence}`,
);
const withConstraint=(document,constraint)=>canonicalSchemaWithConstraint(
  document,constraint,(kind)=>`${kind}:outline:${++sequence}`,
);
const state={project:{
  id:"project:outline",name:"Retail website",
  collections:{
    profiles:[{id:"profile:sitewide",name:"Sitewide",canonicalSchema:canonical("profile:sitewide","Sitewide","/site")}],
    pageGroups:[{id:"group:checkout",name:"Checkout",canonicalSchema:canonical("group:checkout","Checkout","/currency")}],
    pages:[
      {id:"page:cart",name:"Cart",eventName:"pageview",profileId:"profile:sitewide",pageGroupIds:["group:checkout"],canonicalSchema:canonical("page:cart","Cart","/cart_id")},
      {id:"page:payment",name:"Payment",eventName:"pageview",profileId:"profile:sitewide",pageGroupIds:["group:checkout"],canonicalSchema:withConstraint(canonical("page:payment","Payment","/payment_id"),{path:"/oForm/formStepName",expectedValue:"payment"})},
      {id:"page:confirmation",name:"Confirmation",eventName:"pageview",profileId:"profile:sitewide",pageGroupIds:["group:checkout"],canonicalSchema:canonical("page:confirmation","Confirmation","/confirmation_id")},
    ],
    events:[
      {id:"event:paypal",name:"PayPal",eventName:"paypal",canonicalSchema:canonical("event:paypal","PayPal","/paypal")},
      {id:"event:add-payment",name:"add_payment_info",eventName:"add_payment_info",canonicalSchema:canonical("event:add-payment","add_payment_info","/event_name")},
    ],
    flows:[{id:"flow:checkout",name:"Checkout journey"}],
    applicabilitySets:[],assignments:[],fixtures:[],
  },
  documentationFlowGraphs:{"flow:checkout":{
    pageGroupIds:["group:checkout"],
    pageFrames:[
      {id:"frame:cart",name:"Cart frame",pageId:"page:cart",pageGroupId:"group:checkout"},
      {id:"frame:payment",name:"Payment frame",pageId:"page:payment",pageGroupId:"group:checkout"},
      {id:"frame:confirmation",name:"Confirmation frame",pageId:"page:confirmation",pageGroupId:"group:checkout"},
    ],
    occurrences:[
      {id:"occurrence:paypal",name:"Cart PayPal",pageFrameId:"frame:cart",pageId:"page:cart",eventId:"event:paypal",localSchemaContributions:[{path:"/paypal_route",presence:"required",type:"string"}]},
      {id:"occurrence:add-payment",name:"Payment add_payment_info",pageFrameId:"frame:payment",pageId:"page:payment",eventId:"event:add-payment",localSchemaContributions:[{path:"/method",presence:"required",type:"string"}]},
    ],
    relationships:[
      {id:"relationship:cart-payment",sourceEndpoint:{kind:"page-frame",id:"frame:cart"},targetEndpoint:{kind:"page-frame",id:"frame:payment"},kind:"expected_next"},
      {id:"relationship:cart-confirmation",sourceEndpoint:{kind:"page-frame",id:"frame:cart"},targetEndpoint:{kind:"page-frame",id:"frame:confirmation"},kind:"merge"},
    ],
  }},
  releases:[],publicationPolicy:{warningsBlock:false,fixturesRequired:false},namingConventions:{},
},draft:{status:"Draft"},history:{undo:[],redo:[]}};

const initial={
  id:"live-101",name:"page_view",sourceId:"history",
  captureTime:"2026-07-23T10:00:01.000Z",
  payload:{site:"shop",currency:"EUR",cart_id:"cart-1"},
};
const before={
  id:"live-100",name:"page_view",sourceId:"history",
  captureTime:"2026-07-23T10:00:00.000Z",
  payload:{site:"shop",currency:"EUR",payment_id:"payment-before"},
};
const payment={
  id:"live-102",name:"pageview",sourceId:"history",
  captureTime:"2026-07-23T10:00:02.000Z",
  payload:{site:"shop",currency:"EUR",payment_id:"payment-1",oForm:{formStepName:"review"}},
};
const after={
  id:"live-103",name:"add_payment_info",sourceId:"history",
  captureTime:"2026-07-23T10:00:03.000Z",
  payload:{site:"shop",currency:"EUR",payment_id:"payment-1",event_name:"add_payment_info",method:"card"},
};

let run=selectLiveFlow(createLiveFlowTest("run:outline","project:outline"),state,"flow:checkout");
run=linkLiveFlowEvent(run,state,initial,"frame:cart");
const outgoing=liveFlowEventStepChoices(run,state,payment.id).choices;
assert.equal(new Set(outgoing.map(({id})=>id)).size,outgoing.length,"Live Flow choices contain each stable target once");
const relationshipRows=outgoing.filter(({stepKind})=>stepKind==="Page").map((choice)=>({
  relationship_kind:choice.kind,
  next_step:choice.stepKind==="Page"?`${choice.name} Page frame`:`${choice.name} Event occurrence`,
  label_state:choice.displayName===`Cart to ${choice.name}`?"no label":`label ${choice.displayName}`,
  display_name:choice.displayName,
}));

let beforeRun=selectLiveFlow(createLiveFlowTest("run:outline-before","project:outline"),state,"flow:checkout");
beforeRun=linkLiveFlowEvent(beforeRun,state,initial,"frame:cart");
beforeRun=linkLiveFlowEvent(beforeRun,state,before,"frame:payment");
const beforeLinked=beforeRun.history.at(-1).eventId===before.id
  && Date.parse(before.captureTime)<Date.parse(initial.captureTime);
run=linkLiveFlowEvent(run,state,payment,"frame:payment");
const paymentEntry=run.history.at(-1);
const relationshipReport=generateReportDetails(createDefectReport(defectCapturedEvent(createManualFlowDefectEvent(paymentEntry,payment))));
const relationshipText=renderJiraReport(relationshipReport).text;
let initialRun=selectLiveFlow(createLiveFlowTest("run:outline-initial","project:outline"),state,"flow:checkout");
initialRun=linkLiveFlowEvent(initialRun,state,payment,"frame:payment");
const initialReport=generateReportDetails(createDefectReport(defectCapturedEvent(createManualFlowDefectEvent(initialRun.history[0],payment))));
const initialText=renderJiraReport(initialReport).text;
run=linkLiveFlowEvent(run,state,after,"occurrence:add-payment");
const occurrenceEntry=run.history.at(-1);
const pageScopes=paymentEntry.provenance.map(({scope})=>scope);
const occurrenceScopes=occurrenceEntry.provenance.map(({scope})=>scope);
const outlineRows=[
  ...relationshipRows,
  ...(JSON.stringify(pageScopes)===JSON.stringify(["Shared Profile","Page Group","Page","Flow Page-instance"])?[{
    flow_step:"Payment Page frame",
    effective_schema:"its Shared Profiles, ordered Page Groups, Page, and Flow Page-instance contribution",
  }]:[]),
  ...(JSON.stringify(occurrenceScopes)===JSON.stringify(["Shared Profile","Page Group","Page","Flow Page-instance","Event","Event-occurrence"])?[{
    flow_step:"Payment add_payment_info occurrence",
    effective_schema:"its Page-instance branch, Event branch, and Event-occurrence contribution",
  }]:[]),
  ...(beforeLinked?[{capture_order:"before"}]:[]),
  ...(Date.parse(after.captureTime)>Date.parse(initial.captureTime)?[{capture_order:"after"}]:[]),
  ...(relationshipReport.summary==="pageview does not satisfy Payment in Checkout journey"
    && relationshipReport.evidence.validation.some(({actual,constraint,rule})=>actual==="\"review\""&&constraint==="\"payment\""&&rule==="EXPECTED_VALUE")
    && relationshipText.includes("path Cart to Payment")
    && relationshipText.includes("relationship:cart-payment")
    && !/generic constraint|manually selected Flow step/i.test(relationshipText)
    ? [{link_evidence:"relationship Cart to Payment",displayed_link_evidence:"path Cart to Payment"}] : []),
  ...(initialReport.event.flowContext.linkEvidence.label==="Started at Payment"
    && initialText.includes("Started at Payment")
    ? [{link_evidence:"initial selection at Payment",displayed_link_evidence:"Started at Payment"}] : []),
];

assert.equal(outlineRows.length,8,"the production model fixture must demonstrate every Live Flow outline row without duplicate choices");
assert.equal(run.history.map(({eventId})=>eventId).join("|"),"live-101|live-102|live-103");
console.log(JSON.stringify({liveFlowTesting:{outlineRows}}));
