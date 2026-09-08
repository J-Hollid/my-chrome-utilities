import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { runBrowserTargetSession } from "../support/browser-target-session.mjs";
import {observeSchemaEditorWheel} from "../support/side-panel-schema-wheel-observation.mjs";

const wait = (milliseconds=25) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const setup=`(async()=>{const {createSpecificationProject}=await import('/data-layer-specification-project.js'),{openIndexedDbProjectRepository}=await import('/data-layer-durable-project-repository.js'),repository=await openIndexedDbProjectRepository(),created=createSpecificationProject({name:'Shop',site:'shop.example',id:(kind)=>kind==='project'?'project-shop':kind+':shop'}),properties=Object.fromEntries(Array.from({length:32},(_,index)=>['property_'+index,{type:'string'}]));created.project.collections.pages=Array.from({length:18},(_,index)=>({id:'page:'+index,name:index===0?'Cart':'Page '+index,localSchemaContributions:index===0?Object.entries(properties).map(([path,schema])=>({path:'/'+path,schema})):[]}));await repository.putProjectMetadataOnly(created,{active:true,draftToken:'schema-reachability',draftSequence:1,publishedRevision:0});await repository.saveSavedSchema({schema:{id:'schema:opened',name:'Opened Article',version:1,published:true,document:{type:'object',properties},assignments:[],attachedRules:[],documentation:{}},label:'Seed Opened Article'});return true;})()`;
const observe=`(async()=>{const pause=(ms=25)=>new Promise(resolve=>setTimeout(resolve,ms)),until=async(read,label)=>{for(let attempt=0;attempt<240;attempt+=1){const value=read();if(value)return value;await pause();}throw new Error('Timed out: '+label+' '+JSON.stringify({action:globalThis.__schemaReachabilityAction,ready:document.querySelector('#side-panel-root')?.dataset.utilityShellReady,editorHidden:document.querySelector('#schema-editor')?.hidden,route:document.querySelector('#data-layer-panel-schemas')?.dataset.schemaEditorRoute,result:document.querySelector('#schema-result')?.textContent,tree:document.querySelector('#schema-list')?.textContent?.slice(0,500)}));},q=(selector)=>{const value=document.querySelector(selector);if(!value)throw new Error('Missing '+selector);return value;},buttons=(root=document)=>[...root.querySelectorAll('button')],visible=(element)=>element.getClientRects().length>0;await until(()=>q('#side-panel-root').dataset.utilityShellReady==='true','installed shell readiness');const workspace=q('#workspace-panel-data-layer'),panel=q('#data-layer-panel-schemas'),tree=q('#schema-list');q('#data-layer-view-schemas').click();await until(()=>tree.textContent.includes('Opened Article')&&tree.textContent.includes('Cart'),'Schema tree');await pause(120);const action=__schemaReachabilityAction==='Create schema'?q('#create-schema'):__schemaReachabilityAction==='Open Saved schema'?buttons(tree).find(({textContent})=>textContent==='Edit working draft'):buttons([...tree.querySelectorAll('[data-schema-entry-key="pages:page:0"]')].at(-1)).find(({textContent})=>textContent==='Open schema');if(!action)throw new Error('Missing '+__schemaReachabilityAction);action.scrollIntoView({block:'center'});await pause();const repository=await(await import('/data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),beforeScroll=workspace.scrollTop,beforeProject=JSON.stringify((await repository.loadProject('project-shop')).state.project),beforeSchemas=JSON.stringify(await repository.listSavedSchemaMetadata());action.focus();action.click();const editor=await until(()=>{const value=q('#schema-editor');return !value.hidden&&panel.dataset.schemaEditorRoute==='active'?value:undefined;},'active editor route'),detail=q('#schema-detail'),first=q('#schema-editor-name'),workspaceBounds=workspace.getBoundingClientRect(),detailBounds=detail.getBoundingClientRect(),heading=q('#data-layer-panel-schemas > h3'),owners=[...document.querySelectorAll('*')].filter(element=>visible(element)&&element.scrollHeight>element.clientHeight+1&&/(auto|scroll)/.test(getComputedStyle(element).overflowY)),start=detail.scrollTop;first.focus();return{beforeScroll,beforeProject,beforeSchemas,actionLabel:__schemaReachabilityAction,geometry:detailBounds.top>=workspaceBounds.top&&detailBounds.bottom<=workspaceBounds.bottom&&visible(heading)&&visible(first),owner:owners.length===1&&owners[0]===detail,horizontal:document.documentElement.scrollWidth<=document.documentElement.clientWidth,start,point:{x:detailBounds.left+Math.min(20,detailBounds.width/2),y:detailBounds.top+Math.min(40,detailBounds.height/2)}};})()`;
const scrollState=`(()=>{const detail=document.querySelector('#schema-detail'),editor=document.querySelector('#schema-editor'),final=[...editor.querySelectorAll('button')].filter(button=>button.offsetParent!==null).at(-1),finalBounds=final?.getBoundingClientRect(),ownerBounds=detail.getBoundingClientRect();return{offset:detail.scrollTop,finalVisible:Boolean(finalBounds&&finalBounds.bottom<=ownerBounds.bottom&&finalBounds.top>=ownerBounds.top)};})()`;
const resetScroll=`(()=>{const detail=document.querySelector('#schema-detail');detail.scrollTop=0;document.querySelector('#schema-editor-name').focus();return detail.scrollTop;})()`;
const finish=`(async()=>{const pause=(ms=25)=>new Promise(resolve=>setTimeout(resolve,ms)),editor=document.querySelector('#schema-editor'),close=[...editor.querySelectorAll('button')].find(({textContent})=>textContent==='Close editor')??document.querySelector('#close-schema-editor');close.click();await pause(80);const workspace=document.querySelector('#workspace-panel-data-layer'),focused=document.activeElement?.textContent?.trim()??'',repository=await(await import('/data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),afterProject=JSON.stringify((await repository.loadProject('project-shop')).state.project),afterSchemas=JSON.stringify(await repository.listSavedSchemaMetadata());return{restored:workspace.scrollTop===__schemaReachabilityBefore.beforeScroll,focus:__schemaReachabilityAction==='Create schema'?document.activeElement?.id==='create-schema':focused===(__schemaReachabilityAction==='Open Saved schema'?'Edit working draft':'Open schema'),unchanged:afterProject===__schemaReachabilityBefore.beforeProject&&afterSchemas===__schemaReachabilityBefore.beforeSchemas,treeOwner:/(auto|scroll)/.test(getComputedStyle(workspace).overflowY)&&!document.querySelector('#data-layer-panel-schemas').dataset.schemaEditorRoute};})()`;


const targetId = "SIDE_PANEL_SCHEMA_EDITOR_REACHABILITY_TARGET";
const returnExpression = (source) => `return await (${source});`;

const definitions = {
  [targetId]:{
    pagePath:"side-panel.html",
    maximumElapsedMilliseconds:120_000,
    readiness:{
      expression:"document.querySelector('#side-panel-root')?.dataset.utilityShellReady === 'true'",
      description:"initialized Side Panel shell",
    },
    beforeExpression:() => returnExpression(setup),
    run:async({ socket, evaluate }) => {
      const rows = [];
      for (const [width,height,action] of [
        [360,760,"Create schema"],
        [420,900,"Open Saved schema"],
        [520,900,"Open project contributor"],
      ]) {
        await socket().call("Emulation.setDeviceMetricsOverride", {
          width,height,deviceScaleFactor:1,mobile:false,
        });
        await socket().call("Page.reload", { ignoreCache:true });
        await wait(300);
        await evaluate(socket(),
          `globalThis.__schemaReachabilityAction=${JSON.stringify(action)}; return true;`);
        const before = await evaluate(socket(), returnExpression(observe));
        await evaluate(socket(),
          `globalThis.__schemaReachabilityBefore=${JSON.stringify(before)}; return true;`);
        const {before: wheelBefore, after: wheelAfter} = await observeSchemaEditorWheel({
          read: () => evaluate(socket(), returnExpression(scrollState)),
          dispatch: () => socket().call("Input.dispatchMouseEvent", {
            type:"mouseWheel",x:before.point.x,y:before.point.y,deltaX:0,deltaY:520,
          }),
        });
        const resetOffset = await evaluate(socket(), returnExpression(resetScroll));
        await wait(40);
        const keyboardOffsets = [];
        let keyboardState = await evaluate(socket(), returnExpression(scrollState));
        for (let attempt=0; attempt<40 && !keyboardState.finalVisible; attempt+=1) {
          const inputBefore = keyboardState.offset;
          await socket().call("Input.dispatchKeyEvent", {
            type:"keyDown",key:"PageDown",code:"PageDown",
          });
          await socket().call("Input.dispatchKeyEvent", {
            type:"keyUp",key:"PageDown",code:"PageDown",
          });
          await wait(50);
          keyboardState = await evaluate(socket(), returnExpression(scrollState));
          keyboardOffsets.push({before:inputBefore,after:keyboardState.offset});
        }
        const after = await evaluate(socket(), returnExpression(finish));
        rows.push({
          width,height,action,geometry:before.geometry,owner:before.owner,
          horizontal:before.horizontal,wheelOffsets:{before:wheelBefore.offset,after:wheelAfter.offset},
          wheelMoved:wheelAfter.offset>wheelBefore.offset,resetOffset,keyboardOffsets,
          keyboardMoved:keyboardOffsets.some(({before:inputBefore,after:inputAfter})=>inputAfter>inputBefore),
          finalVisible:keyboardState.finalVisible,...after,
        });
      }
      const evidence = {
        rows:rows.every((row) => row.geometry && row.owner && row.horizontal &&
          row.wheelMoved && row.resetOffset===0 && row.keyboardMoved && row.finalVisible),
        restoration:rows.every((row) => row.restored && row.focus && row.unchanged && row.treeOwner),
      };
      assert.equal(Object.values(evidence).every(Boolean), true, JSON.stringify(rows));
      return {schemaEditorReachability:evidence,rows};
    },
  },
};

const sessionEvidence = await runBrowserTargetSession({
  definitions,
  environment:{
    ...process.env,
    SWARMFORGE_BROWSER_TARGET_IDS:JSON.stringify([targetId]),
    SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS:JSON.stringify({[targetId]:{}}),
  },
});
if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory === "other:missing Schema editor reachability stylesheet") {
    const normalized = (value) => Array.isArray(value) ? value.map(normalized)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).sort(([left], [right]) =>
          left.localeCompare(right)).map(([key, nested]) => [key, normalized(nested)]))
        : value;
    const digest = (value) => createHash("sha256")
      .update(JSON.stringify(normalized(value))).digest("hex");
    const expectedPreRepairFailure = { geometry:false, scrollOwner:false, wheelScroll:false };
    const expectedRepairResult = { geometry:true, scrollOwner:true, wheelScroll:true };
    const repairResult = {
      geometry:sessionEvidence.rows.every(({ geometry }) => geometry),
      scrollOwner:sessionEvidence.rows.every(({ owner }) => owner),
      wheelScroll:sessionEvidence.rows.every(({ wheelMoved }) => wheelMoved),
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixture = {
      id:"schema-editor-reachability-stylesheet-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{ stylesheet:"/side-panel-schema-editor-reachability.css" },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
    } }));
  }
}
console.log(JSON.stringify(sessionEvidence));
