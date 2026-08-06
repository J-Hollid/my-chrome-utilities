import { runBrowserTargetSession } from "./browser-target-session.mjs";

const definitions = {
  BRANDING_WORKFLOW_CHOICES_TARGET:{
    pagePath:"specification-builder.html",
    expression:()=>`
      const pause=()=>new Promise(resolve=>queueMicrotask(resolve));
      const choices=await import('./data-layer-studio-choice-controls.js');
      const host=document.createElement('section');host.id='focused-choice-workflow';document.body.replaceChildren(host);
      let changes=0;
      for(const key of choices.studioChoiceContractKeys()){
        const row=document.createElement('p'),label=document.createElement('label'),input=document.createElement('input');
        input.type='checkbox';input.name=key;input.checked=false;input.addEventListener('change',()=>changes+=1);
        choices.declareStudioChoice(input,key);label.append(input,key);row.append(label);host.append(row);
      }
      const dispose=choices.installStudioChoiceControls(host);await pause();
      const controls=[...host.querySelectorAll('input[type=checkbox]')],before=host.innerHTML;
      for(const input of controls){input.focus();input.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));input.click();}
      await pause();
      const observation=Object.fromEntries(controls.map(input=>{const contract=choices.studioChoiceContract(input.name),label=input.labels?.[0],box=input.getBoundingClientRect(),style=getComputedStyle(input);return[input.name,input.checked&&input.dataset.studioChoiceEnhanced==='true'&&input.dataset.studioChoiceContract===input.name&&input.getAttribute('aria-description')===contract.consequence&&label?.htmlFor===input.id&&input.labels.length===1&&box.width>0&&box.height>0&&style.display!=='none'&&(contract.pattern==='switch'?(input.getAttribute('role')==='switch'&&input.getAttribute('aria-checked')==='true'):!input.hasAttribute('role'))];}));
      const after=host.innerHTML,installedWorkflow=location.protocol==='chrome-extension:'&&controls.length===choices.studioChoiceContractKeys().length&&changes===controls.length&&before!==after&&Object.values(observation).every(Boolean);
      dispose();host.remove();
      if(!installedWorkflow)throw new Error('Installed choice-control workflow assertions failed');
      return{studioChoiceControls:observation,brandingWorkflowChoicesIsolation:{guidanceExecuted:false}};`,
  },
  BRANDING_WORKFLOW_GUIDANCE_TARGET:{
    pagePath:"specification-builder.html",
    expression:()=>`
      const guidance=await import('./specification-studio-technical-analyst-guidance.js'),routes=['Project overview','Shared Profiles','Pages','Property Sets','Events','Applicability','Flows','Fixtures','Assignments','Documentation'];
      const root=document.createElement('main'),analyst=document.createElement('button'),bubble=document.createElement('output'),reserve=document.createElement('span'),visual=document.createElement('span'),announcement=document.createElement('span'),control=document.createElement('button');
      analyst.id='technical-analyst';analyst.textContent='Technical analyst';control.id='run-preflight';control.textContent='Run preflight';bubble.hidden=true;bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');reserve.dataset.analystTipReserve='';visual.dataset.analystTipVisual='';announcement.dataset.analystTipAnnouncement='';bubble.append(reserve,visual,announcement);root.append(control,bubble,analyst);document.body.replaceChildren(root);
      let route='Project overview',clock=0;const controller=guidance.installStudioAnalystGuidance({bubble,route:()=>route,active:()=>true,analystControl:analyst,controlRoot:root,reducedMotion:()=>true,now:()=>clock,intervalMilliseconds:60000});
      const initiallyHidden=bubble.hidden;analyst.click();await new Promise(resolve=>queueMicrotask(resolve));const clickShown=!bubble.hidden&&bubble.dataset.hintId==='project-overview'&&visual.textContent===bubble.dataset.completeText&&announcement.textContent===bubble.dataset.completeText&&analyst.dataset.analystPose==='holding';
      const firstId=bubble.dataset.hintId;analyst.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await new Promise(resolve=>queueMicrotask(resolve));const keyboardReplaced=!bubble.hidden&&bubble.dataset.hintId!==firstId;
      route='Pages';controller.evaluate();const routeHidden=bubble.hidden;controller.requestNext();const routeShown=bubble.dataset.hintId==='pages';
      controller.dispose();const disposed=bubble.hidden&&analyst.dataset.analystPose==='idle';
      const catalogue=Object.fromEntries(routes.map(name=>[name,guidance.studioAnalystHintsForRoute(name)])),pools=Object.fromEntries(routes.map(name=>[name,{count:catalogue[name].length,distinct:new Set(catalogue[name].map(({id})=>id)).size,texts:catalogue[name].map(({text})=>text),comic:true}]));
      const installedWorkflow=location.protocol==='chrome-extension:'&&initiallyHidden&&clickShown&&keyboardReplaced&&routeHidden&&routeShown&&disposed;
      if(!installedWorkflow)throw new Error('Installed analyst-guidance workflow assertions failed');
      return{studioAnalystGuidance:{installedBoundary:true,catalogueComplete:routes.every(name=>catalogue[name].length>=5),timing:{first:guidance.STUDIO_ANALYST_FIRST_HINT_MS===10000,lifetime:guidance.STUDIO_ANALYST_HINT_LIFETIME_MS===10000,cooldown:guidance.STUDIO_ANALYST_COOLDOWN_MS===120000,dwell:guidance.STUDIO_ANALYST_CONTROL_DWELL_MS===3000,print:guidance.STUDIO_ANALYST_PRINT_INTERVAL_MS===20},routeIsolation:catalogue.Pages.every(({route})=>route==='Pages'),interaction:{pools:{pools},installedWorkflow:{initiallyHidden,clickShown,keyboardReplaced,routeHidden,routeShown,disposed}},unrelatedChoiceControlsExecuted:false}};`,
  },
};

await runBrowserTargetSession({ definitions });
