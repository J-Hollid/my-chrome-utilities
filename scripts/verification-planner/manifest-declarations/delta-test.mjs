import assert from 'node:assert/strict';
import {manifestDeclarationDelta, parseUnambiguousJson} from './delta.mjs';

const base={manifest_version:3,name:'Fixture',version:'1',permissions:['activeTab'],
  background:{service_worker:'background.js',type:'module'}};
const before=JSON.stringify(base);
const after=JSON.stringify({...base,devtools_page:'tools/devtools.html'});
assert.deepEqual(manifestDeclarationDelta(before,after),{before:null,after:'tools/devtools.html'});
assert.deepEqual(manifestDeclarationDelta(after,before),{before:'tools/devtools.html',after:null});
assert.equal(manifestDeclarationDelta(before,before),null);
for(const [field,value] of Object.entries({permissions:['debugger'],commands:{x:{}},
  background:{service_worker:'other.js'},name:'Changed',optional_host_permissions:['<all_urls>'],
  unknown:true})) {
  assert.equal(manifestDeclarationDelta(before,JSON.stringify({...base,[field]:value,
    devtools_page:'tools/devtools.html'})),null,field);
}
for(const resource of ['https://host/a.html','/a.html','../a.html','a/../b.html',
  'a.html?x=1','a.html#x','a%2ehtml','a\\b.html','a//b.html','a.js','',null,{}]) {
  assert.equal(manifestDeclarationDelta(before,JSON.stringify({...base,devtools_page:resource})),null,
    JSON.stringify(resource));
}
for(const text of ['{"permissions":[],"permissions":["debugger"]}',
  '{"permissions":[],"permissi\\u006fns":[]}',
  '{"x":{"a":1,"a":2}}','{"x":[{"a":1,"a":2}]}','{']) {
  assert.throws(()=>parseUnambiguousJson(text));
  assert.equal(manifestDeclarationDelta(before,text),null);
}
assert.deepEqual(parseUnambiguousJson('{"a":"text: {\\\"a\\\":1}","b":[{"a":2}]}'),
  {a:'text: {"a":1}',b:[{a:2}]});
assert.equal(manifestDeclarationDelta('[]',after),null);
console.log('Manifest field and duplicate-key checks passed');
