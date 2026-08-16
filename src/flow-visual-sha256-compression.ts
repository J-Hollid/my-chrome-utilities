import {FLOW_VISUAL_SHA256_ROUND_CONSTANTS as K} from "./flow-visual-sha256-constants.js";

const rotate=(value:number,bits:number)=>(value>>>bits)|(value<<(32-bits));

export function compressFlowVisualSha256(state:Uint32Array,block:Uint8Array):void{
  const words=new Uint32Array(64),view=new DataView(block.buffer,block.byteOffset,64);
  for(let index=0;index<16;index+=1)words[index]=view.getUint32(index*4);
  for(let index=16;index<64;index+=1){
    const a=words[index-15]!,b=words[index-2]!,s0=rotate(a,7)^rotate(a,18)^(a>>>3),s1=rotate(b,17)^rotate(b,19)^(b>>>10);
    words[index]=(words[index-16]!+s0+words[index-7]!+s1)>>>0;
  }
  let[a,b,c,d,e,f,g,h]=state;
  for(let index=0;index<64;index+=1){
    const s1=rotate(e!,6)^rotate(e!,11)^rotate(e!,25),choice=(e!&f!)^(~e!&g!),t1=(h!+s1+choice+K[index]!+words[index]!)>>>0,s0=rotate(a!,2)^rotate(a!,13)^rotate(a!,22),majority=(a!&b!)^(a!&c!)^(b!&c!),t2=(s0+majority)>>>0;
    h=g;g=f;f=e;e=(d!+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
  }
  const next=[a,b,c,d,e,f,g,h];
  for(let index=0;index<8;index+=1)state[index]=(state[index]!+next[index]!)>>>0;
}
