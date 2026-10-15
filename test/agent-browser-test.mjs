import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,cp,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {resolveChromeExecutable,headlessChromeArguments,stopHeadlessChrome} from './support/headless-chrome.mjs';
import {evaluate,extensionId,pageSocket} from './support/side-panel-companion/chrome.mjs';
import {startCompanion} from '../companion/server.mjs';
import {change,proposal,templatePlan,workbookFile,eventually} from './agent-support.mjs';

const root=await mkdtemp(join(tmpdir(),'twatility-agent-browser-')),profile=join(root,'chrome'),token='browser-test-token';
let calls=0;
const runner=async(job)=>{
  calls++;
  if(job.request.mode==='both') {
    const result=proposal([change('page','pages','Checkout',{path:'/checkout'})]);result.templates=[templatePlan()];
    result.templates[0].fileId=job.request.files[0].id;return result;
  }
  return proposal([change('event','events','Checkout click',{eventName:'checkout_click',trigger:calls===1?'Click Checkout':'Click Pay',schema:{type:'object',properties:{total:{type:'number'}},required:['total']}})]);
};
const companion=await startCompanion({root:join(root,'companion'),port:0,token,runner,accountProvider:async()=>({protocol:1,service:'twatility-companion',auth:'test-provider',plan:'Test',checkedAt:Date.now()})});
// The browser test pregrants localhost access. Chrome's native permission prompt needs a person.
const extensionRoot=join(root,'extension');await cp(resolve('dist'),extensionRoot,{recursive:true});
const manifest=JSON.parse(await readFile(join(extensionRoot,'manifest.json'),'utf8'));manifest.host_permissions=['http://127.0.0.1/*'];await writeFile(join(extensionRoot,'manifest.json'),JSON.stringify(manifest));
const args=headlessChromeArguments(profile,extensionRoot);args.splice(-1,0,`--load-extension=${extensionRoot}`);
const chrome=spawn(resolveChromeExecutable(),args,{stdio:['ignore','ignore','pipe']});let socket;
const port=await new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(new Error('Chrome start timeout')),20000);chrome.stderr.on('data',chunk=>{output+=chunk;const match=output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//u);if(match){clearTimeout(timeout);resolve(Number(match[1]));}});chrome.once('error',reject);});
try {
  const id=await extensionId(port);socket=await pageSocket(port,`chrome-extension://${id}/specification-builder.html`);
  const waitFor=expression=>eventually(()=>evaluate(socket,expression),20000);
  const click=label=>evaluate(socket,`(()=>{const button=[...document.querySelectorAll('button')].find(button=>button.textContent===${JSON.stringify(label)});if(!button)throw Error('Missing button');button.click();})()`);
  await waitFor(`!!document.querySelector('#specification-agent')`);
  await evaluate(socket,`document.querySelector('#project-name').value='Browser agent project';document.querySelector('#project-site').value='example.test';document.querySelector('#create-project-form').requestSubmit()`);
  await waitFor(`!document.querySelector('#project-workspace').hidden`);
  await click('Specification agent');await waitFor(`document.querySelector('.agent-workspace').open`);
  await evaluate(socket,`document.querySelector('[aria-label="Companion endpoint"]').value=${JSON.stringify(companion.url)};document.querySelector('[aria-label="Connection token"]').value=${JSON.stringify(token)}`);
  // The click has a user gesture, as the installed permission request requires.
  await socket.call('Runtime.evaluate',{expression:`[...document.querySelectorAll('.agent-workspace button')].find(button=>button.textContent==='Connect').click()`,userGesture:true});
  await waitFor(`document.querySelector('.agent-workspace [role=status]').textContent.includes('Connected')`);
  await evaluate(socket,`document.querySelector('[aria-label="Task"]').value='event';document.querySelector('[aria-label="Request"]').value='Draft a checkout click event.'`);
  await click('Create draft');await waitFor(`document.querySelector('.agent-workspace').textContent.includes('Checkout click · events')`);
  await evaluate(socket,`document.querySelector('[aria-label="Revision feedback"]').value='Use Click Pay as the trigger.'`);
  await click('Send feedback and refresh context');await waitFor(`document.querySelector('.agent-workspace').textContent.includes('Click Pay')`);
  await evaluate(socket,`document.querySelector('[aria-label="Decision"]').value='accepted'`);await click('Save decision');
  await waitFor(`document.querySelector('[data-decision=accepted]')!==null`);
  await click('Check accepted changes');await waitFor(`document.querySelector('.agent-workspace [role=status]').textContent.includes('passed the specification checks')`);
  await click('Apply accepted changes');await waitFor(`document.querySelector('.agent-workspace [role=status]').textContent.includes('Saved 1 accepted')`);
  await click('Close');await socket.call('Page.reload');await waitFor(`!!document.querySelector('#specification-agent')`);await click('Specification agent');await waitFor(`document.querySelector('.agent-workspace').open`);
  assert.ok(await evaluate(socket,`document.querySelector('.agent-workspace').textContent.includes('Checkout click · events · saved')`));
  await socket.call('Runtime.evaluate',{expression:`[...document.querySelectorAll('.agent-workspace button')].find(button=>button.textContent==='Connect').click()`,userGesture:true});
  await waitFor(`!document.querySelector('.agent-workspace').hasAttribute('aria-busy')`);
  const source=await workbookFile(),path=join(root,'specification.xlsx');await writeFile(path,Buffer.from(source.base64,'base64'));
  const {root:dom}=await socket.call('DOM.getDocument');const {nodeId}=await socket.call('DOM.querySelector',{nodeId:dom.nodeId,selector:'[aria-label="Excel or screenshot files"]'});await socket.call('DOM.setFileInputFiles',{nodeId,files:[path]});
  await evaluate(socket,`document.querySelector('[aria-label="Task"]').value='both';document.querySelector('[aria-label="Request"]').value='Import this workbook and draft an overview template.';document.querySelector('[aria-label="Import source key"]').value='browser-source'`);
  await click('Create draft');await waitFor(`document.querySelector('.agent-workspace').textContent.includes('Source overview · Export template')`);
  await evaluate(socket,`document.querySelectorAll('[aria-label="Decision"]')[0].value='accepted'`);await click('Save decision');await waitFor(`!document.querySelector('.agent-workspace').hasAttribute('aria-busy')`);
  await click('Apply accepted changes');await waitFor(`document.querySelector('.agent-workspace [role=status]').textContent.includes('Saved 1 accepted')`);
  await evaluate(socket,`const panel=[...document.querySelectorAll('.agent-workspace details')].find(item=>item.querySelector(':scope > summary')?.textContent.startsWith('Source overview'));panel.querySelector('[aria-label="Decision"]').value='accepted';[...panel.querySelectorAll('button')].find(button=>button.textContent==='Save decision').click()`);
  await waitFor(`!document.querySelector('.agent-workspace').hasAttribute('aria-busy')`);
  await click('Preview with project data');await waitFor(`document.querySelector('.agent-workspace [role=status]').textContent.includes('Preview uses')`);
  await click('Save accepted template to project');await waitFor(`document.querySelector('.agent-workspace [role=status]').textContent.includes('Template saved')`);
  const saved=await evaluate(socket,`(async()=>{const {openIndexedDbProjectRepository}=await import('./data-layer-durable-project-repository.js');const repository=await openIndexedDbProjectRepository(indexedDB);const {AgentSessionStore}=await import('./agent-specification/storage.js');const keys=await new Promise((resolve,reject)=>{const request=indexedDB.open('twatility-agent-sessions');request.onsuccess=()=>{const list=request.result.transaction('sessions').objectStore('sessions').getAllKeys();list.onsuccess=()=>resolve(list.result);list.onerror=()=>reject(list.error)}});const review=await new AgentSessionStore().load(keys[0]);const loaded=await repository.loadProject(keys[0]);const template=loaded.state.project.documentation.templates[0];const blob=await repository.loadProjectAssetBody({projectId:keys[0],namespace:'documentation-template',digest:template.digest});return {events:loaded.state.project.collections.events.length,pages:loaded.state.project.collections.pages.length,templates:loaded.state.project.documentation.templates.length,bytes:blob.size,applied:review.review.appliedIds.length};})()`);
  assert.deepEqual({...saved,bytes:0},{events:1,pages:1,templates:1,bytes:0,applied:2});assert.ok(saved.bytes>0);
  console.log('PASS installed Studio: connection, draft, revision, accept, check, durable apply, reload recovery, Excel upload, preview, durable template and asset save. Codex output was a deterministic test fixture.');
} catch(error) {
  if(socket)console.error('Studio status:',await evaluate(socket,`document.querySelector('.agent-workspace [role=status]')?.textContent`));throw error;
} finally {socket?.close();await stopHeadlessChrome(chrome);await companion.close();await rm(root,{recursive:true,force:true});}
