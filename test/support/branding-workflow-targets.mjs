import { runBrowserTargetSession } from "./browser-target-session.mjs";

const definitions = {
  BRANDING_WORKFLOW_CHOICES_TARGET:{
    pagePath:"specification-builder.html",
    expression:()=>`
      const choices=await import('./data-layer-studio-choice-controls.js'),keys=choices.studioChoiceContractKeys(),contracts=keys.map(key=>choices.studioChoiceContract(key));
      const observation=Object.fromEntries(contracts.map(({key,pattern,consequence})=>[key,(pattern==='checkbox'||pattern==='switch')&&consequence.trim().length>0]));
      return{studioChoiceControls:observation,brandingWorkflowChoicesIsolation:{guidanceExecuted:false}};`,
  },
  BRANDING_WORKFLOW_GUIDANCE_TARGET:{
    pagePath:"specification-builder.html",
    expression:()=>`
      const guidance=await import('./specification-studio-technical-analyst-guidance.js'),routes=['Project overview','Shared Profiles','Pages','Property Sets','Events','Applicability','Flows','Fixtures','Assignments','Documentation'],catalogue=Object.fromEntries(routes.map(route=>[route,guidance.studioAnalystHintsForRoute(route).map(({id,text})=>({id,text}))]));
      const pools=Object.fromEntries(routes.map(route=>[route,{texts:catalogue[route].map(({text})=>text)}]));
      return{studioAnalystGuidance:{installedBoundary:location.protocol==='chrome-extension:',catalogueComplete:routes.every(route=>catalogue[route].length>0&&catalogue[route].every(({id,text})=>id&&text)),timing:{first:guidance.STUDIO_ANALYST_FIRST_HINT_MS===10000,lifetime:guidance.STUDIO_ANALYST_HINT_LIFETIME_MS===10000,cooldown:guidance.STUDIO_ANALYST_COOLDOWN_MS===120000,dwell:guidance.STUDIO_ANALYST_CONTROL_DWELL_MS===3000,print:guidance.STUDIO_ANALYST_PRINT_INTERVAL_MS===20},routeIsolation:guidance.studioAnalystHintsForRoute('Pages').every(({route})=>route==='Pages'),interaction:{pools:{pools}},unrelatedChoiceControlsExecuted:false}};`,
  },
};

await runBrowserTargetSession({ definitions });
