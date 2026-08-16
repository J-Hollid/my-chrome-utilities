import {concatFlowVisualZipBytes as concat,FLOW_VISUAL_ZIP_STREAM_CHUNK_BYTES as CHUNK,flowVisualBlobCrc,flowVisualZipEncoder as encoder,flowVisualZipU16 as u16,flowVisualZipU32 as u32,safeFlowVisualArchivePath} from "./flow-visual-zip-primitives.js";

export interface FlowVisualZipSink {write(chunk:Uint8Array):Promise<void>;}
export interface FlowVisualZipEntry {name:string;body:Blob;}
const assertWritableEntry=(entry:FlowVisualZipEntry)=>{if(!safeFlowVisualArchivePath(entry.name))throw new DOMException(`The archive contains an unsafe path: ${entry.name}.`,"DataError");if(entry.body.size>0xffffffff)throw new DOMException(`Archive entry ${entry.name} is too large for ZIP32.`,"QuotaExceededError");};
const writeEntryBody=async(entry:FlowVisualZipEntry,sink:FlowVisualZipSink,signal?:AbortSignal)=>{let written=0,maxChunkBytes=0;for(let offset=0;offset<entry.body.size;offset+=CHUNK){if(signal?.aborted)throw new DOMException("Project archive work was cancelled.","AbortError");const chunk=new Uint8Array(await entry.body.slice(offset,offset+CHUNK).arrayBuffer());await sink.write(chunk);written+=chunk.length;maxChunkBytes=Math.max(maxChunkBytes,chunk.length);}return{written,maxChunkBytes};};

export async function writeStoredZip(entries:AsyncIterable<FlowVisualZipEntry>|Iterable<FlowVisualZipEntry>,sink:FlowVisualZipSink,options:{signal?:AbortSignal;onEntry?:(name:string,index:number)=>void}={}):Promise<{bytesWritten:number;entryCount:number;maxChunkBytes:number}>{
  const directory:Uint8Array[]=[];let offset=0,index=0,maxChunkBytes=0;
  for await(const entry of entries){
    assertWritableEntry(entry);
    const name=encoder.encode(entry.name),crc=await flowVisualBlobCrc(entry.body,options.signal),size=entry.body.size,localHeader=concat([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(size),u32(size),u16(name.length),u16(0),name]);
    await sink.write(localHeader);const bodyResult=await writeEntryBody(entry,sink,options.signal),written=localHeader.length+bodyResult.written;maxChunkBytes=Math.max(maxChunkBytes,bodyResult.maxChunkBytes);
    directory.push(concat([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(size),u32(size),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]));offset+=written;index+=1;options.onEntry?.(entry.name,index);
  }
  if(index>0xffff)throw new DOMException("The archive has excessive entry count.","QuotaExceededError");
  const central=concat(directory),end=concat([u32(0x06054b50),u16(0),u16(0),u16(index),u16(index),u32(central.length),u32(offset),u16(0)]);await sink.write(central);await sink.write(end);
  return{bytesWritten:offset+central.length+end.length,entryCount:index,maxChunkBytes};
}
