import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const wait=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
const chromeAdapterSource=`(()=>{const calls=[];globalThis.__chromeAdapter={calls};const event=(name)=>({addListener(listener){calls.push('listen:'+name);globalThis.__chromeAdapter[name]=listener;}});globalThis.chrome={runtime:{onMessage:event('runtime.onMessage')},tabs:{async query(){calls.push('tabs.query');return [{id:7,windowId:1,active:true,title:'Fixture tab',url:'https://example.test/checkout'}];},async get(id){calls.push('tabs.get:'+id);return {id,windowId:1,title:'Fixture tab',url:'https://example.test/checkout'};},onUpdated:event('tabs.onUpdated'),onRemoved:event('tabs.onRemoved')},permissions:{async contains(){calls.push('permissions.contains');return true;},async request(){calls.push('permissions.request');return true;},onRemoved:event('permissions.onRemoved')},windows:{async getCurrent(){calls.push('windows.getCurrent');return {id:1};}},scripting:{async executeScript(){calls.push('scripting.executeScript');return [{result:{success:true,result:'pushed'}}];}}};})()`;
const dataLayerPanelByPack={capture:"data-layer-panel-live","live-flow-testing":"data-layer-panel-live","event-library":"data-layer-panel-library",schemas:"data-layer-panel-schemas",defects:"data-layer-panel-defects",replay:"data-layer-panel-library"};
function isolationScope(id){
  if(id==="command-palette")return {utilityId:"command-palette",panelIds:["palette"],removeSelectors:["#utility-directory","#observation-target-picker","#workspace-tabs"]};
  if(id==="hotkeys")return {utilityId:"hotkeys",panelIds:["workspace-panel-hotkeys"],removeSelectors:["#utility-directory","#observation-target-picker"]};
  const removeSelectors=["#utility-directory","#observation-target-picker"];
  if(id==="event-library")removeSelectors.push("#sequence-library");
  if(id==="replay")removeSelectors.push("#event-template-master","#event-property-editor","#event-template-result");
  return {utilityId:"data-layer",panelIds:["workspace-panel-data-layer",dataLayerPanelByPack[id]],removeSelectors};
}
function isolationQuery(id){
  if(id==="shell")return "";
  const scope=isolationScope(id),parameters=new URLSearchParams({utility:scope.utilityId});
  for(const panel of scope.panelIds)parameters.append("panel",panel);
  for(const selector of scope.removeSelectors)parameters.append("remove",selector);
  return `?${parameters}`;
}
function isolationAssertionExpression(id){
  if(id==="shell")return "true";
  if(id==="command-palette")return "!document.querySelector('#workspace-panel-data-layer,#workspace-panel-hotkeys,#utility-directory,#observation-target-picker')";
  if(id==="hotkeys")return "!document.querySelector('#workspace-panel-data-layer,#palette,#utility-directory,#observation-target-picker')";
  const owned=dataLayerPanelByPack[id];
  const packSpecific=id==="event-library"?"&& !document.querySelector('#sequence-library')":id==="replay"?"&& !document.querySelector('#event-template-master,#event-property-editor')":"";
  return `document.querySelectorAll('[id^="data-layer-panel-"]').length===1 && document.querySelector('#${owned}')!==null && !document.querySelector('#workspace-panel-hotkeys,#palette,#utility-directory,#observation-target-picker') ${packSpecific}`;
}
const accessibilityAssertionExpression=`(()=>{const visible=(element)=>element.getClientRects().length>0;const named=(element)=>{const ariaLabel=element.getAttribute('aria-label')?.trim();if(ariaLabel)return true;const labelledBy=element.getAttribute('aria-labelledby')?.trim().split(/\\s+/).filter(Boolean)??[];if(labelledBy.length&&labelledBy.every(id=>document.getElementById(id)?.textContent?.trim()))return true;if('labels' in element&&[...element.labels].some(label=>label.textContent?.trim()))return true;return Boolean(element.textContent?.trim()||element.getAttribute('title')?.trim());};const controls=[...document.querySelectorAll('button,input:not([type="hidden"]),select,textarea,[role="button"],[role="tab"],[role="combobox"],[role="textbox"]')].filter(visible);const unnamed=controls.filter(element=>!named(element));const references=[...document.querySelectorAll('[aria-controls],[aria-labelledby]')].flatMap(element=>['aria-controls','aria-labelledby'].flatMap(attribute=>(element.getAttribute(attribute)?.trim().split(/\\s+/).filter(Boolean)??[]).filter(id=>!document.getElementById(id)).map(id=>({attribute,id,element:element.id}))));return {passed:unnamed.length===0&&references.length===0,unnamed:unnamed.map(element=>element.id||element.outerHTML.slice(0,80)),references};})()`;
class DevtoolsSocket{
  constructor(url){this.url=new URL(url);this.nextId=1;this.pending=new Map();this.buffer=Buffer.alloc(0);}
  async connect(){await new Promise((resolve,reject)=>{this.socket=net.createConnection({host:this.url.hostname,port:Number(this.url.port)});this.socket.once("error",reject);this.socket.once("connect",()=>{const key=Buffer.from(String(Math.random())).toString("base64");this.socket.write([`GET ${this.url.pathname}${this.url.search} HTTP/1.1`,`Host: ${this.url.host}`,"Upgrade: websocket","Connection: Upgrade",`Sec-WebSocket-Key: ${key}`,"Sec-WebSocket-Version: 13","\r\n"].join("\r\n"));});let handshake="";const receive=(chunk)=>{handshake+=chunk.toString("binary");const end=handshake.indexOf("\r\n\r\n");if(end<0)return;this.socket.off("data",receive);if(!handshake.startsWith("HTTP/1.1 101")){reject(new Error("DevTools WebSocket upgrade failed"));return;}const remaining=Buffer.from(handshake.slice(end+4),"binary");this.socket.on("data",(data)=>this.receive(data));if(remaining.length)this.receive(remaining);resolve();};this.socket.on("data",receive);});}
  receive(chunk){this.buffer=Buffer.concat([this.buffer,chunk]);while(this.buffer.length>=2){const first=this.buffer[0];let length=this.buffer[1]&0x7f,offset=2;if(length===126){if(this.buffer.length<4)return;length=this.buffer.readUInt16BE(2);offset=4;}else if(length===127){if(this.buffer.length<10)return;length=Number(this.buffer.readBigUInt64BE(2));offset=10;}if(this.buffer.length<offset+length)return;const payload=this.buffer.subarray(offset,offset+length);this.buffer=this.buffer.subarray(offset+length);if((first&15)!==1)continue;const message=JSON.parse(payload.toString("utf8")),pending=this.pending.get(message.id);if(!pending)continue;this.pending.delete(message.id);message.error?pending.reject(new Error(message.error.message)):pending.resolve(message.result);}}
  call(method,params={}){const id=this.nextId++;this.send({id,method,params});return new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}));}
  send(payload){const text=Buffer.from(JSON.stringify(payload)),mask=Buffer.from([1,2,3,4]);let header;if(text.length<126)header=Buffer.from([0x81,0x80|text.length]);else{header=Buffer.alloc(4);header[0]=0x81;header[1]=0x80|126;header.writeUInt16BE(text.length,2);}const body=Buffer.from(text);for(let i=0;i<body.length;i++)body[i]^=mask[i%4];this.socket.write(Buffer.concat([header,mask,body]));}
  close(){this.socket?.destroy();}
}

export async function runRenderedWorkflow(id,workflow,options={}){
  const fullPanel=options.fullPanel===true;
  const profile=await mkdtemp(path.join(os.tmpdir(),`${id}-browser-pack-`));
  const server=createServer(async(request,response)=>{const pathname=new URL(request.url??"/","http://browser-pack.local").pathname;const requested=pathname==="/"?"side-panel.html":pathname.slice(1);const file=path.resolve("dist",requested);if(!file.startsWith(path.resolve("dist")+path.sep)){response.writeHead(404).end();return;}try{const content=await readFile(file);response.writeHead(200,{"Content-Type":file.endsWith(".js")?"text/javascript":file.endsWith(".css")?"text/css":"text/html"}).end(content);}catch{response.writeHead(404).end();}});
  await new Promise((resolve)=>server.listen(0,"127.0.0.1",resolve));
  const chrome=spawn("google-chrome",["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--remote-debugging-port=0",`--user-data-dir=${profile}`,"about:blank"],{stdio:["ignore","ignore","pipe"]});
  let socket;
  try{
    const port=await new Promise((resolve,reject)=>{let output="";const timeout=setTimeout(()=>reject(new Error("Chrome did not expose a debugging port")),10000);chrome.stderr.on("data",(chunk)=>{output+=chunk;const match=output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);if(match){clearTimeout(timeout);resolve(Number(match[1]));}});chrome.once("error",reject);});
    const panelUrl=`http://127.0.0.1:${server.address().port}/side-panel.html${fullPanel?"":isolationQuery(id)}`;
    const page=await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`,{method:"PUT"}).then((response)=>response.json());
    socket=new DevtoolsSocket(page.webSocketDebuggerUrl);await socket.connect();
    await socket.call("Browser.grantPermissions",{origin:new URL(panelUrl).origin,permissions:["clipboardReadWrite","clipboardSanitizedWrite"]});
    await socket.call("Emulation.setDeviceMetricsOverride",{width:320,height:900,deviceScaleFactor:1,mobile:false});await socket.call("Runtime.enable");await socket.call("Page.enable");
    if(id==="shell"||fullPanel)await socket.call("Page.addScriptToEvaluateOnNewDocument",{source:chromeAdapterSource});
    if(options.preload)await socket.call("Page.addScriptToEvaluateOnNewDocument",{source:options.preload});
    await socket.call("Page.navigate",{url:panelUrl});
    await socket.call("Page.bringToFront");
    const expectedIsolation=id==="shell"||fullPanel?"":isolationScope(id).utilityId;
    let ready=false;for(let attempt=0;attempt<300;attempt++){const result=await socket.call("Runtime.evaluate",{expression:`document.readyState === 'complete' && document.querySelector('#side-panel-root')?.dataset.utilityShellReady === 'true' && (document.documentElement.dataset.utilityIsolation ?? '') === ${JSON.stringify(expectedIsolation)}`,returnByValue:true});if(result.result.value){ready=true;break;}await wait(50);}assert.equal(ready,true,"Rendered side panel did not become ready in its requested utility scope");
    if(!fullPanel){const isolated=await socket.call("Runtime.evaluate",{expression:isolationAssertionExpression(id),returnByValue:true});assert.equal(isolated.result.value,true,`${id} browser fixture contains unrelated utility DOM`);}
    const result=await socket.call("Runtime.evaluate",{expression:`(async()=>{${workflow}})()`,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);assert.equal(result.result.value?.passed,true,JSON.stringify(result.result.value));assert.equal(result.result.value?.width,320);assert.equal(result.result.value?.overflow,false,"workflow must fit the 320px viewport");
    const accessibility=await socket.call("Runtime.evaluate",{expression:accessibilityAssertionExpression,returnByValue:true});assert.equal(accessibility.result.value?.passed,true,`${id} accessibility outcomes failed: ${JSON.stringify(accessibility.result.value)}`);
    console.log(`${id} rendered browser workflow passed`);
  }finally{socket?.close();const exited=new Promise((resolve)=>chrome.once("exit",resolve));chrome.kill();await Promise.race([exited,wait(3000)]);await new Promise((resolve)=>server.close(resolve));await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
}

export const workflowPreamble=`const q=(selector)=>{const element=document.querySelector(selector);if(!element)throw new Error('Missing '+selector);return element;};const visible=(element)=>element.getClientRects().length>0;`;
