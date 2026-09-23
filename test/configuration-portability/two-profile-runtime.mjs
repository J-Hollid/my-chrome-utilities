import {spawn} from "node:child_process";
import {mkdir,mkdtemp} from "node:fs/promises";
import path from "node:path";

import {evaluate,extensionId,pageSocket,wait} from "../support/side-panel-companion/chrome.mjs";
import {
  headlessChromeArguments,
  removeChromeProfile,
  resolveChromeExecutable,
  stopHeadlessChrome,
} from "../support/headless-chrome.mjs";

async function debuggingPort(chrome){
  return new Promise((resolve,reject)=>{
    let output="";
    const timeout=setTimeout(()=>reject(new Error(`Chrome debugging timeout: ${output}`)),15_000);
    chrome.stderr.on("data",chunk=>{
      output+=chunk;
      const match=output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//u);
      if(match){clearTimeout(timeout);resolve(Number(match[1]));}
    });
    chrome.once("error",reject);
  });
}

export async function nativePointerClick(socket,selector){
  const point=await evaluate(socket,`(()=>{const element=document.querySelector(${JSON.stringify(selector)});if(!element)return null;element.scrollIntoView({block:'center'});const bounds=element.getBoundingClientRect(),x=bounds.left+bounds.width/2,y=bounds.top+bounds.height/2,hit=document.elementFromPoint(x,y);return hit&&(hit===element||element.contains(hit))?{x,y}:null;})()`);
  if(!point)throw new Error(`Native pointer target is not exposed: ${selector}`);
  await socket.call("Page.bringToFront");
  await socket.call("Input.dispatchMouseEvent",{type:"mouseMoved",...point});
  await socket.call("Input.dispatchMouseEvent",{type:"mousePressed",...point,button:"left",buttons:1,clickCount:1});
  await socket.call("Input.dispatchMouseEvent",{type:"mouseReleased",...point,button:"left",buttons:0,clickCount:1});
}

async function pressEnter(socket){
  const key={key:"Enter",code:"Enter",windowsVirtualKeyCode:13,nativeVirtualKeyCode:13};
  await socket.call("Input.dispatchKeyEvent",{type:"keyDown",text:"\r",unmodifiedText:"\r",...key});
  await socket.call("Input.dispatchKeyEvent",{type:"keyUp",...key});
}

async function tabTo(socket,id){
  const key={key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9};
  for(let count=0;count<12;count+=1){
    if(await evaluate(socket,`document.activeElement?.id===${JSON.stringify(id)}`))return;
    await socket.call("Input.dispatchKeyEvent",{type:"keyDown",...key});
    await socket.call("Input.dispatchKeyEvent",{type:"keyUp",...key});
  }
  throw new Error(`Native keyboard could not focus ${id}`);
}

async function pressEscape(socket){
  const key={key:"Escape",code:"Escape",windowsVirtualKeyCode:27,nativeVirtualKeyCode:27};
  await socket.call("Input.dispatchKeyEvent",{type:"keyDown",...key});
  await socket.call("Input.dispatchKeyEvent",{type:"keyUp",...key});
}

export async function importConfigurationInFreshProfile(archiveBase64,sourceIdentity,extensionRoot){
  const profileParent=path.resolve("tmp/browser-profiles");
  await mkdir(profileParent,{recursive:true});
  const profile=await mkdtemp(path.join(profileParent,"configuration-recipient-"));
  const chromeArguments=headlessChromeArguments(profile,extensionRoot);
  chromeArguments.splice(-1,0,`--load-extension=${extensionRoot}`);
  const chrome=spawn(resolveChromeExecutable(),chromeArguments,{stdio:["ignore","ignore","pipe"]});
  let socket;
  try{
    const port=await debuggingPort(chrome),id=await extensionId(port);
    socket=await pageSocket(port,`chrome-extension://${id}/side-panel.html`);
    await socket.call("Page.bringToFront");
    await evaluate(socket,`(async()=>{for(let attempt=0;attempt<240&&!document.querySelector('[data-utility-shell-ready="true"]');attempt+=1)await new Promise(resolve=>setTimeout(resolve,25));return true;})()`);
    await nativePointerClick(socket,"#data-layer-view-projects");
    await nativePointerClick(socket,"#import-complete-configuration");
    await evaluate(socket,`(async()=>{
      const pause=()=>new Promise(resolve=>setTimeout(resolve,25));
      const waitFor=async read=>{for(let attempt=0;attempt<240;attempt+=1){const value=read();if(value)return value;await pause();}};
      await waitFor(()=>document.querySelector('[data-utility-shell-ready="true"]'));
      const file=document.querySelector('#import-complete-configuration-file');
      const bytes=Uint8Array.from(atob(${JSON.stringify(archiveBase64)}),value=>value.charCodeAt(0));
      const transfer=new DataTransfer();
      transfer.items.add(new File([bytes],'complete-configuration.zip',{type:'application/zip'}));
      Object.defineProperty(file,'files',{configurable:true,value:transfer.files});
      file.dispatchEvent(new Event('change',{bubbles:true}));
      const dialog=await waitFor(()=>{const value=document.querySelector('#complete-configuration-review');return value?.open&&!value.querySelector('#setup-from-configuration').disabled&&value;});
      const policy=dialog.querySelector('#complete-configuration-conflict-policy');
      policy.value='replace-all';
      policy.dispatchEvent(new Event('change',{bubbles:true}));
      return true;
    })()`);
    await nativePointerClick(socket,"#complete-configuration-conflict-policy");
    await pressEscape(socket);
    await tabTo(socket,"setup-from-configuration");
    await pressEnter(socket);
    const setup=await evaluate(socket,`(async()=>{
      const pause=()=>new Promise(resolve=>setTimeout(resolve,25));
      const waitFor=async read=>{for(let attempt=0;attempt<240;attempt+=1){const value=read();if(value)return value;await pause();}};
      const committed=await waitFor(()=>document.querySelector('#complete-configuration-status')?.textContent.includes('Configuration setup is complete'));
      const button=document.querySelector('#setup-from-configuration');
      return{committed:Boolean(committed),status:document.querySelector('#complete-configuration-status')?.textContent??'',activeId:document.activeElement?.id??'',disabled:button?.disabled};
    })()`);
    if(!setup.committed)return{passed:false,status:setup.status};
    await evaluate(socket,"location.reload()");
    const result=await evaluate(socket,`(async()=>{
      const pause=()=>new Promise(resolve=>setTimeout(resolve,25));
      const waitFor=async read=>{for(let attempt=0;attempt<240;attempt+=1){const value=read();if(value)return value;await pause();}};
      await waitFor(()=>document.querySelector('[data-utility-shell-ready="true"]'));
      const repository=await (await import('/data-layer-durable-project-repository.js')).openIndexedDbProjectRepository();
      const loaded=await repository.loadProject('project-retail');
      const image=loaded.state.project.conceptVisualAssets.find(({id})=>id==='asset:portable-image');
      const template=loaded.state.project.documentation.templates.find(({id})=>id==='template:portable-excel');
      const imageBody=await repository.loadConceptVisualAssetBody('project-retail','asset:portable-image');
      const templateBody=await repository.loadDocumentationTemplateBody('project-retail',template.body.digest);
      const sha256=async blob=>'sha256:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),byte=>byte.toString(16).padStart(2,'0')).join('');
      const imageElement=new Image(),imageUrl=URL.createObjectURL(imageBody),rendered=await new Promise(resolve=>{imageElement.onload=()=>resolve(imageElement.naturalWidth===1&&imageElement.naturalHeight===1);imageElement.onerror=()=>resolve(false);imageElement.src=imageUrl;document.body.append(imageElement);});URL.revokeObjectURL(imageUrl);imageElement.remove();
      await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/vendor/exceljs.min.js';script.onload=resolve;script.onerror=reject;document.head.append(script);});
      const renderer=await import('/documentation-templates/excel-renderer.js'),snapshot={projectId:'project-retail',projectName:'Retail website',set:{id:'set:runtime',name:'Runtime',themeId:'theme:runtime',sections:[{id:'section:flow',kind:'flow',name:'Flow',selected:true}],templateAssignments:{'excel:flow':template.id}},theme:{id:'theme:runtime',name:'Runtime',clientName:'',logo:'',colors:{heading:'#223344',accent:'#112233',stripe:'#eeeeee'},typography:{family:'Arial',headingSize:14,bodySize:10},density:'comfortable',borders:true,striping:true,highlightedHeadings:true,columnWidths:{},headerText:'',footerText:''},sourceRevisions:{},templates:[template],generatedAt:'2026-09-14T00:00:00.000Z',tables:[{id:'section:flow',title:'Imported flow',headings:['Value'],rows:[['Portable']]}],diagnostics:[],title:'Runtime',incomplete:false,snapshotHash:'runtime'},output=await renderer.writeProjectDocumentationWorkbookWithTemplates(snapshot,{scope:'complete'},async digest=>repository.loadDocumentationTemplateBody('project-retail',digest)),book=new ExcelJS.Workbook();await book.xlsx.load(output);
      const installed=await import('/configuration-portability/installed-repository.js'),adapter=await import('/configuration-portability/durable-project-adapter.js'),port=installed.createInstalledCompleteConfigurationPort({projectStorage:localStorage,dataLayerStorage:localStorage,hotkeyStorage:localStorage,buildIdentity:'runtime-proof',durableRepository:adapter.createDurableProjectConfigurationRepository(repository)});
      const recipient=await port.read(),identity={activeProjectId:recipient.activeProjectId,domains:Object.fromEntries(Object.entries(recipient.sections).map(([domain,records])=>[domain,records.map(({id})=>id).sort()])),bodies:Object.fromEntries(await Promise.all(recipient.bodies.map(async body=>[body.digest,{mediaType:body.mediaType,contentDigest:await sha256(new Blob([body.bytes],{type:body.mediaType}))}])))};
      const identityMatch=JSON.stringify(identity)===JSON.stringify(${JSON.stringify(sourceIdentity)});
      return{passed:identityMatch&&rendered&&book.worksheets.length===1&&book.worksheets[0].name==='Flow',identityMatch,rendered,generatedSheets:book.worksheets.length,imageDigest:await sha256(imageBody),templateDigest:await sha256(templateBody)};
    })()`);
    return result;
  }finally{
    socket?.close();
    await stopHeadlessChrome(chrome);
    await wait(50);
    await removeChromeProfile(profile);
  }
}
