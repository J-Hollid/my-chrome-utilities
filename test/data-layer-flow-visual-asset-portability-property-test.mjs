import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {createFlowVisualArchive,createMemoryFlowVisualAssetStore,importFlowVisualArchive} from "../dist/flow-visual-asset-portability.js";

const base=Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64"));
const bodyFor=seed=>{const body=new Uint8Array(base.length+seed%17);body.set(base);for(let index=base.length;index<body.length;index+=1)body[index]=(seed*31+index*17)&255;return body;};
const assetFor=(seed,id)=>{const bytes=bodyFor(seed),digest=`sha256:${createHash("sha256").update(bytes).digest("hex")}`;return{metadata:{id,mediaType:"image/png",width:1,height:1,byteLength:bytes.length,digest},body:new Blob([bytes],{type:"image/png"})};};

for(let seed=1;seed<=32;seed+=1){
  const unique=1+seed%7,assets=Array.from({length:unique},(_,index)=>assetFor(seed*13+index,`asset:${index}`)),duplicate={metadata:{...assets[0].metadata,id:"asset:duplicate"},body:assets[0].body},declared=[...assets,duplicate],frames=declared.map(({metadata},index)=>({id:`frame:${index}`,conceptVisual:{id:`attachment:${index}`,assetId:metadata.id,description:`Visual ${index}`}})),project={id:"project:property",name:`Property ${seed}`,collections:{},documentationFlowGraphs:{"flow:property":{pageFrames:frames,occurrences:[],relationships:[]}},conceptVisualAssets:declared.map(({metadata})=>metadata),releases:[]};
  const archive=await createFlowVisualArchive({project,assets:declared}),permuted=await createFlowVisualArchive({project,assets:[...declared].reverse()});
  assert.deepEqual(archive,permuted,"archive bytes are deterministic across input ordering");
  const restored=await importFlowVisualArchive(archive,{projectId:`project:copy:${seed}`,id:old=>`copy:${seed}:${old}`});
  assert.deepEqual(restored.assets.map(({metadata})=>metadata.digest).sort(),declared.map(({metadata})=>metadata.digest).sort(),"all content identities survive round-trip");
  assert.equal(restored.project.documentationFlowGraphs[`copy:${seed}:flow:property`].pageFrames.length,declared.length,"all attachment references survive remapping");
  const store=createMemoryFlowVisualAssetStore();await store.replaceProjectAssets(project.id,declared);assert.equal(store.trace().bodyWrites,unique,"duplicate content produces one body write per digest");
}

console.log("flow visual asset portability property tests passed");
