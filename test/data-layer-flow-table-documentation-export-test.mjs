import assert from "node:assert/strict";
import {
  captureMatrixTable,
  compileFlowDocumentationSnapshot,
  configureFlowDocumentationSnapshot,
  configureFlowDocumentationTable,
  flowDocumentationCellDetail,
  flowDocumentationPropertyPaths,
  flowDocumentationSnapshotStale,
  flowValueMapTable,
  renderFlowDocumentationClipboard,
  writeFlowDocumentationWorkbook,
} from "../dist/data-layer-flow-table-documentation-export.js";

const origin=(name,scope="Event")=>({contributorId:`contributor:${name}`,contributorName:name,scope});
const property=(input)=>({...input,origins:[origin(input.origin??"Profile")],superseded:[]});
const compiled=(properties,conflicts=[])=>({status:conflicts.length?"blocked":"ready",properties,conflicts,provenance:[],exclusions:[]});
const contexts=[
  {id:"context:cart",kind:"page-context",pageFrameId:"frame:cart",bindingId:"binding:view",pageName:"Cart",eventName:"page_view",stepLabel:"1",effectiveRevision:4,compiled:compiled({
    "/page_name":property({expectedValue:"cart",presence:"required"}),
    "/form_name":property({allowedValues:["guest","logged_in"],presence:"optional"}),
    "/error_message":property({presence:"forbidden"}),
    "/unsafe":property({expectedValue:"=2+2\t<script>\nnext",presence:"required"}),
  })},
  {id:"context:shipping",kind:"interaction",pageFrameId:"frame:shipping",occurrenceId:"occurrence:shipping",pageName:"Shipping",eventName:"add_shipping_info",stepLabel:"2a",effectiveRevision:7,compiled:compiled({
    "/page_name":property({expectedValue:"shipping",presence:"required",origin:"Shipping page"}),
    "/form_name":property({presence:"required"}),
    "/error_message":property({presence:"required",origin:"Shipping page",condition:{kind:"predicate",field:"form_status",operator:"Equals",value:"failed"}}),
  })},
  {id:"context:payment",kind:"interaction",pageFrameId:"frame:payment",occurrenceId:"occurrence:payment",pageName:"Payment",eventName:"add_payment_info",stepLabel:"2b",effectiveRevision:12,compiled:compiled({},[{path:"/debug_message",message:"parallel definitions conflict",contributors:["Payment page","Payment event"]}])},
];

const snapshot=compileFlowDocumentationSnapshot({projectId:"project:shop",projectName:"Shop",flowId:"flow:checkout",flowName:"Checkout journey",graphRevision:7,sourceState:"draft",generatedAt:"2026-07-20T00:00:00.000Z",contexts});
assert.equal(Object.isFrozen(snapshot),true);
assert.deepEqual(snapshot.contexts.map(({id,pageFrameId,bindingId,occurrenceId})=>({id,pageFrameId,bindingId,occurrenceId})),[
  {id:"context:cart",pageFrameId:"frame:cart",bindingId:"binding:view",occurrenceId:undefined},
  {id:"context:shipping",pageFrameId:"frame:shipping",bindingId:undefined,occurrenceId:"occurrence:shipping"},
  {id:"context:payment",pageFrameId:"frame:payment",bindingId:undefined,occurrenceId:"occurrence:payment"},
]);
const values=flowValueMapTable(snapshot);
assert.deepEqual(values.headings,["Checkout journey","Step 1 Cart / page_view","Step 2a Shipping / add_shipping_info","Step 2b Payment / add_payment_info"]);
assert.equal(values.rows.find(([path])=>path==="page_name")[1],"cart");
assert.equal(values.rows.find(([path])=>path==="form_name")[1],"guest or logged_in");
assert.match(values.rows.find(([path])=>path==="form_name")[2],/Required.*not specified/);
assert.equal(values.rows.find(([path])=>path==="error_message")[1],"Not expected");
assert.match(values.rows.find(([path])=>path==="error_message")[2],/Required when form_status Equals failed/);
assert.match(values.rows.find(([path])=>path==="debug_message")[3],/Blocked/);

const matrix=captureMatrixTable(snapshot);
assert.deepEqual(matrix.rows.find(([path])=>path==="page_name"),["page_name","M","M","—"]);
assert.deepEqual(matrix.rows.find(([path])=>path==="form_name"),["form_name","O","M","—"]);
assert.deepEqual(matrix.rows.find(([path])=>path==="error_message"),["error_message","N","C","—"]);
assert.deepEqual(matrix.rows.find(([path])=>path==="debug_message"),["debug_message","—","—","!"]);
assert.equal(matrix.legend,"M Mandatory · O Optional · C Conditional · N Not expected · — Not defined · ! Blocked");

const configuredSnapshot=configureFlowDocumentationSnapshot(snapshot,{contextOrder:["context:cart","context:payment","context:shipping"],stepLabels:{"context:payment":"Payment choice","context:shipping":"Delivery choice"}});
assert.deepEqual(configuredSnapshot.contexts.map(({id,stepLabel})=>[id,stepLabel]),[["context:cart","1"],["context:payment","Payment choice"],["context:shipping","Delivery choice"]]);
assert.deepEqual(snapshot.contexts.map(({id,stepLabel})=>[id,stepLabel]),[["context:cart","1"],["context:shipping","2a"],["context:payment","2b"]]);
const configuredTable=configureFlowDocumentationTable(configuredSnapshot,"values",{selectedPaths:["/form_name","/page_name"],metadata:["type","allowedValues"],pathDisplay:"canonical",headingParts:{step:false,page:true,event:true}});
assert.deepEqual(configuredTable.headings.slice(0,3),["Checkout journey","Type","Allowed values"]);
assert.deepEqual(configuredTable.rows.map(([path])=>path),["/form_name","/page_name"]);
assert.equal(configuredTable.rows[0][3],"guest or logged_in");
assert.equal(configuredTable.headings[3],"Cart / page_view");
assert.deepEqual(flowDocumentationPropertyPaths(snapshot).slice(0,2),["/page_name","/form_name"]);
const conditionalDetail=flowDocumentationCellDetail(snapshot,"context:shipping","/error_message");
assert.match(conditionalDetail.summary,/Shipping \/ add_shipping_info.*error_message/);
assert.match(conditionalDetail.rule,/Required when form_status Equals failed/);
assert.match(conditionalDetail.provenance,/Shipping page/);

const spreadsheet=renderFlowDocumentationClipboard(values,{includeHeadings:true,style:"plain"});
assert.equal(spreadsheet.plain.split("\n").every((row)=>row.split("\t").length===4),true);
assert.match(spreadsheet.plain,/'=2\+2 <script> next/);
const rich=renderFlowDocumentationClipboard(values,{includeHeadings:true,style:"highlighted"});
assert.match(rich.html,/^<table/);assert.match(rich.html,/&lt;script&gt;/);assert.doesNotMatch(rich.html,/<script>/);assert.match(rich.html,/<br>/);
const incompleteCopy=renderFlowDocumentationClipboard(values,{documentTitle:snapshot.title});
assert.match(incompleteCopy.plain,/^Checkout journey · Draft — incomplete/);
assert.match(incompleteCopy.html,/<caption>Checkout journey · Draft — incomplete<\/caption>/);

assert.equal(flowDocumentationSnapshotStale(snapshot,{graphRevision:7,contextRevisions:{"context:cart":4,"context:shipping":7,"context:payment":12}}).stale,false);
assert.deepEqual(flowDocumentationSnapshotStale(snapshot,{graphRevision:8,contextRevisions:{"context:cart":4,"context:shipping":9,"context:payment":12}}),{stale:true,changedContexts:["Shipping / add_shipping_info"],graphChanged:true});

const workbook=writeFlowDocumentationWorkbook(snapshot,{valueTable:values,matrixTable:matrix});
assert.equal(workbook instanceof Uint8Array,true);assert.equal(new TextDecoder().decode(workbook.slice(0,2)),"PK");
const binary=new TextDecoder().decode(workbook);
for(const sheet of ["Flow values","Capture matrix","Legend and provenance","Export diagnostics"])assert.match(binary,new RegExp(sheet));
assert.doesNotMatch(binary,/<f>/);assert.match(binary,/Draft — incomplete/);assert.match(binary,/&lt;script&gt;/);

console.log("Flow table documentation export tests passed");
