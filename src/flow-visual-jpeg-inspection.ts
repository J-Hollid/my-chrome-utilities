import {flowVisualU16be} from "./flow-visual-image-bytes.js";

export function inspectFlowVisualJpegDimensions(bytes:Uint8Array){
  if(!hasJpegHeader(bytes))return undefined;
  let offset=2;
  while(hasJpegSegment(bytes,offset)){
    const next=nextJpegMarker(bytes,offset),marker=next.marker;offset=next.offset;
    if(endsJpegMetadata(marker))break;
    const length=jpegSegmentLength(bytes,offset);
    if(length===undefined)return undefined;
    const dimensions=jpegDimensions(bytes,offset,marker,length);if(dimensions)return dimensions;
    offset+=length;
  }
  return undefined;
}

const hasJpegHeader=(bytes:Uint8Array)=>bytes.length>=4&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
const hasJpegSegment=(bytes:Uint8Array,offset:number)=>offset+4<=bytes.length;
const nextJpegMarker=(bytes:Uint8Array,start:number)=>{let offset=start;while(bytes[offset]===0xff)offset+=1;return{marker:bytes[offset]!,offset:offset+1};};
const endsJpegMetadata=(marker:number)=>marker===0xd9||marker===0xda;
const isJpegSizeMarker=(marker:number)=>[0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker);
const jpegDimensions=(bytes:Uint8Array,offset:number,marker:number,length:number)=>isJpegSizeMarker(marker)&&length>=7?{width:flowVisualU16be(bytes,offset+5),height:flowVisualU16be(bytes,offset+3)}:undefined;
const jpegSegmentLength=(bytes:Uint8Array,offset:number)=>{if(offset+2>bytes.length)return undefined;const length=flowVisualU16be(bytes,offset);return length>=2&&offset+length<=bytes.length?length:undefined;};
