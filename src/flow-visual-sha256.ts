import {compressFlowVisualSha256} from "./flow-visual-sha256-compression.js";

export class FlowVisualSha256{
  private state=Uint32Array.from([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  private pending=new Uint8Array(64);private pendingBytes=0;private totalBytes=0;private finished=false;
  update(bytes:Uint8Array):void{
    if(this.finished)throw new Error("SHA-256 digest is already complete.");this.totalBytes+=bytes.length;let offset=0;
    if(this.pendingBytes){const count=Math.min(64-this.pendingBytes,bytes.length);this.pending.set(bytes.subarray(0,count),this.pendingBytes);this.pendingBytes+=count;offset=count;if(this.pendingBytes===64){compressFlowVisualSha256(this.state,this.pending);this.pendingBytes=0;}}
    while(offset+64<=bytes.length){compressFlowVisualSha256(this.state,bytes.subarray(offset,offset+64));offset+=64;}
    if(offset<bytes.length){this.pending.set(bytes.subarray(offset),0);this.pendingBytes=bytes.length-offset;}
  }
  hex():string{
    if(this.finished)throw new Error("SHA-256 digest is already complete.");this.finished=true;const tail=new Uint8Array(this.pendingBytes<56?64:128);tail.set(this.pending.subarray(0,this.pendingBytes));tail[this.pendingBytes]=0x80;const bits=BigInt(this.totalBytes)*8n,view=new DataView(tail.buffer);view.setUint32(tail.length-8,Number((bits>>32n)&0xffffffffn));view.setUint32(tail.length-4,Number(bits&0xffffffffn));for(let offset=0;offset<tail.length;offset+=64)compressFlowVisualSha256(this.state,tail.subarray(offset,offset+64));return Array.from(this.state,value=>value.toString(16).padStart(8,"0")).join("");
  }
}
