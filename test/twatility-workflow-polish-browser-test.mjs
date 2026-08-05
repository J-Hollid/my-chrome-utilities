import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir,mkdtemp,rm,writeFile} from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import {
  headlessChromeArguments,
  resolveChromeExecutable,
  stopHeadlessChrome,
} from "./support/headless-chrome.mjs";
import {
  exactChoiceDescriptions,
  expectedStudioChoiceContracts,
} from "./support/studio-choice-contract-oracle.mjs";

const wait=(milliseconds)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));
const expectedSidePanelControlHashes=Object.freeze({
  dom:"d631b978338eae5c282bd0bbd4512a97a57d784728c2e606ae4bdbfd3872f8b2",
  presentation:"99299e7d0055d5b4763266702b349a2db277b16f1e4fb8e739d380ac33e5075d",
});

class DevtoolsSocket {
  constructor(url){this.url=new URL(url);this.nextId=1;this.pending=new Map();this.buffer=Buffer.alloc(0);this.events=[];}
  async connect(){
    await new Promise((resolve,reject)=>{
      this.socket=net.createConnection({host:this.url.hostname,port:Number(this.url.port)});
      this.socket.once("error",reject);
      this.socket.once("connect",()=>{
        const key=Buffer.from(String(Math.random())).toString("base64");
        this.socket.write([
          `GET ${this.url.pathname}${this.url.search} HTTP/1.1`,
          `Host: ${this.url.host}`,
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Key: ${key}`,
          "Sec-WebSocket-Version: 13",
          "\r\n",
        ].join("\r\n"));
      });
      let handshake="";
      const receive=(chunk)=>{
        handshake+=chunk.toString("binary");
        const end=handshake.indexOf("\r\n\r\n");
        if(end<0)return;
        this.socket.off("data",receive);
        if(!handshake.startsWith("HTTP/1.1 101")){reject(new Error("DevTools WebSocket upgrade failed"));return;}
        const remaining=Buffer.from(handshake.slice(end+4),"binary");
        this.socket.on("data",(data)=>this.receive(data));
        if(remaining.length)this.receive(remaining);
        resolve();
      };
      this.socket.on("data",receive);
    });
  }
  receive(chunk){
    this.buffer=Buffer.concat([this.buffer,chunk]);
    while(this.buffer.length>=2){
      const first=this.buffer[0];let length=this.buffer[1]&0x7f,offset=2;
      if(length===126){if(this.buffer.length<4)return;length=this.buffer.readUInt16BE(2);offset=4;}
      else if(length===127){if(this.buffer.length<10)return;length=Number(this.buffer.readBigUInt64BE(2));offset=10;}
      if(this.buffer.length<offset+length)return;
      const payload=this.buffer.subarray(offset,offset+length);this.buffer=this.buffer.subarray(offset+length);
      if((first&15)!==1)continue;
      const message=JSON.parse(payload.toString("utf8")),pending=this.pending.get(message.id);
      if(!pending){this.events.push(message);continue;}
      this.pending.delete(message.id);
      clearTimeout(pending.timeout);
      if(message.error)pending.reject(new Error(message.error.message));else pending.resolve(message.result);
    }
  }
  send(payload){
    const body=Buffer.from(JSON.stringify(payload)),mask=Buffer.from([1,2,3,4]);let header;
    if(body.length<126)header=Buffer.from([0x81,0x80|body.length]);
    else{header=Buffer.alloc(4);header[0]=0x81;header[1]=0x80|126;header.writeUInt16BE(body.length,2);}
    for(let index=0;index<body.length;index+=1)body[index]^=mask[index%4];
    this.socket.write(Buffer.concat([header,mask,body]));
  }
  call(method,params={}){
    const id=this.nextId++;this.send({id,method,params});
    return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{this.pending.delete(id);reject(new Error(`DevTools ${method} timed out`));},method==="Page.captureScreenshot"?60_000:15_000);this.pending.set(id,{resolve,reject,timeout});});
  }
  close(){this.socket?.destroy();}
}

async function evaluate(socket,expression){
  const result=await socket.call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true,userGesture:true});
  if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);
  return result.result.value;
}
async function extensionId(port){
  for(let attempt=0;attempt<160;attempt+=1){
    const targets=await fetch(`http://127.0.0.1:${port}/json/list`).then((response)=>response.json());
    const worker=targets.find(({type,url})=>type==="service_worker"&&url.startsWith("chrome-extension://")&&new URL(url).pathname==="/background.js");
    if(worker)return new URL(worker.url).hostname;
    await wait(25);
  }
  throw new Error("Unpacked extension did not load");
}
async function pageSocket(port,url){
  const page=await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`,{method:"PUT"}).then((response)=>response.json());
  const socket=new DevtoolsSocket(page.webSocketDebuggerUrl);await socket.connect();
  await socket.call("Runtime.enable");await socket.call("Page.enable");await socket.call("Network.enable");await socket.call("Log.enable");
  return socket;
}
async function ready(socket,expression,label=expression){
  for(let attempt=0;attempt<320;attempt+=1){if(await evaluate(socket,expression))return;await wait(25);}
  throw new Error(`Installed Slice 6 UI did not become ready: ${label}`);
}
async function metrics(socket,width,height,url){
  await socket.call("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:false});
  if(url)await socket.call("Page.navigate",{url});
  await ready(socket,"document.readyState==='complete'","document ready");
  await wait(100);
}
async function screenshot(socket,target){
  const capture=await socket.call("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,fromSurface:true});
  await writeFile(target,Buffer.from(capture.data,"base64"));
}
async function nativeKey(socket,key,code=key,modifiers=0){
  await socket.call("Input.dispatchKeyEvent",{type:"keyDown",key,code,modifiers});
  await socket.call("Input.dispatchKeyEvent",{type:"keyUp",key,code,modifiers});
}
async function nativeShiftTab(socket){
  await socket.call("Input.dispatchKeyEvent",{type:"keyDown",key:"Shift",code:"ShiftLeft",modifiers:8});
  await socket.call("Input.dispatchKeyEvent",{type:"keyDown",key:"Tab",code:"Tab",modifiers:8});
  await socket.call("Input.dispatchKeyEvent",{type:"keyUp",key:"Tab",code:"Tab",modifiers:8});
  await socket.call("Input.dispatchKeyEvent",{type:"keyUp",key:"Shift",code:"ShiftLeft"});
}
async function nativeClick(socket,point){
  await socket.call("Input.dispatchMouseEvent",{type:"mouseMoved",...point});
  await socket.call("Input.dispatchMouseEvent",{type:"mousePressed",...point,button:"left",clickCount:1});
  await socket.call("Input.dispatchMouseEvent",{type:"mouseReleased",...point,button:"left",clickCount:1});
}
async function protocolFocus(socket,expression){
  try{
    const remote=await socket.call("Runtime.evaluate",{expression});
    if(!remote.result.objectId)return false;
    const described=await socket.call("DOM.describeNode",{objectId:remote.result.objectId});
    await socket.call("DOM.focus",{backendNodeId:described.node.backendNodeId});
    return evaluate(socket,`document.activeElement===${expression}`);
  }catch(error){
    if(error instanceof Error&&error.message==="Element is not focusable")return false;
    throw error;
  }
}
const nativeChoiceFocusOrders=[];
const sequentialFocusScript=(rootSelector)=>`(()=>{
  const root=document.querySelector(${JSON.stringify(rootSelector)}),visible=(element)=>element.getClientRects().length>0&&getComputedStyle(element).visibility!=="hidden",hiddenByDetails=(element)=>{const details=element.closest("details:not([open])");return details&&element!==details.querySelector(":scope > summary")&&!element.closest("summary");},base=(element)=>visible(element)&&!hiddenByDetails(element)&&!element.disabled&&element.tabIndex>=0&&!element.closest("[inert]");
  const candidates=[...root.querySelectorAll('button,input,select,textarea,a[href],summary,[tabindex]')].filter(base),sequential=candidates.filter((element)=>{
    if(!(element instanceof HTMLInputElement)||element.type!=="radio"||!element.name)return true;
    const group=candidates.filter((candidate)=>candidate instanceof HTMLInputElement&&candidate.type==="radio"&&candidate.name===element.name),selected=group.find((candidate)=>candidate.checked)??group[0];
    return element===selected;
  });
  sequential.forEach((element,index)=>element.dataset.nativeFocusOrder=String(index));
  return sequential;
})()`;
const currentFocusOrderId=(socket,rootSelector)=>evaluate(socket,`(()=>{${sequentialFocusScript(rootSelector)};return document.activeElement?.dataset.nativeFocusOrder??null;})()`);
async function seedFocusOrder(socket,rootSelector,id){
  const target=`document.querySelector(${JSON.stringify(rootSelector)}).querySelector('[data-native-focus-order="${id}"]')`;
  for(let attempt=0;attempt<4;attempt+=1){
    await currentFocusOrderId(socket,rootSelector);
    if(await protocolFocus(socket,target)){
      await wait(10);
      if(await currentFocusOrderId(socket,rootSelector)===id)return true;
    }
  }
  return false;
}
async function nativeFocusOrderAudit(socket,rootSelector){
  const expected=await evaluate(socket,`(()=>{
    const sequence=${sequentialFocusScript(rootSelector)},choiceIndexes=sequence.flatMap((element,index)=>element.matches(".studio-choice-indicator")?[index]:[]);
    if(!choiceIndexes.length)return[];
    const relevant=sequence.slice(Math.min(...choiceIndexes),Math.max(...choiceIndexes)+1),description=(element)=>({id:element.dataset.nativeFocusOrder,tag:element.tagName.toLowerCase(),type:element.getAttribute("type"),choice:element.dataset.studioChoiceContract??null,text:(element.labels?.[0]?.textContent??element.getAttribute("aria-label")??element.textContent??"").replace(/\\s+/g," ").trim().slice(0,120),top:Math.round(element.getBoundingClientRect().top),left:Math.round(element.getBoundingClientRect().left)});
    return relevant.map(description).sort((left,right)=>Math.abs(left.top-right.top)>1?left.top-right.top:left.left-right.left);
  })()`);
  if(!expected.length){
    const evidence={rootSelector,expected:[],forward:[],reverse:[],valid:true};
    nativeChoiceFocusOrders.push(evidence);
    return evidence;
  }
  assert.equal(await seedFocusOrder(socket,rootSelector,expected[0].id),true,`could not prime native focus order for ${rootSelector}`);
  const forward=[await currentFocusOrderId(socket,rootSelector)];
  for(let index=1;index<expected.length;index+=1){
    await nativeKey(socket,"Tab","Tab");
    forward.push(await currentFocusOrderId(socket,rootSelector));
  }
  await nativeKey(socket,"Tab","Tab");
  const outside=await currentFocusOrderId(socket,rootSelector);
  assert.equal(await seedFocusOrder(socket,rootSelector,expected.at(-1).id),true,`could not prime reverse native focus order for ${rootSelector}`);
  const reverse=[await currentFocusOrderId(socket,rootSelector)];
  for(let index=1;index<expected.length;index+=1){
    await nativeShiftTab(socket);
    reverse.push(await currentFocusOrderId(socket,rootSelector));
  }
  const expectedIds=expected.map(({id})=>id),valid=!expectedIds.includes(outside)&&JSON.stringify(forward)===JSON.stringify(expectedIds)&&JSON.stringify(reverse)===JSON.stringify([...expectedIds].reverse()),evidence={rootSelector,expected,forward,outside,reverse,valid};
  assert.equal(valid,true,`native focus order diverged from visual order: ${JSON.stringify(evidence)}`);
  nativeChoiceFocusOrders.push(evidence);
  return evidence;
}
async function nativeReachChoice(socket,rootSelector,locate,label){
  const targetId=await evaluate(socket,`(()=>{${sequentialFocusScript(rootSelector)};const target=${locate};return target?.dataset.nativeFocusOrder??null;})()`);
  assert.notEqual(targetId,null,`choice is absent from native focus order: ${label}`);
  const sequence=await evaluate(socket,`(()=>{const sequence=${sequentialFocusScript(rootSelector)},target=${locate},index=sequence.indexOf(target),firstChoice=sequence.findIndex((element)=>element.matches(".studio-choice-indicator"));return sequence.slice(firstChoice,index+1).map((element)=>element.dataset.nativeFocusOrder);})()`);
  assert.equal(await seedFocusOrder(socket,rootSelector,sequence[0]),true,`could not prime native traversal to ${label}`);
  const traversed=[await currentFocusOrderId(socket,rootSelector)];
  for(let index=1;index<sequence.length;index+=1){
    await nativeKey(socket,"Tab","Tab");
    traversed.push(await currentFocusOrderId(socket,rootSelector));
  }
  assert.deepEqual(traversed,sequence,`native traversal did not reach ${label} in sequence`);
  return evaluate(socket,`(()=>{const input=${locate},style=getComputedStyle(input.labels[0]);return{active:document.activeElement===input,focus:[style.outlineStyle,style.outlineWidth,style.outlineColor],traversed:${JSON.stringify(traversed)}};})()`);
}
async function accessibleDisabled(socket,expression){
  const remote=await socket.call("Runtime.evaluate",{expression});
  const described=await socket.call("DOM.describeNode",{objectId:remote.result.objectId});
  const tree=await socket.call("Accessibility.getPartialAXTree",{backendNodeId:described.node.backendNodeId,fetchRelatives:false});
  return tree.nodes.some((node)=>node.properties?.some((property)=>property.name==="disabled"&&property.value?.value===true));
}
async function nativeFocusChoice(socket,rootSelector,labelIncludes){
  const locate=`(()=>{const root=document.querySelector(${JSON.stringify(rootSelector)});return[...root.querySelectorAll('input[type="checkbox"]')].find((choice)=>choice.labels?.[0]?.textContent.includes(${JSON.stringify(labelIncludes)}))})()`,defaultFocus=await evaluate(socket,`(()=>{const input=${locate},style=getComputedStyle(input.labels[0]);return[style.outlineStyle,style.outlineWidth,style.outlineColor];})()`);
  const reached=await nativeReachChoice(socket,rootSelector,locate,labelIncludes);
  return{...reached,defaultFocus,forward:true,reverse:true};
}
async function nativeChoiceAudit(socket,rootSelector,{settle=100,projectId,durableKeys=[],restore=true}={}){
  const descriptors=await evaluate(socket,`(()=>{
    const root=document.querySelector(${JSON.stringify(rootSelector)}),counts={},text=(input)=>{const copy=input.labels?.[0]?.querySelector(".studio-choice-copy")?.cloneNode(true);copy?.querySelectorAll?.(".studio-switch-mark,.studio-switch-state").forEach((node)=>node.remove());return copy?.textContent.trim()??input.labels?.[0]?.textContent.trim()??"";};
    return[...root.querySelectorAll('input[type="checkbox"]')].filter((input)=>input.getClientRects().length>0).map((input)=>{
      const key=input.dataset.studioChoiceContract,label=text(input),identity=key+"\\n"+label,index=counts[identity]??0;counts[identity]=index+1;return{key,label,index};
    });
  })()`);
  await nativeFocusOrderAudit(socket,rootSelector);
  const results=[];
  for(const descriptor of descriptors){
    await wait(settle);
    await evaluate(socket,`(()=>{const root=document.querySelector(${JSON.stringify(rootSelector)}),text=(input)=>{const copy=input.labels?.[0]?.querySelector(".studio-choice-copy")?.cloneNode(true);copy?.querySelectorAll?.(".studio-switch-mark,.studio-switch-state").forEach((node)=>node.remove());return copy?.textContent.trim()??input.labels?.[0]?.textContent.trim()??"";},matches=root?[...root.querySelectorAll('input[type="checkbox"]')].filter((input)=>input.dataset.studioChoiceContract===${JSON.stringify(descriptor.key)}&&text(input)===${JSON.stringify(descriptor.label)}):[],input=matches[${descriptor.index}];if(input?.closest("details"))input.closest("details").open=true;if(document.activeElement instanceof HTMLElement)document.activeElement.blur();input?.scrollIntoView({block:"center",inline:"nearest"});return Boolean(input);})()`);
    const durable=projectId&&durableKeys.includes(descriptor.key),sequenceBefore=durable?await evaluate(socket,`(async()=>{const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js");return(await(await openIndexedDbProjectRepository()).loadProject(${JSON.stringify(projectId)})).draftSequence;})()`):undefined;
    const locate=`(()=>{const root=document.querySelector(${JSON.stringify(rootSelector)}),text=(input)=>{const copy=input.labels?.[0]?.querySelector(".studio-choice-copy")?.cloneNode(true);copy?.querySelectorAll?.(".studio-switch-mark,.studio-switch-state").forEach((node)=>node.remove());return copy?.textContent.trim()??input.labels?.[0]?.textContent.trim()??"";},matches=root?[...root.querySelectorAll('input[type="checkbox"]')].filter((input)=>input.getClientRects().length>0&&input.dataset.studioChoiceContract===${JSON.stringify(descriptor.key)}&&text(input)===${JSON.stringify(descriptor.label)}):[];return matches[${descriptor.index}]})()`,present=`Boolean(${locate})`;
    const before=await evaluate(socket,`(()=>{const input=${locate},label=input?.labels?.[0],indicator=input?.getBoundingClientRect(),row=label?.getBoundingClientRect(),copy=label?.querySelector(".studio-choice-copy")?.getBoundingClientRect(),style=input&&getComputedStyle(input),labelStyle=label&&getComputedStyle(label),defaultFocus=[labelStyle?.outlineStyle,labelStyle?.outlineWidth,labelStyle?.outlineColor],describedBy=input?.getAttribute("aria-describedby"),actions=[...label?.parentElement?.children??[]].filter((element)=>element!==label&&element.matches?.("button,a[href],[role=button]")),intersects=actions.some((action)=>{const box=action.getBoundingClientRect();return!(row.right<=box.left||box.right<=row.left||row.bottom<=box.top||box.bottom<=row.top);});if(!input||!label)return null;const token=${JSON.stringify(`${descriptor.key}\n${descriptor.label}\n${descriptor.index}`)};globalThis.__studioChoiceAuditChanges??={};globalThis.__studioChoiceAuditInputs??={};globalThis.__studioChoiceAuditEventChecked??={};globalThis.__studioChoiceAuditChanges[token]=0;globalThis.__studioChoiceAuditInputs[token]=input;input.addEventListener("change",(event)=>{globalThis.__studioChoiceAuditChanges[token]++;globalThis.__studioChoiceAuditEventChecked[token]=event.currentTarget.checked;});return{checked:input.checked,disabled:input.disabled,disabledState:input.matches(":disabled"),type:input.type,role:input.getAttribute("role"),id:input.id,forValue:label.htmlFor,labels:input.labels?.length,enhanced:input.dataset.studioChoiceEnhanced,description:input.getAttribute("aria-description"),width:indicator.width,height:indicator.height,rowHeight:row.height,gap:copy?copy.left-indicator.right:null,padding:style.padding,describedByValid:!describedBy||describedBy.split(/\\s+/).every((id)=>document.getElementById(id)),defaultFocus,disabledCursor:labelStyle.cursor,disabledDecoration:labelStyle.textDecorationLine,actionsSeparate:!intersects,contained:row.left>=0&&row.right<=innerWidth+.1};})()`);
    assert.ok(before,`native choice audit could not locate ${JSON.stringify(descriptor)}`);
    const pointerActivation=async(kind)=>{
      const armed=await evaluate(socket,`(()=>{const input=${locate};input.closest("details")?.setAttribute("open","");const label=input.labels[0],target=${JSON.stringify(kind)}==="input"?input:label.querySelector(".studio-choice-copy")??label;target.scrollIntoView({block:"center",inline:"nearest"});const dialog=target.closest("dialog");if(dialog&&dialog.scrollHeight>dialog.clientHeight){const targetBox=target.getBoundingClientRect(),dialogBox=dialog.getBoundingClientRect();dialog.scrollTop+=targetBox.top+targetBox.height/2-(dialogBox.top+dialog.clientHeight/2);}const preliminary=target.getBoundingClientRect();scrollBy(0,preliminary.top+preliminary.height/2-innerHeight/2);const box=target.getBoundingClientRect(),point={x:box.left+box.width/2,y:box.top+box.height/2},hit=document.elementFromPoint(point.x,point.y),stage=(globalThis.__studioChoicePointerStage??0)+1;globalThis.__studioChoicePointerStage=stage;globalThis.__studioChoicePointerAudit={stage,input,changes:0,eventChecked:input.checked};input.addEventListener("change",(event)=>{if(globalThis.__studioChoicePointerAudit?.stage===stage&&globalThis.__studioChoicePointerAudit.input===event.currentTarget){globalThis.__studioChoicePointerAudit.changes++;globalThis.__studioChoicePointerAudit.eventChecked=event.currentTarget.checked;}});return{before:input.checked,...point,hit:hit===input||label.contains(hit),hitTag:hit?.tagName};})()`);
      assert.equal(armed.hit,true,`${kind} pointer coordinate missed ${descriptor.key} ${descriptor.label}: ${JSON.stringify(armed)}`);
      await nativeClick(socket,{x:armed.x,y:armed.y});
      if(descriptor.key==="guided.conditional")await evaluate(socket,`[...document.querySelectorAll("#guided-condition-discard-confirmation button")].find(({textContent})=>textContent==="Discard conditions")?.click()`);
      await wait(settle);
      await ready(socket,present,`rerendered ${descriptor.key} after native ${kind} click`);
      return evaluate(socket,`(()=>{const input=${locate},audit=globalThis.__studioChoicePointerAudit;return{before:${armed.before},checked:input?.checked,eventChecked:audit?.eventChecked,changes:audit?.changes,point:${JSON.stringify({x:armed.x,y:armed.y})},hit:true,hitTag:${JSON.stringify(armed.hitTag)}};})()`);
    };
    if(before.disabled){
      const disabledFocus=await evaluate(socket,`(()=>{const input=${locate},prior=document.activeElement;input.focus();const active=document.activeElement===input;if(prior instanceof HTMLElement)prior.focus();return{active,focusable:input.matches(":focus"),checked:input.checked};})()`),accessibilityDisabled=await accessibleDisabled(socket,locate),inputClick=await pointerActivation("input"),labelClick=await pointerActivation("label");
      results.push({...descriptor,...before,focused:{active:false,forward:true,reverse:true,focus:before.defaultFocus},after:{checked:before.checked,changes:0},inputClick,labelClick,restored:{checked:before.checked,changes:0},restoreExpected:false,disabledFocus,accessibilityDisabled});
      continue;
    }
    const focused=await nativeReachChoice(socket,rootSelector,locate,`${descriptor.key} ${descriptor.label}`);
    await nativeKey(socket,"Shift","ShiftLeft");
    Object.assign(focused,await evaluate(socket,`(()=>{const input=${locate},style=getComputedStyle(input.labels[0]);return{active:document.activeElement===input,focus:[style.outlineStyle,style.outlineWidth,style.outlineColor]};})()`));
    focused.forward=true;focused.reverse=true;
    await evaluate(socket,`(()=>{const input=${locate},token=${JSON.stringify(`${descriptor.key}\n${descriptor.label}\n${descriptor.index}`)};globalThis.__studioChoiceAuditChanges[token]=0;globalThis.__studioChoiceAuditEventChecked[token]=input.checked;if(globalThis.__studioChoiceAuditInputs[token]!==input){globalThis.__studioChoiceAuditInputs[token]=input;input.addEventListener("change",(event)=>{if(globalThis.__studioChoiceAuditInputs[token]===event.currentTarget){globalThis.__studioChoiceAuditChanges[token]++;globalThis.__studioChoiceAuditEventChecked[token]=event.currentTarget.checked;}});}return true;})()`);
    await nativeKey(socket," ","Space");
    if(durable)await evaluate(socket,`(async()=>{const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js"),repo=await openIndexedDbProjectRepository();for(let attempt=0;attempt<240;attempt+=1){if((await repo.loadProject(${JSON.stringify(projectId)})).draftSequence>=${sequenceBefore+1})return true;await new Promise((resolve)=>setTimeout(resolve,20));}return false;})()`);
    else await wait(settle);
    try{await ready(socket,present,`rerendered ${descriptor.key} after native Space`);}catch(error){const diagnostic=await evaluate(socket,`(()=>({root:Boolean(document.querySelector(${JSON.stringify(rootSelector)})),active:document.activeElement?.outerHTML,choices:[...document.querySelectorAll('input[type="checkbox"]')].map((input)=>[input.dataset.studioChoiceContract,input.labels?.[0]?.textContent.trim(),input.checked,input.disabled]).filter(([key])=>key)}))()`);throw new Error(`${error.message}: ${JSON.stringify({descriptor,diagnostic})}`);}
    const after=await evaluate(socket,`(()=>{const input=${locate},token=${JSON.stringify(`${descriptor.key}\n${descriptor.label}\n${descriptor.index}`)};return{checked:input?.checked,eventChecked:globalThis.__studioChoiceAuditEventChecked?.[token],changes:globalThis.__studioChoiceAuditChanges?.[token]};})()`);
    let restored=after;
    if(restore&&after.checked!==before.checked){
      await evaluate(socket,`(()=>{const input=${locate},token=${JSON.stringify(`${descriptor.key}\n${descriptor.label}\n${descriptor.index}`)};if(!input)return false;if(globalThis.__studioChoiceAuditInputs[token]!==input){globalThis.__studioChoiceAuditInputs[token]=input;input.addEventListener("change",(event)=>{globalThis.__studioChoiceAuditChanges[token]++;globalThis.__studioChoiceAuditEventChecked[token]=event.currentTarget.checked;});}input.click();return true;})()`);
      if(descriptor.key==="guided.conditional")await evaluate(socket,`[...document.querySelectorAll("#guided-condition-discard-confirmation button")].find(({textContent})=>textContent==="Discard conditions")?.click()`);
      if(durable)await evaluate(socket,`(async()=>{const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js"),repo=await openIndexedDbProjectRepository();for(let attempt=0;attempt<240;attempt+=1){if((await repo.loadProject(${JSON.stringify(projectId)})).draftSequence>=${sequenceBefore+2})return true;await new Promise((resolve)=>setTimeout(resolve,20));}return false;})()`);
      else await wait(settle);
      try{await ready(socket,present,`rerendered ${descriptor.key} after native restore`);}catch(error){const diagnostic=await evaluate(socket,`(()=>({root:Boolean(document.querySelector(${JSON.stringify(rootSelector)})),active:document.activeElement?.outerHTML,choices:[...document.querySelectorAll('input[type="checkbox"]')].map((input)=>[input.dataset.studioChoiceContract,input.labels?.[0]?.textContent.trim(),input.checked,input.disabled]).filter(([key])=>key)}))()`);throw new Error(`${error.message}: ${JSON.stringify({descriptor,diagnostic})}`);}
      restored=await evaluate(socket,`(()=>{const input=${locate},token=${JSON.stringify(`${descriptor.key}\n${descriptor.label}\n${descriptor.index}`)};return{checked:input?.checked,eventChecked:globalThis.__studioChoiceAuditEventChecked?.[token],changes:globalThis.__studioChoiceAuditChanges?.[token]};})()`);
    }
    const inputClick=await pointerActivation("input"),labelClick=await pointerActivation("label");
    if(restore&&labelClick.checked!==before.checked)restored=await pointerActivation("input");
    results.push({...descriptor,...before,focused,after,inputClick,labelClick,restored,restoreExpected:restore});
  }
  return results;
}
async function durableChoiceConsequence(socket,projectId,key,readExpression,{rootSelector='[aria-label="Project Documentation workspace"]',labelIncludes=""}={}){
  return evaluate(socket,`(async()=>{
    const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js"),repo=await openIndexedDbProjectRepository(),read=${readExpression},root=()=>document.querySelector(${JSON.stringify(rootSelector)}),find=()=>[...root().querySelectorAll('input[type="checkbox"]')].find((input)=>input.dataset.studioChoiceContract===${JSON.stringify(key)}&&input.labels?.[0]?.textContent.includes(${JSON.stringify(labelIncludes)})),before=await repo.loadProject(${JSON.stringify(projectId)}),beforeValue=structuredClone(read(before)),choice=find(),label=choice.labels[0].textContent.trim();
    choice.click();let changed;for(let attempt=0;attempt<80;attempt+=1){changed=await repo.loadProject(${JSON.stringify(projectId)});if(changed.draftSequence>before.draftSequence)break;await new Promise((resolve)=>setTimeout(resolve,20));}await new Promise((resolve)=>setTimeout(resolve,40));const afterValue=structuredClone(read(changed)),fresh=[...root().querySelectorAll('input[type="checkbox"]')].find((input)=>input.dataset.studioChoiceContract===${JSON.stringify(key)}&&input.labels?.[0]?.textContent.trim()===label);fresh.click();let restored;for(let attempt=0;attempt<80;attempt+=1){restored=await repo.loadProject(${JSON.stringify(projectId)});if(restored.draftSequence>changed.draftSequence)break;await new Promise((resolve)=>setTimeout(resolve,20));}
    return{key:${JSON.stringify(key)},label,beforeValue,afterValue,restoredValue:structuredClone(read(restored)),sequences:{before:before.draftSequence,after:changed.draftSequence,restored:restored.draftSequence}};
  })()`);
}
function validNativeChoiceAudit(item){
  const expectedPattern=expectedStudioChoiceContracts.get(item.key)?.[0],focusChanged=item.focused.active&&JSON.stringify(item.focused.focus)!==JSON.stringify(item.defaultFocus)&&item.focused.focus[0]!=="none"&&item.focused.focus[1]!=="0px",indicatorValid=expectedPattern==="switch"?item.width===36&&item.height>=16&&item.height<=18:item.width>=16&&item.width<=18&&item.height>=16&&item.height<=18;
  const activationValid=(entry)=>entry.hit&&entry.checked===!entry.before&&entry.eventChecked===entry.checked&&entry.changes===1,disabledValid=item.disabledState&&item.accessibilityDisabled&&item.disabledCursor==="not-allowed"&&item.disabledDecoration.includes("line-through")&&!item.disabledFocus.active&&!item.disabledFocus.focusable&&item.after.changes===0&&item.inputClick.hit&&item.inputClick.checked===item.inputClick.before&&item.inputClick.changes===0&&item.labelClick.hit&&item.labelClick.checked===item.labelClick.before&&item.labelClick.changes===0;
  const restorationValid=!item.restoreExpected||item.restored.checked===item.checked;
  return item.description===exactChoiceDescriptions[item.key]&&item.type==="checkbox"&&item.role===(expectedPattern==="switch"?"switch":null)&&item.enhanced==="true"&&item.labels===1&&Boolean(item.id)&&item.forValue===item.id&&indicatorValid&&item.padding==="0px"&&Math.abs(item.gap-8)<0.1&&item.rowHeight>=36&&item.describedByValid&&item.actionsSeparate&&item.contained&&(item.disabled?disabledValid:focusChanged&&item.focused.forward&&item.focused.reverse&&item.after.eventChecked===!item.checked&&item.after.changes===1&&activationValid(item.inputClick)&&activationValid(item.labelClick)&&restorationValid);
}

const profile=await mkdtemp(path.join(os.tmpdir(),"twatility-workflow-polish-"));
const extensionRoot=path.resolve("dist"),chromeArguments=headlessChromeArguments(profile,extensionRoot);
chromeArguments.splice(-1,0,`--load-extension=${extensionRoot}`);
const chrome=spawn(resolveChromeExecutable(),chromeArguments,{stdio:["ignore","ignore","pipe"]});
const evidenceDirectory=path.resolve(process.env.BRAND_EVIDENCE_DIR??"docs/twatility-branding-evidence/slice-6-workflows");
await mkdir(evidenceDirectory,{recursive:true});
let side,studio,conflictStudio,blockedStudio;
try{
  const port=await new Promise((resolve,reject)=>{
    let output="";const timeout=setTimeout(()=>reject(new Error(`Chrome debugging timeout: ${output}`)),15_000);
    chrome.stderr.on("data",(chunk)=>{output+=chunk;const match=output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//u);if(match){clearTimeout(timeout);resolve(Number(match[1]));}});
    chrome.once("error",reject);
  });
  const id=await extensionId(port),base=`chrome-extension://${id}/`,projectId="project-polish";
  side=await pageSocket(port,`${base}data-layer-specification-project.js`);
  await ready(side,"document.readyState==='complete'","extension-origin seed document");
  const seeded=await evaluate(side,`(async()=>{
    const {createSpecificationProject}=await import("./data-layer-specification-project.js");
    const {createProjectCollectionEntity}=await import("./data-layer-project-entity-lifecycle.js");
    const {addCanonicalProperty}=await import("./data-layer-canonical-schema.js");
    const {configureProjectEventTransport}=await import("./data-layer-project-event-transport.js");
    const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js");
    let sequence=0;const makeId=(kind)=>kind==="project"?${JSON.stringify(projectId)}:kind+":polish:"+(++sequence);
    let state=createSpecificationProject({name:"Retail measurement operations",description:"Long-form production workflow evidence across every remaining surface.",site:"retail-measurement-operations.example.com",id:makeId});
    for(const [kind,name,values] of[
      ["profiles","Commerce foundation",{}],
      ["propertySets","Checkout customers",{}],
      ["pages","Checkout confirmation",{eventName:"pageview"}],
      ["events","Purchase completed",{eventName:"purchase"}],
      ["applicabilitySets","Retail customers",{}],
      ["flows","Checkout journey",{}],
      ["fixtures","Valid checkout",{}],
    ])state=createProjectCollectionEntity(state,kind,name,makeId,values);
    const profile=state.project.collections.profiles[0],page=state.project.collections.pages[0],propertySet=state.project.collections.propertySets[0],event=state.project.collections.events[0],flow=state.project.collections.flows[0],applicabilitySet=state.project.collections.applicabilitySets[0];
    profile.canonicalSchema=addCanonicalProperty(profile.canonicalSchema,{baseRevision:profile.canonicalSchema.revision,name:"order_id",type:"string",id:(kind)=>kind+":documentation-audit"}).document;
    page.propertySetApplications=[{id:makeId("property-set-application"),propertySetId:propertySet.id,applicabilitySetId:applicabilitySet.id}];
    state=createProjectCollectionEntity(state,"assignments","Purchase payload",makeId,{targetKind:"Shared Profile",targetId:profile.id,eventId:event.id,applicabilitySetId:state.project.collections.applicabilitySets[0].id});
    state=configureProjectEventTransport(state,{observationHistoryPath:"event.history",defaultPushPath:"dataLayer"});
    state.project.documentationFlowGraphs={[flow.id]:{sections:[],pageFrames:[{id:"frame:polish",name:page.name,pageId:page.id,position:{x:120,y:80}}],occurrences:[{id:"occurrence:polish",name:event.name,pageFrameId:"frame:polish",pageId:page.id,eventId:event.id,role:"interaction",obligation:"Required",minimum:1,maximum:1,optional:false,position:{x:210,y:150}}],relationships:[]}};
    state.project.documentation={
      themes:[{id:"theme:polish",name:"Client navy",clientName:"Retail measurement",logo:"",colors:{heading:"#0b3155",accent:"#c7921e",stripe:"#f4e7c9"},typography:{family:"Arial",headingSize:16,bodySize:11},density:"comfortable",borders:true,striping:true,highlightedHeadings:true,columnWidths:{Property:24},headerText:"Retail measurement specification",footerText:"Reviewed Draft"}],
      sets:[{id:"set:polish",name:"Retail implementation specification",themeId:"theme:polish",sections:[{id:"section:overview",kind:"overview",name:"Overview",selected:true},{id:"section:flow",kind:"flow",name:"Checkout journey",targetId:flow.id,selected:true},{id:"section:matrix",kind:"matrix",name:"Data capture matrix",selected:true},{id:"section:profile",kind:"profile",name:"Commerce foundation",targetId:profile.id,selected:true}]}],
    };
    state.draft={id:"draft:polish",status:"Saved",updatedAt:"2026-07-26T20:30:00.000Z"};
    const repository=await openIndexedDbProjectRepository();
    await repository.putProjectMetadataOnly(state,{active:true,draftToken:"polish-9",draftSequence:9,publishedRevision:0,navigation:{kind:"pages"}});
    await repository.saveSavedSchema({schema:{id:"schema:polish",name:"Purchase payload",version:2,published:true,document:{type:"object",properties:{event:{type:"string"}}},assignments:[],attachedRules:[],documentation:{}},label:"Seed Purchase payload"});
    return await repository.activeProjectId()===${JSON.stringify(projectId)};
  })()`);
  assert.equal(seeded,true,"production project and Saved Schema must seed");
  await side.call("Page.navigate",{url:`${base}side-panel.html`});
  await ready(side,"document.readyState==='complete'&&document.querySelector('#data-layer-view-projects')?.isConnected","side-panel durable runtime");
  await ready(side,"document.querySelector('#active-project-header')?.textContent.includes('Retail measurement operations')","active project");

  await metrics(side,360,800);
  const live=await evaluate(side,`(async()=>{
    document.querySelector("#data-layer-view-live").click();document.querySelector("#data-layer-settings").open=true;
    await new Promise(resolve=>setTimeout(resolve,80));
    const ids=["project-transport-context","history-path","history-path-status","default-push-path","default-push-path-status"];
    const controls=[...document.querySelectorAll("button,input,select,textarea,a[href],[role=tab]")];
    const refs=["aria-controls","aria-labelledby","aria-describedby","aria-errormessage"];
    const domSignature=controls.map((element)=>({tag:element.tagName,id:element.id,type:element.getAttribute("type"),role:element.getAttribute("role"),hidden:element.hidden,disabled:Boolean(element.disabled),aria:refs.map((name)=>[name,element.getAttribute(name)])})),presentationSignature=controls.filter((element)=>element.getClientRects().length>0).map((element)=>{const style=getComputedStyle(element),box=element.getBoundingClientRect();return{tag:element.tagName,id:element.id,type:element.getAttribute("type"),box:[box.width,box.height],display:style.display,position:style.position,padding:[style.paddingTop,style.paddingRight,style.paddingBottom,style.paddingLeft],border:[style.borderTopWidth,style.borderRightWidth,style.borderBottomWidth,style.borderLeftWidth],radius:style.borderRadius,font:[style.fontFamily,style.fontSize,style.fontWeight,style.lineHeight],color:style.color,background:style.backgroundColor};}),hash=async(value)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(value)))),byte=>byte.toString(16).padStart(2,"0")).join(""),hashes={dom:await hash(domSignature),presentation:await hash(presentationSignature)};
    const workspace=document.querySelector("#workspace-panel-data-layer");
    return{present:ids.every((id)=>document.getElementById(id)),context:document.querySelector("#project-transport-context").textContent,values:[document.querySelector("#history-path").value,document.querySelector("#default-push-path").value],hashes,overflow:[document.documentElement.scrollWidth-document.documentElement.clientWidth,document.body.scrollWidth-document.body.clientWidth,workspace.scrollWidth-workspace.clientWidth],broken:[...document.querySelectorAll("*")].flatMap((element)=>refs.flatMap((name)=>(element.getAttribute(name)||"").split(/\\s+/).filter(Boolean).filter((id)=>!document.getElementById(id))))};
  })()`);
  assert.equal(live.present,true);
  assert.match(live.context,/Retail measurement operations/u);
  assert.deepEqual(live.values,["event.history","dataLayer"]);
  assert.deepEqual(live.hashes,expectedSidePanelControlHashes,"packaged side-panel controls must match the immutable pre-migration DOM and presentation baselines");
  assert.deepEqual(live.overflow,[0,0,0]);
  assert.deepEqual(live.broken,[]);
  await evaluate(side,`document.querySelector("#data-layer-settings").scrollIntoView({block:"start"})`);
  await wait(50);
  await screenshot(side,path.join(evidenceDirectory,"side-live-settings-360x800.png"));

  await metrics(side,420,900);
  await evaluate(side,`document.querySelector("#data-layer-view-library").click();document.querySelector("#add-new-event").click()`);
  await ready(side,"!document.querySelector('#event-property-editor').hidden","Library editor");
  const library=await evaluate(side,`(()=>{const editor=document.querySelector("#event-property-editor"),master=document.querySelector("#event-template-master"),panel=document.querySelector("#data-layer-panel-library"),wide=[...editor.querySelectorAll("*")].filter((element)=>element.scrollWidth>element.offsetWidth+1).map((element)=>({id:element.id,tag:element.tagName,className:element.className,offsetWidth:element.offsetWidth,scrollWidth:element.scrollWidth})).slice(0,8),overflow=[document.documentElement.scrollWidth-document.documentElement.clientWidth,document.body.scrollWidth-document.body.clientWidth,panel.scrollWidth-panel.clientWidth];return{editor:!editor.hidden,contained:overflow.every((value)=>value<=1)&&wide.length===0&&master.scrollWidth<=master.offsetWidth+1,widths:{editor:[editor.clientWidth,editor.offsetWidth,editor.scrollWidth],master:[master.clientWidth,master.offsetWidth,master.scrollWidth]},overflow,wide,controls:["close-template-editor","event-template-name","event-template-json","save-template-revision","push-template-draft"].every((id)=>document.getElementById(id))};})()`);
  assert.equal(library.editor,true);
  assert.equal(library.contained,true,`Library must be locally contained: ${JSON.stringify(library)}`);
  assert.equal(library.controls,true);
  await screenshot(side,path.join(evidenceDirectory,"side-library-editor-420x900.png"));

  await metrics(side,512,900);
  await evaluate(side,`document.querySelector("#data-layer-view-sessions").click()`);
  await screenshot(side,path.join(evidenceDirectory,"side-sessions-512x900.png"));
  await evaluate(side,`document.querySelector("#data-layer-view-defects").click()`);
  await screenshot(side,path.join(evidenceDirectory,"side-defects-512x900.png"));

  await metrics(side,520,900);
  await evaluate(side,`document.querySelector("#data-layer-view-schemas").click()`);
  await ready(side,"document.querySelector('#schema-list')?.textContent.includes('Project Retail measurement operations')","schema tree");
  const treeBefore=await evaluate(side,`(()=>{const tree=document.querySelector("#schema-list"),rows=[...tree.querySelectorAll('[role="treeitem"]')],first=rows[0]?.querySelector("button");first?.focus();return{categories:[...document.querySelector("#schema-category-filter").options].map(({textContent})=>textContent),rows:rows.length,levels:rows.every((row)=>Number(row.getAttribute("aria-level"))>=1),selected:rows.every((row)=>row.hasAttribute("aria-selected")),contained:tree.scrollWidth<=tree.clientWidth+1,firstText:first?.textContent};})()`);
  assert.deepEqual(treeBefore.categories,["All","Saved schemas","Shared Profiles","Property Sets","Pages","Events","Flow Page instances","Event occurrences"]);
  assert.equal(treeBefore.rows>5,true);
  assert.equal(treeBefore.levels,true);
  assert.equal(treeBefore.selected,true);
  assert.equal(treeBefore.contained,true);
  await screenshot(side,path.join(evidenceDirectory,"side-schema-tree-520x900.png"));
  await evaluate(side,`document.querySelector("#schema-list [role=treeitem] > button:first-child").focus()`);
  await nativeKey(side,"End","End");
  const treeKeyboard=await evaluate(side,`(()=>{const rows=[...document.querySelectorAll("#schema-list [role=treeitem] > button:first-child")];return document.activeElement===rows.at(-1);})()`);
  assert.equal(treeKeyboard,true,"End must move tree focus to the final visible row");

  studio=await pageSocket(port,`${base}specification-builder.html?project=${projectId}&route=overview`);
  await metrics(studio,1280,900);
  await ready(studio,"document.querySelector('#tree-project-name')?.textContent.includes('Retail measurement operations')","Studio project");
  await evaluate(studio,`document.querySelector('#project-tree button[data-kind="documentation"]').click()`);
  await ready(studio,"document.querySelector('[aria-label=\"Project Documentation workspace\"]')","Documentation workspace");
  const documentation=await evaluate(studio,`(()=>{const root=document.querySelector('[aria-label="Project Documentation workspace"]');return{set:root.textContent.includes("Retail implementation specification"),regions:["Documentation section outline","Selected documentation section configuration"].every((name)=>root.querySelector('[aria-label="'+name+'"]')),contained:root.scrollWidth<=root.clientWidth+1,overflow:[document.documentElement.scrollWidth-document.documentElement.clientWidth,document.body.scrollWidth-document.body.clientWidth]};})()`);
  assert.equal(documentation.set,true);
  assert.equal(documentation.regions,true);
  assert.deepEqual(documentation.overflow,[0,0]);
  const documentationChoices=await evaluate(studio,`(()=>{
    const root=document.querySelector('[aria-label="Project Documentation workspace"]'),tableTheme=root.querySelector('[data-theme-group="Table"]');tableTheme.open=true;
    const choices=[...root.querySelectorAll('input[type="checkbox"]')],visible=(element)=>element.getClientRects().length>0;
    const details=choices.map((input)=>{const label=input.labels?.[0],indicator=input.getBoundingClientRect(),copy=label?.querySelector(".studio-choice-copy")?.getBoundingClientRect(),style=getComputedStyle(input),row=label?.getBoundingClientRect(),describedBy=input.getAttribute("aria-describedby");return{text:label?.textContent.trim(),id:input.id,forValue:label?.htmlFor,labels:input.labels?.length,role:input.getAttribute("role"),contract:input.dataset.studioChoiceContract,missing:input.dataset.studioChoiceMissing,description:input.getAttribute("aria-description"),describedBy,describedByExists:!describedBy||describedBy.split(/\\s+/).every((id)=>document.getElementById(id)),enhanced:input.dataset.studioChoiceEnhanced,width:indicator.width,height:indicator.height,padding:style.padding,gap:copy?copy.left-indicator.right:null,rowHeight:row?.height,visible:visible(input)};});
    const exportChoice=choices.find((input)=>input.labels?.[0]?.textContent.includes("Export Overview")),before=exportChoice.checked;let changes=0;exportChoice.addEventListener("change",()=>changes++);exportChoice.click();const afterInput=exportChoice.checked;exportChoice.labels[0].click();
    const actionPairs=[...root.querySelectorAll("li")].flatMap((item)=>{const label=item.querySelector(":scope > label.studio-choice-row"),action=item.querySelector(":scope > button");if(!label||!action||!visible(label)||!visible(action))return[];const left=label.getBoundingClientRect(),right=action.getBoundingClientRect();return[{intersects:!(left.right<=right.left||right.right<=left.left||left.bottom<=right.top||right.bottom<=left.top)}];});
    const verticalDetails=[...root.querySelectorAll("fieldset")].filter((field)=>field.querySelector(":scope > .studio-choice-row,:scope > ol .studio-choice-row")).map((field)=>{const rows=[...field.querySelectorAll(".studio-choice-row")].filter(visible).map((row)=>row.getBoundingClientRect());return{legend:field.querySelector("legend")?.textContent,columns:getComputedStyle(field).gridTemplateColumns,stacked:rows.every((row,index)=>!index||row.top>=rows[index-1].bottom-0.1)};});
    return{count:choices.length,details,activation:{before,afterInput,restored:exportChoice.checked,changes},vertical:verticalDetails.every(({stacked})=>stacked),verticalDetails,actionsSeparate:actionPairs.every(({intersects})=>!intersects)};
  })()`);
  assert.equal(documentationChoices.count>5,true);
  assert.equal(documentationChoices.details.every(({contract,missing})=>contract&&contract!=="missing"&&missing===undefined),true,JSON.stringify(documentationChoices.details));
  assert.equal(documentationChoices.details.every(({contract,description})=>exactChoiceDescriptions[contract]===description),true,JSON.stringify(documentationChoices.details));
  assert.equal(documentationChoices.details.every(({describedByExists})=>describedByExists),true);
  assert.equal(documentationChoices.details.some(({contract,describedBy})=>contract==="documentation.concept-subheadings"&&Boolean(describedBy)),true);
  assert.equal(documentationChoices.details.every(({id,forValue,labels,enhanced,description})=>id&&forValue===id&&labels===1&&enhanced==="true"&&description),true);
  assert.equal(documentationChoices.details.filter(({visible,role})=>visible&&role!=="switch").every(({width,height,padding,gap,rowHeight})=>width>=16&&width<=18&&height>=16&&height<=18&&padding==="0px"&&Math.abs(gap-8)<0.1&&rowHeight>=36),true,JSON.stringify(documentationChoices.details.filter(({visible,role})=>visible&&role!=="switch")));
  assert.equal(documentationChoices.activation.afterInput,!documentationChoices.activation.before);
  assert.equal(documentationChoices.activation.restored,documentationChoices.activation.before);
  assert.equal(documentationChoices.activation.changes,2);
  assert.equal(documentationChoices.details.find(({text})=>text.includes("Include concept subheadings"))?.role,null);
  assert.equal(documentationChoices.details.find(({text})=>text.includes("Borders"))?.role,null);
  assert.equal(documentationChoices.vertical,true,JSON.stringify(documentationChoices.verticalDetails));
  assert.equal(documentationChoices.actionsSeparate,true);
  const documentationNativeChoices=await nativeChoiceAudit(studio,'[aria-label="Project Documentation workspace"]',{settle:300});
  const documentationConfigurationChoices=await evaluate(studio,`(async()=>{
    const root=()=>document.querySelector('[aria-label="Project Documentation workspace"]'),contracts={},details=[];
    const collect=()=>{for(const input of root().querySelectorAll('[aria-label="Selected documentation section configuration"] input[type="checkbox"]')){const key=input.dataset.studioChoiceContract,label=input.labels?.[0],indicator=input.getBoundingClientRect(),row=label?.getBoundingClientRect(),copy=label?.querySelector(".studio-choice-copy")?.getBoundingClientRect(),describedBy=input.getAttribute("aria-describedby"),detail={key,description:input.getAttribute("aria-description"),enhanced:input.dataset.studioChoiceEnhanced,labels:input.labels?.length,id:input.id,forValue:label?.htmlFor,width:indicator.width,height:indicator.height,rowHeight:row?.height,gap:copy?copy.left-indicator.right:null,describedByValid:!describedBy||describedBy.split(/\\s+/).every((id)=>document.getElementById(id))};details.push(detail);contracts[key]??=detail.description;}};
    for(const kind of["flow","matrix","profile"]){root().querySelector('[aria-label="Documentation section outline"] [data-section-kind="'+kind+'"] > button').click();await new Promise((resolve)=>setTimeout(resolve,20));collect();}
    root().querySelector('[aria-label="Documentation section outline"] [data-section-kind="overview"] > button').click();
    return{contracts,details};
  })()`);
  for(const key of ["documentation.flow-context","documentation.property-row","documentation.metadata-column","documentation.matrix-context","documentation.profile-column"])assert.equal(documentationConfigurationChoices.contracts[key],exactChoiceDescriptions[key],`${key} must mount on its production Documentation section`);
  assert.equal(documentationConfigurationChoices.details.every(({key,description,enhanced,labels,id,forValue,width,height,rowHeight,gap,describedByValid})=>description===exactChoiceDescriptions[key]&&enhanced==="true"&&labels===1&&Boolean(id)&&forValue===id&&width>=16&&width<=18&&height>=16&&height<=18&&rowHeight>=36&&Math.abs(gap-8)<0.1&&describedByValid),true,JSON.stringify(documentationConfigurationChoices.details));
  const documentationConfigurationNativeChoices=[];
  for(const kind of["flow","matrix","profile"]){
    await evaluate(studio,`document.querySelector('[aria-label="Documentation section outline"] [data-section-kind="${kind}"] > button').click()`);
    await wait(40);
    documentationConfigurationNativeChoices.push(...await nativeChoiceAudit(studio,'[aria-label="Selected documentation section configuration"]',{settle:300}));
  }
  await evaluate(studio,`(async()=>{const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js"),repo=await openIndexedDbProjectRepository();let last=-1,stable=0;for(let attempt=0;attempt<200;attempt+=1){const current=(await repo.loadProject(${JSON.stringify(projectId)})).draftSequence;if(current===last)stable+=1;else{last=current;stable=0;}if(stable>=6)return current;await new Promise((resolve)=>setTimeout(resolve,50));}throw new Error("Documentation choice saves did not settle.");})()`);
  await evaluate(studio,`document.querySelector('[aria-label="Documentation section outline"] [data-section-kind="overview"] > button').click()`);
  const documentationDurableConsequences={};
  documentationDurableConsequences["documentation.concept-subheadings"]=await durableChoiceConsequence(studio,projectId,"documentation.concept-subheadings",`(loaded)=>loaded.state.project.documentation.sets[0].includeConceptSubheadings===true`,{labelIncludes:"Include concept subheadings"});
  documentationDurableConsequences["documentation.concept-membership"]=await durableChoiceConsequence(studio,projectId,"documentation.concept-membership",`(loaded)=>loaded.state.project.documentation.sets[0].concepts?.find(({name})=>name==="Ungrouped")?.included??true`,{labelIncludes:"Ungrouped"});
  documentationDurableConsequences["documentation.section-membership"]=await durableChoiceConsequence(studio,projectId,"documentation.section-membership",`(loaded)=>loaded.state.project.documentation.sets[0].sections.find(({kind})=>kind==="overview")?.selected===true`,{labelIncludes:"Overview"});
  await evaluate(studio,`document.querySelector('[aria-label="Documentation section outline"] [data-section-kind="flow"] > button').click()`);
  documentationDurableConsequences["documentation.flow-context"]=await durableChoiceConsequence(studio,projectId,"documentation.flow-context",`(loaded)=>(loaded.state.project.documentation.sets[0].sections.find(({kind})=>kind==="flow").configuration?.contextIds??[]).toSorted()`);
  documentationDurableConsequences["documentation.metadata-column"]=await durableChoiceConsequence(studio,projectId,"documentation.metadata-column",`(loaded)=>loaded.state.project.documentation.sets[0].sections.find(({kind})=>kind==="flow").configuration?.columns??[]`,{labelIncludes:"Description"});
  await evaluate(studio,`document.querySelector('[aria-label="Documentation section outline"] [data-section-kind="matrix"] > button').click()`);
  documentationDurableConsequences["documentation.matrix-context"]=await durableChoiceConsequence(studio,projectId,"documentation.matrix-context",`(loaded)=>loaded.state.project.documentation.sets[0].sections.find(({kind})=>kind==="matrix").configuration?.contextIds??[]`);
  await evaluate(studio,`document.querySelector('[aria-label="Documentation section outline"] [data-section-kind="profile"] > button').click()`);
  documentationDurableConsequences["documentation.property-row"]=await durableChoiceConsequence(studio,projectId,"documentation.property-row",`(loaded)=>loaded.state.project.documentation.sets[0].sections.find(({kind})=>kind==="profile").configuration?.paths??[]`);
  documentationDurableConsequences["documentation.profile-column"]=await durableChoiceConsequence(studio,projectId,"documentation.profile-column",`(loaded)=>loaded.state.project.documentation.sets[0].sections.find(({kind})=>kind==="profile").configuration?.columns??[]`,{labelIncludes:"Comments"});
  for(const [key,evidence] of Object.entries(documentationDurableConsequences)){
    assert.notDeepEqual(evidence.afterValue,evidence.beforeValue,`${key} must change its own saved documentation field`);
    assert.deepEqual(evidence.restoredValue,evidence.beforeValue,`${key} must restore its own saved documentation field`);
    assert.deepEqual(evidence.sequences,{before:evidence.sequences.before,after:evidence.sequences.before+1,restored:evidence.sequences.before+2},`${key} must produce exactly one established command per activation`);
  }
  await evaluate(studio,`document.querySelector('[aria-label="Documentation section outline"] [data-section-kind="overview"] > button').click()`);
  await screenshot(studio,path.join(evidenceDirectory,"studio-documentation-1280x900.png"));
  const documentationConservation=await evaluate(studio,`(async()=>{
    const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js"),repo=await openIndexedDbProjectRepository(),root=document.querySelector('[aria-label="Project Documentation workspace"]'),themeGroup=root.querySelector('[data-theme-group="Table"]');
    themeGroup.open=true;
    const before=await repo.loadProject(${JSON.stringify(projectId)}),borders=[...themeGroup.querySelectorAll('input[type="checkbox"]')].find((input)=>input.labels[0].textContent.includes("Borders")),original=borders.checked;
    borders.click();
    const staged=await repo.loadProject(${JSON.stringify(projectId)});
    [...root.querySelectorAll("button")].find((button)=>button.textContent==="Preview theme changes").click();
    const previewed=await repo.loadProject(${JSON.stringify(projectId)});
    [...root.querySelectorAll("button")].find((button)=>button.textContent==="Save theme").click();
    let saved;for(let attempt=0;attempt<160;attempt+=1){saved=await repo.loadProject(${JSON.stringify(projectId)});if(saved.draftSequence===before.draftSequence+1)break;await new Promise((resolve)=>setTimeout(resolve,20));}
    const durableBorders=saved.state.project.documentation.themes.find(({id})=>id==="theme:polish").borders;
    const savedRoot=document.querySelector('[aria-label="Project Documentation workspace"]');[...savedRoot.querySelectorAll("button")].find((button)=>button.textContent==="Refresh preview").click();
    await new Promise((resolve)=>setTimeout(resolve,30));
    const nextRoot=document.querySelector('[aria-label="Project Documentation workspace"]'),confirm=[...nextRoot.querySelectorAll('input[type="checkbox"]')].find((input)=>input.labels[0].textContent.includes("Confirm incomplete export")),exportChoice=[...nextRoot.querySelectorAll('input[type="checkbox"]')].find((input)=>input.labels[0].textContent.includes("Export Overview")),scope=nextRoot.querySelector('[aria-label="Documentation export scope"]'),copy=[...nextRoot.querySelectorAll("button")].find(({textContent})=>textContent==="Copy rich documentation"),ackBefore=confirm.checked,copyBefore=copy.disabled;globalThis.__choiceClipboard={html:"",plain:""};Object.defineProperty(navigator,"clipboard",{configurable:true,value:{write:async(items)=>{globalThis.__choiceClipboard.html=await(await items[0].getType("text/html")).text();globalThis.__choiceClipboard.plain=await(await items[0].getType("text/plain")).text();},writeText:async(value)=>{globalThis.__choiceClipboard.plain=value;}}});
    confirm.click();const copyAfterConfirmation=copy.disabled;exportChoice.click();scope.value="selected";scope.dispatchEvent(new Event("change",{bubbles:true}));copy.click();await new Promise((resolve)=>setTimeout(resolve,60));
    const acknowledged=await repo.loadProject(${JSON.stringify(projectId)});
    return{commandValues:{before:before.draftSequence,staged:staged.draftSequence,previewed:previewed.draftSequence,saved:saved.draftSequence,acknowledged:acknowledged.draftSequence},themeValues:{original,staged:borders.checked,durable:durableBorders},acknowledgementValues:{before:ackBefore,after:confirm.checked,copyBefore,copyAfterConfirmation},exportValues:{selected:exportChoice.checked,html:globalThis.__choiceClipboard.html,plain:globalThis.__choiceClipboard.plain},contracts:[borders.dataset.studioChoiceContract,confirm.dataset.studioChoiceContract,exportChoice.dataset.studioChoiceContract],descriptions:[borders.getAttribute("aria-description"),confirm.getAttribute("aria-description"),exportChoice.getAttribute("aria-description")]};
  })()`);
  assert.deepEqual(documentationConservation.commandValues,{before:documentationConservation.commandValues.before,staged:documentationConservation.commandValues.before,previewed:documentationConservation.commandValues.before,saved:documentationConservation.commandValues.before+1,acknowledged:documentationConservation.commandValues.before+1});
  assert.equal(documentationConservation.themeValues.staged,!documentationConservation.themeValues.original);
  assert.equal(documentationConservation.themeValues.durable,documentationConservation.themeValues.staged);
  assert.equal(documentationConservation.acknowledgementValues.after,!documentationConservation.acknowledgementValues.before);
  assert.equal(documentationConservation.exportValues.selected,true);
  assert.match(documentationConservation.exportValues.plain,/Retail measurement operations/u);
  assert.doesNotMatch(documentationConservation.exportValues.plain,/Checkout journey/u);
  assert.deepEqual(documentationConservation.contracts,["documentation.theme-option","documentation.confirm-incomplete","documentation.export-section"]);
  assert.deepEqual(documentationConservation.descriptions,documentationConservation.contracts.map((key)=>exactChoiceDescriptions[key]));

  await evaluate(studio,`document.querySelector('#project-tree button[data-kind="pages"]').click();document.querySelector('[data-entity-id] button').click()`);
  await ready(studio,"document.querySelector('.composed-schema-workspace input[aria-label=\"Only defined fields\"]')?.dataset.studioChoiceEnhanced==='true'","Only defined fields switch");
  await ready(studio,"document.querySelector('[aria-label=\"Applicability Set composition preview\"] [data-studio-choice-contract=\"schema.page-group-applicability-preview\"]')","Property Set applicability preview choice");
  const applicabilityPreviewNativeChoices=await nativeChoiceAudit(studio,'[aria-label="Applicability Set composition preview"]',{settle:180});
  const switchNativeChoices=await nativeChoiceAudit(studio,".composed-schema-workspace",{settle:180});
  await nativeFocusChoice(studio,".composed-schema-workspace","Only defined fields");
  const switchBefore=await evaluate(studio,`(()=>{const input=document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]'),label=input.labels[0];return{checked:input.checked,role:input.getAttribute("role"),contract:input.dataset.studioChoiceContract,description:input.getAttribute("aria-description"),enhanced:input.dataset.studioChoiceEnhanced==="true"&&input.labels?.length===1&&label.htmlFor===input.id,ariaChecked:input.getAttribute("aria-checked"),state:label.querySelector(".studio-switch-state")?.textContent,mark:label.querySelector(".studio-switch-mark")?.textContent,undo:Number(document.querySelector("#undo-project").dataset.undoCount)};})()`);
  await nativeKey(studio," ","Space");
  await wait(180);
  const switchAfter=await evaluate(studio,`(()=>{const input=document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]'),label=input.labels[0];return{checked:input.checked,role:input.getAttribute("role"),ariaChecked:input.getAttribute("aria-checked"),state:label.querySelector(".studio-switch-state")?.textContent,mark:label.querySelector(".studio-switch-mark")?.textContent,undo:Number(document.querySelector("#undo-project").dataset.undoCount)};})()`);
  assert.equal(switchBefore.role,"switch");
  assert.equal(switchBefore.contract,"schema.only-defined");
  assert.equal(switchBefore.description,exactChoiceDescriptions["schema.only-defined"]);
  assert.equal(switchBefore.enhanced,true);
  assert.equal(switchAfter.role,"switch");
  assert.equal(switchAfter.checked,!switchBefore.checked);
  assert.equal(switchAfter.ariaChecked,String(switchAfter.checked));
  assert.equal(switchAfter.state,switchAfter.checked?"On":"Off");
  assert.equal(switchAfter.mark,switchAfter.checked?"✓":"—");
  assert.equal(switchAfter.undo,switchBefore.undo+1);
  await evaluate(studio,`document.querySelector("#undo-project").click()`);
  await wait(180);
  const switchUndo=await evaluate(studio,`(()=>{const input=document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]');return{checked:input.checked,undo:Number(document.querySelector("#undo-project").dataset.undoCount),redo:Number(document.querySelector("#redo-project").dataset.redoCount)};})()`);
  await evaluate(studio,`document.querySelector("#redo-project").click()`);
  await wait(180);
  const switchRedo=await evaluate(studio,`(()=>{const input=document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]');return{checked:input.checked,undo:Number(document.querySelector("#undo-project").dataset.undoCount),redo:Number(document.querySelector("#redo-project").dataset.redoCount)};})()`);
  assert.equal(switchUndo.checked,switchBefore.checked);
  assert.equal(switchUndo.redo,1);
  assert.equal(switchRedo.checked,switchAfter.checked);
  assert.equal(switchRedo.undo,switchAfter.undo);
  blockedStudio=await pageSocket(port,`${base}specification-builder.html?project=${projectId}&kind=pages`);
  await metrics(blockedStudio,1000,760);
  await ready(blockedStudio,"document.querySelector('#project-tree button[data-kind=\"pages\"]')","second-window Pages");
  await evaluate(blockedStudio,`document.querySelector('[data-entity-id] button').click()`);
  await ready(blockedStudio,"document.querySelector('.composed-schema-workspace input[aria-label=\"Only defined fields\"]')?.dataset.studioChoiceEnhanced==='true'","second-window Only defined fields");
  await evaluate(blockedStudio,`document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]').click()`);
  await ready(studio,`document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]')?.checked===${JSON.stringify(switchBefore.checked)}`,"newer second-window switch value");
  const blockedHistoryEventStart=studio.events.length;
  await evaluate(studio,`document.querySelector("#undo-project").click()`);
  await ready(studio,"document.querySelector('#project-conflict-review')?.open&&document.querySelector('#project-conflict-fields input[type=\"checkbox\"]')?.disabled","blocked history conflict");
  const disabledConflictNativeChoices=await nativeChoiceAudit(studio,"#project-conflict-review");
  assert.equal(disabledConflictNativeChoices.length>0&&disabledConflictNativeChoices.every(({disabled,disabledState,disabledFocus})=>disabled&&disabledState&&!disabledFocus.active&&!disabledFocus.focusable),true,JSON.stringify(disabledConflictNativeChoices));
  await evaluate(studio,`document.querySelector("#reload-project-conflict").click()`);
  await ready(studio,"!document.querySelector('#project-conflict-review').open","rejected blocked history conflict");
  const blockedHistoryEvents=studio.events.splice(blockedHistoryEventStart),expectedBlockedHistoryEvents=blockedHistoryEvents.filter(({method,params})=>method==="Runtime.exceptionThrown"&&params.exceptionDetails?.exception?.className==="DurablePageHistoryConflict");
  assert.equal(expectedBlockedHistoryEvents.length,1,JSON.stringify(blockedHistoryEvents));
  studio.events.push(...blockedHistoryEvents.filter((event)=>!expectedBlockedHistoryEvents.includes(event)));
  await evaluate(blockedStudio,`document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]').click()`);
  await ready(studio,`document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]')?.checked===${JSON.stringify(switchAfter.checked)}`,"restored second-window switch value");
  await blockedStudio.call("Page.close");blockedStudio.close();blockedStudio=undefined;
  await studio.call("Page.reload",{ignoreCache:true});
  await ready(studio,"document.querySelector('.composed-schema-workspace input[aria-label=\"Only defined fields\"]')?.dataset.studioChoiceEnhanced==='true'","reloaded Only defined fields switch");
  const switchReloaded=await evaluate(studio,`document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]').checked`);
  assert.equal(switchReloaded,switchAfter.checked);
  await evaluate(studio,`document.querySelector('#project-tree button[data-kind="profiles"]').click();document.querySelector('[data-entity-id] button').click()`);
  await ready(studio,"document.querySelector('#bulk-properties')","Shared Profile bulk authoring");
  await evaluate(studio,`(()=>{const format=document.querySelector('[aria-label="Bulk input format"]'),source=document.querySelector("#bulk-properties");format.value="json";source.value=JSON.stringify([{path:"/commerce/order_id",type:"string"}]);document.querySelector("#commit-bulk-properties").click();})()`);
  await ready(studio,"document.querySelector('#bulk-stage-review input[type=\"checkbox\"]')?.dataset.studioChoiceEnhanced==='true'","bulk-stage choice");
  await evaluate(studio,`(()=>{const inspector=document.querySelector("#project-inspector");if(inspector.hidden)document.querySelector("#toggle-project-inspector").click();const details=document.querySelector("#bulk-properties").closest("details");details.open=true;details.scrollIntoView({block:"nearest"});})()`);
  const bulkNativeChoices=await nativeChoiceAudit(studio,"#bulk-stage-review");
  const bulkConservation=await evaluate(studio,`(async()=>{
    const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js"),repo=await openIndexedDbProjectRepository(),before=await repo.loadProject(${JSON.stringify(projectId)}),format=document.querySelector('[aria-label="Bulk input format"]'),source=document.querySelector("#bulk-properties");
    format.value="json";source.value=JSON.stringify([{path:"/commerce/order_id",type:"string"}]);document.querySelector("#commit-bulk-properties").click();
    await new Promise((resolve)=>setTimeout(resolve,50));
    const staged=await repo.loadProject(${JSON.stringify(projectId)}),choice=document.querySelector('#bulk-stage-review input[type="checkbox"]'),label=choice.labels[0],enhanced=choice.dataset.studioChoiceEnhanced==="true"&&choice.labels?.length===1&&label.htmlFor===choice.id,choiceBefore=choice.checked;let changes=0;choice.addEventListener("change",()=>changes++);choice.click();const afterInput=choice.checked;label.click();const restored=choice.checked,activationChanges=changes;if(!choice.checked)choice.click();const actionSelected=choice.checked;
    document.querySelector("#bulk-mark-required").click();
    await new Promise((resolve)=>setTimeout(resolve,40));
    const actioned=await repo.loadProject(${JSON.stringify(projectId)}),revisionText=document.querySelector("#bulk-stage-review").textContent;
    document.querySelector("#confirm-bulk-properties").click();
    let committed;for(let attempt=0;attempt<160;attempt+=1){committed=await repo.loadProject(${JSON.stringify(projectId)});if(committed.draftSequence===before.draftSequence+1)break;await new Promise((resolve)=>setTimeout(resolve,20));}
    const profile=committed.state.project.collections.profiles[0];
    const durableText=JSON.stringify(profile);
    return{contract:choice.dataset.studioChoiceContract,description:choice.getAttribute("aria-description"),enhanced,activation:{choiceBefore,afterInput,restored,changes:activationChanges},actionSelected,commandValues:{before:before.draftSequence,staged:staged.draftSequence,actioned:actioned.draftSequence,committed:committed.draftSequence},stageCopy:revisionText.includes("project unchanged"),durableText,durable:durableText.includes('"name":"order_id"')&&durableText.includes('"mode":"required"')};
  })()`);
  assert.equal(bulkConservation.contract,"bulk.staged-property");
  assert.equal(bulkConservation.description,exactChoiceDescriptions["bulk.staged-property"]);
  assert.equal(bulkConservation.enhanced,true,JSON.stringify(bulkConservation));
  assert.equal(bulkConservation.activation.afterInput,!bulkConservation.activation.choiceBefore);
  assert.equal(bulkConservation.activation.restored,bulkConservation.activation.choiceBefore);
  assert.equal(bulkConservation.activation.changes,2);
  assert.equal(bulkConservation.actionSelected,true);
  assert.deepEqual(bulkConservation.commandValues,{before:bulkConservation.commandValues.before,staged:bulkConservation.commandValues.before,actioned:bulkConservation.commandValues.before,committed:bulkConservation.commandValues.before+1});
  assert.equal(bulkConservation.stageCopy,true);
  assert.equal(bulkConservation.durable,true,JSON.stringify(bulkConservation));
  await evaluate(studio,`document.querySelector("#undo-project").click()`);
  await wait(120);
  const defectOptions=await evaluate(studio,`(async()=>{
    const {renderDefectReportBuilder}=await import("./data-layer-defect-report-ui.js"),{renderOccurrenceDefectReportBuilder}=await import("./data-layer-event-occurrence-defect-report-ui.js"),{openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js"),repo=await openIndexedDbProjectRepository(),before=await repo.loadProject(${JSON.stringify(projectId)}),host=document.createElement("section"),occurrenceHost=document.createElement("section");let validationCopied="",occurrenceCopied="";
    host.dataset.installedDefectRoute="validation";occurrenceHost.dataset.installedDefectRoute="occurrence";document.querySelector("#workspace-content").append(host,occurrenceHost);
    const event={id:"purchase:defect",name:"purchase",source:"dataLayer",sourceId:"dataLayer",sourceName:"dataLayer",pageUrl:"https://shop.example/checkout",pathname:"/checkout",captureTime:"2026-07-29T10:00:00Z",visitId:"visit:defect",target:"payload",validation:"Invalid",payload:{currency:"GBP"},validationDetails:{schema:{id:"schema:defect",name:"Purchase",version:2},issues:[{severity:"error",instancePath:"/currency",message:"must be one of EUR or USD",expected:"one of EUR or USD",actual:"GBP",rule:"currency v2",schemaLocation:"#/properties/currency"}]}};
    renderDefectReportBuilder(host,event,{writeText:async(text)=>{validationCopied=text;}},[event]);
    renderOccurrenceDefectReportBuilder(occurrenceHost,event,"Unexpected event",[],[event],{writeText:async(text)=>{occurrenceCopied=text;}});
    await new Promise((resolve)=>setTimeout(resolve,30));
    const choices=[...host.querySelectorAll('input[type="checkbox"]'),...occurrenceHost.querySelectorAll('input[type="checkbox"]')],contracts=choices.map((input)=>input.dataset.studioChoiceContract),descriptions=Object.fromEntries(choices.map((input)=>[input.dataset.studioChoiceContract,input.getAttribute("aria-description")])),enhanced=choices.every((input)=>input.dataset.studioChoiceEnhanced==="true"&&input.labels?.length===1&&input.labels[0].htmlFor===input.id),missing=choices.some((input)=>input.dataset.studioChoiceContract==="missing"||input.dataset.studioChoiceMissing==="true"),texts=choices.map((input)=>input.labels[0]?.textContent),first=choices.find((input)=>input.dataset.studioChoiceContract==="defect.issue-inclusion");let activation;if(first){const initial=first.checked;let changes=0;first.addEventListener("change",()=>changes++);first.click();const afterInput=first.checked;first.labels[0].click();activation={initial,afterInput,restored:first.checked,changes};}for(const key of["defect.expected-override","defect.acknowledgement"])choices.find((input)=>input.dataset.studioChoiceContract===key)?.click();[...occurrenceHost.querySelectorAll("button")].find(({textContent})=>textContent==="Confirm expectation")?.click();[...host.querySelectorAll("button")].find(({textContent})=>textContent==="Copy for Jira Cloud")?.click();[...occurrenceHost.querySelectorAll("button")].find(({textContent})=>textContent==="Copy for Jira Cloud")?.click();await new Promise((resolve)=>setTimeout(resolve,30));const staged=await repo.loadProject(${JSON.stringify(projectId)});
    return{contracts:[...new Set(contracts)].sort(),descriptions,activation,copied:{validation:validationCopied,occurrence:occurrenceCopied},enhanced,commandValues:{before:before.draftSequence,staged:staged.draftSequence},missing,texts};
  })()`);
  assert.equal(defectOptions.missing,false,JSON.stringify(defectOptions));
  assert.equal(defectOptions.contracts.includes("defect.issue-inclusion"),true,JSON.stringify(defectOptions));
  assert.equal(defectOptions.contracts.includes("defect.report-section"),true);
  assert.equal(defectOptions.contracts.includes("defect.expected-override"),true);
  assert.equal(defectOptions.contracts.includes("defect.acknowledgement"),true);
  assert.equal(defectOptions.contracts.every((key)=>defectOptions.descriptions[key]===exactChoiceDescriptions[key]),true,JSON.stringify(defectOptions));
  assert.deepEqual(defectOptions.activation,{initial:true,afterInput:false,restored:true,changes:2});
  assert.equal(defectOptions.enhanced,true);
  assert.match(defectOptions.copied.validation,/purchase/u);
  assert.match(defectOptions.copied.occurrence,/purchase/u);
  assert.equal(defectOptions.commandValues.staged,defectOptions.commandValues.before);
  const defectNativeChoices=[
    ...await nativeChoiceAudit(studio,'[data-installed-defect-route="validation"]'),
    ...await nativeChoiceAudit(studio,'[data-installed-defect-route="occurrence"]'),
  ];
  await evaluate(studio,`document.querySelectorAll("[data-installed-defect-route]").forEach((host)=>host.remove())`);
  const mountedComponentChoices=await evaluate(studio,`(async()=>{
    const pause=()=>new Promise((resolve)=>setTimeout(resolve,30)),workspace=document.querySelector("#workspace-content"),mount=document.createElement("section");mount.dataset.installedChoiceComponentAudit="true";workspace.append(mount);
    const contracts={},instances=[],interactions=[],seen=new WeakSet(),interacted=new WeakSet(),record=(root)=>{
      for(const input of root.querySelectorAll('input[type="checkbox"]')){
        if(seen.has(input))continue;seen.add(input);
        const key=input.dataset.studioChoiceContract;if(!key)continue;
        const label=input.labels?.[0],indicator=input.getBoundingClientRect(),row=label?.getBoundingClientRect(),copy=label?.querySelector(".studio-choice-copy")?.getBoundingClientRect(),describedBy=input.getAttribute("aria-describedby"),actions=[...label?.parentElement?.children??[]].filter((element)=>element!==label&&element.matches?.("button,a")),intersects=actions.some((action)=>{const box=action.getBoundingClientRect();return!(row.right<=box.left||box.right<=row.left||row.bottom<=box.top||box.bottom<=row.top);});
        const detail={key,description:input.getAttribute("aria-description"),pattern:input.getAttribute("role")==="switch"?"switch":"checkbox",enhanced:input.dataset.studioChoiceEnhanced,labels:input.labels?.length,id:input.id,forValue:label?.htmlFor,width:indicator.width,height:indicator.height,rowHeight:row?.height,gap:copy?copy.left-indicator.right:null,describedByValid:!describedBy||describedBy.split(/\\s+/).every((id)=>document.getElementById(id)),visible:input.getClientRects().length>0,actionsSeparate:!intersects};
        instances.push(detail);contracts[key]??=detail;
      }
    },probe=async(root,onlyKey)=>{
      for(const input of [...root.querySelectorAll('input[type="checkbox"]')]){const key=input.dataset.studioChoiceContract,label=input.labels?.[0];if(!key||!label||(onlyKey&&key!==onlyKey)||interacted.has(input))continue;interacted.add(input);const labelText=label.textContent.trim(),before=input.checked;let inputChanges=0;input.addEventListener("change",()=>inputChanges++);input.click();const afterInput=input.checked;await pause();const fresh=[...root.querySelectorAll('input[type="checkbox"]')].find((candidate)=>candidate.dataset.studioChoiceContract===key&&candidate.labels?.[0]?.textContent.trim()===labelText)??input,freshBefore=fresh.checked;interacted.add(fresh);let labelChanges=0;fresh.addEventListener("change",()=>labelChanges++);fresh.labels?.[0]?.click();await pause();interactions.push({key,before,afterInput,freshBefore,afterLabel:fresh.checked,inputChanges,labelChanges});}
    };
    const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js"),repository=await openIndexedDbProjectRepository(),projectBefore=await repository.loadProject(${JSON.stringify(projectId)});
    const source={id:"schema:audit-source",name:"Audit source",version:1,published:true,document:{type:"object",properties:{currency:{type:"string"},market:{type:"string"}}},assignments:[],attachedRules:[{id:"rule:audit",name:"Retail currency",version:1,propertyPath:"/currency",operator:"allowed-values",allowedValues:["EUR"],severity:"error",conditionGroup:{mode:"all",predicates:[{propertyPath:"/market",operator:"equals",value:"retail"}]}}],documentation:{properties:{}}};
    const destination={id:"schema:audit-destination",name:"Audit destination",version:1,published:true,document:{type:"object",properties:{currency:{type:"number"}}},assignments:[],attachedRules:[],documentation:{properties:{}}};
    const specificationHost=document.createElement("section");specificationHost.dataset.keyboardChoiceFixture="specification";mount.append(specificationHost);let specificationPlain="";
    const specification=await import("./data-layer-schema-specification-builder-ui.js");
    specification.renderSchemaSpecificationBuilder(specificationHost,source,[source],"published:1",()=>{}, {writeRich:async(_html,plain)=>{specificationPlain=plain;},writePlain:async(plain)=>{specificationPlain=plain;}});
    await pause();record(specificationHost);await probe(specificationHost);[...specificationHost.querySelectorAll("button")].find(({textContent})=>textContent==="Copy specification table").click();await pause();
    const copyHost=document.createElement("dialog");mount.append(copyHost);let copyTransaction;
    const copyUi=await import("./data-layer-schema-property-copy-ui.js"),copyModel=await import("./data-layer-schema-property-copy.js");
    copyUi.renderSchemaPropertyCopyReview(copyHost,{source:copyModel.schemaPropertyCopySource(source,{surface:"current"}),selectedPath:"/currency",destinations:[destination],schemas:[source,destination],reusableRuleIds:[],onApply:(transaction)=>{copyTransaction=transaction;}});
    const destinationSelect=copyHost.querySelector("#schema-property-copy-destination");destinationSelect.value=destination.id;destinationSelect.dispatchEvent(new Event("change",{bubbles:true}));await pause();record(copyHost);await probe(copyHost);
    const conflict=copyHost.querySelector("[data-copy-conflict-decision]");conflict.value="replace from source";conflict.dispatchEvent(new Event("change",{bubbles:true}));await pause();record(copyHost);await probe(copyHost,"schema.destructive-confirmation");await probe(copyHost);
    const destructive=copyHost.querySelector("[data-copy-destructive-confirmation]");destructive?.click();copyHost.querySelector("button[type=button]")?.click();await pause();
    const timelineHost=document.createElement("section"),timelineEntries=document.createElement("ul");mount.append(timelineHost,timelineEntries);
    const timeline=await import("./data-layer-defect-report-timeline-controls.js"),timelineEvent={id:"timeline:audit",name:"purchase",source:"dataLayer",sourceId:"dataLayer",sourceName:"dataLayer",pageUrl:"https://shop.example/checkout",pathname:"/checkout",captureTime:"2026-07-29T10:00:00Z",visitId:"visit:audit",target:"payload",validation:"Invalid",payload:{currency:"GBP"}};
    let timelineSelections=[];timeline.appendTimelineControls(timelineHost,timelineEntries,{event:timelineEvent,timeline:[timelineEvent]},{report:()=>({timeline:[]}),update:()=>{},refresh:()=>{}},{onSelectionsChange:(value)=>{timelineSelections=value;}});
    [...timelineHost.querySelectorAll("button")].find(({textContent})=>textContent==="Add event to timeline").click();timelineHost.querySelector('input[type="radio"]').click();await pause();record(timelineHost);await probe(timelineHost);timelineHost.querySelector('input[type="checkbox"]').click();[...timelineHost.querySelectorAll("button")].find(({textContent})=>textContent==="Add to timeline").click();
    const missingHost=document.createElement("section");missingHost.dataset.keyboardChoiceFixture="missing";mount.append(missingHost);let missingCopied="",missingSaved;const missingUi=await import("./data-layer-missing-event-defect-report-ui.js"),missingSchema={id:"schema:missing-audit",name:"Missing audit",version:1,published:true,document:{type:"object",properties:{currency:{type:"string",default:"EUR"}}},assignments:[],attachedRules:[],documentation:{properties:{"/currency":{displayName:"Currency",description:"Expected currency",example:{value:"EUR",selectionMethod:"custom"}}}}},visit={id:"visit:missing-audit",pageUrl:"https://shop.example/checkout",pathname:"/checkout",startedAt:"2026-07-29T10:00:00Z",endedAt:"2026-07-29T10:01:00Z",events:[]};
    missingUi.renderMissingEventDefectReportBuilder(missingHost,[visit],[missingSchema],{entryPoint:"Installed Studio audit",initialSchemaId:missingSchema.id,writeClipboard:async(text)=>{missingCopied=text;},saveReportedDefect:async(report)=>{missingSaved=structuredClone(report);}});
    await pause();record(missingHost);await probe(missingHost);for(const [prefix,value] of [["Expected source","dataLayer"],["Expected event name","purchase"]]){const input=[...missingHost.querySelectorAll("label")].find(({textContent})=>textContent.startsWith(prefix))?.querySelector("input");input.value=value;input.dispatchEvent(new Event("input",{bubbles:true}));}missingHost.querySelector('input[data-studio-choice-contract="defect.warning-acknowledgement"]').click();[...missingHost.querySelectorAll("button")].find(({textContent})=>textContent==="Confirm at least one matching event was expected").click();await pause();[...missingHost.querySelectorAll("button")].find(({textContent})=>textContent==="Copy for Jira Cloud")?.click();[...missingHost.querySelectorAll("button")].find(({textContent})=>textContent==="Save defect")?.click();await pause();
    const guidedHost=document.createElement("section");mount.append(guidedHost);let guidedPublished;const guided=await import("./data-layer-guided-validation-ui.js"),flow=guided.createGuidedValidationFlow(guidedHost,{schemaCandidates:()=>[],publish:(result)=>{guidedPublished=structuredClone(result);}});
    flow.openProperty({id:"guided:audit",name:"purchase",sourceId:"dataLayer",sourceName:"dataLayer",pageUrl:"https://shop.example/checkout",pathname:"/checkout",captureTime:"2026-07-29T10:00:00Z",target:"payload",payload:{currency:"GBP"}},"/currency");
    await pause();guidedHost.querySelector('input[name="guided-schema-destination"][value="new"]').click();const schemaName=guidedHost.querySelector("#guided-new-schema-name");schemaName.value="Audit purchase";schemaName.dispatchEvent(new Event("input",{bubbles:true}));[...guidedHost.querySelectorAll("button")].find(({textContent})=>textContent==="Continue").click();await pause();
    let requirement=guidedHost.querySelector("#guided-requirement");requirement.value="Must be present";requirement.dispatchEvent(new Event("change",{bubbles:true}));await pause();record(guidedHost);await probe(guidedHost);
    flow.openProperty({id:"guided:audit",name:"purchase",sourceId:"dataLayer",sourceName:"dataLayer",pageUrl:"https://shop.example/checkout",pathname:"/checkout",captureTime:"2026-07-29T10:00:00Z",target:"payload",payload:{currency:"GBP"}},"/currency");await pause();guidedHost.querySelector('input[name="guided-schema-destination"][value="new"]').click();const resetName=guidedHost.querySelector("#guided-new-schema-name");resetName.value="Audit purchase";resetName.dispatchEvent(new Event("input",{bubbles:true}));[...guidedHost.querySelectorAll("button")].find(({textContent})=>textContent==="Continue").click();await pause();requirement=guidedHost.querySelector("#guided-requirement");requirement.value="Must be present";requirement.dispatchEvent(new Event("change",{bubbles:true}));await pause();
    [...guidedHost.querySelectorAll("button")].find(({textContent})=>textContent==="Continue").click();await pause();[...guidedHost.querySelectorAll("button")].find(({textContent})=>textContent==="Continue").click();await pause();record(guidedHost);await probe(guidedHost);
    guidedHost.querySelector("#guided-publish-rule")?.click();[...guidedHost.querySelectorAll("button")].find(({textContent})=>textContent==="Add validation to draft")?.click();await pause();
    const projectAfter=await repository.loadProject(${JSON.stringify(projectId)});
    return{contracts,instances,interactions,consequences:{specificationPlain,copy:{selectedPath:copyTransaction?.plan.selectedPath,dependencies:copyTransaction?.plan.dependencies.map(({path})=>path),publishedType:copyTransaction?.schema.document.properties.currency.type,draftType:copyTransaction?.schema.workingDraft?.document.properties.currency.type,dependencyType:copyTransaction?.schema.workingDraft?.document.properties.market.type},timelineSelections,missing:{copied:missingCopied,saved:missingSaved},guided:guidedPublished,project:{before:projectBefore.draftSequence,after:projectAfter.draftSequence,bytesUnchanged:JSON.stringify(projectBefore.state)===JSON.stringify(projectAfter.state)}},missingState:{buttons:[...missingHost.querySelectorAll("button")].map(({textContent,disabled})=>[textContent,disabled]),status:missingHost.querySelector("output[aria-live=polite]")?.textContent,draft:missingHost.textContent.slice(-400)},guidedStage:guidedHost.querySelector("#guided-validation-heading")?.textContent};
  })()`);
  for(const key of ["schema.copy-dependency","schema.destructive-confirmation","schema.specification-property","schema.specification-headings","defect.timeline-evidence","defect.warning-acknowledgement","defect.expected-property","guided.conditional","guided.publish-rule"]){
    assert.equal(mountedComponentChoices.contracts[key]?.description,exactChoiceDescriptions[key],`${key} must mount through its production component: ${JSON.stringify(mountedComponentChoices)}`);
  }
  assert.equal(mountedComponentChoices.instances.length>9,true,"every repeated production choice instance must remain in the audit");
  assert.equal(mountedComponentChoices.instances.every(({key,description,pattern,enhanced,labels,id,forValue,width,height,rowHeight,gap,describedByValid,visible,actionsSeparate})=>description===exactChoiceDescriptions[key]&&pattern==="checkbox"&&enhanced==="true"&&labels===1&&Boolean(id)&&forValue===id&&width>=16&&width<=18&&height>=16&&height<=18&&rowHeight>=36&&Math.abs(gap-8)<0.1&&describedByValid&&visible&&actionsSeparate),true,JSON.stringify(mountedComponentChoices.instances));
  assert.equal(mountedComponentChoices.interactions.every(({before,afterInput,freshBefore,afterLabel,inputChanges,labelChanges})=>afterInput===!before&&freshBefore===afterInput&&afterLabel===before&&inputChanges>=1&&labelChanges===1),true,JSON.stringify(mountedComponentChoices.interactions));
  assert.match(mountedComponentChoices.consequences.specificationPlain,/Property name.*Description/u);
  assert.deepEqual(mountedComponentChoices.consequences.copy,{selectedPath:"/currency",dependencies:["/market"],publishedType:"number",draftType:"string",dependencyType:"string"});
  assert.deepEqual(mountedComponentChoices.consequences.timelineSelections,[{eventId:"timeline:audit",includeSummary:true,includePayload:false,includeValidation:false}]);
  assert.match(mountedComponentChoices.consequences.missing.copied,/Missing event: purchase/u,JSON.stringify(mountedComponentChoices.missingState));
  assert.equal(mountedComponentChoices.consequences.missing.saved.expectation.eventName,"purchase");
  assert.equal(mountedComponentChoices.consequences.missing.saved.expectedPayload.currency,undefined);
  assert.equal(mountedComponentChoices.consequences.guided.schema.name,"Audit purchase");
  assert.equal(mountedComponentChoices.consequences.guided.schema.rules.length,1);
  assert.equal(mountedComponentChoices.consequences.guided.assignment.eventName,"purchase");
  assert.deepEqual(mountedComponentChoices.consequences.project,{before:mountedComponentChoices.consequences.project.before,after:mountedComponentChoices.consequences.project.before,bytesUnchanged:true});
  await evaluate(studio,`(async()=>{
    const pause=()=>new Promise((resolve)=>setTimeout(resolve,30)),mount=document.querySelector("[data-installed-choice-component-audit]"),source={id:"schema:keyboard-source",name:"Keyboard source",version:1,published:true,document:{type:"object",properties:{currency:{type:"string"},market:{type:"string"}}},assignments:[],attachedRules:[{id:"rule:keyboard",name:"Keyboard dependency",version:1,propertyPath:"/currency",operator:"allowed-values",allowedValues:["EUR"],severity:"error",conditionGroup:{mode:"all",predicates:[{propertyPath:"/market",operator:"equals",value:"retail"}]}}],documentation:{properties:{}}},destination={id:"schema:keyboard-destination",name:"Keyboard destination",version:1,published:true,document:{type:"object",properties:{currency:{type:"number"}}},assignments:[],attachedRules:[],documentation:{properties:{}}};
    const copyHost=document.createElement("dialog");copyHost.dataset.keyboardChoiceFixture="copy";mount.append(copyHost);const copyUi=await import("./data-layer-schema-property-copy-ui.js"),copyModel=await import("./data-layer-schema-property-copy.js");copyUi.renderSchemaPropertyCopyReview(copyHost,{source:copyModel.schemaPropertyCopySource(source,{surface:"current"}),selectedPath:"/currency",destinations:[destination],schemas:[source,destination],reusableRuleIds:[],onApply:()=>{}});const destinationSelect=copyHost.querySelector("#schema-property-copy-destination");destinationSelect.value=destination.id;destinationSelect.dispatchEvent(new Event("change",{bubbles:true}));await pause();const conflict=copyHost.querySelector("[data-copy-conflict-decision]");conflict.value="replace from source";conflict.dispatchEvent(new Event("change",{bubbles:true}));await pause();if(!copyHost.open)copyHost.show();
    const timelineHost=document.createElement("section"),timelineEntries=document.createElement("ul");timelineHost.dataset.keyboardChoiceFixture="timeline";mount.append(timelineHost,timelineEntries);const timeline=await import("./data-layer-defect-report-timeline-controls.js"),event={id:"timeline:keyboard",name:"purchase",source:"dataLayer",sourceId:"dataLayer",sourceName:"dataLayer",pageUrl:"https://shop.example/checkout",pathname:"/checkout",captureTime:"2026-07-29T10:00:00Z",visitId:"visit:keyboard",target:"payload",validation:"Invalid",payload:{currency:"GBP"}};timeline.appendTimelineControls(timelineHost,timelineEntries,{event,timeline:[event]},{report:()=>({timeline:[]}),update:()=>{},refresh:()=>{}},{onSelectionsChange:()=>{}});[...timelineHost.querySelectorAll("button")].find(({textContent})=>textContent==="Add event to timeline").click();timelineHost.querySelector('input[type="radio"]').click();await pause();
    const guided=await import("./data-layer-guided-validation-ui.js"),advance=async(host,toReview)=>{const flow=guided.createGuidedValidationFlow(host,{schemaCandidates:()=>[],publish:()=>{}});flow.openProperty({id:"guided:keyboard",name:"purchase",sourceId:"dataLayer",sourceName:"dataLayer",pageUrl:"https://shop.example/checkout",pathname:"/checkout",captureTime:"2026-07-29T10:00:00Z",target:"payload",payload:{currency:"GBP"}},"/currency");await pause();host.querySelector('input[name="guided-schema-destination"][value="new"]').click();const name=host.querySelector("#guided-new-schema-name");name.value="Keyboard purchase";name.dispatchEvent(new Event("input",{bubbles:true}));[...host.querySelectorAll("button")].find(({textContent})=>textContent==="Continue").click();await pause();const requirement=host.querySelector("#guided-requirement");requirement.value="Must be present";requirement.dispatchEvent(new Event("change",{bubbles:true}));await pause();if(toReview){[...host.querySelectorAll("button")].find(({textContent})=>textContent==="Continue").click();await pause();[...host.querySelectorAll("button")].find(({textContent})=>textContent==="Continue").click();await pause();}};
    const conditionalHost=document.createElement("section"),publishHost=document.createElement("section");conditionalHost.dataset.keyboardChoiceFixture="guided-conditional";publishHost.dataset.keyboardChoiceFixture="guided-publish";mount.append(conditionalHost,publishHost);await advance(conditionalHost,false);await advance(publishHost,true);
    return true;
  })()`);
  await evaluate(studio,`document.querySelectorAll("[data-installed-choice-component-audit] dialog[open]").forEach((dialog)=>dialog.close())`);
  const mountedComponentNativeChoices=[
    ...await nativeChoiceAudit(studio,'[data-keyboard-choice-fixture="specification"]'),
    ...await nativeChoiceAudit(studio,'[data-keyboard-choice-fixture="missing"]'),
    ...await nativeChoiceAudit(studio,'[data-keyboard-choice-fixture="timeline"]'),
    ...await nativeChoiceAudit(studio,'[data-keyboard-choice-fixture="guided-conditional"]'),
    ...await nativeChoiceAudit(studio,'[data-keyboard-choice-fixture="guided-publish"]'),
  ];
  await evaluate(studio,`document.querySelector('[data-keyboard-choice-fixture="copy"]').showModal()`);
  mountedComponentNativeChoices.push(...await nativeChoiceAudit(studio,'[data-keyboard-choice-fixture="copy"]',{restore:false}));
  await evaluate(studio,`document.querySelectorAll("dialog[open]").forEach((dialog)=>dialog.close())`);
  await evaluate(studio,`document.querySelector('#project-tree button[data-kind="applicabilitySets"]').click();document.querySelector('[data-entity-id] button').click()`);
  await ready(studio,"document.querySelector('.contextual-editor fieldset[name=\"condition\"]')","condition authoring route");
  await wait(250);
  const conditionNativeChoices=await nativeChoiceAudit(studio,".contextual-editor");
  const conditionOptions=await evaluate(studio,`(async()=>{
    const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js"),repo=await openIndexedDbProjectRepository(),before=await repo.loadProject(${JSON.stringify(projectId)}),editor=document.querySelector(".contextual-editor"),choice=editor.querySelector('input[name="fallback"]'),enhanced=choice.dataset.studioChoiceEnhanced==="true"&&choice.labels?.length===1&&choice.labels[0].htmlFor===choice.id,initial=choice.checked;let changes=0;choice.addEventListener("change",()=>changes++);choice.click();const afterInput=choice.checked;choice.labels[0].click();const afterLabel=choice.checked;choice.click();const stagedValue=choice.checked,staged=await repo.loadProject(${JSON.stringify(projectId)});editor.querySelector("form").requestSubmit();let committed;for(let attempt=0;attempt<160;attempt+=1){committed=await repo.loadProject(${JSON.stringify(projectId)});if(committed.draftSequence===before.draftSequence+1)break;await new Promise((resolve)=>setTimeout(resolve,20));}const durable=committed.state.project.collections.applicabilitySets[0];
    return{route:Boolean(editor.querySelector('fieldset[name="condition"]')),contract:choice.dataset.studioChoiceContract,description:choice.getAttribute("aria-description"),enhanced,activation:{initial,afterInput,afterLabel,stagedValue,changes},durable:durable.fallback,commandValues:{before:before.draftSequence,staged:staged.draftSequence,committed:committed.draftSequence}};
  })()`);
  assert.equal(conditionOptions.route,true);
  assert.equal(conditionOptions.contract,"entity.editor-option");
  assert.equal(conditionOptions.description,exactChoiceDescriptions["entity.editor-option"]);
  assert.equal(conditionOptions.enhanced,true);
  assert.deepEqual(conditionOptions.activation,{initial:conditionOptions.activation.initial,afterInput:!conditionOptions.activation.initial,afterLabel:conditionOptions.activation.initial,stagedValue:!conditionOptions.activation.initial,changes:3});
  assert.equal(conditionOptions.commandValues.staged,conditionOptions.commandValues.before);
  assert.deepEqual(conditionOptions.commandValues,{before:conditionOptions.commandValues.before,staged:conditionOptions.commandValues.before,committed:conditionOptions.commandValues.before+1});
  assert.equal(conditionOptions.durable,conditionOptions.activation.stagedValue);
  await evaluate(studio,`document.querySelector('#project-tree button[data-kind="applicabilitySets"]').click();document.querySelector('[data-add-kind="applicabilitySets"]').click()`);
  await ready(studio,"document.querySelector('[data-creation-kind=\"applicabilitySets\"]')","Applicability creation route");
  const creationNativeChoices=await nativeChoiceAudit(studio,'[data-creation-kind="applicabilitySets"]');
  const creationChoice=await evaluate(studio,`(async()=>{
    const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js"),repo=await openIndexedDbProjectRepository(),before=await repo.loadProject(${JSON.stringify(projectId)}),form=document.querySelector('[data-creation-kind="applicabilitySets"] form'),choice=form.querySelector('input[name="fallback"]'),enhanced=choice.dataset.studioChoiceEnhanced==="true"&&choice.labels?.length===1&&choice.labels[0].htmlFor===choice.id,initial=choice.checked;form.querySelector('input[name="name"]').value="Audit fallback";choice.click();const checked=choice.checked,staged=await repo.loadProject(${JSON.stringify(projectId)});form.requestSubmit();let committed;for(let attempt=0;attempt<160;attempt+=1){committed=await repo.loadProject(${JSON.stringify(projectId)});if(committed.draftSequence===before.draftSequence+1)break;await new Promise((resolve)=>setTimeout(resolve,20));}return{contract:choice.dataset.studioChoiceContract,description:choice.getAttribute("aria-description"),enhanced,initial,checked,durable:committed.state.project.collections.applicabilitySets.at(-1).fallback,commandValues:{before:before.draftSequence,staged:staged.draftSequence,committed:committed.draftSequence}};})()`);
  assert.equal(creationChoice.contract,"entity.creation-option");
  assert.equal(creationChoice.description,exactChoiceDescriptions["entity.creation-option"]);
  assert.equal(creationChoice.enhanced,true);
  assert.equal(creationChoice.checked,!creationChoice.initial);
  assert.equal(creationChoice.durable,creationChoice.checked);
  assert.deepEqual(creationChoice.commandValues,{before:creationChoice.commandValues.before,staged:creationChoice.commandValues.before,committed:creationChoice.commandValues.before+1});
  conflictStudio=await pageSocket(port,`${base}specification-builder.html?project=${projectId}&kind=pages`);
  await metrics(conflictStudio,1100,760);
  await ready(conflictStudio,"document.querySelector('#project-tree button[data-kind=\"pages\"]')","conflict Studio");
  await evaluate(conflictStudio,`document.querySelector('#project-tree button[data-kind="pages"]').click();document.querySelector('[data-entity-id] button').click()`);
  await ready(conflictStudio,"document.querySelector('.contextual-editor [name=\"name\"]')","stale Page editor");
  const conflictPrimary=await evaluate(studio,`(async()=>{const durable=await import("./data-layer-durable-project-repository.js"),repo=await durable.openIndexedDbProjectRepository(),base=await repo.loadProject(${JSON.stringify(projectId)}),next=structuredClone(base.state),page=next.project.collections.pages[0];page.name="Current conflict value";const result=await repo.saveDraft(durable.durableDraftCommand(base,next,{commandId:"choice-control-current-conflict",label:"Create choice-control conflict"}));return{status:result.status,sequence:(await repo.loadProject(${JSON.stringify(projectId)})).draftSequence};})()`);
  assert.notEqual(conflictPrimary.status,"conflict");
  await evaluate(conflictStudio,`(()=>{const editor=document.querySelector(".contextual-editor"),name=editor.querySelector('[name="name"]');name.value="Pending conflict value";name.dispatchEvent(new Event("input",{bubbles:true}));editor.querySelector("form").requestSubmit();return true;})()`);
  await ready(conflictStudio,"document.querySelector('#project-conflict-review')?.open","conflict review");
  const conflictNativeChoices=await nativeChoiceAudit(conflictStudio,"#project-conflict-review");
  const conflictConservation=await evaluate(conflictStudio,`(async()=>{
    const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js"),repo=await openIndexedDbProjectRepository(),dialog=document.querySelector("#project-conflict-review"),choice=dialog.querySelector('input[type="checkbox"]'),enhanced=choice.dataset.studioChoiceEnhanced==="true"&&choice.labels?.length===1&&choice.labels[0].htmlFor===choice.id,before=await repo.loadProject(${JSON.stringify(projectId)}),initial=choice.checked;choice.click();const selected=choice.checked,staged=await repo.loadProject(${JSON.stringify(projectId)}),text=dialog.textContent;document.querySelector("#merge-project-conflict").click();let committed;for(let attempt=0;attempt<160;attempt+=1){committed=await repo.loadProject(${JSON.stringify(projectId)});if(committed.draftSequence===before.draftSequence+1)break;await new Promise((resolve)=>setTimeout(resolve,20));}return{contract:choice.dataset.studioChoiceContract,description:choice.getAttribute("aria-description"),enhanced,values:{initial,staged:selected,current:text.includes("Current conflict value"),pending:text.includes("Pending conflict value"),durable:committed.state.project.collections.pages[0].name},commandValues:{before:before.draftSequence,staged:staged.draftSequence,committed:committed.draftSequence}};})()`);
  assert.equal(conflictConservation.contract,"conflict.pending-field");
  assert.equal(conflictConservation.description,exactChoiceDescriptions["conflict.pending-field"]);
  assert.equal(conflictConservation.enhanced,true);
  assert.deepEqual(conflictConservation.values,{initial:false,staged:true,current:true,pending:true,durable:"Pending conflict value"});
  assert.deepEqual(conflictConservation.commandValues,{before:conflictConservation.commandValues.before,staged:conflictConservation.commandValues.before,committed:conflictConservation.commandValues.before+1});
  conflictStudio.close();conflictStudio=undefined;

  await studio.call("Emulation.setTouchEmulationEnabled",{enabled:true,maxTouchPoints:1});
  await metrics(studio,360,800);
  await evaluate(studio,`document.querySelector('#project-tree button[data-kind="documentation"]').click();document.querySelector('[data-theme-group="Table"]').open=true`);
  await ready(studio,"document.querySelector('[aria-label=\"Project Documentation workspace\"] input[type=\"checkbox\"]')?.dataset.studioChoiceEnhanced==='true'","narrow choice rows");
  const responsiveFocus=await nativeFocusChoice(studio,'[aria-label="Project Documentation workspace"]',"Include concept subheadings");
  const responsiveChoices=await evaluate(studio,`(()=>{
    const root=document.querySelector('[aria-label="Project Documentation workspace"]'),choices=[...root.querySelectorAll('input[type="checkbox"]')].filter((input)=>input.getClientRects().length),rows=choices.map((input)=>input.labels[0]),boxes=rows.map((row)=>row.getBoundingClientRect());
    return{coarse:matchMedia("(pointer: coarse)").matches,minTarget:Math.min(...boxes.map(({height})=>height)),adjacent:choices.every((choice)=>{const indicator=choice.getBoundingClientRect(),copy=choice.labels[0].querySelector(".studio-choice-copy").getBoundingClientRect();return Math.abs(copy.left-indicator.right-8)<.1;}),contained:boxes.every(({left,right})=>left>=0&&right<=innerWidth+.1),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  })()`);
  assert.equal(responsiveChoices.coarse,true);
  assert.equal(responsiveChoices.minTarget>=44,true);
  assert.equal(responsiveChoices.adjacent,true);
  assert.equal(responsiveChoices.contained,true);
  assert.equal(responsiveFocus.active,true);
  assert.notDeepEqual(responsiveFocus.focus,responsiveFocus.defaultFocus);
  assert.notEqual(responsiveFocus.focus[0],"none");
  assert.notEqual(responsiveFocus.focus[1],"0px");
  assert.equal(responsiveChoices.overflow,0);
  await metrics(studio,640,450);
  const zoomChoices=await evaluate(studio,`(()=>{const root=document.querySelector('[aria-label="Project Documentation workspace"]'),choices=[...root.querySelectorAll('input[type="checkbox"]')].filter((input)=>input.getClientRects().length),rows=choices.map((input)=>input.labels[0].getBoundingClientRect());return{targets:rows.every(({height})=>height>=44),contained:rows.every(({left,right})=>left>=0&&right<=innerWidth+.1),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};})()`);
  assert.deepEqual(zoomChoices,{targets:true,contained:true,overflow:0});
  await studio.call("Emulation.setTouchEmulationEnabled",{enabled:false});

  await metrics(studio,1720,960);
  await evaluate(studio,`document.querySelector('#project-tree button[data-kind="flows"]').click();document.querySelector('[data-entity-id] button').click()`);
  await ready(studio,"document.querySelector('#flow-graph-workspace .flow-graph-canvas')","Flow workspace");
  const flow=await evaluate(studio,`(()=>{const owner=document.querySelector(".flow-canvas-scroll"),canvas=document.querySelector(".flow-graph-canvas"),overflow=getComputedStyle(owner).overflowX;return{canvas:Boolean(canvas),localOwner:overflow==="auto"||overflow==="hidden"||owner.scrollWidth>owner.clientWidth,documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};})()`);
  assert.equal(flow.canvas,true);
  assert.equal(flow.localOwner,true);
  assert.equal(flow.documentOverflow,0);
  await metrics(studio,1440,900);
  await evaluate(studio,`document.querySelector("#run-preflight").click()`);
  await ready(studio,"document.querySelector('.preflight-list')","preflight assurance");
  await evaluate(studio,`document.querySelector("#show-coverage").click()`);
  await ready(studio,"document.querySelector('.coverage-grid')||document.querySelector('#workspace-content').textContent.includes('Coverage blocked')","assurance");

  await metrics(studio,640,450);
  const zoom=await evaluate(studio,`(()=>({overflow:[document.documentElement.scrollWidth-document.documentElement.clientWidth,document.body.scrollWidth-document.body.clientWidth],controls:[...document.querySelectorAll("button,input,select,textarea")].filter((element)=>{const box=element.getBoundingClientRect();return box.width>0&&box.height>0;}).every((element)=>element.getBoundingClientRect().width<=innerWidth)}))()`);
  assert.deepEqual(zoom.overflow,[0,0]);
  assert.equal(zoom.controls,true);
  await screenshot(studio,path.join(evidenceDirectory,"studio-zoom-640x450.png"));

  await studio.call("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  const reduced=await evaluate(studio,`(()=>{const samples=[...document.querySelectorAll(".entity-row button,.actions button")];return{matches:matchMedia("(prefers-reduced-motion: reduce)").matches,durations:samples.map((element)=>getComputedStyle(element).transitionDuration)};})()`);
  assert.equal(reduced.matches,true);
  assert.equal(reduced.durations.every((duration)=>duration.split(",").every((value)=>parseFloat(value)<=0.001)),true);
  await studio.call("Emulation.setEmulatedMedia",{features:[{name:"forced-colors",value:"active"}]});
  const forced=await evaluate(studio,`(()=>{const samples=[document.querySelector("#show-coverage"),document.querySelector("#publish-project"),document.querySelector("#project-tree button[aria-current=true]")].filter(Boolean);return{matches:matchMedia("(forced-colors: active)").matches,count:samples.length,borders:samples.map((element)=>{const style=getComputedStyle(element);return[style.borderTopWidth,style.borderRightWidth,style.borderBottomWidth,style.borderLeftWidth];})};})()`);
  assert.equal(forced.matches,true);
  assert.equal(forced.count,3);
  assert.equal(forced.borders.every((widths)=>widths.some((width)=>parseFloat(width)>0)),true);

  await studio.call("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await studio.call("Emulation.setDeviceMetricsOverride",{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await studio.call("Page.bringToFront");
  await evaluate(studio,"document.querySelector('#project-tree button[data-kind=\"pages\"]').click()");
  await wait(100);
  await studio.call("Page.navigate",{url:`${base}specification-builder.html?project=${projectId}&route=overview`});
  await ready(studio,"document.readyState==='complete'&&!document.querySelector('#project-workspace').hidden&&document.querySelector('#project-tree button[data-kind=\"overview\"]')?.getAttribute('aria-current')==='true'","analyst guidance overview");
  const analystBefore=await evaluate(studio,`(async()=>{const repo=await (await import("./data-layer-durable-project-repository.js")).openIndexedDbProjectRepository(),record=await repo.loadProject(${JSON.stringify(projectId)}),workspace=document.querySelector("#workspace-pane");workspace.focus();return{project:JSON.stringify(record),undo:document.querySelector("#undo-project").dataset.undoCount,focus:workspace.id,bubbleHidden:document.querySelector("#studio-analyst-hint").hidden};})()`);
  assert.equal(analystBefore.bubbleHidden,true);
  const analystAutomaticBoundary=await evaluate(studio,`(async()=>{const {installStudioAnalystGuidance}=await import("./specification-studio-technical-analyst-guidance.js"),bubble=document.querySelector("#studio-analyst-hint"),analystControl=document.querySelector("#studio-analyst-control"),blocker=document.createElement("div");blocker.dataset.schemaRowOverlay="true";document.body.append(blocker);let now=0;const controller=installStudioAnalystGuidance({bubble,analystControl,route:()=>"Project overview",active:()=>true,reducedMotion:()=>true,now:()=>now,intervalMilliseconds:1_000_000});now=9_999;controller.evaluate();const preFirst=bubble.hidden,preFirstPose=analystControl.dataset.analystPose;now=10_000;controller.evaluate();window.__studioAnalystAutomaticBoundary={controller,blocker,setNow:(value)=>{now=value;}};return{preFirst,preFirstPose,shown:!bubble.hidden,id:bubble.dataset.hintId,pose:analystControl.dataset.analystPose};})()`);
  const analystPreFirst=analystAutomaticBoundary.preFirst;
  assert.equal(analystPreFirst,true);
  assert.deepEqual(analystAutomaticBoundary,{preFirst:true,preFirstPose:"idle",shown:true,id:"project-overview",pose:"holding"});
  const analystVisible=await evaluate(studio,`(()=>{const region=document.querySelector("#studio-analyst-guidance"),control=document.querySelector("#studio-analyst-control"),images=[...control.querySelectorAll("img")],bubble=document.querySelector("#studio-analyst-hint"),nav=document.querySelector("#project-workspace > nav"),regionBox=region.getBoundingClientRect(),controlBox=control.getBoundingClientRect(),bubbleBox=bubble.getBoundingClientRect(),navBox=nav.getBoundingClientRect(),style=getComputedStyle(bubble),under=[...document.elementsFromPoint(bubbleBox.left+bubbleBox.width/2,bubbleBox.top+bubbleBox.height/2)].filter((element)=>element!==bubble&&element.matches("button,input,select,textarea,a[href],[role=button]"));return{hidden:bubble.hidden,text:bubble.dataset.completeText,hintId:bubble.dataset.hintId,pose:control.dataset.analystPose,width:controlBox.width,minReadableWidth:parseFloat(getComputedStyle(document.documentElement).fontSize)*8,leftAnchored:controlBox.left<regionBox.left+regionBox.width*.2,aspectRatio:controlBox.width/controlBox.height,bubbleWidthRatio:bubbleBox.width/regionBox.width,bubbleAboveAnalyst:bubbleBox.bottom<=controlBox.top+2,artSources:images.map((image)=>new URL(image.currentSrc||image.src).pathname.split("/").pop()),artCanvases:images.map((image)=>[image.naturalWidth,image.naturalHeight,image.complete]),artGeometry:images.map((image)=>{const box=image.getBoundingClientRect(),imageStyle=getComputedStyle(image);return{box:[box.left,box.top,box.width,box.height].map((value)=>Math.round(value*100)/100),objectFit:imageStyle.objectFit,objectPosition:imageStyle.objectPosition,transform:imageStyle.transform};}),inside:regionBox.left>=navBox.left&&regionBox.right<=navBox.right+.6&&bubbleBox.left>=regionBox.left&&bubbleBox.right<=regionBox.right+.6&&bubbleBox.top>=regionBox.top&&controlBox.bottom<=regionBox.bottom+.6,under:under.length,overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,focus:document.activeElement.id,live:bubble.getAttribute("aria-live"),role:bubble.getAttribute("role"),animation:style.animationName,transition:style.transitionDuration,background:style.backgroundImage,border:style.borderTopWidth,shadow:style.boxShadow,font:style.fontFamily};})()`);
  assert.deepEqual({
    hidden:analystVisible.hidden,
    text:analystVisible.text,
    hintId:analystVisible.hintId,
    readableWidth:analystVisible.width>=analystVisible.minReadableWidth,
    leftAnchored:analystVisible.leftAnchored,
    inside:analystVisible.inside,
    under:analystVisible.under,
    overflow:analystVisible.overflow,
    focus:analystVisible.focus,
    live:analystVisible.live,
    role:analystVisible.role,
    animation:analystVisible.animation,
    transitionDisabled:analystVisible.transition.split(",").every((value)=>parseFloat(value)<=0.001),
  },{
    hidden:false,
    text:"A project with no collection is merely a clipboard with ambitions. Pick one on the left and give the specification somewhere to begin.",
    hintId:"project-overview",
    readableWidth:true,
    leftAnchored:true,
    inside:true,
    under:0,
    overflow:0,
    focus:"workspace-pane",
    live:"polite",
    role:"status",
    animation:"none",
    transitionDisabled:true,
  });
  assert.equal(analystVisible.pose,"holding");
  assert.ok(analystVisible.aspectRatio>0.70&&analystVisible.aspectRatio<0.73);
  assert.equal(analystVisible.bubbleWidthRatio>0.84,true,JSON.stringify(analystVisible));
  assert.equal(analystVisible.bubbleAboveAnalyst,true);
  assert.deepEqual(analystVisible.artSources,["technical-analyst.png","technical-analyst-speaking-a.png","technical-analyst-speaking-b.png"]);
  assert.equal(analystVisible.artCanvases.every(([width,height,complete])=>width===587&&height===822&&complete),true);
  assert.equal(
    analystVisible.artGeometry.slice(1).every((geometry)=>JSON.stringify(geometry)===JSON.stringify(analystVisible.artGeometry[0])),
    true,
    JSON.stringify(analystVisible.artGeometry),
  );
  assert.deepEqual(
    {
      objectFit:analystVisible.artGeometry[0].objectFit,
      objectPosition:analystVisible.artGeometry[0].objectPosition,
      transform:analystVisible.artGeometry[0].transform,
    },
    {objectFit:"contain",objectPosition:"50% 100%",transform:"none"},
  );
  assert.match(analystVisible.background,/radial-gradient/u);
  assert.equal(parseFloat(analystVisible.border)>0,true);
  assert.notEqual(analystVisible.shadow,"none");
  assert.match(analystVisible.font,/Bangers|sans-serif/u);
  const analystAutomaticHidden=await evaluate(studio,`(()=>{const boundary=window.__studioAnalystAutomaticBoundary;boundary.setNow(20_000);boundary.controller.evaluate();const hidden=document.querySelector("#studio-analyst-hint").hidden,pose=document.querySelector("#studio-analyst-control").dataset.analystPose;boundary.controller.dispose();boundary.blocker.remove();delete window.__studioAnalystAutomaticBoundary;return{hidden,pose};})()`);
  assert.deepEqual(analystAutomaticHidden,{hidden:true,pose:"idle"});

  const analystScheduleBoundary=await evaluate(studio,`(async()=>{
    const {installStudioAnalystGuidance}=await import("./specification-studio-technical-analyst-guidance.js"),bubble=document.querySelector("#studio-analyst-hint");
    let now=0,active=true,route="Project overview";
    const snapshot=()=>({hidden:bubble.hidden,id:bubble.dataset.hintId??null,text:bubble.dataset.completeText??null});
    const install=()=>installStudioAnalystGuidance({bubble,route:()=>route,active:()=>active,now:()=>now,intervalMilliseconds:1_000_000});
    let controller=install();
    const tick=(elapsed)=>{now+=elapsed;controller.evaluate();return snapshot();};
    const preFirst=tick(9_999),first=tick(1),afterLifetime=tick(10_000);
    const cooldownBefore=tick(109_999),second=tick(1),rotation=[first];
    for(const nextRoute of["Shared Profiles","Pages","Flows","Documentation"]){
      route=nextRoute;
      tick(0);
      rotation.push(tick(10_000));
    }
    route="Project overview";
    const routeHide=tick(0),retained=tick(10_000);
    controller.dispose();
    const pause=(pauseKind)=>{
      now=0;active=true;route="Pages";bubble.hidden=true;controller=install();
      const before=tick(5_000);
      active=false;
      const inactive=tick(60_000);
      active=true;
      tick(0);
      const resumed=tick(5_000);
      active=false;
      const removed=tick(1);
      controller.dispose();
      return{pauseKind,before,inactive,resumed,removed};
    };
    return{preFirst,first,afterLifetime,cooldownBefore,second,rotation,routeHide,retained,documentPause:pause("document-hidden"),blockingPause:pause("blocking-surface")};
  })()`);
  assert.deepEqual({
    preFirstHidden:analystScheduleBoundary.preFirst.hidden,
    first:analystScheduleBoundary.first.id,
    afterLifetimeHidden:analystScheduleBoundary.afterLifetime.hidden,
    cooldownBeforeHidden:analystScheduleBoundary.cooldownBefore.hidden,
    second:analystScheduleBoundary.second.id,
    rotation:analystScheduleBoundary.rotation.map(({id,text})=>[id,text]),
    routeHide:analystScheduleBoundary.routeHide.hidden,
    retained:analystScheduleBoundary.retained.id,
    documentPause:[analystScheduleBoundary.documentPause.before.hidden,analystScheduleBoundary.documentPause.inactive.hidden,analystScheduleBoundary.documentPause.resumed.id,analystScheduleBoundary.documentPause.removed.hidden],
    blockingPause:[analystScheduleBoundary.blockingPause.before.hidden,analystScheduleBoundary.blockingPause.inactive.hidden,analystScheduleBoundary.blockingPause.resumed.id,analystScheduleBoundary.blockingPause.removed.hidden],
  },{
    preFirstHidden:true,
    first:"project-overview",
    afterLifetimeHidden:true,
    cooldownBeforeHidden:true,
    second:"project-overview-context",
    rotation:[
      ["project-overview","A project with no collection is merely a clipboard with ambitions. Pick one on the left and give the specification somewhere to begin."],
      ["shared-profiles","If Pages keep borrowing the same fields, stop issuing duplicates like raffle tickets. Put them in a Shared Profile and let inheritance do the legwork."],
      ["pages","Give each Page its observed page event before polishing the schema. Even a splendid room needs a doorbell before anyone can prove they visited."],
      ["flows","Pages are the rooms; Events are the custard pies. Add the rooms first, then put each splat where it actually happened."],
      ["documentation","Refresh the preview after changing a Documentation Set. Yesterday's snapshot is beautifully formatted and completely unaware of today."],
    ],
    routeHide:true,
    retained:"project-overview-search",
    documentPause:[true,true,"pages",true],
    blockingPause:[true,true,"pages",true],
  });

  const analystBlockingPredicate=await evaluate(studio,`(async()=>{
    const {studioAnalystGuidanceIsActive}=await import("./specification-studio-technical-analyst-guidance.js"),workspace=document.querySelector("#project-workspace"),navigation=document.querySelector("#project-workspace > nav"),region=document.querySelector("#studio-analyst-guidance"),active=()=>studioAnalystGuidanceIsActive({document,populated:true,workspace,navigation,region}),dialog=document.querySelector("#project-conflict-review"),menu=document.querySelector(".actions details"),layer=document.createElement("div");
    const baseline=active();
    dialog.showModal();const dialogBlocked=!active();dialog.close();
    menu.open=true;const menuBlocked=!active();menu.open=false;
    layer.dataset.schemaRowOverlay="true";document.body.append(layer);const layerBlocked=!active();layer.remove();
    return{baseline,dialogBlocked,menuBlocked,layerBlocked};
  })()`);
  assert.deepEqual(analystBlockingPredicate,{baseline:true,dialogBlocked:true,menuBlocked:true,layerBlocked:true});
  await side.call("Page.bringToFront");
  await wait(100);
  const analystDocumentHidden=await evaluate(studio,`(async()=>{const {studioAnalystGuidanceIsActive}=await import("./specification-studio-technical-analyst-guidance.js");return{hidden:document.hidden,active:studioAnalystGuidanceIsActive({document,populated:true,workspace:document.querySelector("#project-workspace"),navigation:document.querySelector("#project-workspace > nav"),region:document.querySelector("#studio-analyst-guidance")})};})()`);
  assert.deepEqual(analystDocumentHidden,{hidden:true,active:false});
  await studio.call("Page.bringToFront");

  await studio.call("Emulation.setDeviceMetricsOverride",{width:640,height:450,deviceScaleFactor:1,mobile:false});
  const analystZoom=await evaluate(studio,`(async()=>{
    const {installStudioAnalystGuidance}=await import("./specification-studio-technical-analyst-guidance.js"),region=document.querySelector("#studio-analyst-guidance"),bubble=document.querySelector("#studio-analyst-hint"),navigation=document.querySelector("#project-workspace > nav");let now=0;
    const controller=installStudioAnalystGuidance({bubble,route:()=>"Documentation",active:()=>true,now:()=>now,intervalMilliseconds:1_000_000});now=10_000;controller.evaluate();
    const regionBox=region.getBoundingClientRect(),bubbleBox=bubble.getBoundingClientRect(),navigationBox=navigation.getBoundingClientRect(),result={visible:region.getClientRects().length>0&&!bubble.hidden,inside:regionBox.left>=navigationBox.left&&regionBox.right<=navigationBox.right+.6&&bubbleBox.left>=regionBox.left&&bubbleBox.right<=regionBox.right+.6,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),text:bubble.dataset.completeText};
    controller.dispose();return result;
  })()`);
  assert.deepEqual(analystZoom,{visible:true,inside:true,overflow:0,text:"Refresh the preview after changing a Documentation Set. Yesterday's snapshot is beautifully formatted and completely unaware of today."});
  await studio.call("Emulation.setDeviceMetricsOverride",{width:360,height:800,deviceScaleFactor:1,mobile:false});
  const analystNarrow=await evaluate(studio,`(()=>{const region=document.querySelector("#studio-analyst-guidance"),nav=document.querySelector("#project-workspace > nav"),visibleBefore=region.getClientRects().length>0;nav.hidden=true;const hiddenWithNavigation=region.getClientRects().length===0;nav.hidden=false;const overflow=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)<=innerWidth;return{visibleBefore,hiddenWithNavigation,overflow};})()`);
  assert.deepEqual(analystNarrow,{visibleBefore:true,hiddenWithNavigation:true,overflow:true});

  await studio.call("Emulation.setDeviceMetricsOverride",{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await evaluate(studio,"document.querySelector('#studio-analyst-control').click()");
  const analystFooterLayout=await evaluate(studio,`(()=>{const nav=document.querySelector("#project-workspace > nav"),tree=document.querySelector("#project-tree"),region=document.querySelector("#studio-analyst-guidance"),control=document.querySelector("#studio-analyst-control"),bubble=document.querySelector("#studio-analyst-hint"),box=(element)=>{const value=element.getBoundingClientRect();return{left:value.left,top:value.top,right:value.right,bottom:value.bottom,width:value.width,height:value.height};},sample=()=>{const navBox=box(nav),treeBox=box(tree),regionBox=box(region),controlBox=box(control),bubbleBox=box(bubble),buttons=[...tree.querySelectorAll("button")],lastBox=box(buttons.at(-1));return{nav:navBox,tree:treeBox,region:regionBox,control:controlBox,bubble:bubbleBox,last:lastBox,scrollable:tree.scrollHeight>tree.clientHeight,scrollTop:tree.scrollTop,footerBottom:Math.round((navBox.bottom-regionBox.bottom)*10)/10,footerLeft:Math.round((regionBox.left-navBox.left)*10)/10,treeAboveFooter:treeBox.bottom<=regionBox.top+.6,bubbleAboveAnalyst:bubbleBox.bottom<=controlBox.top+2,bubbleReadable:bubbleBox.width>=regionBox.width*.84,controlsClear:treeBox.bottom<=regionBox.top+.6&&buttons.every((button)=>{const value=button.getBoundingClientRect(),visibleTop=Math.max(value.top,treeBox.top),visibleBottom=Math.min(value.bottom,treeBox.bottom);return visibleBottom<=visibleTop||visibleBottom<=regionBox.top+.6;})};},short=sample(),added=[];for(let index=0;index<28;index+=1){const item=document.createElement("li"),button=document.createElement("button");button.type="button";button.textContent="Temporary navigation evidence "+index;item.append(button);tree.append(item);added.push(item);}const beforeScroll=sample();tree.scrollTop=tree.scrollHeight;const afterScroll=sample();added.forEach((item)=>item.remove());tree.scrollTop=0;return{short,long:{beforeScroll,afterScroll},restored:sample()};})()`);
  assert.equal(analystFooterLayout.short.treeAboveFooter,true);
  assert.equal(analystFooterLayout.short.bubbleAboveAnalyst,true);
  assert.equal(analystFooterLayout.short.bubbleReadable,true);
  assert.equal(analystFooterLayout.short.controlsClear,true);
  assert.equal(analystFooterLayout.long.beforeScroll.scrollable,true);
  assert.equal(analystFooterLayout.long.afterScroll.scrollTop>0,true);
  assert.deepEqual(analystFooterLayout.long.beforeScroll.region,analystFooterLayout.long.afterScroll.region);
  assert.equal(analystFooterLayout.long.afterScroll.treeAboveFooter,true);
  assert.equal(analystFooterLayout.long.afterScroll.controlsClear,true);
  assert.deepEqual(analystFooterLayout.short.region,analystFooterLayout.restored.region);
  assert.deepEqual(
    [analystFooterLayout.short.footerBottom,analystFooterLayout.short.footerLeft],
    [analystFooterLayout.long.afterScroll.footerBottom,analystFooterLayout.long.afterScroll.footerLeft],
  );
  const analystLayoutSample=await evaluate(studio,`(()=>{const control=document.querySelector("#studio-analyst-control"),region=document.querySelector("#studio-analyst-guidance"),bubble=document.querySelector("#studio-analyst-hint"),tree=document.querySelector("#project-tree"),box=(element)=>{const value=element.getBoundingClientRect();return[value.left,value.top,value.width,value.height].map((part)=>Math.round(part*10)/10);},controlBox=control.getBoundingClientRect(),style=getComputedStyle(control),outline=getComputedStyle(control,"::after");return{region:box(region),tree:box(tree),control:box(control),bubble:box(bubble),scale:new DOMMatrix(style.transform).a,shadow:style.boxShadow,border:style.borderTopWidth,background:style.backgroundColor,outlineOpacity:outline.opacity,center:{x:controlBox.left+controlBox.width/2,y:controlBox.top+controlBox.height/2}};})()`);
  await studio.call("Input.dispatchMouseEvent",{type:"mouseMoved",x:analystLayoutSample.center.x,y:analystLayoutSample.center.y});
  await wait(30);
  const analystHover=await evaluate(studio,`(()=>{const control=document.querySelector("#studio-analyst-control"),region=document.querySelector("#studio-analyst-guidance"),bubble=document.querySelector("#studio-analyst-hint"),tree=document.querySelector("#project-tree"),box=(element)=>{const value=element.getBoundingClientRect();return[value.left,value.top,value.width,value.height].map((part)=>Math.round(part*10)/10);},controlBox=control.getBoundingClientRect(),bubbleBox=bubble.getBoundingClientRect(),style=getComputedStyle(control),outline=getComputedStyle(control,"::after");return{region:box(region),tree:box(tree),scale:new DOMMatrix(style.transform).a,shadow:style.boxShadow,outlineOpacity:outline.opacity,outlineBorder:outline.borderTopWidth,outlineWidth:outline.outlineWidth,overlap:controlBox.top<bubbleBox.bottom-2};})()`);
  await studio.call("Input.dispatchMouseEvent",{type:"mouseMoved",x:1200,y:850});
  const analystFocus=await evaluate(studio,`(()=>{const control=document.querySelector("#studio-analyst-control"),region=document.querySelector("#studio-analyst-guidance"),tree=document.querySelector("#project-tree"),box=(element)=>{const value=element.getBoundingClientRect();return[value.left,value.top,value.width,value.height].map((part)=>Math.round(part*10)/10);};control.focus();const style=getComputedStyle(control),outline=getComputedStyle(control,"::after");return{region:box(region),tree:box(tree),scale:new DOMMatrix(style.transform).a,shadow:style.boxShadow,outlineOpacity:outline.opacity,outlineBorder:outline.borderTopWidth,outlineWidth:outline.outlineWidth,focus:document.activeElement.id};})()`);
  const analystRest=await evaluate(studio,`(()=>{document.querySelector("#project-search").focus();const control=document.querySelector("#studio-analyst-control"),style=getComputedStyle(control),outline=getComputedStyle(control,"::after");return{scale:new DOMMatrix(style.transform).a,shadow:style.boxShadow,border:style.borderTopWidth,background:style.backgroundColor,outlineOpacity:outline.opacity,focus:document.activeElement.id};})()`);
  assert.equal(Math.abs(analystHover.scale-1.05)<.001,true);
  assert.equal(Math.abs(analystFocus.scale-1.05)<.001,true);
  assert.equal(Math.abs(analystRest.scale-1)<.001,true);
  assert.deepEqual([analystLayoutSample.shadow,analystHover.shadow,analystFocus.shadow,analystRest.shadow],["none","none","none","none"]);
  assert.deepEqual([analystLayoutSample.border,analystRest.border],["0px","0px"]);
  assert.deepEqual([analystLayoutSample.outlineOpacity,analystRest.outlineOpacity],["0","0"]);
  assert.equal(Number(analystHover.outlineOpacity)>0,true);
  assert.equal(Number(analystFocus.outlineOpacity)>0,true);
  assert.equal(parseFloat(analystHover.outlineBorder)>0&&parseFloat(analystHover.outlineWidth)>0,true);
  assert.equal(parseFloat(analystFocus.outlineBorder)>0&&parseFloat(analystFocus.outlineWidth)>0,true);
  assert.match(analystLayoutSample.background,/rgba\(0, 0, 0, 0\)|transparent/u);
  assert.equal(analystRest.shadow,analystLayoutSample.shadow);
  assert.deepEqual([analystHover.region,analystHover.tree],[analystLayoutSample.region,analystLayoutSample.tree]);
  assert.deepEqual([analystFocus.region,analystFocus.tree],[analystLayoutSample.region,analystLayoutSample.tree]);
  assert.equal(analystHover.overlap,false);

  const analystClickActivation=await evaluate(studio,`(()=>{const control=document.querySelector("#studio-analyst-control"),before=document.activeElement.id;control.click();return{before,after:document.activeElement.id,id:document.querySelector("#studio-analyst-hint").dataset.hintId,text:document.querySelector("#studio-analyst-hint").dataset.completeText};})()`);
  await evaluate(studio,"document.querySelector('#studio-analyst-control').focus()");
  const enterFocusBefore=await evaluate(studio,"document.activeElement.id");
  await nativeKey(studio,"Enter","Enter");
  await wait(30);
  const analystEnterActivation=await evaluate(studio,`(()=>({before:${JSON.stringify("studio-analyst-control")},after:document.activeElement.id,id:document.querySelector("#studio-analyst-hint").dataset.hintId,text:document.querySelector("#studio-analyst-hint").dataset.completeText}))()`);
  assert.equal(enterFocusBefore,"studio-analyst-control");
  await nativeKey(studio," ","Space");
  await wait(30);
  const analystSpaceActivation=await evaluate(studio,`(()=>({before:"studio-analyst-control",after:document.activeElement.id,id:document.querySelector("#studio-analyst-hint").dataset.hintId,text:document.querySelector("#studio-analyst-hint").dataset.completeText}))()`);
  const activationIds=[analystClickActivation.id,analystEnterActivation.id,analystSpaceActivation.id];
  assert.equal(new Set(activationIds).size,3);
  assert.deepEqual(
    [analystClickActivation.before,analystClickActivation.after,analystEnterActivation.before,analystEnterActivation.after,analystSpaceActivation.before,analystSpaceActivation.after],
    ["project-search","project-search","studio-analyst-control","studio-analyst-control","studio-analyst-control","studio-analyst-control"],
  );

  const analystTail=await evaluate(studio,`(()=>{
    const region=document.querySelector("#studio-analyst-guidance").getBoundingClientRect();
    const controlElement=document.querySelector("#studio-analyst-control"),control=controlElement.getBoundingClientRect();
    const bubbleElement=document.querySelector("#studio-analyst-hint"),bubble=bubbleElement.getBoundingClientRect();
    const svg=document.querySelector("#studio-analyst-tail"),path=svg.querySelector("[data-analyst-tail-shape]"),matrix=path.getScreenCTM();
    const screen=(x,y)=>{const point=new DOMPoint(x,y).matrixTransform(matrix);return{x:point.x,y:point.y};};
    const mouthRight=screen(54,6),mouthLeft=screen(28,6),mouth={x:(mouthRight.x+mouthLeft.x)/2,y:(mouthRight.y+mouthLeft.y)/2},middle=screen(20,33),tip=screen(4,45),painted=path.getBoundingClientRect();
    const openRoot=!/[zZ]\\s*$/u.test(path.getAttribute("d")??""),attached=svg.parentElement===bubbleElement;
    const mouthMelds=[mouthRight,mouthLeft].every((point)=>point.x>bubble.left&&point.x<bubble.right&&Math.abs(point.y-bubble.bottom)<4);
    const pathLength=path.getTotalLength(),sampleCount=Math.ceil(pathLength/.4),localPoints=Array.from({length:sampleCount+1},(_,index)=>{const point=path.getPointAtLength(pathLength*index/sampleCount);return{x:point.x,y:point.y};});
    const orientation=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),intersections=[];
    for(let first=0;first<localPoints.length-1;first+=1){for(let second=first+2;second<localPoints.length-1;second+=1){const a=localPoints[first],b=localPoints[first+1],c=localPoints[second],d=localPoints[second+1],abC=orientation(a,b,c),abD=orientation(a,b,d),cdA=orientation(c,d,a),cdB=orientation(c,d,b);if(abC*abD < -1e-4&&cdA*cdB < -1e-4)intersections.push([first,second]);}}
    const rootMidpoint={x:(localPoints[0].x+localPoints.at(-1).x)/2,y:(localPoints[0].y+localPoints.at(-1).y)/2};let tipIndex=0,tipDistance=-1;localPoints.forEach((point,index)=>{const distance=(point.x-rootMidpoint.x)**2+(point.y-rootMidpoint.y)**2;if(distance>tipDistance){tipDistance=distance;tipIndex=index;}});const localTip=localPoints[tipIndex],axisLength=Math.hypot(localTip.x-rootMidpoint.x,localTip.y-rootMidpoint.y),axis={x:(localTip.x-rootMidpoint.x)/axisLength,y:(localTip.y-rootMidpoint.y)/axisLength},projections=localPoints.map((point)=>(point.x-rootMidpoint.x)*axis.x+(point.y-rootMidpoint.y)*axis.y),outbound=projections.slice(0,tipIndex+1),returning=projections.slice(tipIndex),monotonicEdges=tipIndex>0&&tipIndex<localPoints.length-1&&outbound.every((value,index)=>index===0||value>=outbound[index-1]-.5)&&returning.every((value,index)=>index===0||value<=returning[index-1]+.5);
    const artworks=[...controlElement.querySelectorAll("img")].map((art)=>{const canvas=document.createElement("canvas");canvas.width=art.naturalWidth;canvas.height=art.naturalHeight;const context=canvas.getContext("2d",{willReadFrequently:true});context.drawImage(art,0,0);return{width:canvas.width,height:canvas.height,rgba:context.getImageData(0,0,canvas.width,canvas.height).data};});
    let canvasSamples=0,opaqueSamples=0;
    for(let y=0;y<=50;y+=1)for(let x=0;x<=54;x+=1){const local=new DOMPoint(x,y);if(!path.isPointInFill(local)&&!path.isPointInStroke(local))continue;const point=local.matrixTransform(matrix);if(point.x<control.left||point.x>control.right||point.y<control.top||point.y>control.bottom)continue;canvasSamples+=1;for(const art of artworks){const pixelX=Math.min(art.width-1,Math.max(0,Math.floor((point.x-control.left)/control.width*art.width))),pixelY=Math.min(art.height-1,Math.max(0,Math.floor((point.y-control.top)/control.height*art.height)));if(art.rgba[(pixelY*art.width+pixelX)*4+3]>24)opaqueSamples+=1;}}
    return{visible:path.getClientRects().length>0,mouth,middle,tip,attached,openRoot,melds:attached&&openRoot&&mouthMelds&&Math.abs(mouthRight.x-mouthLeft.x)>control.width*.12,simple:intersections.length===0,monotonicEdges,intersections:intersections.slice(0,8),pointsToward:tip.x<control.right-2&&tip.x>=control.right-control.width*.18&&tip.y>=control.top&&tip.y<=control.top+control.height*.3,clearsArtwork:canvasSamples>0&&opaqueSamples===0,clearanceSamples:canvasSamples,travels:mouth.x>middle.x&&middle.x>tip.x&&mouth.y<middle.y&&middle.y<tip.y,inside:painted.left>=region.left-1&&painted.right<=region.right+1&&painted.top>=region.top-1&&painted.bottom<=region.bottom+1};
  })()`);
  assert.deepEqual({visible:analystTail.visible,attached:analystTail.attached,openRoot:analystTail.openRoot,melds:analystTail.melds,simple:analystTail.simple,monotonicEdges:analystTail.monotonicEdges,pointsToward:analystTail.pointsToward,clearsArtwork:analystTail.clearsArtwork,travels:analystTail.travels,inside:analystTail.inside},{visible:true,attached:true,openRoot:true,melds:true,simple:true,monotonicEdges:true,pointsToward:true,clearsArtwork:true,travels:true,inside:true},`tail geometry: ${JSON.stringify(analystTail)}`);
  await screenshot(studio,path.join(evidenceDirectory,"studio-analyst-guidance-1280x900.png"));

  await evaluate(studio,"document.querySelector('#project-tree button[data-kind=\"pages\"]').click()");
  await wait(100);
  const analystRouteHidden=await evaluate(studio,"document.querySelector('#studio-analyst-hint').hidden");
  await evaluate(studio,"document.querySelector('#project-tree button[data-kind=\"overview\"]').click()");
  await wait(100);
  const analystRouteBeforeRequest=await evaluate(studio,"document.querySelector('#studio-analyst-hint').hidden");
  const analystRetainedRequest=await evaluate(studio,`(()=>{document.querySelector("#studio-analyst-control").click();const bubble=document.querySelector("#studio-analyst-hint");return{id:bubble.dataset.hintId,text:bubble.dataset.completeText};})()`);
  assert.deepEqual([analystRouteHidden,analystRouteBeforeRequest],[true,true]);
  assert.equal(activationIds.includes(analystRetainedRequest.id),false);

  const analystPools=await evaluate(studio,`(async()=>{const {studioAnalystHintsForRoute}=await import("./specification-studio-technical-analyst-guidance.js"),parts=["Project overview","Shared Profiles","Pages","Property Sets","Events","Applicability","Flows","Fixtures","Assignments","Documentation"],comicDevice=/clipboard|ambitions|cast|filing-cabinet|brass band|magnifying glass|raffle|moustache|family tree|gangs|gate|doorbell|doorman|inspectors|rebellions|ancestors|club|crystal balls|telegrams|orchestra|quarrel|parties|pipe|hat|custard pie|witness|megaphone|eyebrow|mystery|traffic control|rooms|carpet|plot|road sign|yesterday|heroic|loitering|detective|machinery|flag|parcel|ushers|building|crown|cupboard|shoppers|waistcoat|stationery/iu,pools=Object.fromEntries(parts.map((part)=>{const tips=studioAnalystHintsForRoute(part);return[part,{count:tips.length,distinct:new Set(tips.map(({id})=>id)).size,texts:tips.map(({text})=>text),comic:tips.every(({text})=>comicDevice.test(text))}];})),flow=Object.fromEntries(studioAnalystHintsForRoute("Flows").map(({id,text})=>[id,text])),required={"Project overview":"Lost an entity in the filing-cabinet jungle? Global search finds it without rearranging a single saved Draft.","Shared Profiles":"Concepts arrange Profile properties into sensible documentation gangs. Validation remains unmoved; it has its own clipboard.","Pages":"Path conditions are the Page's doorman: they inspect each observed location and politely—or firmly—decide whether it belongs.","Assignments":"Run preflight before testing. Missing targets and tied candidates are easier to catch before they put on matching moustaches.","Documentation":"Generate rich copy or Excel only after refreshing the preview. Exporting stale work merely gives yesterday better stationery."},semantics={canvas:/Pages are the rooms; Events are the custard pies.*Add the rooms first/u.test(flow.flows),frames:/Page frames.*journey step/u.test(flow["flows-frames"]),containment:/Event occurrence inside its owning Page frame/u.test(flow["flows-occurrences"]),pageRelationships:/Connect Page frames to Page frames/u.test(flow["flows-relationships"]),occurrencesAreNotEndpoints:!/connect(?:ing)? (?:Event )?occurrences|occurrence(?:s)? (?:as|for|to) relationship endpoints?/iu.test(flow["flows-relationships"]),documentation:/Refresh Documentation.*selected Flow.*value map/u.test(flow["flows-documentation"]),required:Object.entries(required).every(([route,text])=>studioAnalystHintsForRoute(route).some((hint)=>hint.text===text))};return{pools,semantics};})()`);
  assert.equal(Object.keys(analystPools.pools).length,10);
  assert.equal(Object.values(analystPools.pools).every(({count,distinct,texts,comic})=>count>=5&&count===distinct&&texts.every((text)=>text.length>20)&&comic),true);
  assert.equal(Object.values(analystPools.semantics).every(Boolean),true);

  const analystDwell=await evaluate(studio,`(async()=>{
    const {installStudioAnalystGuidance}=await import("./specification-studio-technical-analyst-guidance.js"),bubble=document.querySelector("#studio-analyst-hint"),root=document.querySelector("#project-workspace"),blocker=document.createElement("div");blocker.dataset.schemaRowOverlay="true";document.body.append(blocker);let now=0,route="Project overview";
    const dwell=async(element,modality)=>{now=0;bubble.hidden=true;const controller=installStudioAnalystGuidance({bubble,controlRoot:root,route:()=>route,active:()=>true,reducedMotion:()=>true,now:()=>now,intervalMilliseconds:1_000_000}),over=modality==="pointer"?"pointerover":"focusin",out=modality==="pointer"?"pointerout":"focusout",EventType=modality==="pointer"?PointerEvent:FocusEvent;element.dispatchEvent(new EventType(over,{bubbles:true}));now=2_999;controller.evaluate();const before=bubble.hidden;now=3_000;controller.evaluate();const first={hidden:bubble.hidden,id:bubble.dataset.hintId??null,text:bubble.dataset.completeText??null,focus:document.activeElement.id};now=30_000;controller.evaluate();const stayed={hidden:bubble.hidden,id:bubble.dataset.hintId??null};element.dispatchEvent(new EventType(out,{bubbles:true,relatedTarget:document.body}));controller.dispose();return{before,first,stayed};};
    const preflight=await dwell(document.querySelector("#run-preflight"),"focus"),coverage=await dwell(document.querySelector("#show-coverage"),"pointer"),publish=await dwell(document.querySelector("#publish-project"),"pointer"),unsupported=await dwell(document.querySelector("#toggle-project-inspector"),"pointer");
    document.querySelector('#project-tree button[data-kind="pages"]').click();await new Promise((resolve)=>setTimeout(resolve,50));route="Pages";const addPage=await dwell(document.querySelector('[data-add-kind="pages"]'),"pointer"),details=document.querySelector(".actions details");details.open=true;const undo=await dwell(document.querySelector("#undo-project"),"focus");details.open=false;blocker.remove();
    return{preflight,coverage,publish,unsupported,addPage,undo};
  })()`);
  const expectedControlTips={
    preflight:"Run preflight before publishing. It is considerably cheaper than discovering a missing target while the brass band is already playing.",
    coverage:"The Coverage matrix catches untested properties hiding behind the curtains. Open it when surely something covers that stops sounding scientific.",
    publish:"Publish release turns today's Draft into an immutable revision. Give the review one heroic squint first; even boffins check the parachute.",
    addPage:"Every grand journey needs somewhere for the trouble to begin. Add Page creates a real location before you send it marching onto a Flow.",
    undo:"Made a magnificent blunder? Undo rewinds the latest change on this page while the published revision remains safely behind glass.",
  };
  for(const [key,text] of Object.entries(expectedControlTips)){
    assert.equal(analystDwell[key].before,true);
    assert.equal(analystDwell[key].first.hidden,false);
    assert.equal(analystDwell[key].first.text,text);
    assert.deepEqual(analystDwell[key].stayed,{hidden:true,id:null});
  }
  assert.deepEqual(
    {hidden:analystDwell.unsupported.first.hidden,id:analystDwell.unsupported.first.id,text:analystDwell.unsupported.first.text},
    {hidden:true,id:null,text:null},
  );

  await studio.call("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"no-preference"}]});
  const analystTypewriter=await evaluate(studio,`(async()=>{
    const {installStudioAnalystGuidance}=await import("./specification-studio-technical-analyst-guidance.js"),bubble=document.querySelector("#studio-analyst-hint"),analystControl=document.querySelector("#studio-analyst-control"),talkA=analystControl.querySelector('[data-analyst-art="speaking-a"]'),talkB=analystControl.querySelector('[data-analyst-art="speaking-b"]'),reserve=bubble.querySelector("[data-analyst-tip-reserve]"),visual=bubble.querySelector("[data-analyst-tip-visual]"),announcement=bubble.querySelector("[data-analyst-tip-announcement]"),blocker=document.createElement("div");blocker.dataset.schemaRowOverlay="true";document.body.append(blocker);await new Promise((resolve)=>setTimeout(resolve,300));let route="Project overview",active=true,announcementCount=0;announcement.textContent="";
    const announcementObserver=new MutationObserver(()=>{if(announcement.textContent)announcementCount+=1;});announcementObserver.observe(announcement,{childList:true,subtree:true,characterData:true});
    const frame=()=>[Number(getComputedStyle(talkA).opacity),Number(getComputedStyle(talkB).opacity)];
    const controller=installStudioAnalystGuidance({bubble,analystControl,route:()=>route,active:()=>active,reducedMotion:()=>false,intervalMilliseconds:1_000_000}),samples=[];let samplingInitialPrint=true;const observer=new MutationObserver(()=>{if(samplingInitialPrint)samples.push({time:performance.now(),text:visual.textContent});});observer.observe(visual,{childList:true,subtree:true,characterData:true});
    controller.requestNext();const initialBox=bubble.getBoundingClientRect(),initial={text:visual.textContent,reserved:reserve.textContent,announcement:announcement.textContent,width:initialBox.width,height:initialBox.height,pose:analystControl.dataset.analystPose,frame:frame()};
    await new Promise((resolve)=>setTimeout(resolve,75));const partial=visual.textContent;await new Promise((resolve)=>setTimeout(resolve,210));samplingInitialPrint=false;const switchedFrame=frame(),firstId=bubble.dataset.hintId,initialAnnouncementCount=announcementCount;controller.requestNext();const replacement={id:bubble.dataset.hintId,text:visual.textContent,complete:bubble.dataset.completeText,pose:analystControl.dataset.analystPose};await new Promise((resolve)=>setTimeout(resolve,45));const replacementAnnouncementCount=announcementCount-initialAnnouncementCount;active=false;controller.evaluate();const hiddenText=visual.textContent;await new Promise((resolve)=>setTimeout(resolve,45));const hideCancellation={hidden:bubble.hidden,stable:visual.textContent===hiddenText,pose:analystControl.dataset.analystPose};active=true;controller.evaluate();route="Pages";controller.evaluate();const cancelledText=visual.textContent;await new Promise((resolve)=>setTimeout(resolve,45));const routeChange={hidden:bubble.hidden,stable:visual.textContent===cancelledText,pose:analystControl.dataset.analystPose};observer.disconnect();announcementObserver.disconnect();controller.dispose();
    const reducedController=installStudioAnalystGuidance({bubble,analystControl,route:()=>"Project overview",active:()=>true,reducedMotion:()=>true,intervalMilliseconds:1_000_000});reducedController.requestNext();await Promise.resolve();const reducedBox=bubble.getBoundingClientRect(),reduced={complete:bubble.dataset.completeText,visual:visual.textContent,announcement:announcement.textContent,width:reducedBox.width,height:reducedBox.height,pose:analystControl.dataset.analystPose,frame:frame()};reducedController.dispose();const disposedPose=analystControl.dataset.analystPose;blocker.remove();
    return{initial,partial,switchedFrame,firstId,replacement,samples:samples.slice(0,4),hideCancellation,routeChange,initialAnnouncementCount,replacementAnnouncementCount,reduced,disposedPose};
  })()`);
  assert.equal(analystTypewriter.initial.text,"");
  assert.equal(analystTypewriter.initial.reserved.length>20,true);
  assert.equal(analystTypewriter.initial.pose,"speaking");
  assert.notDeepEqual(analystTypewriter.initial.frame,analystTypewriter.switchedFrame,"the two speaking drawings alternate during typewriter output");
  assert.equal([...analystTypewriter.initial.frame,...analystTypewriter.switchedFrame].every((opacity)=>opacity===0||opacity===1),true);
  assert.equal(analystTypewriter.partial.length>=2,true);
  assert.equal(typeof analystTypewriter.firstId,"string");
  assert.notEqual(analystTypewriter.replacement.id,analystTypewriter.firstId);
  assert.equal(analystTypewriter.replacement.text,"");
  assert.equal(analystTypewriter.replacement.pose,"speaking");
  assert.deepEqual(analystTypewriter.hideCancellation,{hidden:true,stable:true,pose:"idle"});
  assert.deepEqual(analystTypewriter.routeChange,{hidden:true,stable:true,pose:"idle"});
  assert.equal(analystTypewriter.samples.length>=3,true);
  assert.equal(analystTypewriter.samples.slice(1).every((sample,index)=>sample.time-analystTypewriter.samples[index].time>=15),true);
  assert.deepEqual([analystTypewriter.initialAnnouncementCount,analystTypewriter.replacementAnnouncementCount],[1,1]);
  assert.equal(analystTypewriter.reduced.visual,analystTypewriter.reduced.complete);
  assert.equal(analystTypewriter.reduced.announcement,analystTypewriter.reduced.complete);
  assert.equal(analystTypewriter.reduced.pose,"holding");
  assert.deepEqual(analystTypewriter.reduced.frame,[1,0]);
  assert.equal(analystTypewriter.disposedPose,"idle");
  assert.deepEqual(
    [analystTypewriter.initial.width,analystTypewriter.initial.height],
    [analystTypewriter.reduced.width,analystTypewriter.reduced.height],
  );
  await studio.call("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});

  const analystAfter=await evaluate(studio,`(async()=>{const repo=await (await import("./data-layer-durable-project-repository.js")).openIndexedDbProjectRepository(),record=await repo.loadProject(${JSON.stringify(projectId)});return{project:JSON.stringify(record),undo:document.querySelector("#undo-project").dataset.undoCount,focus:document.activeElement.id};})()`);
  assert.equal(analystAfter.project,analystBefore.project);
  assert.equal(analystAfter.undo,analystBefore.undo);
  const studioAnalystGuidance={before:analystBefore,preFirstHidden:analystPreFirst,visible:analystVisible,scheduleBoundary:analystScheduleBoundary,blockingPredicate:analystBlockingPredicate,documentHidden:analystDocumentHidden,zoom:analystZoom,narrow:analystNarrow,interaction:{footerLayout:analystFooterLayout,layout:analystLayoutSample,hover:analystHover,focus:analystFocus,rest:analystRest,activations:[analystClickActivation,analystEnterActivation,analystSpaceActivation],tail:analystTail,routeHidden:analystRouteHidden,routeBeforeRequest:analystRouteBeforeRequest,retainedRequest:analystRetainedRequest,pools:analystPools,dwell:analystDwell,typewriter:analystTypewriter},after:analystAfter};

  const badEvents=[...side.events,...studio.events].filter(({method,params})=>method==="Runtime.exceptionThrown"||method==="Network.loadingFailed"||(method==="Log.entryAdded"&&params.entry?.level==="error"));
  assert.deepEqual(badEvents,[],"installed Slice 6 surfaces must have no runtime or load errors");
  const observedDescriptions={
    ...Object.fromEntries(documentationChoices.details.map(({contract,description})=>[contract,description])),
    ...documentationConfigurationChoices.contracts,
    ...Object.fromEntries(Object.entries(mountedComponentChoices.contracts).map(([key,{description}])=>[key,description])),
    ...Object.fromEntries(applicabilityPreviewNativeChoices.map(({key,description})=>[key,description])),
    [switchBefore.contract]:switchBefore.description,
    [bulkConservation.contract]:bulkConservation.description,
    ...defectOptions.descriptions,
    [conditionOptions.contract]:conditionOptions.description,
    [creationChoice.contract]:creationChoice.description,
    [conflictConservation.contract]:conflictConservation.description,
  };
  assert.deepEqual(Object.keys(observedDescriptions).sort(),[...expectedStudioChoiceContracts.keys()].sort(),"the installed production mounts must exercise every registered Studio choice");
  const nativeChoiceAudits=[...documentationNativeChoices,...documentationConfigurationNativeChoices,...switchNativeChoices,...disabledConflictNativeChoices,...bulkNativeChoices,...defectNativeChoices,...mountedComponentNativeChoices,...applicabilityPreviewNativeChoices,...conditionNativeChoices,...creationNativeChoices,...conflictNativeChoices];
  assert.equal(nativeChoiceAudits.every(validNativeChoiceAudit),true,JSON.stringify(nativeChoiceAudits.filter((item)=>!validNativeChoiceAudit(item))));
  const instanceEvidence=Object.fromEntries([...expectedStudioChoiceContracts.keys()].map((key)=>{const instances=nativeChoiceAudits.filter((detail)=>detail.key===key);return[key,instances.length>0&&instances.every(validNativeChoiceAudit)];}));
  const mountedInteractionsByKey=(key)=>mountedComponentChoices.interactions.some((item)=>item.key===key)&&mountedComponentChoices.interactions.filter((item)=>item.key===key).every(({before,afterInput,freshBefore,afterLabel,inputChanges,labelChanges})=>afterInput===!before&&freshBefore===afterInput&&afterLabel===before&&inputChanges>=1&&labelChanges===1);
  const durableDocumentationConsequence=(key)=>{const evidence=documentationDurableConsequences[key];return evidence&&JSON.stringify(evidence.afterValue)!==JSON.stringify(evidence.beforeValue)&&JSON.stringify(evidence.restoredValue)===JSON.stringify(evidence.beforeValue)&&evidence.sequences.after===evidence.sequences.before+1&&evidence.sequences.restored===evidence.sequences.before+2;};
  const consequenceEvidence=Object.fromEntries([...expectedStudioChoiceContracts.keys()].map((key)=>[key,!key.startsWith("documentation.")]));
  Object.assign(consequenceEvidence,{
    "documentation.concept-subheadings":durableDocumentationConsequence("documentation.concept-subheadings"),
    "documentation.concept-membership":durableDocumentationConsequence("documentation.concept-membership"),
    "documentation.section-membership":durableDocumentationConsequence("documentation.section-membership"),
    "documentation.flow-context":durableDocumentationConsequence("documentation.flow-context"),
    "documentation.property-row":durableDocumentationConsequence("documentation.property-row"),
    "documentation.metadata-column":durableDocumentationConsequence("documentation.metadata-column"),
    "documentation.matrix-context":durableDocumentationConsequence("documentation.matrix-context"),
    "documentation.profile-column":durableDocumentationConsequence("documentation.profile-column"),
    "documentation.export-section":documentationConservation.exportValues.selected&&/Retail measurement operations/u.test(documentationConservation.exportValues.plain)&&!/Checkout journey/u.test(documentationConservation.exportValues.plain),
    "documentation.confirm-incomplete":documentationConservation.acknowledgementValues.after!==documentationConservation.acknowledgementValues.before&&documentationConservation.commandValues.acknowledged===documentationConservation.commandValues.saved,
    "documentation.theme-option":documentationConservation.themeValues.staged!==documentationConservation.themeValues.original&&documentationConservation.themeValues.durable===documentationConservation.themeValues.staged&&documentationConservation.commandValues.saved===documentationConservation.commandValues.before+1,
    "schema.only-defined":switchAfter.checked===!switchBefore.checked&&switchUndo.checked===switchBefore.checked&&switchRedo.checked===switchAfter.checked&&switchReloaded===switchAfter.checked,
    "schema.copy-dependency":mountedInteractionsByKey("schema.copy-dependency")&&mountedComponentChoices.consequences.copy.dependencies[0]==="/market",
    "schema.destructive-confirmation":mountedInteractionsByKey("schema.destructive-confirmation")&&mountedComponentChoices.consequences.copy.publishedType==="number"&&mountedComponentChoices.consequences.copy.draftType==="string",
    "schema.specification-property":mountedInteractionsByKey("schema.specification-property")&&/currency/u.test(mountedComponentChoices.consequences.specificationPlain),
    "schema.specification-headings":mountedInteractionsByKey("schema.specification-headings")&&/Property name/u.test(mountedComponentChoices.consequences.specificationPlain),
    "schema.page-group-applicability-preview":applicabilityPreviewNativeChoices.some(({key,checked,after,restored})=>key==="schema.page-group-applicability-preview"&&after.checked===!checked&&restored.checked===checked),
    "entity.creation-option":creationChoice.durable===creationChoice.checked&&creationChoice.checked!==creationChoice.initial&&creationChoice.commandValues.committed===creationChoice.commandValues.before+1,
    "entity.editor-option":conditionOptions.durable===conditionOptions.activation.stagedValue&&conditionOptions.commandValues.committed===conditionOptions.commandValues.before+1,
    "conflict.pending-field":conflictConservation.values.durable==="Pending conflict value"&&conflictConservation.commandValues.committed===conflictConservation.commandValues.before+1,
    "bulk.staged-property":bulkConservation.durable&&bulkConservation.commandValues.committed===bulkConservation.commandValues.before+1,
    "defect.issue-inclusion":defectOptions.activation.changes===2&&Boolean(defectOptions.copied.validation),
    "defect.expected-override":Boolean(defectOptions.copied.occurrence),
    "defect.acknowledgement":Boolean(defectOptions.copied.occurrence),
    "defect.report-section":Boolean(defectOptions.copied.validation),
    "defect.timeline-evidence":mountedInteractionsByKey("defect.timeline-evidence")&&mountedComponentChoices.consequences.timelineSelections[0].includeSummary,
    "defect.warning-acknowledgement":mountedInteractionsByKey("defect.warning-acknowledgement")&&Boolean(mountedComponentChoices.consequences.missing.saved),
    "defect.expected-property":mountedInteractionsByKey("defect.expected-property")&&Boolean(mountedComponentChoices.consequences.missing.copied),
    "guided.conditional":mountedInteractionsByKey("guided.conditional")&&mountedComponentChoices.consequences.guided.schema.rules.length===1,
    "guided.publish-rule":mountedInteractionsByKey("guided.publish-rule")&&mountedComponentChoices.consequences.guided.reusableRules.length===1,
  });
  const studioChoiceControls=Object.fromEntries([...expectedStudioChoiceContracts].map(([key,[pattern,description]])=>[key,
    observedDescriptions[key]===description
    &&instanceEvidence[key]===true
    &&consequenceEvidence[key]===true
    &&nativeChoiceAudits.filter((item)=>item.key===key).every((item)=>item.role===(pattern==="switch"?"switch":null))
  ]));
  assert.equal(Object.values(studioChoiceControls).every(Boolean),true,JSON.stringify({observedDescriptions,instanceEvidence,consequenceEvidence,studioChoiceControls,copyInteractions:mountedComponentChoices.interactions.filter(({key})=>key.startsWith("schema.")),copyConsequence:mountedComponentChoices.consequences.copy}));
  await writeFile(path.join(evidenceDirectory,"report.json"),`${JSON.stringify({live,library,tree:treeBefore,treeKeyboard,documentation,documentationChoices,documentationConfigurationChoices,documentationConservation,documentationDurableConsequences,nativeChoiceFocusOrders,nativeChoiceAudits,mountedComponentChoices,switch:{before:switchBefore,after:switchAfter,undo:switchUndo,redo:switchRedo,reloaded:switchReloaded},bulkConservation,defectOptions,conditionOptions,creationChoice,conflictConservation,studioChoiceControls,studioAnalystGuidance,flow,zoom,reduced,forced},null,2)}\n`);
  console.log(JSON.stringify({studioChoiceControls,studioAnalystGuidance}));
} finally {
  blockedStudio?.close();conflictStudio?.close();side?.close();studio?.close();
  await stopHeadlessChrome(chrome,1500);
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}

console.log("TWAtility Belt packaged Slice 6 workflow polish browser test passed");
