import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtemp,rm} from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import {headlessChromeArguments,stopHeadlessChrome} from "../support/headless-chrome.mjs";

const wait=(milliseconds)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));
class DevtoolsSocket{
  constructor(url){this.url=new URL(url);this.nextId=1;this.pending=new Map();this.handlers=new Map();this.buffer=Buffer.alloc(0);}
  async connect(){await new Promise((resolve,reject)=>{this.socket=net.createConnection({host:this.url.hostname,port:Number(this.url.port)});this.socket.once("error",reject);this.socket.once("connect",()=>{const key=Buffer.from(String(Math.random())).toString("base64");this.socket.write([`GET ${this.url.pathname}${this.url.search} HTTP/1.1`,`Host: ${this.url.host}`,"Upgrade: websocket","Connection: Upgrade",`Sec-WebSocket-Key: ${key}`,"Sec-WebSocket-Version: 13","\r\n"].join("\r\n"));});let handshake="";const receive=(chunk)=>{handshake+=chunk.toString("binary");const end=handshake.indexOf("\r\n\r\n");if(end<0)return;this.socket.off("data",receive);if(!handshake.startsWith("HTTP/1.1 101"))return reject(new Error("DevTools WebSocket upgrade failed"));const remaining=Buffer.from(handshake.slice(end+4),"binary");this.socket.on("data",(data)=>this.receive(data));if(remaining.length)this.receive(remaining);resolve();};this.socket.on("data",receive);});}
  receive(chunk){this.buffer=Buffer.concat([this.buffer,chunk]);while(this.buffer.length>=2){const first=this.buffer[0];let length=this.buffer[1]&0x7f,offset=2;if(length===126){if(this.buffer.length<4)return;length=this.buffer.readUInt16BE(2);offset=4;}else if(length===127){if(this.buffer.length<10)return;length=Number(this.buffer.readBigUInt64BE(2));offset=10;}if(this.buffer.length<offset+length)return;const payload=this.buffer.subarray(offset,offset+length);this.buffer=this.buffer.subarray(offset+length);if((first&15)!==1)continue;const message=JSON.parse(payload.toString("utf8")),pending=this.pending.get(message.id);if(!pending){this.handlers.get(message.method)?.(message.params);continue;}this.pending.delete(message.id);message.error?pending.reject(new Error(message.error.message)):pending.resolve(message.result);}}
  send(payload){const body=Buffer.from(JSON.stringify(payload)),mask=Buffer.from([1,2,3,4]);let header;if(body.length<126)header=Buffer.from([0x81,0x80|body.length]);else{header=Buffer.alloc(4);header[0]=0x81;header[1]=0x80|126;header.writeUInt16BE(body.length,2);}for(let index=0;index<body.length;index+=1)body[index]^=mask[index%4];this.socket.write(Buffer.concat([header,mask,body]));}
  call(method,params={}){const id=this.nextId++;this.send({id,method,params});return new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}));}
  on(method,handler){this.handlers.set(method,handler);}
  close(){this.socket?.destroy();}
}

const profile=await mkdtemp(path.join(os.tmpdir(),"canvas-first-flow-"));
const extensionRoot=path.resolve("dist");
const chromeArguments=headlessChromeArguments(profile,extensionRoot);
chromeArguments.splice(-1,0,`--load-extension=${extensionRoot}`);
const chrome=spawn("google-chrome",chromeArguments,{stdio:["ignore","ignore","pipe"]});

async function debuggingPort(){return new Promise((resolve,reject)=>{let output="";const timeout=setTimeout(()=>reject(new Error(`Chrome did not expose a debugging port: ${output}`)),15000);chrome.stderr.on("data",(chunk)=>{output+=chunk;const match=output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);if(match){clearTimeout(timeout);resolve(Number(match[1]));}});chrome.once("error",reject);});}
async function extensionId(port){for(let attempt=0;attempt<100;attempt+=1){const targets=await fetch(`http://127.0.0.1:${port}/json/list`).then((response)=>response.json()),worker=targets.find(({type,url})=>type==="service_worker"&&url.startsWith("chrome-extension://")&&new URL(url).pathname==="/background.js");if(worker)return new URL(worker.url).hostname;await wait(20);}throw new Error("Unpacked extension did not load");}
async function evaluate(socket,expression){try{new vm.Script(expression);}catch(error){throw new Error(`Invalid page expression: ${error.stack}`);}const result=await socket.call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);return result.result.value;}
async function ready(socket){for(let attempt=0;attempt<200;attempt+=1){if(await evaluate(socket,"document.readyState==='complete'&&Boolean(document.querySelector('#create-project-form'))"))return;await wait(25);}throw new Error("Specification Builder did not become ready");}
async function reload(socket){await socket.call("Page.enable");await socket.call("Page.reload",{ignoreCache:true});await ready(socket);}

const helpers=`
const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error('Missing '+selector);return value;};
const all=(selector,root=document)=>[...root.querySelectorAll(selector)];
const pause=(milliseconds=35)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));
const visible=(element)=>{const rect=element.getBoundingClientRect();return !element.hidden&&!element.closest('[hidden]')&&rect.width>0&&rect.height>0;};
const submit=async(form,controls=[])=>{if(!visible(form)||!controls.every(visible))throw new Error('Refusing to submit a hidden form or control');form.requestSubmit();await pause();};
const set=(control,value)=>{control.value=String(value);control.dispatchEvent(new Event('input',{bubbles:true}));control.dispatchEvent(new Event('change',{bubbles:true}));};
const choose=(select,text)=>{const option=[...select.options].find(({textContent})=>textContent===text);if(!option)throw new Error('Missing option '+text);set(select,option.value);};
const envelope=()=>JSON.parse(localStorage.getItem('my-chrome-utilities.specification-project.v1'));
const bytes=()=>localStorage.getItem('my-chrome-utilities.specification-project.v1');
const nativeDone=()=>pause(180);
const nativeKey=async(key)=>{flowNativeKey(JSON.stringify({key}));await nativeDone();};
const nativePoint=async(element,type,offsetX=0,offsetY=0)=>{element.scrollIntoView({block:'center',inline:'center'});await pause();const rect=element.getBoundingClientRect();flowNativePointer(JSON.stringify({type,x:rect.left+rect.width/2+offsetX,y:rect.top+rect.height/2+offsetY}));await nativeDone();};
const nativeClick=async(element)=>{await nativePoint(element,'mousePressed');await nativePoint(element,'mouseReleased');};
const nativeDrag=async(element,offsetX,offsetY)=>{element.scrollIntoView({block:'center',inline:'center'});await pause();const owner=element.closest('[data-occurrence-id]'),before=owner?.getAttribute('transform'),rect=element.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2,steps=Math.max(1,Math.ceil(Math.max(Math.abs(offsetX),Math.abs(offsetY))/10));flowNativePointer(JSON.stringify({type:'mousePressed',x,y}));await nativeDone();for(let step=1;step<=steps;step+=1){flowNativePointer(JSON.stringify({type:'mouseMoved',x:x+offsetX*step/steps,y:y+offsetY*step/steps}));await nativeDone();}const moved=owner?.getAttribute('transform');flowNativePointer(JSON.stringify({type:'mouseReleased',x:x+offsetX,y:y+offsetY}));await nativeDone();return{before,moved};};
const openKind=async(kind)=>{q('#project-tree button[data-kind="'+kind+'"]').click();await pause();};
const add=async(kind,name)=>{await openKind(kind);const form=q('#add-entity-form'),kindControl=q('#entity-kind',form),nameControl=q('#entity-name',form);choose(kindControl,{pages:'Page',pageGroups:'Page group',events:'Event',flows:'Flow'}[kind]);set(nameControl,name);await submit(form,[kindControl,nameControl]);};
const openEntity=async(kind,name)=>{await openKind(kind);const row=all('.entity-row button',q('#workspace-content')).find(({textContent})=>textContent===name);if(!row)throw new Error('Missing entity '+name);row.click();await pause();return q('.contextual-editor form');};
const saveEntity=async(kind,name,configure)=>{const form=await openEntity(kind,name);await configure(form);await submit(form,[...form.elements].filter((control)=>control.required));};
const selectOnly=(select,names)=>{for(const option of select.options)option.selected=names.includes(option.textContent);select.dispatchEvent(new Event('change',{bubbles:true}));};
const openFlow=async(name)=>{await openKind('flows');const row=all('.entity-row button',q('#workspace-content')).find(({textContent})=>textContent===name);if(!row)throw new Error('Missing Flow '+name);row.click();await pause();};
const catalog=(kind)=>q('[aria-label="'+kind+' catalog"]');
const catalogButton=(kind,name)=>all('button',catalog(kind)).find(({textContent})=>textContent.startsWith(name));
const clickCatalog=async(kind,name)=>{const control=catalogButton(kind,name);if(!control)throw new Error('Missing '+kind+' component '+name);control.click();await pause();};
const searchCatalog=(kind,term)=>set(q('[aria-label="Search '+kind+'"]',catalog(kind)),term);
const frameCard=(name)=>all('[data-page-frame-id]',q('[aria-label="Flow Page frames"]')).find(({textContent})=>textContent.includes(name));
const selectFrame=async(name,keyboard=false)=>{const frame=frameCard(name);if(!frame)throw new Error('Missing Page frame '+name+' from '+q('[aria-label="Flow Page frames"]').textContent+' graph '+JSON.stringify(graphFor().graph.pageFrames));const control=q('button',frame);if(keyboard){control.focus();await nativeKey(' ');}else{control.click();await pause();}return frame;};
const canvas=()=>q('[aria-label="Interactive directional Flow canvas"]');
const outline=()=>q('[aria-label="Synchronized editable Flow outline"]');
const nodes=()=>all('[data-occurrence-id]',canvas());
const nodeId=(id)=>q('[data-occurrence-id="'+CSS.escape(id)+'"]',canvas());
const nodeNamed=(name,predicate=()=>true)=>nodes().find((node)=>node.textContent.includes(name)&&predicate(node));
const relationshipForm=()=>q('[aria-label="Inline relationship popover"]');
const configureRelationship=async(kind,label)=>{const form=relationshipForm();choose(q('[aria-label="Relationship kind"]',form),kind);set(q('[aria-label="Relationship group"]',form),'Fulfilment choice');set(q('[aria-label="Relationship label"]',form),label);set(q('[aria-label="Documentation condition"]',form),'checkout remains open');set(q('[aria-label="Relationship expectation"]',form),'review this journey expectation manually');await submit(form,[q('[aria-label="Relationship kind"]',form)]);};
const graphFor=(flowName='Checkout journey')=>{const stored=envelope(),flow=stored.project.collections.flows.find(({name})=>name===flowName),graph=stored.project.documentationFlowGraphs?.[flow.id]??{pageGroupIds:[],pageFrames:[],occurrences:[],relationships:[]};return{stored,flow,graph};};
const pointerConnect=async(source,target,kind,label)=>{const beforeIds=new Set(graphFor().graph.relationships.map(({id})=>id)),output=q('[data-output-port-for="'+source.dataset.occurrenceId+'"]'),input=q('[data-input-port-for="'+target.dataset.occurrenceId+'"]');await nativePoint(output,'mousePressed');const preview=q('.flow-connection-preview'),initialEnd=[preview.getAttribute('x2'),preview.getAttribute('y2')];await nativePoint(input,'mouseMoved');const moved=q('.flow-connection-preview'),movedEnd=[moved.getAttribute('x2'),moved.getAttribute('y2')],valid=input.classList.contains('is-valid-target');await nativePoint(input,'mouseReleased');const popoverFocus=relationshipForm().contains(document.activeElement),created=graphFor().graph.relationships.find(({id})=>!beforeIds.has(id));await configureRelationship(kind,label);return{createdId:created.id,previewMoved:initialEnd.join(',')!==movedEnd.join(','),valid,popoverFocus};};
const keyboardConnect=async(source,target,kind,label)=>{const beforeIds=new Set(graphFor().graph.relationships.map(({id})=>id)),output=q('[data-keyboard-output-for="'+source.dataset.occurrenceId+'"]'),eligible=nodes().filter(({dataset})=>dataset.occurrenceId!==source.dataset.occurrenceId),targetIndex=eligible.findIndex(({dataset})=>dataset.occurrenceId===target.dataset.occurrenceId);if(targetIndex<0)throw new Error('Missing keyboard target');output.focus();await nativeKey('Enter');for(let index=0;index<targetIndex;index+=1)await nativeKey('ArrowRight');await nativeKey('Enter');const popoverFocused=relationshipForm().contains(document.activeElement),created=graphFor().graph.relationships.find(({id})=>!beforeIds.has(id));await configureRelationship(kind,label);await nativeKey('Escape');return{createdId:created.id,popoverFocused,edgeFocused:document.activeElement?.dataset.relationshipId===created.id};};
const dragComponentPhases=async(component,target,phases=['dragEnter','dragOver','drop'],offsetX=0,offsetY=0)=>{target.scrollIntoView({block:'center',inline:'center'});await pause();const rect=target.getBoundingClientRect();flowNativePointer(JSON.stringify({type:'drag',phases,x:rect.left+rect.width/2+offsetX,y:rect.top+rect.height/2+offsetY,component:{kind:component.dataset.componentKind,id:component.dataset.componentId}}));await nativeDone();await pause();};
const dragComponent=(component,target,offsetX=0,offsetY=0)=>dragComponentPhases(component,target,undefined,offsetX,offsetY);
const stableGraphCapture=(flowName)=>{const {stored,flow,graph}=graphFor(flowName);return{flowId:flow.id,laneOrder:[...graph.pageGroupIds],frames:graph.pageFrames.map(({id,pageId,pageGroupId,freePageRegion,position})=>({id,pageId,pageGroupId,freePageRegion,position})),occurrences:graph.occurrences.map(({id,pageFrameId,pageId,pageGroupId,eventId,role,trigger,position})=>({id,pageFrameId,pageId,pageGroupId,eventId,role,trigger,position})),relationships:graph.relationships.map(({id,sourceNodeId,targetNodeId,kind,group,label,documentationCondition,expectation})=>({id,sourceNodeId,targetNodeId,kind,group,label,documentationCondition,expectation})),selectedItem:graph.selectedItem,viewport:graph.viewport??{x:0,y:0,zoom:1},entityIds:{groups:stored.project.collections.pageGroups.map(({id})=>id),pages:stored.project.collections.pages.map(({id})=>id),events:stored.project.collections.events.map(({id})=>id)}};};
`;

let socket;
try{
  const port=await debuggingPort();
  const id=await extensionId(port);
  const page=await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`chrome-extension://${id}/specification-builder.html`)}`,{method:"PUT"}).then((response)=>response.json());
  socket=new DevtoolsSocket(page.webSocketDebuggerUrl);
  await socket.connect();
  await socket.call("Runtime.enable");
  await socket.call("Page.enable");
  await socket.call("Page.bringToFront");
  for(const name of ["flowNativeKey","flowNativePointer"])await socket.call("Runtime.addBinding",{name});
  socket.on("Runtime.bindingCalled",async({name,payload})=>{const action=JSON.parse(payload);try{if(name==="flowNativeKey"){const key=action.key,code=key===" "?"Space":key,windowsVirtualKeyCode=key==="Enter"?13:key==="Escape"?27:key.startsWith("Arrow")?{ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40}[key]:key.charCodeAt(0);await socket.call("Input.dispatchKeyEvent",{type:"keyDown",key,code,windowsVirtualKeyCode,nativeVirtualKeyCode:windowsVirtualKeyCode});await socket.call("Input.dispatchKeyEvent",{type:"keyUp",key,code,windowsVirtualKeyCode,nativeVirtualKeyCode:windowsVirtualKeyCode});}else if(action.type==="drag"){const items=[{mimeType:"application/x-flow-component",data:JSON.stringify(action.component)}];if(action.component.kind==="page")items.push({mimeType:"application/x-flow-page-component",data:action.component.id});const dragData={items,dragOperationsMask:1};for(const type of action.phases??["dragEnter","dragOver","drop"])await socket.call("Input.dispatchDragEvent",{type,x:action.x,y:action.y,data:dragData});}else await socket.call("Input.dispatchMouseEvent",{type:action.type,x:action.x,y:action.y,button:action.type==="mouseMoved"?"none":"left",buttons:action.type==="mouseReleased"?0:1,clickCount:1});}catch(error){console.error("Native input failed",error);}});
  await socket.call("Emulation.setDeviceMetricsOverride",{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  await ready(socket);

  const session=await evaluate(socket,`(async()=>{${helpers}
    set(q('#project-name'),'Canvas Flow shop');
    set(q('#project-site'),'shop.example');
    await submit(q('#create-project-form'),[q('#project-name'),q('#project-site')]);
    for(const name of ['page_view','route_view','add_shipping_info','add_payment_info','purchase'])await add('events',name);
    for(const name of ['Cart','Payment','Shipping','Thank you','Landing','Campaign','Returns'])await add('pages',name);
    let stored=envelope(),events=Object.fromEntries(stored.project.collections.events.map((event)=>[event.name,event]));
    await saveEntity('events','page_view',async(form)=>{choose(q('select[name="role"]',form),'Context-setting');set(q('input[name="trigger"]',form),'Initial load');});
    await saveEntity('events','route_view',async(form)=>{choose(q('select[name="role"]',form),'Context-setting');set(q('input[name="trigger"]',form),'SPA route change');});
    for(const [group,members] of [['Checkout',['Cart','Payment']],['Delivery',['Shipping']],['Confirmation',['Thank you']]]){await add('pageGroups',group);await saveEntity('pageGroups',group,async(form)=>selectOnly(q('select[name="pageIds"]',form),members));}
    await add('pageGroups','Support');await saveEntity('pageGroups','Support',async(form)=>selectOnly(q('select[name="pageIds"]',form),['Returns']));
    await add('flows','Checkout journey');
    await openFlow('Checkout journey');

    const evidence={},workspace=q('#workspace-pane'),inspector=q('#project-inspector'),initialCanvas=canvas(),initialOutline=outline(),initialBytes=bytes();
    const catalogsInstalled=['Page Groups','Pages','Events'].every((name)=>workspace.contains(catalog(name)));
    const outlineOwned=workspace.contains(initialOutline);
    const inspectorFormFree=!q('#flow-inspector-context').querySelector('form')&&q('#add-flow-step-form').hidden;
    const advancedSeparated=q('#flow-step-editor summary').textContent.includes('Advanced')&&!q('#flow-step-editor').querySelector('[aria-label="Relationship kind"]');
    all('button',q('[aria-label="Flow component catalogs"]')).find(({textContent})=>textContent==='Close Inspector').click();
    const closedOperable=inspector.hidden&&['Page Groups','Pages','Events'].every((name)=>workspace.contains(catalog(name)))&&bytes()===initialBytes;
    evidence.runtime001={catalogsInstalled,outlineOwned,closedOperable,inspectorFormFree,advancedSeparated};

    const noInitialGraph=all('.flow-lane-label',initialCanvas).length===0&&graphFor().graph.pageGroupIds.length===0;
    for(const name of ['Checkout','Delivery','Confirmation'])await clickCatalog('Page Groups',name);
    stored=envelope();
    let {flow,graph}=graphFor(),groups=Object.fromEntries(stored.project.collections.pageGroups.map((group)=>[group.name,group]));
    const expectedInitialIds=['Checkout','Delivery','Confirmation'].map((name)=>groups[name].id);
    const exactInitialLabels=all('.flow-lane-label',canvas()).map(({textContent})=>textContent).join('|')==='Checkout|Delivery|Confirmation';
    const exactInitialIds=JSON.stringify(graph.pageGroupIds)===JSON.stringify(expectedInitialIds)&&!('pageGroupIds' in flow);
    const noFallback=noInitialGraph&&!/(Context|Shipping|Payment|Merge)/.test(JSON.stringify(graph.pageGroupIds))&&all('.flow-lane-label',canvas()).length===3;
    const exactNextAction=q('[role="status"]',q('.documentary-flow')).textContent==='Add a Page from the Pages catalog.';
    evidence.runtime002={exactInitialLabels,exactInitialIds,noFallback,exactNextAction};

    const confirmationRow=all('li',q('[aria-label="Page Group lane controls"]')).find(({dataset})=>dataset.pageGroupId===groups.Confirmation.id);
    all('button',confirmationRow).find(({textContent})=>textContent==='Move earlier').click();await pause();
    graph=graphFor().graph;
    const reorderedIds=[groups.Checkout.id,groups.Confirmation.id,groups.Delivery.id];
    const exactReorder=all('.flow-lane-label',canvas()).map(({textContent})=>textContent).join('|')==='Checkout|Confirmation|Delivery'&&JSON.stringify(graph.pageGroupIds)===JSON.stringify(reorderedIds);
    const derivedPositions=all('.flow-lane-label',canvas()).map((label)=>label.getAttribute('x')).join('|')==='22|242|462';

    searchCatalog('Pages','Cart');
    const cartResults=all('button',catalog('Pages'));
    const exactCartResult=cartResults.length===1&&cartResults[0].textContent==='Cart · Checkout';
    cartResults[0].click();await pause();
    searchCatalog('Pages','');
    stored=envelope();({flow,graph}=graphFor());
    const cart=stored.project.collections.pages.find(({name})=>name==='Cart'),cartFrame=graph.pageFrames.find(({pageId})=>pageId===cart.id);
    const oneCartFrame=Boolean(cartFrame)&&graph.pageFrames.filter(({pageId})=>pageId===cart.id).length===1&&cartFrame.pageGroupId===groups.Checkout.id&&frameCard('Cart').dataset.pageId===cart.id&&frameCard('Cart').dataset.pageGroupId===groups.Checkout.id;
    const cartMembershipLabel=catalogButton('Pages','Cart').textContent==='Cart · Checkout'&&frameCard('Cart').textContent.includes('Checkout / Cart');
    const beforeGuard=bytes(),beforeGuardRevision=envelope().revision;
    const checkoutRow=all('li',q('[aria-label="Page Group lane controls"]')).find(({dataset})=>dataset.pageGroupId===groups.Checkout.id);
    all('button',checkoutRow).find(({textContent})=>textContent==='Remove lane').click();await pause();
    const guardStatus=q('[role="status"]',q('.documentary-flow')).textContent;
    const guardedRemoval=bytes()===beforeGuard&&envelope().revision===beforeGuardRevision&&guardStatus.includes('Cart')&&guardStatus.includes('Move Page frame')&&guardStatus.includes('Remove Page frame');
    evidence.runtime003={exactReorder,derivedPositions,idsUnchanged:JSON.stringify(graph.pageGroupIds)===JSON.stringify(reorderedIds),guardedRemoval};

    const beforeWrongDrop=bytes(),beforeWrongRevision=envelope().revision,shipping=stored.project.collections.pages.find(({name})=>name==='Shipping');
    await dragComponent(catalogButton('Pages','Shipping'),q('[data-lane-dropzone]',q('[data-page-group-id="'+groups.Checkout.id+'"]',canvas())));
    const repair=q('[role="status"] a',q('.documentary-flow'));
    const wrongOwnerRejected=bytes()===beforeWrongDrop&&envelope().revision===beforeWrongRevision&&q('[role="status"]',q('.documentary-flow')).textContent.includes('Shipping')&&q('[role="status"]',q('.documentary-flow')).textContent.includes('Checkout');
    const exactRepair=repair.textContent==='Open Page Group membership'&&repair.getAttribute('href')==='?kind=pages&entity='+encodeURIComponent(shipping.id)+'&field=pageGroupIds'&&!q('[aria-label="Page Group lane controls"]').querySelector('input,select');
    evidence.runtime004={exactCartResult,oneCartFrame,cartMembershipLabel,wrongOwnerRejected,exactRepair};

    for(const name of ['Shipping','Thank you'])await clickCatalog('Pages',name);
    const cartInitiallyEmpty=graphFor().graph.occurrences.every(({pageFrameId})=>pageFrameId!==cartFrame.id);
    await selectFrame('Cart');await nativeClick(catalogButton('Events','page_view'));
    await selectFrame('Cart');const routeButton=catalogButton('Events','route_view');routeButton.focus();await nativeKey(' ');
    stored=envelope();({flow,graph}=graphFor());
    const contextRecords=graph.occurrences.filter(({eventId})=>[events.page_view.id,events.route_view.id].includes(eventId)),contextByEvent=Object.fromEntries(contextRecords.map((occurrence)=>[occurrence.eventId,occurrence]));
    const exactContextRefs=contextByEvent[events.page_view.id]?.trigger==='Initial load'&&contextByEvent[events.route_view.id]?.trigger==='SPA route change'&&contextRecords.every((record)=>record.pageFrameId===cartFrame.id&&record.pageId===cart.id&&record.pageGroupId===groups.Checkout.id&&record.role==='context-setting'&&!record.contextBindingId);
    const noCopiedContext=contextRecords.length===2&&contextRecords.every((record)=>!('schema' in record)&&!('contextBindingId' in record)&&!('lane' in record)&&!('laneName' in record))&&!('contextEventBindings' in stored.project.collections.pages.find(({id})=>id===cart.id))&&!('contextEventBindings' in stored.project.collections.flows.find(({id})=>id===flow.id));
    evidence.runtime005={cartInitiallyEmpty,pointerAndKeyboardInserted:contextRecords.length===2,exactContextRefs,noCopiedContext};

    const eventDefinitionBefore=JSON.stringify(stored.project.collections.events.find(({name})=>name==='add_shipping_info'));
    const membershipsBefore=JSON.stringify(stored.project.collections.pageGroups.map(({id,pageIds})=>({id,pageIds})));
    searchCatalog('Events','add_shipping_info');
    const oneShippingEvent=all('button',catalog('Events')).length===1&&catalogButton('Events','add_shipping_info').textContent==='add_shipping_info';
    await selectFrame('Cart');await nativeClick(catalogButton('Events','add_shipping_info'));
    let firstReuse=graphFor().graph.occurrences.find(({eventId})=>eventId===events.add_shipping_info.id),firstReuseBytes=JSON.stringify(firstReuse);
    await selectFrame('Shipping',true);const reuseButton=catalogButton('Events','add_shipping_info');reuseButton.focus();await nativeKey(' ');searchCatalog('Events','');
    stored=envelope();({flow,graph}=graphFor());
    const shippingFrame=graph.pageFrames.find(({pageId})=>pageId===shipping.id),reuse=graph.occurrences.filter(({eventId})=>eventId===events.add_shipping_info.id);
    const exactReusableRefs=reuse.length===2&&new Set(reuse.map(({id})=>id)).size===2&&reuse.some(({pageFrameId,pageId,pageGroupId})=>pageFrameId===cartFrame.id&&pageId===cart.id&&pageGroupId===groups.Checkout.id)&&reuse.some(({pageFrameId,pageId,pageGroupId})=>pageFrameId===shippingFrame.id&&pageId===shipping.id&&pageGroupId===groups.Delivery.id);
    const reusableSourcesUnchanged=eventDefinitionBefore===JSON.stringify(stored.project.collections.events.find(({name})=>name==='add_shipping_info'))&&membershipsBefore===JSON.stringify(stored.project.collections.pageGroups.map(({id,pageIds})=>({id,pageIds})))&&firstReuseBytes===JSON.stringify(graph.occurrences.find(({id})=>id===firstReuse.id));
    evidence.runtime006={oneShippingEvent,pointerAndKeyboardPlaced:true,exactReusableRefs,reusableSourcesUnchanged};

    const landing=stored.project.collections.pages.find(({name})=>name==='Landing'),campaign=stored.project.collections.pages.find(({name})=>name==='Campaign');
    const noInitialFreeFrame=!canvas().querySelector('[data-free-page-frame-canvas]')&&!canvas().querySelector('[data-free-page-edge-target]');
    await dragComponentPhases(catalogButton('Pages','Landing'),canvas(),['dragEnter']);
    let edgeTargets=all('[data-free-page-edge-target]',canvas()),beforeTarget=edgeTargets.find(({dataset})=>dataset.freePageEdgeTarget==='before-lanes'),afterTarget=edgeTargets.find(({dataset})=>dataset.freePageEdgeTarget==='after-lanes'),laneGeometry=q('.flow-lane',canvas()).getBoundingClientRect(),beforeGeometry=q('rect',beforeTarget).getBoundingClientRect(),afterGeometry=q('rect',afterTarget).getBoundingClientRect();
    const exactTransientTargets=edgeTargets.length===2&&beforeTarget.getAttribute('aria-label')==='Place before lanes'&&afterTarget.getAttribute('aria-label')==='Place after lanes';
    const narrowTargetGeometry=beforeGeometry.width<laneGeometry.width&&afterGeometry.width<laneGeometry.width&&beforeGeometry.height<laneGeometry.height&&afterGeometry.height<laneGeometry.height&&beforeGeometry.right<afterGeometry.left;
    await dragComponentPhases(catalogButton('Pages','Landing'),beforeTarget,['dragOver','drop']);
    await dragComponentPhases(catalogButton('Pages','Campaign'),canvas(),['dragEnter']);edgeTargets=all('[data-free-page-edge-target]',canvas());afterTarget=edgeTargets.find(({dataset})=>dataset.freePageEdgeTarget==='after-lanes');await dragComponentPhases(catalogButton('Pages','Campaign'),afterTarget,['dragOver','drop']);
    ({graph}=graphFor());const freeLanding=graph.pageFrames.find(({freePageRegion,pageId})=>freePageRegion&&pageId===landing.id),freeCampaign=graph.pageFrames.find(({freePageRegion,pageId})=>freePageRegion&&pageId===campaign.id);
    const exactFreeFrames=Boolean(freeLanding&&freeCampaign)&&freeLanding.freePageRegion==='before-lanes'&&freeCampaign.freePageRegion==='after-lanes'&&freeLanding.pageId===landing.id&&freeCampaign.pageId===campaign.id&&[freeLanding,freeCampaign].every((item)=>Number.isFinite(item.position.x)&&Number.isFinite(item.position.y)&&!('pageGroupId' in item)&&!('contextBindingId' in item))&&graph.pageGroupIds.every((id)=>id!==freeLanding.id&&id!==freeCampaign.id);
    const freeCanvasFrames=all('[data-free-page-frame-canvas]',canvas()),laneRects=all('.flow-lane',canvas()).map((item)=>item.getBoundingClientRect()),leftFrame=q('[data-free-page-frame-canvas="'+freeLanding.id+'"]').getBoundingClientRect(),rightFrame=q('[data-free-page-frame-canvas="'+freeCampaign.id+'"]').getBoundingClientRect();
    const compactFrameCount=freeCanvasFrames.length===2,compactFrameGeometry=leftFrame.width<Math.min(...laneRects.map(({width})=>width))&&rightFrame.width<Math.min(...laneRects.map(({width})=>width)),oppositeFrameSides=leftFrame.right<Math.min(...laneRects.map(({left})=>left))&&rightFrame.left>Math.max(...laneRects.map(({right})=>right));
    await dragComponent(catalogButton('Events','route_view'),q('[data-free-page-frame-id="'+freeLanding.id+'"]'));await dragComponent(catalogButton('Events','page_view'),q('[data-free-page-frame-id="'+freeCampaign.id+'"]'));
    ({graph}=graphFor());const freeInteraction=graph.occurrences.find(({pageFrameId})=>pageFrameId===freeLanding.id),campaignInteraction=graph.occurrences.find(({pageFrameId})=>pageFrameId===freeCampaign.id);
    const bothAcceptEvents=freeInteraction?.eventId===events.route_view.id&&campaignInteraction?.eventId===events.page_view.id&&[freeInteraction,campaignInteraction].every((item)=>item&&!item.pageGroupId&&Boolean(q('[data-input-port-for="'+item.id+'"]'))&&Boolean(q('[data-output-port-for="'+item.id+'"]')));
    const freeOutput=q('[data-output-port-for="'+freeInteraction.id+'"]');await nativePoint(freeOutput,'mousePressed');const freeRelationshipStarted=Boolean(document.querySelector('.flow-connection-preview'));await nativeKey('Escape');
    const beforeLandingDrop=bytes(),beforeLandingRevision=envelope().revision;
    {const landingCheckoutDrop=q('[data-lane-dropzone]',q('[data-page-group-id="'+groups.Checkout.id+'"]',canvas())),dropRect=landingCheckoutDrop.getBoundingClientRect();await dragComponent(catalogButton('Pages','Landing'),landingCheckoutDrop,0,dropRect.height/2-12);}
    const landingRepair=q('[role="status"] a',q('.documentary-flow'));
    const landingWrongDrop=bytes()===beforeLandingDrop&&envelope().revision===beforeLandingRevision&&landingRepair.getAttribute('href')==='?kind=pages&entity='+encodeURIComponent(landing.id)+'&field=pageGroupIds';
    const returns=stored.project.collections.pages.find(({name})=>name==='Returns'),beforeGroupedEdge=bytes(),beforeGroupedEdgeRevision=envelope().revision;
    await dragComponentPhases(catalogButton('Pages','Returns'),canvas(),['dragEnter']);let groupedTarget=q('[data-free-page-edge-target="before-lanes"]',canvas());await dragComponentPhases(catalogButton('Pages','Returns'),groupedTarget,['dragOver','drop']);
    await dragComponentPhases(catalogButton('Pages','Returns'),canvas(),['dragEnter']);groupedTarget=q('[data-free-page-edge-target="after-lanes"]',canvas());await dragComponentPhases(catalogButton('Pages','Returns'),groupedTarget,['dragOver','drop']);
    ({graph}=graphFor());const groupedEdgeRepair=q('[role="status"] a',q('.documentary-flow')),unselectedMembershipRejected=bytes()===beforeGroupedEdge&&envelope().revision===beforeGroupedEdgeRevision&&!graph.pageFrames.some(({pageId})=>pageId===returns.id)&&!graph.occurrences.some(({pageId})=>pageId===returns.id),unselectedMembershipGuidance=q('[role="status"]',q('.documentary-flow')).textContent.includes('Returns')&&groupedEdgeRepair.getAttribute('href')==='?kind=pages&entity='+encodeURIComponent(returns.id)+'&field=pageGroupIds';
    evidence.runtime007={noInitialFreeFrame,exactTransientTargets,narrowTargetGeometry,exactFreeFrames,compactFrameCount,compactFrameGeometry,oppositeFrameSides,bothAcceptEvents,freeRelationshipStarted,unusedTargetsRemoved:!canvas().querySelector('[data-free-page-edge-target]'),landingWrongDrop,unselectedMembershipRejected,unselectedMembershipGuidance};

    await selectFrame('Cart');await clickCatalog('Events','add_payment_info');
    await selectFrame('Thank you');await clickCatalog('Events','purchase');
    stored=envelope();({flow,graph}=graphFor());
    const paymentOccurrence=graph.occurrences.find(({eventId,pageFrameId})=>eventId===events.add_payment_info.id&&pageFrameId===cartFrame.id),purchaseOccurrence=graph.occurrences.find(({eventId,pageId})=>eventId===events.purchase.id&&pageId===stored.project.collections.pages.find(({name})=>name==='Thank you').id);
    const beforePointerY=paymentOccurrence.position.y,pointerMotion=await nativeDrag(q('rect',nodeId(paymentOccurrence.id)),0,30);
    ({graph}=graphFor());const savedPayment=graph.occurrences.find(({id})=>id===paymentOccurrence.id),validPointerMove=pointerMotion.before!==pointerMotion.moved&&savedPayment.position.y===Math.round(beforePointerY+30)&&nodeId(paymentOccurrence.id).getAttribute('transform').endsWith(' '+savedPayment.position.y+')');
    const lastValidTransform=nodeId(paymentOccurrence.id).getAttribute('transform'),beforePointerCross=bytes(),crossRevision=envelope().revision,idCapture=JSON.stringify(stableGraphCapture('Checkout journey').entityIds);
    await nativeDrag(q('rect',nodeId(paymentOccurrence.id)),100,0);
    const pointerCrossNoWrite=bytes()===beforePointerCross&&envelope().revision===crossRevision&&nodeId(paymentOccurrence.id).getAttribute('transform')===lastValidTransform;
    const beforeKeyCross=bytes();nodeId(paymentOccurrence.id).focus();await nativeKey('ArrowRight');
    const keyboardCrossNoWrite=bytes()===beforeKeyCross&&nodeId(paymentOccurrence.id).getAttribute('transform')===lastValidTransform;
    const movementGuidance=q('[role="status"]',q('.documentary-flow')).textContent.includes('Add the predefined Event to another Page frame instead.')&&idCapture===JSON.stringify(stableGraphCapture('Checkout journey').entityIds);
    evidence.runtime008={validPointerMove,pointerCrossNoWrite,keyboardCrossNoWrite,movementGuidance,reloadCoordinates:false};

    ({graph}=graphFor());const initialOccurrence=graph.occurrences.find(({eventId,role})=>eventId===events.page_view.id&&role==='context-setting'),shippingCartOccurrence=graph.occurrences.find(({eventId,pageFrameId})=>eventId===events.add_shipping_info.id&&pageFrameId===cartFrame.id);
    const initialNode=nodeId(initialOccurrence.id),paymentNode=nodeId(paymentOccurrence.id),shippingCartNode=nodeId(shippingCartOccurrence.id),purchaseNode=nodeId(purchaseOccurrence.id);
    const pointerExpected=await pointerConnect(initialNode,paymentNode,'expected-next','continue to payment');
    ({graph}=graphFor());const expectedRelationship=graph.relationships.find(({id})=>id===pointerExpected.createdId),expectedEdge=q('[data-relationship-id="'+expectedRelationship.id+'"]',canvas()),expectedLine=q('line',expectedEdge);
    const exactExpected=expectedRelationship.sourceNodeId===initialOccurrence.id&&expectedRelationship.targetNodeId===paymentOccurrence.id&&expectedRelationship.kind==='expected-next'&&Boolean(expectedRelationship.id);
    const directedGeometry=expectedEdge.dataset.directed==='true'&&Boolean(q('polygon',expectedEdge))&&(Number(expectedLine.getAttribute('x2'))!==Number(expectedLine.getAttribute('x1'))||Number(expectedLine.getAttribute('y2'))!==Number(expectedLine.getAttribute('y1')));
    evidence.runtime009={previewFollowed:pointerExpected.previewMoved,targetValid:pointerExpected.valid,exactExpected,directedGeometry,popoverFocused:pointerExpected.popoverFocus};

    const cancellation=async(target,release=true)=>{const before=bytes(),revision=envelope().revision,count=graphFor().graph.relationships.length,output=q('[data-output-port-for="'+initialOccurrence.id+'"]');await nativePoint(output,'mousePressed');await nativePoint(target,'mouseMoved');const invalid=target.classList.contains('is-invalid-target')||canvas().classList.contains('is-invalid-target')||Boolean(target.closest('[data-occurrence-id]')?.classList.contains('is-invalid-target'));if(release)await nativePoint(target,'mouseReleased');else await nativeKey('Escape');return{invalid,noWrite:bytes()===before&&envelope().revision===revision&&graphFor().graph.relationships.length===count,removed:!document.querySelector('.flow-connection-preview'),sourceFocus:document.activeElement?.dataset.occurrenceId===initialOccurrence.id};};
    const sourceCancel=await cancellation(nodeId(initialOccurrence.id));
    const emptyTarget=q('.flow-lane',canvas()),emptyCancel=await cancellation(emptyTarget);
    const incompatible=q('[data-output-port-for="'+paymentOccurrence.id+'"]'),portCancel=await cancellation(incompatible);
    const escapeCancel=await cancellation(nodeId(initialOccurrence.id),false);
    evidence.runtime010={sourceInvalid:sourceCancel.invalid,sourcePointerup:sourceCancel.noWrite&&sourceCancel.removed&&sourceCancel.sourceFocus,emptyPointerup:emptyCancel.noWrite&&emptyCancel.removed&&emptyCancel.sourceFocus,incompatiblePointerup:portCancel.noWrite&&portCancel.removed&&portCancel.sourceFocus,escapeCancelled:escapeCancel.noWrite&&escapeCancel.removed&&escapeCancel.sourceFocus};

    const parallelShipping=await pointerConnect(nodeId(initialOccurrence.id),nodeId(shippingCartOccurrence.id),'parallel','shipping branch');
    const parallelPayment=await pointerConnect(nodeId(initialOccurrence.id),nodeId(paymentOccurrence.id),'parallel','payment branch');
    const mergePayment=await pointerConnect(nodeId(paymentOccurrence.id),nodeId(purchaseOccurrence.id),'merge','join payment at purchase');
    const mergeShipping=await pointerConnect(nodeId(shippingCartOccurrence.id),nodeId(purchaseOccurrence.id),'merge','join shipping at purchase');
    ({graph}=graphFor());
    const parallel=graph.relationships.filter(({id})=>[parallelShipping.createdId,parallelPayment.createdId].includes(id)),merge=graph.relationships.filter(({id})=>[mergePayment.createdId,mergeShipping.createdId].includes(id));
    const exactParallel=parallel.length===2&&parallel.every(({kind,sourceNodeId,targetNodeId})=>kind==='parallel'&&sourceNodeId===initialOccurrence.id&&[shippingCartOccurrence.id,paymentOccurrence.id].includes(targetNodeId))&&new Set(parallel.map(({targetNodeId})=>targetNodeId)).size===2;
    const exactMerge=merge.length===2&&merge.every(({kind,sourceNodeId,targetNodeId})=>kind==='merge'&&[shippingCartOccurrence.id,paymentOccurrence.id].includes(sourceNodeId)&&targetNodeId===purchaseOccurrence.id)&&new Set(merge.map(({sourceNodeId})=>sourceNodeId)).size===2;
    const exactMeaning=[...parallel,...merge].every(({group,label,documentationCondition,expectation})=>group==='Fulfilment choice'&&Boolean(label)&&documentationCondition==='checkout remains open'&&expectation==='review this journey expectation manually')&&new Set(parallel.map(({label})=>label)).size===2&&new Set(merge.map(({label})=>label)).size===2;
    const exactProjections=[...parallel,...merge].every(({id,sourceNodeId,targetNodeId})=>{const edge=q('[data-relationship-id="'+id+'"]',canvas()),row=q('[data-relationship-id="'+id+'"]',outline());return edge.getAttribute('aria-label').includes(sourceNodeId===initialOccurrence.id?'page_view':sourceNodeId===paymentOccurrence.id?'add_payment_info':'add_shipping_info')&&row.textContent.includes(targetNodeId===purchaseOccurrence.id?'purchase':targetNodeId===paymentOccurrence.id?'add_payment_info':'add_shipping_info');});
    const manualOnly=q('.documentary-flow .status-text').textContent==='Documentary journey expectations are checked manually. Each Event payload schema validates independently.'&&!JSON.stringify(graph).includes('executed');
    evidence.runtime011={exactParallel,exactMerge,exactMeaning,exactProjections,manualOnly};

    const beforeKeyboardCount=graph.relationships.length;
    const keyboardExpected=await keyboardConnect(nodeId(initialOccurrence.id),nodeId(paymentOccurrence.id),'expected-next','keyboard payment route');
    ({graph}=graphFor());const keyboardRelationship=graph.relationships.find(({id})=>id===keyboardExpected.createdId);
    evidence.runtime012={popoverFocused:keyboardExpected.popoverFocused,edgeFocused:keyboardExpected.edgeFocused,exactOneCreated:graph.relationships.length===beforeKeyboardCount+1,exactKeyboardRelationship:keyboardRelationship.sourceNodeId===initialOccurrence.id&&keyboardRelationship.targetNodeId===paymentOccurrence.id&&keyboardRelationship.kind==='expected-next'};

    nodeId(paymentOccurrence.id).dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();
    const actions=q('[aria-label="Selected node inline actions"]'),inlineActions=['Move','Connect','Duplicate occurrence','Remove','Open schema contribution'].every((name)=>all('button',actions).some(({textContent})=>textContent===name));
    const beforeSchemaCapture=stableGraphCapture('Checkout journey'),beforeSchemaTransform=nodeId(paymentOccurrence.id).getAttribute('transform'),beforeViewport=canvas().dataset.viewport;
    all('button',actions).find(({textContent})=>textContent==='Open schema contribution').click();await pause();await pause();
    const schemaOpened=!q('#layered-schema-editor-host').hidden&&q('#workspace-content').hidden;
    all('button',q('#layered-schema-editor-host')).find(({textContent})=>textContent==='Return to Flow').click();await pause();
    const afterSchemaCapture=stableGraphCapture('Checkout journey'),restored=JSON.stringify(afterSchemaCapture)===JSON.stringify(beforeSchemaCapture)&&canvas().dataset.viewport===beforeViewport&&nodeId(paymentOccurrence.id).getAttribute('transform')===beforeSchemaTransform&&nodeId(paymentOccurrence.id).classList.contains('is-selected');
    const openInspector=all('button',q('[aria-label="Flow component catalogs"]')).find(({textContent})=>textContent==='Open Inspector');openInspector.click();await pause();
    const inspectorContext=q('#flow-inspector-context').textContent.includes(paymentOccurrence.id)&&!q('#flow-inspector-context').querySelector('button,form,input,select,textarea');
    evidence.runtime013={inlineActions,schemaOpened,restored,inspectorContext};

    ({graph}=graphFor());const landingBeforeMove=graph.pageFrames.find(({id})=>id===freeLanding.id),stripFreePresentation=({freePageRegion,position,...identity})=>identity,landingIdentityBefore=JSON.stringify(stripFreePresentation(landingBeforeMove)),landingReferencesBefore=JSON.stringify({page:envelope().project.collections.pages.find(({id})=>id===landingBeforeMove.pageId),children:graph.occurrences.filter(({pageFrameId})=>pageFrameId===freeLanding.id),relationships:graph.relationships.filter(({sourceNodeId,targetNodeId})=>graph.occurrences.some(({id,pageFrameId})=>[sourceNodeId,targetNodeId].includes(id)&&pageFrameId===freeLanding.id))});
    const freeLandingCanvas=q('[data-free-page-frame-canvas="'+freeLanding.id+'"]',canvas());freeLandingCanvas.focus();await pause();const freeLandingRect=q('rect',freeLandingCanvas),pointerEdgeTarget=q('[data-free-page-edge-target="after-lanes"]',canvas()),pointerTargetVisible=pointerEdgeTarget.getAttribute('aria-label')==='Place after lanes',sourceBounds=freeLandingRect.getBoundingClientRect(),targetBounds=pointerEdgeTarget.getBoundingClientRect();let sourcePoint;for(let y=sourceBounds.top+3;y<sourceBounds.bottom&&!sourcePoint;y+=8)for(let x=sourceBounds.left+3;x<sourceBounds.right;x+=8)if(document.elementFromPoint(x,y)?.closest('[data-free-page-frame-canvas]')===freeLandingCanvas){sourcePoint={x,y};break;}if(!sourcePoint)throw new Error('No exposed pointer surface on free Page frame');const sourceX=sourcePoint.x,sourceY=sourcePoint.y,targetX=targetBounds.left+targetBounds.width/2,targetY=targetBounds.top+targetBounds.height/2,sourceHitsFrame=true;let framePointerDown=false;freeLandingCanvas.addEventListener('pointerdown',()=>{framePointerDown=true;},{once:true});flowNativePointer(JSON.stringify({type:'mousePressed',x:sourceX,y:sourceY}));await nativeDone();for(let step=1;step<=12;step+=1){flowNativePointer(JSON.stringify({type:'mouseMoved',x:sourceX+(targetX-sourceX)*step/12,y:sourceY+(targetY-sourceY)*step/12}));await nativeDone();}flowNativePointer(JSON.stringify({type:'mouseReleased',x:targetX,y:targetY}));await nativeDone();
    ({graph}=graphFor());const landingAfterPointer=graph.pageFrames.find(({id})=>id===freeLanding.id),pointerRegionAfter=landingAfterPointer.freePageRegion==='after-lanes',pointerCoordinatesChanged=JSON.stringify(landingAfterPointer.position)!==JSON.stringify(landingBeforeMove.position),pointerIdentityStable=JSON.stringify(stripFreePresentation(landingAfterPointer))===landingIdentityBefore,pointerReferencesStable=JSON.stringify({page:envelope().project.collections.pages.find(({id})=>id===landingAfterPointer.pageId),children:graph.occurrences.filter(({pageFrameId})=>pageFrameId===freeLanding.id),relationships:graph.relationships.filter(({sourceNodeId,targetNodeId})=>graph.occurrences.some(({id,pageFrameId})=>[sourceNodeId,targetNodeId].includes(id)&&pageFrameId===freeLanding.id))})===landingReferencesBefore;
    q('[data-free-page-frame-canvas="'+freeLanding.id+'"]',canvas()).focus();await nativeKey('ArrowLeft');({graph}=graphFor());const landingAfterKeyboard=graph.pageFrames.find(({id})=>id===freeLanding.id),landingCanvas=q('[data-free-page-frame-canvas="'+freeLanding.id+'"]',canvas()),landingTransform=landingCanvas.getAttribute('transform'),keyboardReturnedLeftInitial=landingAfterKeyboard.freePageRegion==='before-lanes'&&document.activeElement?.dataset.freePageFrameCanvas===freeLanding.id&&landingTransform.startsWith('translate('+(landingAfterKeyboard.position.x-10)+' ');
    const pointerOwnerBytes=bytes(),pointerOwnerRevision=envelope().revision,pointerOwnerNode=nodeId(freeInteraction.id),pointerOwnerTransform=pointerOwnerNode.getAttribute('transform'),pointerOwnerBounds=q('rect',pointerOwnerNode).getBoundingClientRect(),pointerOwnerOccurrence=graph.occurrences.find(({id})=>id===freeInteraction.id),pointerA=41,pointerB=42,pointerEvent=(type,pointerId,clientX,clientY)=>new PointerEvent(type,{bubbles:true,pointerId,pointerType:'touch',isPrimary:pointerId===pointerA,buttons:type==='pointerup'||type==='pointercancel'?0:1,clientX,clientY});pointerOwnerNode.dispatchEvent(pointerEvent('pointerdown',pointerA,pointerOwnerBounds.left+30,pointerOwnerBounds.top+20));const ownerX=pointerOwnerBounds.left+30,ownerY=pointerOwnerBounds.top+52;window.dispatchEvent(pointerEvent('pointermove',pointerB,ownerX,ownerY));window.dispatchEvent(pointerEvent('pointerup',pointerB,ownerX,ownerY));window.dispatchEvent(pointerEvent('pointercancel',pointerB,ownerX,ownerY));await pause();const foreignPointerIgnored=bytes()===pointerOwnerBytes&&envelope().revision===pointerOwnerRevision&&nodeId(freeInteraction.id).getAttribute('transform')===pointerOwnerTransform;window.dispatchEvent(pointerEvent('pointermove',pointerA,ownerX,ownerY));window.dispatchEvent(pointerEvent('pointerup',pointerA,ownerX,ownerY));await pause();({graph}=graphFor());const ownerMoved=graph.occurrences.find(({id})=>id===freeInteraction.id),pointerOwnerCommitted=ownerMoved.position.y===pointerOwnerOccurrence.position.y+32&&envelope().revision===pointerOwnerRevision+1&&bytes()!==pointerOwnerBytes,keyboardReturnedLeft=keyboardReturnedLeftInitial;
    const groupedFrameCanvas=q('[data-page-frame-id="'+cartFrame.id+'"]',canvas()),groupedBytes=bytes(),groupedRevision=envelope().revision,groupedTransform=groupedFrameCanvas.getAttribute('transform');await nativeDrag(q('rect',groupedFrameCanvas),100,0);const groupedPointerRejected=bytes()===groupedBytes&&envelope().revision===groupedRevision&&q('[data-page-frame-id="'+cartFrame.id+'"]',canvas()).getAttribute('transform')===groupedTransform;q('[data-page-frame-id="'+cartFrame.id+'"]',canvas()).focus();await nativeKey('ArrowLeft');const membershipRepair=q('[role="status"] a',q('.documentary-flow')),groupedKeyboardRejected=bytes()===groupedBytes&&envelope().revision===groupedRevision&&q('[data-page-frame-id="'+cartFrame.id+'"]',canvas()).getAttribute('transform')===groupedTransform,membershipGuidance=q('[role="status"]',q('.documentary-flow')).textContent.includes('Cart')&&membershipRepair.getAttribute('href')==='?kind=pages&entity='+encodeURIComponent(cart.id)+'&field=pageGroupIds';
    evidence.runtime016={pointerTargetVisible,sourceHitsFrame,framePointerDown,pointerRegionAfter,pointerCoordinatesChanged,pointerIdentityStable,pointerReferencesStable,keyboardReturnedLeft,foreignPointerIgnored,pointerOwnerCommitted,groupedPointerRejected,groupedKeyboardRejected,membershipGuidance,reloadRegions:false};

    const beforeRename=stableGraphCapture('Checkout journey'),stableSemanticBytes=JSON.stringify({frames:beforeRename.frames,occurrences:beforeRename.occurrences,relationships:beforeRename.relationships});
    await saveEntity('pageGroups','Checkout',async(form)=>set(q('input[name="name"]',form),'Basket'));
    await saveEntity('pages','Cart',async(form)=>set(q('input[name="name"]',form),'Basket page'));
    await saveEntity('events','add_payment_info',async(form)=>set(q('input[name="name"]',form),'payment_details_added'));
    await openFlow('Checkout journey');
    const renamedCanvas=canvas().textContent.includes('Basket')&&canvas().textContent.includes('Basket page')&&canvas().textContent.includes('payment_details_added');
    const renamedCatalogs=catalog('Page Groups').textContent.includes('Basket')&&catalog('Pages').textContent.includes('Basket page · Basket')&&catalog('Events').textContent.includes('payment_details_added');
    const renamedOutline=outline().textContent.includes('payment_details_added')&&outline().textContent.includes('Initial load');
    q('[data-relationship-id="'+expectedRelationship.id+'"]',canvas()).dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();
    const renamedPopover=relationshipForm().textContent.includes('page_view → payment_details_added');
    const afterRename=stableGraphCapture('Checkout journey'),renameIdsStable=stableSemanticBytes===JSON.stringify({frames:afterRename.frames,occurrences:afterRename.occurrences,relationships:afterRename.relationships});
    evidence.runtime014={renamedCanvas,renamedCatalogs,renamedOutline,renamedPopover,renameIdsStable,reloadStable:false};

    await add('flows','Minimal journey');await openFlow('Minimal journey');
    const closeInspector=all('button',q('[aria-label="Flow component catalogs"]')).find(({textContent})=>textContent==='Close Inspector');closeInspector?.click();
    await clickCatalog('Page Groups','Basket');await clickCatalog('Page Groups','Confirmation');
    await clickCatalog('Pages','Basket page');await clickCatalog('Pages','Thank you');
    await selectFrame('Basket page');await nativeClick(catalogButton('Events','page_view'));
    await selectFrame('Basket page');await clickCatalog('Events','payment_details_added');
    await selectFrame('Thank you');await clickCatalog('Events','purchase');
    let minimal=graphFor('Minimal journey'),minimalInitial=minimal.graph.occurrences.find(({eventId,role})=>eventId===events.page_view.id&&role==='context-setting'),minimalPayment=minimal.graph.occurrences.find(({eventId})=>eventId===events.add_payment_info.id),minimalPurchase=minimal.graph.occurrences.find(({eventId})=>eventId===events.purchase.id);
    const connectMinimal=async(sourceId,targetId,label)=>{const source=nodeId(sourceId),target=nodeId(targetId),before=new Set(graphFor('Minimal journey').graph.relationships.map(({id})=>id)),output=q('[data-output-port-for="'+source.dataset.occurrenceId+'"]'),input=q('[data-input-port-for="'+target.dataset.occurrenceId+'"]');await nativePoint(output,'mousePressed');await nativePoint(input,'mouseMoved');await nativePoint(input,'mouseReleased');const created=graphFor('Minimal journey').graph.relationships.find(({id})=>!before.has(id)),form=relationshipForm();choose(q('[aria-label="Relationship kind"]',form),'expected-next');set(q('[aria-label="Relationship group"]',form),'Minimal route');set(q('[aria-label="Relationship label"]',form),label);set(q('[aria-label="Documentation condition"]',form),'documented only');set(q('[aria-label="Relationship expectation"]',form),'review manually');await submit(form,[q('[aria-label="Relationship kind"]',form)]);return created.id;};
    const minimalFirst=await connectMinimal(minimalInitial.id,minimalPayment.id,'continue'),minimalSecond=await connectMinimal(minimalPayment.id,minimalPurchase.id,'finish');
    nodeId(minimalPayment.id).dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();
    minimal=graphFor('Minimal journey');
    const exactMinimalStorage=minimal.graph.pageGroupIds.join('|')===[groups.Checkout.id,groups.Confirmation.id].join('|')&&minimal.graph.pageFrames.length===2&&minimal.graph.occurrences.length===3&&minimal.graph.relationships.length===2&&minimal.graph.relationships.map(({id})=>id).join('|')===[minimalFirst,minimalSecond].join('|')&&minimal.graph.relationships[0].sourceNodeId===minimalInitial.id&&minimal.graph.relationships[0].targetNodeId===minimalPayment.id&&minimal.graph.relationships[1].sourceNodeId===minimalPayment.id&&minimal.graph.relationships[1].targetNodeId===minimalPurchase.id;
    const exactMinimalProjection=all('.flow-lane-label',canvas()).map(({textContent})=>textContent).join('|')==='Basket|Confirmation'&&all('[data-page-frame-id]',canvas()).length===2&&nodes().length===3&&all('[data-relationship-id]',canvas()).length===2&&all('[data-relationship-id]',outline()).length===2;
    const forbiddenKeys=['lane','laneName','selectorId','schema','transition','executed','contextBindingId','contextEventBindings'];
    const noForbiddenCanonical=forbiddenKeys.every((key)=>!minimal.graph.pageFrames.some((item)=>key in item)&&!minimal.graph.occurrences.some((item)=>key in item)&&!minimal.graph.relationships.some((item)=>key in item));
    const documentaryBoundary=q('.documentary-flow .status-text').textContent.includes('Each Event payload schema validates independently')&&q('.documentary-flow .status-text').textContent.includes('expectations are checked manually')&&q('#project-inspector').hidden;
    evidence.runtime015={exactMinimalStorage,exactMinimalProjection,noForbiddenCanonical,documentaryBoundary,reloadExact:false};

    return{evidence,captures:{checkout:stableGraphCapture('Checkout journey'),minimal:stableGraphCapture('Minimal journey'),paymentOccurrenceId:paymentOccurrence.id,minimalSelectedId:minimalPayment.id,freeLandingId:freeLanding.id,freeCampaignId:freeCampaign.id},installedBoundary:location.protocol==='chrome-extension:'&&chrome.runtime.id===location.hostname};
  })()`);

  await reload(socket);
  const reloadEvidence=await evaluate(socket,`(async()=>{${helpers}
    const expected=${JSON.stringify(session.captures)};
    await openFlow('Checkout journey');
    const checkout=stableGraphCapture('Checkout journey');
    const checkoutStable=JSON.stringify(checkout)===JSON.stringify(expected.checkout)&&canvas().querySelector('[data-occurrence-id="'+expected.paymentOccurrenceId+'"]')?.getAttribute('transform').endsWith(' '+checkout.occurrences.find(({id})=>id===expected.paymentOccurrenceId).position.y+')');
    const reloadedFree=checkout.frames.filter(({id})=>[expected.freeLandingId,expected.freeCampaignId].includes(id)),reloadRegions=reloadedFree.length===2&&reloadedFree.find(({id})=>id===expected.freeLandingId)?.freePageRegion==='before-lanes'&&reloadedFree.find(({id})=>id===expected.freeCampaignId)?.freePageRegion==='after-lanes'&&reloadedFree.every(({id,freePageRegion,position})=>canvas().querySelector('[data-free-page-frame-canvas="'+id+'"][data-free-page-region="'+freePageRegion+'"]')&&Number.isFinite(position.x)&&Number.isFinite(position.y)&&!checkout.laneOrder.includes(id))&&!all('.flow-lane-label',canvas()).some(({textContent})=>/Landing|Campaign/.test(textContent));
    await openFlow('Minimal journey');
    const minimal=stableGraphCapture('Minimal journey');
    const minimalStable=JSON.stringify(minimal)===JSON.stringify(expected.minimal)&&all('.flow-lane-label',canvas()).map(({textContent})=>textContent).join('|')==='Basket|Confirmation'&&all('[data-page-frame-id]',canvas()).length===2&&nodes().length===3&&all('[data-relationship-id]',canvas()).length===2&&all('[data-relationship-id]',outline()).length===2&&Boolean(canvas().querySelector('[data-occurrence-id="'+expected.minimalSelectedId+'"].is-selected'));
    return{checkoutStable,minimalStable,reloadRegions};
  })()`);
  session.evidence.runtime008.reloadCoordinates=reloadEvidence.checkoutStable;
  session.evidence.runtime014.reloadStable=reloadEvidence.checkoutStable;
  session.evidence.runtime015.reloadExact=reloadEvidence.minimalStable;
  session.evidence.runtime016.reloadRegions=reloadEvidence.reloadRegions;
  const legacyFixture=await evaluate(socket,`(()=>{${helpers}
    const stored=envelope(),flow=stored.project.collections.flows.find(({name})=>name==='Checkout journey'),graph=stored.project.documentationFlowGraphs[flow.id],otherFlow=stored.project.collections.flows.find(({name})=>name==='Minimal journey'),otherGraph=stored.project.documentationFlowGraphs[otherFlow.id],pageView=stored.project.collections.events.find(({name})=>name==='page_view'),routeView=stored.project.collections.events.find(({name})=>name==='route_view'),pageViewOccurrence=graph.occurrences.find(({eventId,role})=>eventId===pageView.id&&role==='context-setting'),routeViewOccurrence=graph.occurrences.find(({eventId,role,pageFrameId})=>eventId===routeView.id&&role==='context-setting'&&pageFrameId===pageViewOccurrence.pageFrameId),cart=stored.project.collections.pages.find(({id})=>id===pageViewOccurrence.pageId),otherFrame=otherGraph.pageFrames.find(({pageId})=>pageId!==cart.id),otherPage=stored.project.collections.pages.find(({id})=>id===otherFrame.pageId),pageBindingId='binding:legacy-page-view',routeBindingId='binding:legacy-route-view',otherBindingId='binding:legacy-other-page-view',otherOccurrence={id:'occurrence:legacy-other-page-view',name:'Payment initial context',pageFrameId:otherFrame.id,pageId:otherFrame.pageId,pageGroupId:otherFrame.pageGroupId,contextBindingId:otherBindingId,position:{y:165},obligation:'Required',minimum:1,maximum:1,optional:false};
    cart.name='Cart';
    cart.contextEventBindings=[{id:pageBindingId,name:'Initial load',eventId:pageView.id,trigger:'Initial load'},{id:routeBindingId,name:'SPA route change',eventId:routeView.id,trigger:'SPA route change'}];
    otherPage.contextEventBindings=[{id:otherBindingId,name:'Initial load',eventId:pageView.id,trigger:'Initial load'}];
    graph.occurrences=graph.occurrences.map((occurrence)=>{const bindingId=occurrence.id===pageViewOccurrence.id?pageBindingId:occurrence.id===routeViewOccurrence.id?routeBindingId:undefined;if(!bindingId)return occurrence;const{eventId,role,trigger,...legacy}=occurrence;return{...legacy,contextBindingId:bindingId};});
    otherGraph.occurrences.push(otherOccurrence);
    const topology=(candidate)=>JSON.stringify({frames:candidate.pageFrames,occurrences:candidate.occurrences.map(({id,pageFrameId,pageId,pageGroupId,position,obligation,minimum,maximum,optional})=>({id,pageFrameId,pageId,pageGroupId,position,obligation,minimum,maximum,optional})),relationships:candidate.relationships}),preProject=structuredClone(stored.project),validEnvelope=structuredClone(stored);sessionStorage.setItem('flow-valid-migration',JSON.stringify(validEnvelope));
    otherOccurrence.contextBindingId='binding:missing';
    localStorage.setItem('my-chrome-utilities.specification-project.v1',JSON.stringify(stored));
    return{preProject,topologies:{checkout:topology(validEnvelope.project.documentationFlowGraphs[flow.id]),other:topology(validEnvelope.project.documentationFlowGraphs[otherFlow.id])},flowIds:[flow.id,otherFlow.id],pageIds:[cart.id,otherPage.id],pageViewId:pageView.id,routeViewId:routeView.id,occurrenceIds:[pageViewOccurrence.id,routeViewOccurrence.id,otherOccurrence.id],occurrenceNames:[pageViewOccurrence.name,routeViewOccurrence.name,otherOccurrence.name],bindingIds:[pageBindingId,routeBindingId,otherBindingId,'binding:missing'],otherPageName:otherPage.name};
  })()`);
  await reload(socket);
  const blockedMigrationEvidence=await evaluate(socket,`(async()=>{${helpers}
    const fixture=${JSON.stringify(legacyFixture)};await openFlow('Checkout journey');const review=q('[aria-label="Flow Page-context migration review"]'),text=review.textContent,confirm=all('button',review).find(({textContent})=>textContent==='Confirm Page-context migration'),before=bytes(),humanBlocker=text.includes('Payment initial context in Minimal journey has a missing Page binding on '+fixture.otherPageName+'.'),noRawIds=[...fixture.flowIds,...fixture.pageIds,...fixture.occurrenceIds,...fixture.bindingIds,fixture.pageViewId,fixture.routeViewId].every((id)=>!text.includes(id));confirm.click();await pause();const disabled=confirm.disabled,blockedNoWrite=bytes()===before;localStorage.setItem('my-chrome-utilities.specification-project.v1',sessionStorage.getItem('flow-valid-migration'));return{humanBlocker,noRawIds,disabled,blockedNoWrite};
  })()`);
  await reload(socket);
  session.evidence.runtime017=await evaluate(socket,`(async()=>{${helpers}
    const fixture=${JSON.stringify(legacyFixture)},blocked=${JSON.stringify(blockedMigrationEvidence)};
    await openFlow('Checkout journey');
    const review=q('[aria-label="Flow Page-context migration review"]'),reviewText=review.textContent,rows=all('li',review).map(({textContent})=>textContent),humanReview=rows.length===3&&rows.some((text)=>text.includes('Checkout journey / Cart / page_view')&&text.includes('Initial load')&&text.includes('occurrence '+fixture.occurrenceNames[0]))&&rows.some((text)=>text.includes('Checkout journey / Cart / route_view')&&text.includes('SPA route change')&&text.includes('occurrence '+fixture.occurrenceNames[1]))&&rows.some((text)=>text.includes('Minimal journey / '+fixture.otherPageName+' / page_view')&&text.includes('Initial load')&&text.includes('occurrence Payment initial context'))&&!reviewText.includes('affected occurrence'),noRawIds=[...fixture.flowIds,...fixture.pageIds,...fixture.occurrenceIds,...fixture.bindingIds,fixture.pageViewId,fixture.routeViewId].every((id)=>!reviewText.includes(id));
    const topology=(graph)=>JSON.stringify({frames:graph.pageFrames,occurrences:graph.occurrences.map(({id,pageFrameId,pageId,pageGroupId,position,obligation,minimum,maximum,optional})=>({id,pageFrameId,pageId,pageGroupId,position,obligation,minimum,maximum,optional})),relationships:graph.relationships});
    await nativeClick(all('button',review).find(({textContent})=>textContent==='Confirm Page-context migration'));
    const migrated=graphFor('Checkout journey'),otherMigrated=graphFor('Minimal journey'),affected=[...migrated.graph.occurrences,...otherMigrated.graph.occurrences].filter(({id})=>fixture.occurrenceIds.includes(id)),topologyPreserved=topology(migrated.graph)===fixture.topologies.checkout&&topology(otherMigrated.graph)===fixture.topologies.other,directOccurrences=affected.length===3&&affected.filter(({eventId,role,trigger})=>eventId===fixture.pageViewId&&role==='context-setting'&&trigger==='Initial load').length===2&&affected.some(({eventId,role,trigger})=>eventId===fixture.routeViewId&&role==='context-setting'&&trigger==='SPA route change'),canonicalBindingFree=!JSON.stringify(migrated.stored.project).includes('contextEventBindings')&&!JSON.stringify(migrated.stored.project).includes('contextBindingId')&&!document.querySelector('[aria-label="Flow Page-context migration review"]');
    q('#undo-project').click();await pause();
    const canonical=(value)=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map((key)=>[key,canonical(value[key])])):value,undoRestored=JSON.stringify(canonical(envelope().project))===JSON.stringify(canonical(fixture.preProject));
    return{...blocked,humanReview,noRawIds,topologyPreserved,directOccurrences,canonicalBindingFree,undoRestored};
  })()`);
  session.evidence.installedBoundary=session.installedBoundary;
  for(let runtime=1;runtime<=17;runtime+=1){const key=`runtime${String(runtime).padStart(3,"0")}`;assert.equal(Object.values(session.evidence[key]).every(Boolean),true,`${key}: ${JSON.stringify(session.evidence[key])}`);}
  assert.equal(session.evidence.installedBoundary,true);
  console.log(JSON.stringify({flowGraph:session.evidence}));
}finally{
  socket?.close();
  await stopHeadlessChrome(chrome);
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
