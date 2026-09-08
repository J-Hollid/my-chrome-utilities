import { connectUtilityPage } from './utility-host/page-client.js';
if(localStorage.getItem('probe.crash')==='true')throw new Error('Controlled Probe startup exception');
const draft=document.querySelector('#draft'), output=document.querySelector('#state');
let state={draft:localStorage.getItem('utility.probe.draft')??'',running:false,events:0,stops:0,owner:crypto.randomUUID(),unavailable:false};
draft.value=state.draft;
const client=connectUtilityPage(window,message=>{
  if(message.kind==='state'&&!client.ownsWork&&message.payload){state=message.payload;draft.value=state.draft;render();}
  if(client.ownsWork){
    if(message.kind==='action')action(message.payload);
    if(message.kind==='stop')action('stop');
    if(message.kind==='reset'){action('stop');state.draft='';draft.value='';client.send('dirty',false);publish();}
    if(message.kind==='close'||message.kind==='target-closed'){action('stop');state.unavailable=true;publish();}
  }
});
function render(){output.textContent=JSON.stringify({...state,session:client.identity.sessionId,target:client.identity.targetId,ownsWork:client.ownsWork});document.documentElement.dataset.ready='true';}
function publish(){render();if(client.ownsWork)client.send('state',state);}
function action(name){
  if(name&&typeof name==='object'&&typeof name.draft==='string'){state.draft=name.draft;draft.value=state.draft;client.send('dirty',true);}
  if(name==='save'){localStorage.setItem('utility.probe.draft',state.draft);client.send('dirty',false);}
  if(name==='start'&&!state.unavailable)state.running=true;
  if(name==='event'&&state.running)state.events++;
  if(name==='stop'&&state.running){state.running=false;state.stops++;}
  publish();
}
for(const id of ['start','event','stop'])document.querySelector('#'+id).onclick=()=>client.ownsWork?action(id):client.send('action',id);
draft.oninput=()=>client.ownsWork?action({draft:draft.value}):client.send('action',{draft:draft.value});
document.querySelector('#save').onclick=()=>client.ownsWork?action('save'):client.send('action','save');
window.addEventListener('pagehide',()=>{if(client.ownsWork)action('stop');});
publish();
