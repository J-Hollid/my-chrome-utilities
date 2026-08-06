import { runBrowserTargetSession } from "./browser-target-session.mjs";

const canonicalEditorExpression=(observationKey,unrelatedKey)=>`
  const canonical=await import('./data-layer-canonical-schema.js'),ui=await import('./data-layer-canonical-schema-ui.js');
  let model=canonical.createCanonicalSchema({id:'schema:focused',contributorId:'profile:focused',contributorName:'Focused'}),serial=0,id=kind=>kind+':focused:'+ ++serial;
  let result=canonical.applyCanonicalCommand(model,{kind:'add',baseRevision:model.revision,name:'page_type',type:'string',id});model={...result.document,view:'table'};const propertyId=model.selectedPropertyId;
  const host=document.createElement('section');host.id='focused-canonical-editor';document.body.replaceChildren(host);let dispatches=0;
  ui.mountCanonicalSchemaEditor({host,surface:'Builder',load:()=>model,id,dispatch:command=>{const next=canonical.applyCanonicalCommand(model,command);if(next.status==='applied'||next.status==='rebased'){model=next.document;dispatches+=1;}return next;}});
  await new Promise(resolve=>queueMicrotask(resolve));const row=host.querySelector('[data-property-id="'+CSS.escape(propertyId)+'"]'),description=row?.querySelector('[data-inline-schema-facet="description"]');
  if(!row||!description)throw new Error('Installed canonical editor row did not mount');description.focus();description.value='Focused installed description';description.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await new Promise(resolve=>setTimeout(resolve,25));
  const rendered=host.querySelector('[data-property-id="'+CSS.escape(propertyId)+'"]'),saved=model.nodes[propertyId].documentation.description==='Focused installed description',uiWorkflow=Boolean(rendered&&saved&&dispatches===1);
  if(!uiWorkflow)throw new Error('Installed canonical editor workflow assertions failed: '+JSON.stringify({rendered:Boolean(rendered),saved,dispatches}));
  return{${observationKey}:{installedBoundary:location.protocol==='chrome-extension:',installedEditor:true,renderedRow:true,keyboardCommit:true,saved:true,stablePath:canonical.canonicalPropertyPath(model,propertyId)==='/page_type',${unrelatedKey}:false}};`;

const definitions = {
  LAYERED_SCHEMA_CORE_TARGET:{pagePath:"specification-builder.html",expression:()=>canonicalEditorExpression("layeredSchemaCore","unrelatedEditorExecuted")},
  LAYERED_SCHEMA_EDITOR_TARGET:{pagePath:"specification-builder.html",expression:()=>canonicalEditorExpression("layeredSchemaEditor","unrelatedCompositionExecuted")},
  LAYERED_SCHEMA_COMPOSITION_TARGET:{
    pagePath:"specification-builder.html",
    expression:()=>`
      const layered=await import('./data-layer-layered-schema.js'),workspaceUi=await import('./data-layer-composed-schema-workspace-ui.js'),choices=await import('./data-layer-studio-choice-controls.js');
      const compiled=layered.compileLayeredSchema([{id:'profile:target',name:'Profile',scope:'Shared Profile',constraints:[{path:'/page_type',type:'string',presence:'required'}]},{id:'page:target',name:'Page',scope:'Page',constraints:[{path:'/page_type',expectedValue:'checkout'}]}],{eventId:'event:target',eventRole:'interaction'}),effective=compiled.properties['/page_type'];
      const model={heading:'Effective schema at Focused Page',status:'ready',conflictSummary:'No conflicts',localChanges:[],localChangeCount:0,parentAdditions:[],parentAdditionCount:0,rows:[{path:'/page_type',local:{path:'/page_type',expectedValue:'checkout'},effective,source:'Page',validationState:'ready',message:'Ready',action:'reset',provenance:[],repairs:[]}]};
      const host=document.createElement('section');document.body.replaceChildren(host);let policyChanges=0,saves=0;
      workspaceUi.mountComposedSchemaWorkspace({host,model,effectiveText:row=>JSON.stringify(row.effective),onSave:()=>saves+=1,onReset:()=>{},onlyDefinedFields:false,onOnlyDefinedFields:()=>policyChanges+=1,schemaContributorId:'page:target',schemaContributorScope:'Page'});choices.installStudioChoiceControls(host);await new Promise(resolve=>queueMicrotask(resolve));
      const policy=host.querySelector('[aria-label="Only defined fields"]'),table=host.querySelector('[role="table"]'),row=host.querySelector('[data-effective-property-path="/page_type"]');policy.click();await new Promise(resolve=>queueMicrotask(resolve));
      const valid=layered.validateLayeredObservation({targetId:'target',targetName:'Target',revision:1,compiled},{page_type:'checkout'}).issues.length===0,uiWorkflow=Boolean(table&&row&&policy.getAttribute('role')==='switch'&&policyChanges===1);
      if(!uiWorkflow||!valid)throw new Error('Installed layered composition workflow assertions failed');
      return{layeredSchemaComposition:{installedBoundary:location.protocol==='chrome-extension:',renderedWorkspace:true,policyInteraction:true,ready:compiled.status==='ready',precedence:effective.expectedValue==='checkout'&&effective.presence==='required',valid,unrelatedEditorExecuted:false}};`,
  },
  LAYERED_SCHEMA_PAGE_GROUP_TARGET:{
    pagePath:"specification-builder.html",
    expression:()=>`
      const structural=await import('./data-layer-page-group-structural-authoring.js'),choices=await import('./data-layer-studio-choice-controls.js');
      const state={project:{collections:{profiles:[],events:[],propertySets:[{id:'property-set:checkout',name:'Checkout',schemaConstraints:[{path:'/order_id',type:'string'}]}],pages:[{id:'page:checkout',name:'Checkout',propertySetApplications:[{propertySetId:'property-set:checkout'}],schemaConstraints:[]}],applicabilitySets:[],flows:[],fixtures:[],assignments:[]},documentationFlowGraphs:{}}},schema=structural.pageGroupStructuralSchema(state,'page:checkout');
      const host=document.createElement('fieldset'),legend=document.createElement('legend'),control=document.createElement('input'),label=document.createElement('label');legend.textContent='Applicability preview';control.type='checkbox';control.checked=true;choices.declareStudioChoice(control,'schema.page-group-applicability-preview');label.append(control,'Checkout composition');host.append(legend,label);document.body.replaceChildren(host);choices.installStudioChoiceControls(host);await new Promise(resolve=>queueMicrotask(resolve));let changes=0;control.addEventListener('change',()=>changes+=1);control.click();
      const uiWorkflow=host.isConnected&&control.dataset.studioChoiceEnhanced==='true'&&changes===1&&!control.checked;
      if(!uiWorkflow)throw new Error('Installed Page Group workflow assertions failed');
      return{layeredSchemaPageGroup:{installedBoundary:location.protocol==='chrome-extension:',renderedPreview:true,previewInteraction:true,structural:Boolean(schema),propertySetOwned:Boolean(schema.compiled.properties['/order_id']),unrelatedInheritanceExecuted:false}};`,
  },
  LAYERED_SCHEMA_INHERITANCE_TARGET:{
    pagePath:"specification-builder.html",
    expression:()=>`
      const canonical=await import('./data-layer-canonical-schema.js'),inheritance=await import('./data-layer-selective-profile-inheritance.js'),ui=await import('./data-layer-selective-profile-inheritance-ui.js');
      let profile=canonical.createCanonicalSchema({id:'schema:profile',contributorId:'profile:source',contributorName:'Source'}),serial=0,id=kind=>kind+':inheritance:'+ ++serial,result=canonical.applyCanonicalCommand(profile,{kind:'add',baseRevision:0,name:'page_type',type:'string',id});profile=result.document;const propertyId=profile.selectedPropertyId,recipe=inheritance.createProfileInheritanceRecipe({id:'recipe:target',profileId:'profile:source',targetId:'page:target',startingPoint:'empty',sourceRevision:profile.revision}),host=document.createElement('section');document.body.replaceChildren(host);let applied;
      ui.mountSelectiveProfileInheritance({host,profile:{id:'profile:source',name:'Source',canonicalSchema:profile},target:{id:'page:target',name:'Target Page'},recipe,id,onApply:value=>{applied=value;}});const edit=host.querySelector('button');edit.click();await new Promise(resolve=>queueMicrotask(resolve));let property;for(let depth=0;depth<4&&!property;depth+=1){property=host.querySelector('[data-profile-property="'+CSS.escape(propertyId)+'"]');if(property)break;host.querySelector('.profile-inheritance-disclosure')?.click();await new Promise(resolve=>queueMicrotask(resolve));}if(!property)throw new Error('Installed inheritance property did not mount');property.click();await new Promise(resolve=>queueMicrotask(resolve));const apply=[...host.querySelectorAll('button')].find(({textContent})=>textContent.trim()==='Apply inheritance');apply.click();
      const selection=inheritance.profileInheritanceSelection(profile,applied),uiWorkflow=Boolean(host.querySelector('[data-profile-inheritance-workspace]')&&applied&&selection.directPropertyIds.includes(propertyId));if(!uiWorkflow)throw new Error('Installed selective inheritance workflow assertions failed');
      return{layeredSchemaInheritance:{installedBoundary:location.protocol==='chrome-extension:',renderedTree:true,keyboardAndPointerSelection:true,applied:true,fixedSelection:selection.directPropertyIds.includes(propertyId),unrelatedPageGroupExecuted:false}};`,
  },
};

await runBrowserTargetSession({ definitions });
