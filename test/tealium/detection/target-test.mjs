import assert from 'node:assert/strict';
import {readTarget,validateCurrentTag} from '../../../dist/tealium/detection/browser-target.js';
const tag={uid:'21',profile:'shop',name:'Analytics',senderSource:'function tag(){}'};
const frame={frameId:0,documentId:'old',result:{url:'https://shop.example/',tags:[tag],limits:[],resources:[],childFrames:[],state:'Detected'}};
let responses=[],calls=[];
globalThis.chrome={scripting:{executeScript:async options=>{calls.push(options);return responses.shift();}}};
responses=[[frame],[{frameId:0,documentId:'new',result:'https://shop.example/'}]];
assert.equal((await readTarget(42)).frames.length,0,'A read cannot publish a replaced document');
responses=[[frame],[{frameId:0,documentId:'old',result:'https://shop.example/'}]];
assert.equal((await readTarget(42)).frames[0].documentId,'old');
responses=[[frame]];
await validateCurrentTag({...tag,tabId:42,frameId:0,documentId:'old'});
assert.deepEqual(calls.at(-1).target,{tabId:42,documentIds:['old']});
responses=[[{...frame,documentId:'new'}]];
await assert.rejects(()=>validateCurrentTag({...tag,tabId:42,frameId:0,documentId:'old'}),/no longer current/);
console.log('Tealium target reader rejects replacement documents and binds source checks to document IDs');

responses=[[{...frame,result:{...frame.result,tags:[{...tag,extensionSources:['replacement extension']}]}}]];
await assert.rejects(()=>validateCurrentTag({...tag,extensionSources:['old extension'],tabId:42,frameId:0,documentId:'old'}),/no longer current/);
