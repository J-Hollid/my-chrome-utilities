import assert from "node:assert/strict";
import {ContextExportSession} from "../dist/schema-context-export/session.js";
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
