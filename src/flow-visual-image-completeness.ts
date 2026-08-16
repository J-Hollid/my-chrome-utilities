import {flowVisualAscii,flowVisualU32be,flowVisualU32le} from "./flow-visual-image-bytes.js";
import type {FlowVisualMediaType} from "./flow-visual-image-inspection.js";

const completeJpeg=async(body:Blob)=>{const suffix=new Uint8Array(await body.slice(-2).arrayBuffer());return suffix[0]===0xff&&suffix[1]===0xd9;};
const completeWebp=async(body:Blob)=>{const header=new Uint8Array(await body.slice(0,12).arrayBuffer());return header.length===12&&flowVisualU32le(header,4)+8===body.size;};
async function completePng(body:Blob):Promise<boolean>{
  let offset=8,sawImage=false;
  while(offset+12<=body.size){const chunk=await readPngChunk(body,offset);if(!chunk)return false;if(chunk.kind==="IDAT")sawImage=true;if(chunk.kind==="IEND")return completePngEnd(body,chunk,sawImage);offset=chunk.end;}
  return false;
}
const readPngChunk=async(body:Blob,offset:number)=>{const header=new Uint8Array(await body.slice(offset,offset+8).arrayBuffer()),length=flowVisualU32be(header,0),end=offset+12+length;return end<=body.size?{length,kind:flowVisualAscii(header,4,4),end}:undefined;};
const completePngEnd=(body:Blob,chunk:{length:number;end:number},sawImage:boolean)=>sawImage&&chunk.length===0&&chunk.end===body.size;
const structurallyComplete=(body:Blob,mediaType:FlowVisualMediaType)=>mediaType==="image/jpeg"?completeJpeg(body):mediaType==="image/webp"?completeWebp(body):completePng(body);

export async function requireCompleteFlowVisualDecode(body:Blob,mediaType:FlowVisualMediaType):Promise<void>{
  if(typeof createImageBitmap==="function"){let bitmap:ImageBitmap|undefined;try{bitmap=await createImageBitmap(body);if(!bitmap.width||!bitmap.height)throw new Error("empty decode");return;}catch{throw new DOMException(`Visual body is not a completely decodable ${mediaType.replace("image/","").toUpperCase()} image.`,"DataError");}finally{bitmap?.close();}}
  if(!await structurallyComplete(body,mediaType))throw new DOMException(`Visual body is not a complete ${mediaType.replace("image/","").toUpperCase()} image.`,"DataError");
}
