import {flowVisualZipDecoder as decoder,flowVisualZipView16 as view16,flowVisualZipView32 as view32,readFlowVisualZipBytes as readBytes} from "./flow-visual-zip-primitives.js";

export interface FlowVisualZipDirectory {offset:number;size:number;}
const hasExpectedDirectoryCounts=(end:Uint8Array,count:number)=>view16(end,8)===count&&view16(end,10)===count;
const hasExpectedDirectoryBounds=(end:Uint8Array,sourceSize:number,localEnd:number)=>{const size=view32(end,12),offset=view32(end,16);return offset===localEnd&&offset+size===sourceSize-22;};
const validEndRecord=(end:Uint8Array,count:number,sourceSize:number,localEnd:number)=>view32(end,0)===0x06054b50&&hasExpectedDirectoryCounts(end,count)&&view16(end,20)===0&&hasExpectedDirectoryBounds(end,sourceSize,localEnd);

export async function readFlowVisualZipDirectory(source:Blob,entries:Map<string,Blob>,localEnd:number):Promise<FlowVisualZipDirectory>{
  if(!entries.size)throw new DOMException("Choose a readable version 3 project archive.","DataError");
  if(source.size<22)throw new DOMException("The project archive is incomplete.","DataError");
  const end=await readBytes(source,source.size-22,22);if(!validEndRecord(end,entries.size,source.size,localEnd))throw new DOMException("The project archive directory is incomplete or inconsistent.","DataError");return{offset:view32(end,16),size:view32(end,12)};
}

const assertCentralHeader=(header:Uint8Array)=>{if(header.length!==46||view32(header,0)!==0x02014b50)throw new DOMException("The project archive central directory is malformed.","DataError");};
const centralRecordLength=(header:Uint8Array,offset:number,end:number)=>{const nameLength=view16(header,28),length=46+nameLength+view16(header,30)+view16(header,32);if(!nameLength||offset+length>end)throw new DOMException("The project archive central directory is incomplete.","DataError");return{nameLength,length};};
const assertKnownDirectoryEntry=(entries:Map<string,Blob>,name:string)=>{if(!entries.has(name))throw new DOMException(`The project archive directory declares unknown entry ${name}.`,"DataError");};
const assertCompleteDirectory=(offset:number,end:number,count:number,expected:number)=>{if(offset!==end||count!==expected)throw new DOMException("The project archive central directory entry count is inconsistent.","DataError");};

export async function validateFlowVisualZipDirectory(source:Blob,entries:Map<string,Blob>,directory:FlowVisualZipDirectory):Promise<void>{
  let offset=directory.offset,count=0,end=directory.offset+directory.size;
  while(offset<end){const header=await readBytes(source,offset,46);assertCentralHeader(header);const record=centralRecordLength(header,offset,end),name=decoder.decode(await readBytes(source,offset+46,record.nameLength));assertKnownDirectoryEntry(entries,name);count+=1;offset+=record.length;}
  assertCompleteDirectory(offset,end,count,entries.size);
}
