import assert from "node:assert/strict";

import {createSpecificationProject,addProjectEntity,undoProjectTransaction} from "../dist/data-layer-specification-project.js";
import {
  addUngroupedPageFrame,
  addGraphOccurrence,
  duplicateGraphOccurrence,
  removeFlowPageFrame,
  removeGraphOccurrence,
} from "../dist/data-layer-flow-graph.js";
import {
  attachFlowConceptVisual,
  validateFlowConceptVisualSource,
} from "../dist/flow-graph/concept-visuals.js";
import {flowConceptVisualEditorDiagnostic} from "../dist/flow-graph/concept-visual-ui.js";

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
assert.equal(flowConceptVisualEditorDiagnostic("Saved description","Choose a valid PNG image"),"Choose a valid PNG image","a file diagnostic is not overwritten by description validity");
assert.equal(flowConceptVisualEditorDiagnostic("",""),"Description is required");

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

const replacement={mediaType:"image/webp",width:400,height:250,bytes:"data:image/webp;base64,UklGRg==",byteLength:8,digest:"sha256:replacement"};
state=attachFlowConceptVisual(state,flow.id,{kind:"page-frame",id:frame.id},{raster:replacement,description:"Replacement Cart"},id);
assert.deepEqual(state.project.conceptVisualAssets.map(({digest})=>digest).sort(),[raster.digest,replacement.digest].sort(),"replacement retains an asset that another attachment still references");
assert.equal(state.project.documentationFlowGraphs[flow.id].pageFrames[0].conceptVisual.id,pageAttachment.id,"replacement preserves attachment identity");
state=attachFlowConceptVisual(state,flow.id,{kind:"occurrence",id:occurrence.id},{raster:replacement,description:"Replacement Payment"},id);
assert.deepEqual(state.project.conceptVisualAssets.map(({digest})=>digest),[replacement.digest],"replacement removes the old asset after its last reference changes");
state=undoProjectTransaction(state);
assert.deepEqual(state.project.conceptVisualAssets.map(({digest})=>digest).sort(),[raster.digest,replacement.digest].sort(),"Undo restores the replaced occurrence asset and attachment");
state=undoProjectTransaction(state);
assert.deepEqual(state.project.conceptVisualAssets.map(({digest})=>digest),[raster.digest],"Undo restores the original shared asset registry exactly");

state=duplicateGraphOccurrence(state,flow.id,occurrence.id,id);
const duplicate=state.project.documentationFlowGraphs[flow.id].occurrences.at(-1);
assert.equal(state.project.conceptVisualAssets.length,1);
assert.notEqual(duplicate.conceptVisual.id,eventAttachment.id,"production occurrence duplication creates a distinct attachment identity");
assert.equal(duplicate.conceptVisual.assetId,eventAttachment.assetId,"production occurrence duplication reuses the shared asset");
assert.equal(duplicate.conceptVisual.description,eventAttachment.description,"production occurrence duplication copies contextual metadata");
state=removeGraphOccurrence(state,flow.id,duplicate.id);
assert.equal(state.project.conceptVisualAssets.length,1,"removing a duplicated occurrence retains the asset referenced by its source");
state=removeGraphOccurrence(state,flow.id,occurrence.id);
assert.equal(state.project.conceptVisualAssets.length,1,"an asset remains while another attachment references it");
state=removeFlowPageFrame(state,flow.id,frame.id);
assert.equal(state.project.conceptVisualAssets.length,0,"last-reference removal cleans up bytes atomically");
state=undoProjectTransaction(state);
assert.equal(state.project.conceptVisualAssets.length,1,"Undo restores the same asset");
assert.equal(state.project.documentationFlowGraphs[flow.id].pageFrames[0].conceptVisual.assetId,pageAttachment.assetId);

console.log("Flow concept visual semantic tests passed");
