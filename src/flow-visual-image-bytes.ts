export const flowVisualAscii=(bytes:Uint8Array,start:number,length:number)=>new TextDecoder().decode(bytes.slice(start,start+length));
export const flowVisualU16be=(bytes:Uint8Array,offset:number)=>new DataView(bytes.buffer,bytes.byteOffset+offset,2).getUint16(0,false);
export const flowVisualU24le=(bytes:Uint8Array,offset:number)=>bytes[offset]!|(bytes[offset+1]!<<8)|(bytes[offset+2]!<<16);
export const flowVisualU32be=(bytes:Uint8Array,offset:number)=>new DataView(bytes.buffer,bytes.byteOffset+offset,4).getUint32(0,false);
export const flowVisualU32le=(bytes:Uint8Array,offset:number)=>new DataView(bytes.buffer,bytes.byteOffset+offset,4).getUint32(0,true);
