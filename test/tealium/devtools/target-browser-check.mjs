import assert from 'node:assert/strict';
import ts from 'typescript';
import {installedTealium} from '../installed.mjs';
import {targetSend} from './target-fixtures.mjs';
const editor=`(async()=>{const S=await import('./panels/sources/sources.js');const v=S.SourcesPanel.SourcesPanel.instance().sourcesView(),s=v.currentSourceFrame()?.textEditor?.state;return {url:v.currentUISourceCode()?.url(),text:s?.doc?.toString(),head:s?.selection?.main?.head};})()`;
const tokens=text=>{const scanner=ts.createScanner(ts.ScriptTarget.Latest,true,ts.LanguageVariant.Standard,text),out=[];while(scanner.scan()!==ts.SyntaxKind.EndOfFileToken)out.push(scanner.getTokenText());return out;};
export async function checkTargetEditors(extensionRoot) {
 const results=[];
 for(const [fixture,suffix,fallback]of [['targets-duplicate','duplicate.js',true],['targets-separate','selected.js',false],['targets-unique','bundle.js',false],['targets-definitions','bundle.js',false],['targets-empty','empty.js',false]]){
  const installed=await installedTealium({extensionRoot,fixtureName:fixture});
  const {browser,native,doc,website,websiteSession}=installed;
  try{
   await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
   const key=await browser.evaluate(native,`${doc}.querySelector('.tag').dataset.key`);
   await browser.call('Target.openDevTools',{targetId:website.targetId});
   const front=await browser.wait('source-target frontend',async()=>(await browser.call('Target.getTargets')).targetInfos.find(t=>t.url.startsWith('devtools://')&&t.title.includes('/'+fixture)));
   const session=await browser.attach(front.targetId);
   await browser.wait('send destination ready',()=>browser.evaluate(native,`!${doc}.querySelector('#show-source').disabled`));
   const requests=await browser.evaluate(websiteSession,"performance.getEntriesByType('resource').map(r=>r.name)");
   await browser.evaluate(native,`${doc}.querySelector('#show-source').click()`);
   let observed=await browser.wait('actual send editor',()=>browser.evaluate(session,editor),v=>v.url?.includes('/targets/'+suffix+'?revision=source-targets')&&v.text?.length);
   if(fallback){assert.equal(observed.head,0);assert.equal(await browser.evaluate(native,`${doc}.querySelector('#feedback').textContent`),'Exact location unavailable; opened file');}
   else {
    const starts=[...observed.text.matchAll(/u\.send\s*=/g)].map(m=>m.index);
    const wanted=observed.text.indexOf('function',starts.at(-1));assert.equal(observed.head,wanted);
   }
   if(['targets-definitions','targets-empty'].includes(fixture)){
    await browser.wait('extend destination ready',()=>browser.evaluate(native,`!${doc}.querySelector('#show-extend').disabled`));
    await browser.evaluate(native,`${doc}.querySelector('#show-extend').click()`);
    observed=await browser.wait('actual extension array selection',()=>browser.evaluate(session,editor),v=>tokens(v.text?.slice(v.head)??'').slice(0,4).join(' ')==='u . extend =');
    assert.equal(observed.head,[...observed.text.matchAll(/u\.extend\s*=/g)].at(-1).index);
    const toggle=`(()=>{function find(root){for(const e of root.querySelectorAll('*')){if(/pretty.?print/i.test(e.getAttribute('aria-label')??e.getAttribute('title')??'')){e.click();return true;}if(e.shadowRoot&&find(e.shadowRoot))return true;}return false;}return find(document);})()`;
    assert.equal(await browser.evaluate(session,toggle),true);
    await browser.wait('formatter changes source',()=>browser.evaluate(session,editor),v=>v.text!==observed.text);
    for(const [id,expected]of [['show-source',tokens(targetSend)],['show-extend',['u','.','extend','=']]]){
     await browser.evaluate(native,`${doc}.querySelector('#${id}').click()`);
     await browser.wait('formatted destination selection',()=>browser.evaluate(session,editor),v=>JSON.stringify(tokens(v.text?.slice(v.head)??'').slice(0,expected.length))===JSON.stringify(expected));
    }
    await browser.evaluate(native,"Array.from(document.querySelectorAll('#workspace-panel-tealium button')).find(b=>b.textContent.includes('full-width')).click()");
    const full=await browser.wait('source-target full-width',async()=>(await browser.call('Target.getTargets')).targetInfos.find(t=>t.url.includes('surface=workbench')&&t.url.includes('/tealium/live/')));
    const expanded=await browser.attach(full.targetId);
    await browser.wait('both full-width destinations visible',()=>browser.evaluate(expanded,"['show-source','show-extend'].every(id=>{const b=document.getElementById(id);return b&&!b.disabled&&b.getBoundingClientRect().width>0})"));
    await browser.evaluate(expanded,"document.querySelector('#show-extend').click()");
    await browser.wait('full-width extension destination',()=>browser.evaluate(session,editor),v=>tokens(v.text?.slice(v.head)??'').slice(0,4).join(' ')==='u . extend =');
   }
   assert.equal(await browser.evaluate(websiteSession,'window.calls'),0);
   assert.deepEqual(await browser.evaluate(websiteSession,"performance.getEntriesByType('resource').map(r=>r.name)"),requests);
   assert.equal(await browser.evaluate(native,`${doc}.querySelector('.tag').dataset.key`),key);
   results.push({fixture,url:observed.url,actualEditor:true,fallback,both:fixture==='targets-definitions'||fixture==='targets-empty',noExecution:true});
  }finally{await installed.close();}
 }
 return results;
}
