export type FlowVisualMediaType="image/png"|"image/jpeg"|"image/webp";
export interface FlowVisualAssetMetadata {id:string;mediaType:FlowVisualMediaType;width:number;height:number;byteLength:number;digest:string;}

export const FLOW_VISUAL_LIMITS={sourceBytes:5*1024*1024,dimension:4096,pixels:16_000_000} as const;

const hex=(value:ArrayBuffer)=>Array.from(new Uint8Array(value),byte=>byte.toString(16).padStart(2,"0")).join("");
export const flowVisualDigest=async(value:Blob|Uint8Array):Promise<string>=>{
  const bytes=value instanceof Blob?await value.arrayBuffer():Uint8Array.from(value).buffer;
  return`sha256:${hex(await crypto.subtle.digest("SHA-256",bytes))}`;
};

export function validateFlowVisualMetadata(value:FlowVisualAssetMetadata):void{
  if(!value.id||!/^image\/(?:png|jpeg|webp)$/.test(value.mediaType))throw new DOMException("A visual asset has unsupported metadata.","DataError");
  if(!Number.isInteger(value.width)||!Number.isInteger(value.height)||value.width<1||value.height<1||value.width>FLOW_VISUAL_LIMITS.dimension||value.height>FLOW_VISUAL_LIMITS.dimension||value.width*value.height>FLOW_VISUAL_LIMITS.pixels)throw new DOMException(`Visual ${value.id} dimensions exceed the supported limit.`,"DataError");
  if(!Number.isInteger(value.byteLength)||value.byteLength<1||value.byteLength>FLOW_VISUAL_LIMITS.sourceBytes)throw new DOMException(`Visual ${value.id} exceeds the supported byte limit.`,"DataError");
  if(!/^sha256:[0-9a-f]{64}$/.test(value.digest))throw new DOMException(`Visual ${value.id} has an invalid SHA-256 digest.`,"DataError");
}

const ascii=(bytes:Uint8Array,start:number,length:number)=>new TextDecoder().decode(bytes.slice(start,start+length));
const u16be=(bytes:Uint8Array,offset:number)=>new DataView(bytes.buffer,bytes.byteOffset+offset,2).getUint16(0,false);
const u24le=(bytes:Uint8Array,offset:number)=>bytes[offset]!|(bytes[offset+1]!<<8)|(bytes[offset+2]!<<16);
const u32be=(bytes:Uint8Array,offset:number)=>new DataView(bytes.buffer,bytes.byteOffset+offset,4).getUint32(0,false);
const u32le=(bytes:Uint8Array,offset:number)=>new DataView(bytes.buffer,bytes.byteOffset+offset,4).getUint32(0,true);

function pngDimensions(bytes:Uint8Array){
  if(bytes.length<24||![137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value)||ascii(bytes,12,4)!=="IHDR")return undefined;
  return{width:u32be(bytes,16),height:u32be(bytes,20)};
}
function jpegDimensions(bytes:Uint8Array){
  if(bytes.length<4||bytes[0]!==0xff||bytes[1]!==0xd8||bytes[2]!==0xff)return undefined;
  let offset=2;
  while(offset+4<=bytes.length){while(bytes[offset]===0xff)offset+=1;const marker=bytes[offset++]!;if(marker===0xd9||marker===0xda)break;if(offset+2>bytes.length)return undefined;const length=u16be(bytes,offset);if(length<2||offset+length>bytes.length)return undefined;if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&length>=7)return{width:u16be(bytes,offset+5),height:u16be(bytes,offset+3)};offset+=length;}
  return undefined;
}
function webpDimensions(bytes:Uint8Array){
  if(bytes.length<30||ascii(bytes,0,4)!=="RIFF"||ascii(bytes,8,4)!=="WEBP")return undefined;
  const kind=ascii(bytes,12,4);
  if(kind==="VP8X")return{width:1+u24le(bytes,24),height:1+u24le(bytes,27)};
  if(kind==="VP8 "&&bytes.length>=30&&bytes[23]===0x9d&&bytes[24]===0x01&&bytes[25]===0x2a)return{width:u16be(Uint8Array.of(bytes[27]!,bytes[26]!),0)&0x3fff,height:u16be(Uint8Array.of(bytes[29]!,bytes[28]!),0)&0x3fff};
  if(kind==="VP8L"&&bytes.length>=25&&bytes[20]===0x2f){const bits=u32le(bytes,21);return{width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};}
  return undefined;
}

export async function inspectFlowVisualBody(body:Blob,mediaType:FlowVisualMediaType):Promise<{width:number;height:number}>{
  const prefix=new Uint8Array(await body.slice(0,Math.min(body.size,128*1024)).arrayBuffer());
  const dimensions=mediaType==="image/png"?pngDimensions(prefix):mediaType==="image/jpeg"?jpegDimensions(prefix):webpDimensions(prefix);
  if(!dimensions)throw new DOMException(`Visual body is not a valid ${mediaType.replace("image/","").toUpperCase()} image.`,"DataError");
  return dimensions;
}

export async function validateFlowVisualBody(metadata:FlowVisualAssetMetadata,body:Blob):Promise<void>{
  validateFlowVisualMetadata(metadata);
  if(body.size!==metadata.byteLength)throw new DOMException(`Visual ${metadata.id} byte length does not match its metadata.`,"DataError");
  const dimensions=await inspectFlowVisualBody(body,metadata.mediaType);
  if(dimensions.width!==metadata.width||dimensions.height!==metadata.height)throw new DOMException(`Visual ${metadata.id} decoded dimensions do not match its metadata.`,"DataError");
  if(await flowVisualDigest(body)!==metadata.digest)throw new DOMException(`Visual ${metadata.id} digest does not match its original body.`,"DataError");
}
