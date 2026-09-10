import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readTealiumPage} from '../../../dist/tealium/detection/page-reader.js';
export function identityExamples() {
 const examples=[];
 for(const [fixture,cfg,expected] of [
  ['docs runtime on a CNAME path',{utid:'tealium/docs/202504230113',path:'https://first.party/custom/'},'tealium/docs/202504230113'],
  ['second runtime on a custom path',{utid:'shop/checkout/202609100600'},'shop/checkout/202609100600'],
  ['conflicting hints with valid utid',{utid:'shop/main/202609100601',account:'wrong',profile:'wrong'},'shop/main/202609100601'],
  ['absent runtime identity',{},'unavailable']]) {
  const runtime={cfg,view(){},link(){},loader:{cfg:{21:{}}},sender:{21:{send(){}}}};
  const root={cfg:{env:'prod'},o:{second:runtime}};
  const result=vm.runInNewContext(`(${readTealiumPage.toString()})()`,{window:{utag:root},location:{href:'https://shop.example/'},document:{scripts:[],querySelectorAll:()=>[]},performance:{getEntriesByType:()=>[]},URL});
  const row=result.tags[0];const identity=row.publishId?[row.account,row.profileName,row.publishId].join('/'):'unavailable';
  assert.equal(identity,expected);assert.equal(row.profile,'second');assert.equal(row.environment,null);assert.equal(row.libraryVersion,null);assert.ok(row.senderSource);
  examples.push({fixture,identity});
 }
 return examples;
}
