import assert from 'node:assert/strict';
import {createInstalledObservationBinding} from '../../dist/data-layer-installed/capture/observation-sources/binding.js';
let configuration={projectId:'retail',sources:[]},session={session:{id:'s',status:'active',tabId:7,historyPath:'dataLayer',currentUrl:'https://retail.test',timeline:[]}};
let observer={sessionState:session},live={sources:[],events:[]};
const binding=createInstalledObservationBinding({sourceConfiguration:()=>configuration,observerRuntime:{}},{
  active:()=>true,session:()=>session,observer:()=>observer,live:()=>live,
  setSession:value=>session=value,setObserver:value=>observer=value,setLive:value=>live=value,
  changed:()=>{session=observer.sessionState;},render:()=>{},
});
binding.beginProject();configuration={projectId:'partner',sources:[]};binding.configurationChanged();
assert.equal(session.session.status,'ended','observer synchronization cannot restore the previous active project session');
assert.equal(observer.sessionState.session.status,'ended');
console.log('Project switch observation disposal tests passed');
