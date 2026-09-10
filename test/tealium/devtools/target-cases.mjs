import assert from 'node:assert/strict';
import {resolveTagSource} from '../../../dist/tealium/devtools/source.js';
import {checkRegexTargets} from './target-regex-check.mjs';
import {checkStatementTargets} from './target-statement-check.mjs';
export const send='function(a,b){for(var i=0;i<u.extend.length;i++)u.extend[i](a,b);}';
export const extension='function(a,b){window.calls++;return "selected-extension";}';
export const definition=(ext=extension)=>`(function(){var u={};u.extend=[${ext}];u.send=${send};utag.sender[21]=u;})();`;
export function checkSourceTargets() {
 checkRegexTargets();
 checkStatementTargets();
 const url='https://assets.shop.example/custom/bundle.js?revision=7',other=url+'&copy';
 const tag={senderSource:send,extensionSources:[extension],requestUrls:[]};
 const cases=[
  ['two copies inside one known bundle',{...tag,extensionSources:null},[{url,content:send+send}],'allow file start with uncertain location'],
  ['known separate script and another copy',{...tag,requestUrls:[url]},[{url,content:send},{url:other,content:send}],'allow the observed tag script'],
  ['two files with one matching extend array',tag,[{url,content:definition()},{url:other,content:definition('function(){return "other";}')}],'allow the matching file'],
  ['two files with shared send and extend',tag,[{url,content:definition()},{url:other,content:definition()}],'report ambiguous file and disable opening'],
  ['unique extension beside two unbound sends',tag,[{url,content:`var first=${send};var second=${send};var u={};u.extend=[${extension}];`}],'allow file start with uncertain location'],
 ];
 assert.equal(resolveTagSource(tag,[{url,content:JSON.stringify(send)}]).status,'Unresolved','A string is not a registered source definition');
 assert.equal(resolveTagSource(tag,[{url,content:'/* '+send+' */'}]).status,'Unresolved','A comment is not a source definition');
 const examples=[];
 for(const [fixture,row,sources,outcome]of cases){const r=resolveTagSource(row,sources);assert.equal(r.status,outcome.startsWith('report')?'Ambiguous':'Resolved');if(outcome.includes('file start')){assert.equal(r.line,0);assert.equal(r.column,0);assert.equal(r.exact,false);}else if(r.status==='Resolved')assert.equal(r.url,url);examples.push({fixture,outcome});}
 const content=definition('function(){return "wrong";}')+definition();
 for(const [destination,action,label]of [['send','Go to u.send',"the selected tag's send definition"],['extend','Go to u.extend',"the selected tag's extension-array definition"]]){
  const r=resolveTagSource(tag,[{url,content}],destination);const expected=destination==='send'?content.lastIndexOf(send):content.lastIndexOf('u.extend=');assert.equal(r.column,expected);assert.equal(r.exact,true);examples.push({action,destination:label});
 }
 for(const [evidence,extensionSources,content,outcome]of [
  ['absent array',null,definition(),'disabled with u.extend unavailable'],
  ['unreadable array',null,definition(),'disabled with u.extend unavailable'],
  ['empty array with known definition',[],definition(''),'enabled at the empty array definition'],
  ['readable array with only a known file',[extension],'wrapped','enabled at file start with uncertain location']]){
  const r=resolveTagSource({...tag,extensionSources,requestUrls:[url]},[{url,content}],'extend');assert.equal(r.status,extensionSources===null?'Unresolved':'Resolved');if(extensionSources===null)assert.equal(r.detail,'u.extend unavailable');else assert.equal(r.exact,content!=='wrapped');examples.push({evidence,outcome});
 }
 return examples;
}
