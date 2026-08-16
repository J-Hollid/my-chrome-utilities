export const flowVisualZipEncoder=new TextEncoder(),flowVisualZipDecoder=new TextDecoder();
export const FLOW_VISUAL_ZIP_STREAM_CHUNK_BYTES=64*1024;
const crcTable=Array.from({length:256},(_,index)=>{let value=index;for(let bit=0;bit<8;bit+=1)value=(value&1)?0xedb88320^(value>>>1):value>>>1;return value>>>0;});
const crcUpdate=(value:number,bytes:Uint8Array)=>{for(const byte of bytes)value=crcTable[(value^byte)&255]!^(value>>>8);return value;};
export const flowVisualZipU16=(value:number)=>Uint8Array.of(value&255,(value>>>8)&255);
export const flowVisualZipU32=(value:number)=>Uint8Array.of(value&255,(value>>>8)&255,(value>>>16)&255,(value>>>24)&255);
export const concatFlowVisualZipBytes=(parts:readonly Uint8Array[])=>{const output=new Uint8Array(parts.reduce((total,part)=>total+part.length,0));let offset=0;for(const part of parts){output.set(part,offset);offset+=part.length;}return output;};
export const flowVisualZipView32=(bytes:Uint8Array,offset:number)=>new DataView(bytes.buffer,bytes.byteOffset+offset,4).getUint32(0,true);
export const flowVisualZipView16=(bytes:Uint8Array,offset:number)=>new DataView(bytes.buffer,bytes.byteOffset+offset,2).getUint16(0,true);
export const safeFlowVisualArchivePath=(name:string)=>Boolean(name&&!name.startsWith("/")&&!name.includes("\\")&&!name.split("/").some(part=>part===""||part==="."||part===".."));
export const readFlowVisualZipBytes=async(source:Blob,start:number,length:number)=>new Uint8Array(await source.slice(start,start+length).arrayBuffer());

export async function flowVisualBlobCrc(body:Blob,signal?:AbortSignal):Promise<number>{
  let value=0xffffffff;
  for(let offset=0;offset<body.size;offset+=FLOW_VISUAL_ZIP_STREAM_CHUNK_BYTES){if(signal?.aborted)throw new DOMException("Project archive work was cancelled.","AbortError");value=crcUpdate(value,new Uint8Array(await body.slice(offset,offset+FLOW_VISUAL_ZIP_STREAM_CHUNK_BYTES).arrayBuffer()));}
  return(value^0xffffffff)>>>0;
}
