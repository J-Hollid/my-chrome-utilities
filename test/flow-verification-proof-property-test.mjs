import assert from "node:assert/strict";

import {
  decodeDevtoolsTextFrame,
  encodeDevtoolsTextFrame,
} from "./support/flow-workspace-r02-runtime.mjs";

let seed=0x51f10a7;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed;};
const scalar=()=>{
  const ranges=[[0x20,0x7e],[0xa0,0x7ff],[0x800,0xd7ff],[0xe000,0xffff],[0x10000,0x10ffff]];
  const [minimum,maximum]=ranges[random()%ranges.length];
  return String.fromCodePoint(minimum+(random()%(maximum-minimum+1)));
};
const payloadWithByteLength=(length)=>{
  let payload="",bytes=0;
  for(let index=0;index<16;index+=1){
    const next=scalar(),nextLength=Buffer.byteLength(next);
    if(bytes+nextLength>length)break;
    payload+=next;bytes+=nextLength;
  }
  return payload+"x".repeat(length-bytes);
};

for(const boundary of [125,126,65535,65536]){
  for(let sample=0;sample<48;sample+=1){
    const length=Math.max(0,boundary-2+(random()%5));
    const payload=payloadWithByteLength(length);
    const mask=Buffer.from([random()&255,random()&255,random()&255,random()&255]);
    const decoded=decodeDevtoolsTextFrame(encodeDevtoolsTextFrame(payload,mask).bytes);
    assert.equal(decoded.valid,true,decoded.message);
    assert.equal(decoded.payloadLength,length);
    assert.equal(decoded.payload,payload);
    assert.deepEqual(decoded.mask,mask);
    assert.equal(decoded.lengthForm,length<126?"short":length<=65535?"uint16":"uint64");
  }
}

console.log("Flow verification proof property tests passed");
