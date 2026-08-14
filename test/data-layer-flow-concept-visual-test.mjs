import assert from "node:assert/strict";

import {createSpecificationProject,addProjectEntity,undoProjectTransaction} from "../dist/data-layer-specification-project.js";
import {addUngroupedPageFrame,addGraphOccurrence} from "../dist/data-layer-flow-graph.js";
import {
  attachFlowConceptVisual,
  duplicateFlowConceptVisualAttachment,
  removeFlowConceptVisual,
  validateFlowConceptVisualSource,
} from "../dist/flow-graph/concept-visuals.js";

let sequence=0;
const id=(kind)=>`${kind}:${++sequence}`;
let state=createSpecificationProject({name:"Retail",site:"retail.example",id});
state=addProjectEntity(state,"pages",{name:"Cart"},id);
state=addProjectEntity(state,"events",{name:"Payment",eventName:"add_payment_info"},id);
state=addProjectEntity(state,"flows",{name:"Checkout"},id);
const page=state.project.collections.pages[0],event=state.project.collections.events[0],flow=state.project.collections.flows[0];
state=addUngroupedPageFrame(state,flow.id,{name:"Cart",pageId:page.id,y:60},id);
const frame=state.project.documentationFlowGraphs[flow.id].pageFrames[0];
state=addGraphOccurrence(state,flow.id,{name:"add_payment_info",pageFrameId:frame.id,pageId:page.id,eventId:event.id,obligation:"Required",minimum:1,maximum:1,x:24,y:70},id);
const occurrence=state.project.documentationFlowGraphs[flow.id].occurrences[0];
const raster={mediaType:"image/png",width:320,height:200,bytes:"iVBORw0KGgoAAA",byteLength:11,digest:"sha256:shared"};

assert.deepEqual(validateFlowConceptVisualSource({...raster,sourceByteLength:1024}),{valid:true});
assert.equal(validateFlowConceptVisualSource({...raster,mediaType:"image/svg+xml",sourceByteLength:100}).diagnostic,"Choose a PNG, JPEG, or WebP image");
assert.equal(validateFlowConceptVisualSource({...raster,sourceByteLength:5*1024*1024+1}).diagnostic,"The visual is too large");
assert.equal(validateFlowConceptVisualSource({...raster,width:4097,sourceByteLength:100}).diagnostic,"The visual dimensions exceed 4096 pixels");
assert.equal(validateFlowConceptVisualSource({...raster,width:4096,height:4096,sourceByteLength:100}).diagnostic,"The visual exceeds 16 megapixels");

const canonicalBefore=JSON.stringify({pages:state.project.collections.pages,events:state.project.collections.events});
state=attachFlowConceptVisual(state,flow.id,{kind:"page-frame",id:frame.id},{raster,description:"Cart after address completion",caption:"Checkout review",sourceReference:"https://figma.example/cart"},id);
state=attachFlowConceptVisual(state,flow.id,{kind:"occurrence",id:occurrence.id},{raster,description:"Payment after submission"},id);
assert.equal(state.project.conceptVisualAssets.length,1,"byte-identical visuals share one project asset");
const graph=state.project.documentationFlowGraphs[flow.id],pageAttachment=graph.pageFrames[0].conceptVisual,eventAttachment=graph.occurrences[0].conceptVisual;
assert.notEqual(pageAttachment.id,eventAttachment.id,"contextual attachments retain independent identity");
assert.equal(pageAttachment.assetId,eventAttachment.assetId,"attachments share the normalized asset identity");
assert.equal(pageAttachment.description,"Cart after address completion");
assert.equal(eventAttachment.description,"Payment after submission");
assert.equal(JSON.stringify({pages:state.project.collections.pages,events:state.project.collections.events}),canonicalBefore,"Flow visuals do not alter canonical Page or Event definitions");

state=duplicateFlowConceptVisualAttachment(state,flow.id,{kind:"page-frame",id:frame.id},{kind:"occurrence",id:occurrence.id},id);
assert.equal(state.project.conceptVisualAssets.length,1);
assert.notEqual(state.project.documentationFlowGraphs[flow.id].occurrences[0].conceptVisual.id,pageAttachment.id);
state=removeFlowConceptVisual(state,flow.id,{kind:"page-frame",id:frame.id});
assert.equal(state.project.conceptVisualAssets.length,1,"an asset remains while another attachment references it");
state=removeFlowConceptVisual(state,flow.id,{kind:"occurrence",id:occurrence.id});
assert.equal(state.project.conceptVisualAssets.length,0,"last-reference removal cleans up bytes atomically");
state=undoProjectTransaction(state);
assert.equal(state.project.conceptVisualAssets.length,1,"Undo restores the same asset");
assert.equal(state.project.documentationFlowGraphs[flow.id].occurrences[0].conceptVisual.assetId,pageAttachment.assetId);

console.log("Flow concept visual semantic tests passed");
