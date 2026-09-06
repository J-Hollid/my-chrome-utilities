import assert from "node:assert/strict";

export async function verifyCoordinatorDialogActions(side, evaluate) {
  const result = await evaluate(side, `(${coordinatorActions.toString()})()`);
  assert.deepEqual(result, {creation:true,switching:true,metadata:true,undo:true,importing:true,cancellation:true,subscription:true});
  return result;
}

async function coordinatorActions() {
  const {mountProjectLibraryUi} = await import("./data-layer-project-library-ui.js");
  const {PROJECT_LIBRARY_STORAGE_KEY, restoreProjectLibrary} = await import("./data-layer-project-library.js");
  const pause = () => new Promise(resolve => setTimeout(resolve, 10));
  const until = async predicate => {
    for(let attempt=0;attempt<100;attempt++) { if(predicate()) return; await pause(); }
    throw Error("Dialog callback did not settle");
  };
  const host = document.createElement("section");
  host.innerHTML = '<div id="active-project-header"></div><div id="active-project-card"></div><input id="project-library-search"><ul id="project-library-list"></ul><button id="create-library-project">Create project</button><button id="import-library-project">Import project</button><input type="file" id="import-library-project-file"><p id="project-library-status"></p>';
  document.body.append(host);
  const values = new Map();
  let sequence=0, writes=0, undos=0, commits=0, releases=0, aborts=0, subscriber, prior, pending=false;
  const button = (root,text) => [...root.querySelectorAll("button")].find(item=>item.textContent===text);
  const dialog = () => document.querySelector("dialog[open]");
  const close = async () => { const opened=dialog(); opened.close(); await until(()=>!opened.isConnected); };
  const storage = {getItem:key=>values.get(key)??null,removeItem:key=>values.delete(key),setItem:(key,value)=>{if(key===PROJECT_LIBRARY_STORAGE_KEY){prior=values.get(key);writes++;}values.set(key,value);},
    projectLibraryTransport:{prepareExport:async()=>{throw Error("Unexpected export");},inspectImport:async()=>({
      formatVersion:2,sourceName:"Source",targetName:"Copy",projectId:"import:copy",entityCounts:{},referenceIntegrity:"valid",migrations:[],blockers:[],
      commit:async({name,signal})=>{commits++;if(name!=="Copy")throw Error("Changed import input");if(pending)await new Promise((resolve,reject)=>signal.addEventListener("abort",()=>{aborts++;reject(new DOMException("Cancelled","AbortError"));},{once:true}));},
      release:()=>{releases++;},
    })}};
  const ui = mountProjectLibraryUi({root:host,storage,projectStorageKey:"fixture:project",navigationStorageKey:"fixture:navigation",
    id:kind=>`${kind}:dialog:${++sequence}`,now:()=>"2026-09-06T00:00:00.000Z",openStudio(){},
    exportProject:async()=>{throw Error("Unexpected fallback");},importProject:async()=>{throw Error("Unexpected fallback");},
    subscribe:listener=>{subscriber=listener;return()=>{};},settled:async()=>{},
    undoProject:async()=>{undos++;values.set(PROJECT_LIBRARY_STORAGE_KEY,prior);}});
  const create = async name => {
    host.querySelector("#create-library-project").click();
    const opened=dialog();
    opened.querySelector('[name="name"]').value=name;
    button(opened,"Review create project").click();
    button(opened,"Confirm create project").click();
    button(opened,"Confirm create project").click();
    await close();
    return ui.library().activeProjectId;
  };
  try {
    const first=await create("First"),second=await create("Second");
    const creation=writes===2&&first!==second&&ui.library().activeProjectId===second;
    button(host.querySelector(`[data-project-id="${first}"]`),"Switch").click();
    await until(()=>Boolean(dialog()));
    const switchDialog=dialog();
    button(switchDialog,"Switch to First").click();
    await until(()=>!switchDialog.isConnected);
    const switching=ui.library().activeProjectId===first&&writes===3&&document.activeElement?.dataset.projectId===first;
    button(host.querySelector("#active-project-card"),"Edit details").click();
    await until(()=>Boolean(dialog()));
    dialog().querySelector('[name="notes"]').value="Changed";
    button(dialog(),"Save project details").click();
    const metadata=writes===4&&ui.library().projects[first].state.project.notes==="Changed";
    button(dialog(),"Undo metadata edit").click();
    button(dialog(),"Undo metadata edit").click();
    await until(()=>undos===1&&dialog().querySelector('[name="notes"]').value!=="Changed");
    const undo=ui.library().projects[first].state.project.id===first&&ui.library().projects[first].state.project.notes!=="Changed";
    await close();
    const inspect = async () => {
      const input=host.querySelector('input[type="file"]'),transfer=new DataTransfer();
      transfer.items.add(new File(["{}"],"copy.json"));
      Object.defineProperty(input,"files",{value:transfer.files,configurable:true});
      input.dispatchEvent(new Event("change"));
      await until(()=>Boolean(dialog()));
    };
    await inspect();
    button(dialog(),"Import as new project").click();
    button(dialog(),"Import as new project").click();
    await until(()=>dialog().textContent.includes("Imported Copy"));
    await close();
    const importing=commits===1&&releases===1&&ui.library().activeProjectId===first;
    pending=true;
    await inspect();
    button(dialog(),"Import as new project").click();
    await close();
    await until(()=>aborts===1);
    const cancellation=commits===2&&releases===2&&writes===4;
    const replacement=restoreProjectLibrary(values.get(PROJECT_LIBRARY_STORAGE_KEY));
    replacement.projects[first].state.project.name="Subscribed name";
    subscriber(replacement);
    const subscription=host.querySelector("#active-project-card").textContent.includes("Subscribed name");
    return {creation,switching,metadata,undo,importing,cancellation,subscription};
  } finally {
    if(dialog()) await close();
    host.remove();
  }
}
