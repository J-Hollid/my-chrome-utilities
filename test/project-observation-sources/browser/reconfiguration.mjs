export async function observeInstalledSourceReconfiguration() {
  const q=selector=>{const node=document.querySelector(selector);if(!node)throw new Error("Missing "+selector);return node;};
  const until=async(predicate,label)=>{
    const deadline=performance.now()+10000;
    while(!predicate()){if(performance.now()>deadline)throw new Error("Timed out: "+label+" "+document.querySelector("#observation-source-error")?.textContent);
      await new Promise(resolve=>requestAnimationFrame(resolve));}
  };
  const row=id=>q(`.observation-source-row[data-source-id="${id}"]`);
  const clickText=(host,text)=>{const node=[...host.querySelectorAll("button")].find(button=>button.textContent===text);if(!node)throw new Error("Missing button "+text);node.click();};
  const input=(selector,value)=>{q(selector).value=value;q(selector).dispatchEvent(new Event("input",{bubbles:true}));};
  clickText(row("application"),"Edit");input("#observation-source-path","analyticsQueue");q("#save-observation-source").click();
  await until(()=>row("application").querySelector("code").textContent==="analyticsQueue"&&!document.querySelector("#observation-source-path"),"path edit");
  event.history.push({event:"oldPath"});analyticsQueue.push({event:"Q1"});
  await until(()=>q("#live-event-feed").textContent.includes("Q1"),"new path capture");
  const oldPathDetached=!q("#live-event-feed").textContent.includes("oldPath");
  const oldEvent=[...q("#live-event-feed").querySelectorAll("[data-event-id]")].find(node=>node.textContent.startsWith("A0 "));
  oldEvent.click();
  const oldPathRetained=q("[data-observation-source-details]").textContent.includes("event.history");
  q("#back-to-events").click();
  q("#add-observation-source").click();input("#observation-source-name","Marketing");input("#observation-source-path","dataLayer");q("#save-observation-source").click();
  await until(()=>document.querySelectorAll(".observation-source-row").length===2&&!document.querySelector("#observation-source-name"),"new identity");
  const added=[...document.querySelectorAll(".observation-source-row")].find(row=>row.querySelector("strong").textContent==="Marketing");
  const newIdentity=added.dataset.sourceId!=="marketing";
  q("#add-observation-source").click();input("#observation-source-name","Pending");input("#observation-source-path","deferred.queue");q("#save-observation-source").click();
  await until(()=>document.querySelectorAll(".observation-source-row").length===3&&!document.querySelector("#observation-source-name"),"waiting source save");
  const pendingId=[...document.querySelectorAll(".observation-source-row")].find(row=>row.querySelector("strong").textContent==="Pending").dataset.sourceId;
  await until(()=>row(pendingId).querySelector("output").textContent==="Waiting for path","waiting status");
  analyticsQueue.push({event:"Q2"});
  await until(()=>q("#live-event-feed").textContent.includes("Q2"),"ready source while waiting");
  globalThis.deferred={queue:[{event:"D1"}]};
  await until(()=>q("#live-event-feed").textContent.includes("D1")&&row(pendingId).querySelector("output").textContent==="Ready","waiting source joins");
  const joinedOnce=[...q("#live-event-feed").querySelectorAll("[data-event-id]")].filter(node=>node.textContent.startsWith("D1 ")).length===1;
  const oldArray=analyticsQueue;
  globalThis.analyticsQueue=[{event:"R0"}];
  await until(()=>q("#live-event-feed").textContent.includes("R0"),"replacement array");
  oldArray.push({event:"lateOldArray"});analyticsQueue.push({event:"R1"});
  await until(()=>q("#live-event-feed").textContent.includes("R1"),"replacement push");
  const replacedOnce=[...q("#live-event-feed").querySelectorAll("[data-event-id]")].filter(node=>node.textContent.startsWith("R0 ")).length===1;
  const oldArrayDetached=!q("#live-event-feed").textContent.includes("lateOldArray");
  const replacement=function(...items){return Array.prototype.push.apply(this,items);};
  analyticsQueue.push=replacement;
  q("#end-data-layer-testing").click();
  const cleanupPreserved=analyticsQueue.push===replacement;
  const before=q("#live-event-feed").textContent;
  dataLayer.push({event:"afterStop"});deferred.queue.push({event:"afterStop"});
  const stopped=q("#live-event-feed").textContent===before&&globalThis.__twaObservationArrays.channels.size===0;
  return {oldPathDetached,oldPathRetained,newIdentity,joinedOnce,replacedOnce,oldArrayDetached,cleanupPreserved,stopped,
    remainingIds:[...document.querySelectorAll(".observation-source-row")].map(row=>row.dataset.sourceId)};
}
