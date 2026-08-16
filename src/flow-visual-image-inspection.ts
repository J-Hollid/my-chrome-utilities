import {requireCompleteFlowVisualDecode} from "./flow-visual-image-completeness.js";
import {inspectFlowVisualJpegDimensions} from "./flow-visual-jpeg-inspection.js";
import {inspectFlowVisualPngDimensions} from "./flow-visual-png-inspection.js";
import {inspectFlowVisualWebpDimensions} from "./flow-visual-webp-inspection.js";

export type FlowVisualMediaType="image/png"|"image/jpeg"|"image/webp";
export {requireCompleteFlowVisualDecode};

export async function inspectFlowVisualImage(body:Blob,mediaType:FlowVisualMediaType):Promise<{width:number;height:number}>{
  const prefix=new Uint8Array(await body.slice(0,Math.min(body.size,128*1024)).arrayBuffer());
  const dimensions=mediaType==="image/png"?inspectFlowVisualPngDimensions(prefix):mediaType==="image/jpeg"?inspectFlowVisualJpegDimensions(prefix):inspectFlowVisualWebpDimensions(prefix);
  if(!dimensions)throw new DOMException(`Visual body is not a valid ${mediaType.replace("image/","").toUpperCase()} image.`,"DataError");
  return dimensions;
}
