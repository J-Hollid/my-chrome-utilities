import type {FlowConceptVisualAsset} from "./flow-graph/concept-visuals.js";

export const FLOW_VISUAL_THUMBNAIL_SIZE={width:320,height:200,maxBytes:256*1024} as const;

interface FlowVisualThumbnailSettlementOptions{
  projectId:string;
  asset:Omit<FlowConceptVisualAsset,"bytes">&{bytes?:string};
  waitForSave:()=>Promise<void>;
  matchesCurrentAsset:()=>boolean;
  loadThumbnail:()=>Promise<Blob|undefined>;
  loadOriginal:()=>Promise<Blob>;
  createThumbnail:(body:Blob)=>Promise<Blob>;
  storeThumbnail:(projectId:string,assetId:string,body:Blob)=>Promise<void>;
}

const stagedFlowVisualBody=(asset:FlowVisualThumbnailSettlementOptions["asset"]):Blob|undefined=>{
  if(!asset.bytes)return undefined;
  const match=new RegExp(`^data:${asset.mediaType};base64,(.+)$`).exec(asset.bytes);
  if(!match)throw new DOMException(`Visual ${asset.id} has unreadable staged bytes.`,"DataError");
  const raw=atob(match[1]!);
  return new Blob([Uint8Array.from(raw,character=>character.charCodeAt(0))],{type:asset.mediaType});
};

export async function resolveFlowVisualThumbnailAfterSave(options:FlowVisualThumbnailSettlementOptions):Promise<Blob>{
  const staged=stagedFlowVisualBody(options.asset);
  if(staged)await options.waitForSave();
  if(!options.matchesCurrentAsset())throw new DOMException(`Visual asset ${options.asset.id} changed before thumbnail settlement.`,"AbortError");
  const cached=await options.loadThumbnail();
  if(cached)return cached;
  const thumbnail=await options.createThumbnail(staged??await options.loadOriginal());
  await options.storeThumbnail(options.projectId,options.asset.id,thumbnail);
  return thumbnail;
}

const canvasBlob=(canvas:HTMLCanvasElement):Promise<Blob>=>new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new DOMException("The visual thumbnail could not be encoded.","EncodingError")),"image/webp",.82));

export async function createFlowVisualThumbnail(original:Blob):Promise<Blob>{
  if(typeof createImageBitmap!=="function")throw new DOMException("Image decoding is unavailable.","NotSupportedError");const bitmap=await createImageBitmap(original);try{const scale=Math.min(FLOW_VISUAL_THUMBNAIL_SIZE.width/bitmap.width,FLOW_VISUAL_THUMBNAIL_SIZE.height/bitmap.height,1),width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));let result:Blob;if(typeof OffscreenCanvas!=="undefined"){const canvas=new OffscreenCanvas(width,height),context=canvas.getContext("2d");if(!context)throw new DOMException("The visual thumbnail canvas is unavailable.","InvalidStateError");context.drawImage(bitmap,0,0,width,height);result=await canvas.convertToBlob({type:"image/webp",quality:.82});}else{const canvas=document.createElement("canvas"),context=canvas.getContext("2d");canvas.width=width;canvas.height=height;if(!context)throw new DOMException("The visual thumbnail canvas is unavailable.","InvalidStateError");context.drawImage(bitmap,0,0,width,height);result=await canvasBlob(canvas);}if(result.size>FLOW_VISUAL_THUMBNAIL_SIZE.maxBytes)throw new DOMException("The generated visual thumbnail exceeds its cache bound.","QuotaExceededError");return result;}finally{bitmap.close();}
}
