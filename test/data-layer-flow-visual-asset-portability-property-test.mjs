import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {createFlowVisualArchive,createMemoryFlowVisualAssetStore,importFlowVisualArchive} from "../dist/flow-visual-asset-portability.js";
import {readStoredZip} from "../dist/flow-visual-zip.js";

const base=Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64"));
const crcTable=Array.from({length:256},(_,index)=>{let value=index;for(let bit=0;bit<8;bit+=1)value=(value&1)?0xedb88320^(value>>>1):value>>>1;return value>>>0;}),crc32=bytes=>{let value=0xffffffff;for(const byte of bytes)value=crcTable[(value^byte)&255]^(value>>>8);return(value^0xffffffff)>>>0;};
const bodyFor=seed=>{const data=new TextEncoder().encode(`seed\0${seed}`),type=new TextEncoder().encode("tEXt"),chunk=new Uint8Array(12+data.length),view=new DataView(chunk.buffer);view.setUint32(0,data.length);chunk.set(type,4);chunk.set(data,8);view.setUint32(8+data.length,crc32(chunk.slice(4,8+data.length)));const body=new Uint8Array(base.length+chunk.length);body.set(base.slice(0,-12));body.set(chunk,base.length-12);body.set(base.slice(-12),base.length-12+chunk.length);return body;};
const assetFor=(seed,id)=>{const bytes=bodyFor(seed),digest=`sha256:${createHash("sha256").update(bytes).digest("hex")}`;return{metadata:{id,mediaType:"image/png",width:1,height:1,byteLength:bytes.length,digest},body:new Blob([bytes],{type:"image/png"})};};

for(let seed=1;seed<=32;seed+=1){
  const unique=1+seed%7,assets=Array.from({length:unique},(_,index)=>assetFor(seed*13+index,`asset:${index}`)),duplicate={metadata:{...assets[0].metadata,id:"asset:duplicate"},body:assets[0].body},declared=[...assets,duplicate],frames=declared.map(({metadata},index)=>({id:`frame:${index}`,conceptVisual:{id:`attachment:${index}`,assetId:metadata.id,description:`Visual ${index}`}})),project={id:"project:property",name:`Property ${seed}`,collections:{},documentationFlowGraphs:{"flow:property":{pageFrames:frames,occurrences:[],relationships:[]}},conceptVisualAssets:declared.map(({metadata})=>metadata),releases:[]};
  const archive=await createFlowVisualArchive({project,assets:declared}),permuted=await createFlowVisualArchive({project,assets:[...declared].reverse()});
  assert.deepEqual(archive,permuted,"archive bytes are deterministic across input ordering");
  const progress=[],restored=await importFlowVisualArchive(archive,{projectId:`project:copy:${seed}`,id:old=>`copy:${seed}:${old}`,onProgress:value=>progress.push(value)});
  assert.deepEqual(restored.assets.map(({metadata})=>metadata.digest).sort(),declared.map(({metadata})=>metadata.digest).sort(),"all content identities survive round-trip");
  assert.equal(restored.project.documentationFlowGraphs[`copy:${seed}:flow:property`].pageFrames.length,declared.length,"all attachment references survive remapping");
  assert.ok(progress.length>=declared.length&&progress.filter(({phase})=>phase==="validate").every((value,index)=>value.completed===index+1),"validation progress is monotonic across generated asset ranges");
  const store=createMemoryFlowVisualAssetStore();await store.replaceProjectAssets(project.id,declared);assert.equal(store.trace().bodyWrites,unique,"duplicate content produces one body write per digest");store.clearTrace();await store.listMetadata(project.id);const visible=seed%declared.length;for(let index=0;index<visible;index+=1)await store.readBody(project.id,declared[index].metadata.id);assert.equal(store.trace().bodyReads,visible,"hydration reads only the generated visible subset");
  const truncated=archive.slice(0,archive.length-(1+seed%Math.min(archive.length-1,31)));await assert.rejects(()=>importFlowVisualArchive(truncated,{projectId:"project:rejected",id:old=>old}),/incomplete|directory|readable|CRC/i,"truncated archive structures reject across generated cut points");
  if(seed%4===0){const controller=new AbortController();await assert.rejects(()=>importFlowVisualArchive(archive,{signal:controller.signal,onProgress:value=>{if(value.phase==="read")controller.abort();}}),error=>error?.name==="AbortError","cancellation rejects throughout archive inspection ranges");}
  if(seed===1)await assert.rejects(()=>readStoredZip(new Blob([archive]),{entries:2,unpackedBytes:512*1024*1024}),/entry count/i,"entry-count limits reject before unbounded staging");
}

console.log("flow visual asset portability property tests passed");
