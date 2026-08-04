const call=(evaluate,socket,fn,input)=>evaluate(socket,`(${fn})(${JSON.stringify(input)})`);

async function seedPageTable(){
  const durable=await import('/data-layer-durable-project-repository.js'),repository=await durable.openIndexedDbProjectRepository(),projectId=await repository.activeProjectId(),loaded=await repository.loadProject(projectId),project=structuredClone(loaded.state.project),profileId='profile:authoring086',pageId='page:authoring086',profile={id:profileId,name:'Containment profile',requirements:[],schemaConstraints:[{path:'/customer_status',type:'string',documentation:'Inherited customer status'}]},page={id:pageId,name:'Containment page',profileId,localSchemaContributions:[{path:'/page_note',type:'string',documentation:'Page-only note'}]};
  project.collections.profiles=[...project.collections.profiles.filter(({id})=>id!==profileId),profile];
  project.collections.pages=[...project.collections.pages.filter(({id})=>id!==pageId),page];
  const saved=await repository.saveDraft(durable.durableDraftCommand(loaded,{...loaded.state,project},{commandId:'authoring086:'+crypto.randomUUID(),label:'Seed inherited editor containment'}));
  if(saved.status==='conflict')throw new Error('Inherited editor containment seed conflicted');
  return{id:pageId};
}

async function openPage({id}){
  const pause=()=>new Promise(resolve=>setTimeout(resolve,35)),wait=async(read,label)=>{for(let attempt=0;attempt<200;attempt+=1){const value=read();if(value)return value;await pause();}throw new Error('Inherited editor containment '+label);},tree=await wait(()=>document.querySelector('#project-tree button[data-kind="pages"]'),'Pages collection');tree.click();const open=await wait(()=>document.querySelector('[data-entity-id="'+CSS.escape(id)+'"] button[aria-label^="Open "]'),'Page route');open.click();await wait(()=>{const root=document.querySelector('.composed-schema-workspace[data-schema-contributor-id="'+CSS.escape(id)+'"]');return root?.querySelector('[data-effective-property-path="/customer_status"]')&&root.querySelector('[data-effective-property-path="/page_note"]')?root:undefined;},'Page schema Table');return true;
}

function inspectPageTable({id}){
  const root=[...document.querySelectorAll('.composed-schema-workspace[data-schema-contributor-id="'+CSS.escape(id)+'"]')].find(candidate=>!candidate.closest('[hidden]')),paths=['/customer_status','/page_note'],intersection=(left,right)=>Math.max(0,Math.min(left.right,right.right)-Math.max(left.left,right.left))*Math.max(0,Math.min(left.bottom,right.bottom)-Math.max(left.top,right.top)),rows=paths.map(path=>{const row=root?.querySelector('[data-effective-property-path="'+path+'"]'),first=row?.querySelector('[data-schema-table-cell="property-editor"]'),action=first?.querySelector('[data-schema-table-property-editor-action="true"]'),pathCell=row?.querySelector('[data-schema-table-cell="path"]'),firstBox=first?.getBoundingClientRect(),actionBox=action?.getBoundingClientRect(),pathBox=pathCell?.getBoundingClientRect(),contained=Boolean(firstBox&&actionBox&&actionBox.left>=firstBox.left-.5&&actionBox.right<=firstBox.right+.5&&actionBox.top>=firstBox.top-.5&&actionBox.bottom<=firstBox.bottom+.5),after=Boolean(firstBox&&pathBox&&pathBox.left>=firstBox.right-.5),complete=Boolean(pathCell?.textContent.trim()===path&&pathCell.scrollWidth<=pathCell.clientWidth+1),overlap=actionBox&&pathBox?intersection(actionBox,pathBox):Number.POSITIVE_INFINITY;return{path,contained,after,complete,overlap,first:firstBox&&{left:firstBox.left,right:firstBox.right,top:firstBox.top,bottom:firstBox.bottom},action:actionBox&&{left:actionBox.left,right:actionBox.right,top:actionBox.top,bottom:actionBox.bottom},pathBox:pathBox&&{left:pathBox.left,right:pathBox.right,top:pathBox.top,bottom:pathBox.bottom}};});return{rows,all:rows.length===2&&rows.every(({contained,after,complete,overlap})=>contained&&after&&complete&&overlap===0)};
}

export async function runSchemaTableContainmentRuntimeProbe({evaluate,socket,ready,setViewport}){
  const seed=await call(evaluate,socket,seedPageTable);await evaluate(socket,'location.reload(); true');await ready(socket,'#project-tree');await call(evaluate,socket,openPage,seed);const presentations=[];
  for(const[width,zoom]of[[1280,1],[360,1],[720,2]]){await setViewport(width,800,zoom);presentations.push({width,zoom,...await call(evaluate,socket,inspectPageTable,seed)});}
  await setViewport(1280,900,1);
  return{authoring086:presentations.every(({all})=>all),presentations};
}
