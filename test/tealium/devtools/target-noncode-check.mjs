import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {resolveTagSource} from '../../../dist/tealium/devtools/source.js';
export function checkNoncodeTargets() {
 const senderSource='function(a,b){return a+b;}',url='https://example.test/noncode.js';
 const real='const actual='+senderSource+';';
 const contents=[
  'const text = `outer ${`'+senderSource+'`} tail`;',
  'const text = `outer ${String.raw`'+senderSource+'`} tail`;',
  'const text = `outer ${`middle ${`'+senderSource+'`}`} tail`;',
  'const text = `outer ${/'+senderSource+'/} tail`;',
  '<!-- '+senderSource+'\n','--> '+senderSource+'\n',
  '  <!-- '+senderSource+'\r\n','  --> '+senderSource+'\r\n',
  '#! '+senderSource+'\n',
 ];
 for(const content of contents) {
  const variants=[content,content+real];
  if(!content.startsWith('#!'))variants.push(real+'\n'+content);
  for(const text of variants) {
   new Script(text); // Validate script syntax without execution.
   const tag={senderSource,requestUrls:[]};
   assert.equal(resolveTagSource(tag,[{url,content:text}]).status,'Unresolved',content);
   const known=resolveTagSource({...tag,requestUrls:[url]},[{url,content:text}]);
   assert.equal(known.status,'Resolved');assert.equal(known.exact,false,content);
   assert.equal(known.line,0);assert.equal(known.column,0);
  }
 }
 // Literal delimiters inside ordinary strings or escaped template text are safe.
 for(const prefix of ['const text="<!-- --> ${";','const text=`literal '+senderSource+'`;',
  'const text=`escaped \\${literal}`;',
  'const text=`outer ${"'+senderSource+'"} tail`;',
  'const text=`outer ${({text:"'+senderSource+'"}).text} tail`;',
  'const text=`outer ${call([1,2], {value:"}"})} tail`;']) {
  assert.equal(resolveTagSource({senderSource,requestUrls:[]},[{url,content:prefix}]).status,'Unresolved');
  assert.equal(resolveTagSource({senderSource,requestUrls:[url]},[{url,content:prefix}]).exact,false);
  const content=prefix+real;new Function(content);
  const result=resolveTagSource({senderSource,requestUrls:[]},[{url,content}]);
  assert.equal(result.exact,true,prefix);assert.equal(result.column,prefix.length+real.indexOf(senderSource));
 }
}
