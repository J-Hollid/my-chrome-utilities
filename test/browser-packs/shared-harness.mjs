import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const wait=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
class DevtoolsSocket{
  constructor(url){this.url=new URL(url);this.nextId=1;this.pending=new Map();this.buffer=Buffer.alloc(0);}
  async connect(){await new Promise((resolve,reject)=>{this.socket=net.createConnection({host:this.url.hostname,port:Number(this.url.port)});this.socket.once("error",reject);this.socket.once("connect",()=>{const key=Buffer.from(String(Math.random())).toString("base64");this.socket.write([`GET ${this.url.pathname}${this.url.search} HTTP/1.1`,`Host: ${this.url.host}`,"Upgrade: websocket","Connection: Upgrade",`Sec-WebSocket-Key: ${key}`,"Sec-WebSocket-Version: 13","\r\n"].join("\r\n"));});let handshake="";const receive=(chunk)=>{handshake+=chunk.toString("binary");const end=handshake.indexOf("\r\n\r\n");if(end<0)return;this.socket.off("data",receive);if(!handshake.startsWith("HTTP/1.1 101")){reject(new Error("DevTools WebSocket upgrade failed"));return;}const remaining=Buffer.from(handshake.slice(end+4),"binary");this.socket.on("data",(data)=>this.receive(data));if(remaining.length)this.receive(remaining);resolve();};this.socket.on("data",receive);});}
  receive(chunk){this.buffer=Buffer.concat([this.buffer,chunk]);while(this.buffer.length>=2){const first=this.buffer[0];let length=this.buffer[1]&0x7f,offset=2;if(length===126){if(this.buffer.length<4)return;length=this.buffer.readUInt16BE(2);offset=4;}else if(length===127){if(this.buffer.length<10)return;length=Number(this.buffer.readBigUInt64BE(2));offset=10;}if(this.buffer.length<offset+length)return;const payload=this.buffer.subarray(offset,offset+length);this.buffer=this.buffer.subarray(offset+length);if((first&15)!==1)continue;const message=JSON.parse(payload.toString("utf8")),pending=this.pending.get(message.id);if(!pending)continue;this.pending.delete(message.id);message.error?pending.reject(new Error(message.error.message)):pending.resolve(message.result);}}
  call(method,params={}){const id=this.nextId++;this.send({id,method,params});return new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}));}
  send(payload){const text=Buffer.from(JSON.stringify(payload)),mask=Buffer.from([1,2,3,4]);let header;if(text.length<126)header=Buffer.from([0x81,0x80|text.length]);else{header=Buffer.alloc(4);header[0]=0x81;header[1]=0x80|126;header.writeUInt16BE(text.length,2);}const body=Buffer.from(text);for(let i=0;i<body.length;i++)body[i]^=mask[i%4];this.socket.write(Buffer.concat([header,mask,body]));}
  close(){this.socket?.destroy();}
}

export async function runRenderedWorkflow(id,workflow){
  const profile=await mkdtemp(path.join(os.tmpdir(),`${id}-browser-pack-`));
  const server=createServer(async(request,response)=>{const requested=request.url==="/"?"side-panel.html":request.url?.slice(1);const file=path.resolve("dist",requested??"side-panel.html");if(!file.startsWith(path.resolve("dist")+path.sep)){response.writeHead(404).end();return;}try{const content=await readFile(file);response.writeHead(200,{"Content-Type":file.endsWith(".js")?"text/javascript":file.endsWith(".css")?"text/css":"text/html"}).end(content);}catch{response.writeHead(404).end();}});
  await new Promise((resolve)=>server.listen(0,"127.0.0.1",resolve));
  const chrome=spawn("google-chrome",["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--remote-debugging-port=0",`--user-data-dir=${profile}`,"about:blank"],{stdio:["ignore","ignore","pipe"]});
  let socket;
  try{
    const port=await new Promise((resolve,reject)=>{let output="";const timeout=setTimeout(()=>reject(new Error("Chrome did not expose a debugging port")),10000);chrome.stderr.on("data",(chunk)=>{output+=chunk;const match=output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);if(match){clearTimeout(timeout);resolve(Number(match[1]));}});chrome.once("error",reject);});
    const panelUrl=`http://127.0.0.1:${server.address().port}/side-panel.html`;
    const page=await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(panelUrl)}`,{method:"PUT"}).then((response)=>response.json());
    socket=new DevtoolsSocket(page.webSocketDebuggerUrl);await socket.connect();
    await socket.call("Emulation.setDeviceMetricsOverride",{width:320,height:900,deviceScaleFactor:1,mobile:false});await socket.call("Runtime.enable");
    let ready=false;for(let attempt=0;attempt<300;attempt++){const result=await socket.call("Runtime.evaluate",{expression:"document.readyState === 'complete' && document.querySelector('#side-panel-root')?.dataset.utilityShellReady === 'true'",returnByValue:true});if(result.result.value){ready=true;break;}await wait(50);}assert.equal(ready,true,"Rendered side panel did not become ready");
    const result=await socket.call("Runtime.evaluate",{expression:`(async()=>{${workflow}})()`,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);assert.equal(result.result.value?.passed,true,JSON.stringify(result.result.value));assert.equal(result.result.value?.width,320);assert.equal(result.result.value?.overflow,false,"workflow must fit the 320px viewport");
    console.log(`${id} rendered browser workflow passed`);
  }finally{socket?.close();const exited=new Promise((resolve)=>chrome.once("exit",resolve));chrome.kill();await Promise.race([exited,wait(3000)]);await new Promise((resolve)=>server.close(resolve));await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
}

export const workflowPreamble=`const q=(selector)=>{const element=document.querySelector(selector);if(!element)throw new Error('Missing '+selector);return element;};const visible=(element)=>element.getClientRects().length>0;`;
