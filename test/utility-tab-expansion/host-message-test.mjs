import './host-contract.mjs';
import assert from 'node:assert/strict';
import {createRetainedUtilityPage} from '../../dist/utility-host/retained-page.js';
import {utilityMessage} from '../../dist/utility-host/protocol.js';
import {utilityBrowserPorts} from '../../dist/utility-host/installed-entry.js';
import {execFileSync} from 'node:child_process';
import {verificationDigest} from '../../scripts/verification-evidence.mjs';

for(const api of [undefined,{}, {tabs:{}}]) {
  const ports=utilityBrowserPorts(api);
  assert.equal(await ports.selectTarget(),null);
  assert.doesNotThrow(()=>ports.subscribeTargetClosed(()=>{})());
}
const listeners=new Set();
const ports=utilityBrowserPorts({tabs:{query:async()=>[{id:1,url:'chrome://settings'},{id:42,url:'https://shop.example'}],
  onRemoved:{addListener:listener=>listeners.add(listener),removeListener:listener=>listeners.delete(listener)}}});
assert.equal(await ports.selectTarget(),42);
const removedTab=()=>{};const unsubscribe=ports.subscribeTargetClosed(removedTab);
assert.equal(listeners.has(removedTab),true);unsubscribe();assert.equal(listeners.size,0);

const repairContext=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
if(repairContext?.causalCategory==='other:utility host missing tabs API') {
  const source=execFileSync('git',['show','05c50244:src/utility-host/installed-entry.ts'],{encoding:'utf8'});
  const body=source.match(/selectTarget: async \(\) => \{[\s\S]*?return \(\) => chrome.tabs.onRemoved.removeListener\(listener\);\n    \}/)?.[0];
  assert.ok(body,'The fixture must reproduce the exact previous host callbacks');
  const previous=new Function('chrome',`return ({${body}})`)({});
  assert.throws(()=>previous.subscribeTargetClosed(()=>{}),TypeError);
  const current=utilityBrowserPorts({});
  assert.doesNotThrow(()=>current.subscribeTargetClosed(()=>{})());
  assert.equal(await current.selectTarget(),null);
  const pre={missingTabsBlocksShell:true},post={missingTabsBlocksShell:false,target:null};
  const fixture={id:'utility-host-missing-tabs-api-v1',causalCategory:repairContext.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(repairContext.diagnosedBoundary),
    input:{preRepairCommit:'05c50244',chromeApi:{}},expectedPreRepairFailure:pre,expectedRepairResult:post};
  const fixtureDigest=verificationDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:repairContext.incidentId,failureDigest:repairContext.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:pre},
    repairResult:{status:'passed',fixtureDigest,observed:post}}}));
}

class Events {
  listeners=new Map();
  addEventListener(kind,listener){this.listeners.set(kind,listener);}
  removeEventListener(kind,listener){if(this.listeners.get(kind)===listener)this.listeners.delete(kind);}
  emit(kind,event){this.listeners.get(kind)?.(event);}
}
const ownerMessages=[],workbenchMessages=[];
const owner={postMessage:message=>ownerMessages.push(message)};
const workbench={postMessage:message=>workbenchMessages.push(message),closed:false,close(){this.closed=true;},focus(){}};
class Element extends Events {
  style={};children=[];attributes=new Map();disabled=false;removed=false;
  constructor(tag,doc){super();this.tag=tag;this.ownerDocument=doc;if(tag==='iframe')this.contentWindow=owner;}
  setAttribute(key,value){this.attributes.set(key,value);}
  append(...children){this.children.push(...children);}
  remove(){this.removed=true;}
}
const doc={createElement:tag=>new Element(tag,doc)};
const panel=new Element('section',doc),page=new Events();
Object.assign(page,{location:new URL('https://extension.test/side-panel.html'),confirm:()=>false,open:()=>workbench});
let targetListener,removed=false;
const contribution={id:'probe',label:'Probe',page:'probe.html',storage:{namespace:'utility.probe.state',version:1}};
const host=createRetainedUtilityPage({contribution,panel,page,selectTarget:async()=>771,
  subscribeTargetClosed:listener=>{targetListener=listener;return()=>{removed=true;};}});
assert.equal(panel.children.some(({tag})=>tag==='iframe'),false);
await host.load();await host.load();
const frame=panel.children.find(({tag})=>tag==='iframe'),url=new URL(frame.src);
assert.equal(panel.children.filter(({tag})=>tag==='iframe').length,1);
const identity={utilityId:'probe',sessionId:url.searchParams.get('session'),targetId:771};
const send=(source,message)=>page.emit('message',{source,origin:page.location.origin,data:message});
const [launch,reset]=panel.children;
for(const change of [{sessionId:'old'},{targetId:772}])send(owner,utilityMessage({...identity,...change},'ready'));
send({},utilityMessage(identity,'ready'));assert.equal(launch.disabled,true);
send(owner,utilityMessage(identity,'ready'));assert.equal(launch.disabled,false);
launch.emit('click');
const baseline=ownerMessages.length;
for(const source of [workbench,{}])for(const change of [{sessionId:'old'},{targetId:772}])send(source,utilityMessage({...identity,...change},'action','event'));
send({},utilityMessage(identity,'action','event'));
assert.equal(ownerMessages.length,baseline,'Wrong sender, old session, and different target cannot act');
send(workbench,utilityMessage(identity,'action','event'));
assert.equal(ownerMessages.length,baseline+1);assert.equal(ownerMessages.at(-1).payload,'event');
send(owner,utilityMessage(identity,'dirty',true));reset.emit('click');
assert.equal(ownerMessages.length,baseline+1,'Cancel does not stop work');
page.confirm=()=>true;reset.emit('click');assert.equal(ownerMessages.at(-1).kind,'reset');
targetListener(772);assert.equal(launch.disabled,false);
targetListener(771);assert.equal(launch.disabled,true);assert.equal(ownerMessages.at(-1).kind,'target-closed');
const unavailable=ownerMessages.length;
send(workbench,utilityMessage(identity,'action','start'));
assert.equal(ownerMessages.length,unavailable,'A closed target cannot accept new work');
host.dispose();host.dispose();assert.equal(removed,true);assert.equal(page.listeners.size,0);assert.equal(frame.removed,true);
for (const closedId of [771,772]) {
  const racePanel=new Element('section',doc),racePage=new Events();
  Object.assign(racePage,{location:page.location,confirm:()=>true,open:()=>workbench});
  let select,closed;
  const raceHost=createRetainedUtilityPage({contribution,panel:racePanel,page:racePage,
    selectTarget:()=>new Promise(resolve=>{select=resolve;}),
    subscribeTargetClosed:listener=>{closed=listener;return()=>{};}});
  const loading=raceHost.load();
  closed(closedId);
  select(771);
  await loading;
  const raceFrame=racePanel.children.find(({tag})=>tag==='iframe');
  const raceIdentity={utilityId:'probe',targetId:771,
    sessionId:new URL(raceFrame.src).searchParams.get('session')};
  const beforeReady=ownerMessages.length;
  racePage.emit('message',{source:owner,origin:racePage.location.origin,
    data:utilityMessage(raceIdentity,'ready')});
  assert.equal(racePanel.children[0].disabled,closedId===771,
    'Closure while target selection is pending must disable only the selected target');
  assert.equal(ownerMessages.slice(beforeReady).some(message=>message.kind==='target-closed'),closedId===771,
    'The ready owner must receive closure recorded before target selection completed');
  raceHost.dispose();
}
console.log('Host rejects mismatched senders, sessions, and targets; owned reset and cleanup passed');
