import {flowVisualAscii,flowVisualU32be} from "./flow-visual-image-bytes.js";

export function inspectFlowVisualPngDimensions(bytes:Uint8Array){
  if(bytes.length<24||![137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value)||flowVisualAscii(bytes,12,4)!=="IHDR")return undefined;
  return{width:flowVisualU32be(bytes,16),height:flowVisualU32be(bytes,20)};
}
