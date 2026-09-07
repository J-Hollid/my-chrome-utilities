import assert from "node:assert/strict";
import {ContextExportSession} from "../dist/schema-context-export/session.js";
import {completeContextDownload} from "../dist/schema-context-export/browser-ports.js";
const source={key:"draft",name:"Draft",role:"Saved Schema",context:"",version:"Draft",schema:{id:"s",name:"Draft",version:1,assignments:[],document:{type:"object",properties:{amount:{type:"number"}}}}};
let writes=0,downloads=0,failCopy=true,failDownload=true;
const session=new ContextExportSession(()=>source,{
  copy:async text=>{if(failCopy)throw new Error("Clipboard denied");writes++;assert.equal(text,session.snapshot.text);},
  download:async snapshot=>{if(failDownload)throw new Error("Download denied");downloads++;assert.equal(snapshot.text,session.snapshot.text);},
});
session.refresh();
await assert.rejects(session.copy(),/Clipboard denied/);assert.equal(writes,0);
failCopy=false;await session.copy();assert.equal(writes,1);
await assert.rejects(session.download(),/Download denied/);assert.equal(downloads,0);
failDownload=false;await session.download();assert.equal(downloads,1);
source.schema.document.properties.amount.minimum=10;
assert.equal(session.stale,true);await assert.rejects(session.copy(),/Refresh export/);
assert.equal(writes,1);session.refresh();assert.equal(session.stale,false);
source.schema.attachedRules=[{id:"unsupported",name:"Private check",version:1,operator:"custom",propertyPath:"/amount"}];
session.refresh();assert.equal(session.needsConfirmation,true);
await assert.rejects(session.download(),/Confirm/);session.confirm();await session.download();
source.schema.document.properties.amount.minimum=20;session.refresh();assert.equal(session.needsConfirmation,true);
session.close();await assert.rejects(session.copy(),/closed/i);
assert.equal(writes,1);assert.equal(downloads,2);
console.log("Schema context session: stale snapshots, confirmation, failure, retry, and cancellation passed.");

function downloadApi(state="in_progress"){
  const listeners=new Set();
  return {listeners,download:async options=>{assert.equal(options.filename,"draft.schema.json");return 7;},
    search:async()=>[{id:7,state,error:"FILE_ACCESS_DENIED"}],
    onChanged:{addListener:fn=>listeners.add(fn),removeListener:fn=>listeners.delete(fn)},
    emit:delta=>{for(const fn of listeners)fn(delta);}};
}
const options={url:"blob:test",filename:"draft.schema.json",saveAs:false};
const api=downloadApi();let completed=false;
const pending=completeContextDownload(api,options).then(()=>{completed=true;});
await new Promise(resolve=>setImmediate(resolve));
assert.equal(completed,false,"Starting a download does not establish completion");
api.emit({id:8,state:{current:"complete"}});assert.equal(completed,false);
api.emit({id:7,state:{current:"complete"}});await pending;assert.equal(api.listeners.size,0);
const interrupted=downloadApi();const rejected=assert.rejects(completeContextDownload(interrupted,options),/FILE_ACCESS_DENIED/);
await new Promise(resolve=>setImmediate(resolve));
interrupted.emit({id:7,state:{current:"interrupted"},error:{current:"FILE_ACCESS_DENIED"}});
await rejected;assert.equal(interrupted.listeners.size,0);
for(const state of ["complete","interrupted"]){
  const early=downloadApi(state),result=completeContextDownload(early,options);
  if(state==="complete")await result;else await assert.rejects(result,/FILE_ACCESS_DENIED/);
  assert.equal(early.listeners.size,0,"Early terminal state removes the listener");
}
await assert.rejects(completeContextDownload({...downloadApi(),download:async()=>{throw new Error("Download denied");}},options),/Download denied/);
const searchFailure=downloadApi();searchFailure.search=async()=>{throw new Error("Status unavailable");};
await assert.rejects(completeContextDownload(searchFailure,options),/Status unavailable/);assert.equal(searchFailure.listeners.size,0);
console.log("Download completion, interruption, early events, and listener cleanup passed.");
