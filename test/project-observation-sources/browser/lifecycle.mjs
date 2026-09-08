export async function observeInstalledSourceLifecycle() {
  const q=selector=>{const node=document.querySelector(selector);if(!node)throw new Error("Missing "+selector);return node;};
  const until=async(predicate,label)=>{
    const deadline=performance.now()+10000;
    while(!predicate()){if(performance.now()>deadline)throw new Error("Timed out: "+label);
      await new Promise(resolve=>requestAnimationFrame(resolve));}
  };
  const row=id=>q(`.observation-source-row[data-source-id="${id}"]`);
  const clickText=(host,text)=>{const node=[...host.querySelectorAll("button")].find(button=>button.textContent===text);
    if(!node)throw new Error("Missing button "+text);node.click();};
  const enabled=()=>row("marketing").querySelector('input[type="checkbox"]');
  enabled().click();
  await until(()=>!enabled().checked&&row("marketing").querySelector("output").textContent==="Disabled","disable");
  dataLayer.push({event:"M2"});event.history.push({event:"A2"});
  await until(()=>q("#live-event-feed").textContent.includes("A2"),"unaffected Application");
  const whileDisabled=!q("#live-event-feed").textContent.includes("M2");
  enabled().click();
  await until(()=>q("#live-event-feed").textContent.includes("M2"),"re-enable catchup");
  const catchup=[...q("#live-event-feed").querySelectorAll("[data-event-id]")].filter(node=>node.textContent.startsWith("M2 ")).length===1;
  clickText(row("marketing"),"Edit");
  q("#observation-source-name").value="Analytics";q("#observation-source-name").dispatchEvent(new Event("input",{bubbles:true}));
  q("#save-observation-source").click();
  await until(()=>row("marketing").querySelector("strong").textContent==="Analytics"&&!document.querySelector("#observation-source-name"),"rename");
  dataLayer.push({event:"M3"});
  await until(()=>q("#live-event-feed").textContent.includes("M3"),"new label");
  const text=q("#live-event-feed").textContent;
  const oldLabel=[...q("#live-event-feed").querySelectorAll("[data-event-id]")].find(node=>node.textContent.startsWith("M0 ")).textContent.includes("Marketing");
  const newLabel=[...q("#live-event-feed").querySelectorAll("[data-event-id]")].find(node=>node.textContent.startsWith("M3 ")).textContent.includes("Analytics");
  q("#add-observation-source").click();
  q("#observation-source-name").value="Duplicate";q("#observation-source-name").dispatchEvent(new Event("input",{bubbles:true}));
  q("#observation-source-path").value="window.dataLayer";q("#observation-source-path").dispatchEvent(new Event("input",{bubbles:true}));
  q("#save-observation-source").click();
  await until(()=>q("#observation-source-error").textContent.includes("already added"),"duplicate validation");
  const duplicateRejected=q("#observation-source-path").getAttribute("aria-invalid")==="true";
  clickText(q('form[aria-label="Observation source"]'),"Cancel");
  clickText(row("marketing"),"Remove");
  const confirmationRequired=document.querySelectorAll(".observation-source-row").length===2;
  clickText(q('[aria-label="Remove observation source"]'),"Confirm removal");
  await until(()=>document.querySelectorAll(".observation-source-row").length===1,"confirmed remove");
  dataLayer.push({event:"removed"});event.history.push({event:"A3"});
  await until(()=>q("#live-event-feed").textContent.includes("A3"),"remaining source");
  const removedDetached=!q("#live-event-feed").textContent.includes("removed");
  const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js");
  const repository=await openIndexedDbProjectRepository();
  const stored=await repository.loadProject(await repository.activeProjectId());
  return {whileDisabled,catchup,oldLabel,newLabel,duplicateRejected,confirmationRequired,removedDetached,
    storedSources:stored.state.project.eventTransport.observationSources,
    pushDefault:stored.state.project.eventTransport.defaultPushPath,
    subscriptions:globalThis.__twaObservationArrays.channels.size,overflow:document.documentElement.scrollWidth>innerWidth,text};
}
