export const typedLiteralFocusedEditorExpression=String.raw`(async()=>{
  const pause=(ms=35)=>new Promise((resolve)=>setTimeout(resolve,ms));
  const waitFor=async(read,label)=>{
    for(let attempt=0;attempt<240;attempt+=1){
      const value=await read();
      if(value)return value;
      await pause();
    }
    throw new Error('typed literal focused editor: '+label);
  };
  const buttons=(root=document)=>[...(root?.querySelectorAll('button')??[])];
  const fire=(control,value)=>{
    if(!control)throw new Error('Missing control for '+String(value));
    control.value=String(value);
    control.dispatchEvent(new Event('input',{bubbles:true}));
    control.dispatchEvent(new Event('change',{bubbles:true}));
  };
  const click=(root,label)=>{
    const control=buttons(root).find(({textContent})=>textContent.trim()===label);
    if(!control)throw new Error('Missing '+label);
    control.click();
    return control;
  };
  const closeLayers=async()=>{
    for(let layer=0;layer<4&&document.querySelector(':modal');layer+=1){
      document.querySelector(':modal').dispatchEvent(new Event('cancel',{cancelable:true}));
      await pause();
    }
  };
  const latest=(selector)=>[...document.querySelectorAll(selector)]
    .filter((candidate)=>candidate.isConnected&&!candidate.closest('[hidden]')).at(-1);
  const stageFocused=async(focused,selector,value)=>{
    focused=focused?.isConnected?focused:latest('[data-focused-property-editor="true"]');
    fire(focused?.querySelector(selector),value);
    await pause();
    return latest('[data-focused-property-editor="true"]')??focused;
  };
  const repository=await (await import('/data-layer-durable-project-repository.js')).openIndexedDbProjectRepository();
  const projectId=await repository.activeProjectId();
  const snapshot=async()=>{
    const loaded=await repository.loadProject(projectId);
    return{
      bytes:JSON.stringify(loaded.state.project),
      sequence:loaded.draftSequence,
      undo:Number(document.querySelector('#undo-project')?.dataset.undoCount??0),
    };
  };
  const unchanged=(left,right)=>left.bytes===right.bytes&&left.sequence===right.sequence&&left.undo===right.undo;
  const waitSaved=()=>waitFor(()=>document.querySelector('#project-state')?.textContent.startsWith('Saved Draft'),'Saved Draft');
  const waitSequence=(before)=>waitFor(async()=>{
    const next=await snapshot();
    return next.sequence===before.sequence+1&&next.undo===before.undo+1?next:undefined;
  },'one durable command and Undo action');
  const profileState=async()=>{
    const loaded=await repository.loadProject(projectId);
    return{loaded,profile:loaded.state.project.collections.profiles.find(({name})=>name==='Sitewide')};
  };
  const profileNode=async(name)=>{
    const {profile}=await profileState();
    return Object.values(profile.canonicalSchema.nodes).find((node)=>node.name===name);
  };
  const openProfile=async()=>{
    await closeLayers();
    document.querySelector('#project-tree button[data-kind="profiles"]').click();
    const route=await waitFor(
      ()=>[...document.querySelectorAll('#workspace-content .entity-row button')]
        .find(({textContent})=>textContent.trim().startsWith('Sitewide')),
      'Sitewide route',
    );
    route.click();
    await pause(140);
    const editor=await waitFor(
      ()=>[...document.querySelectorAll('[aria-label="Builder canonical schema editor"]')]
        .find((candidate)=>candidate.isConnected&&!candidate.closest('[hidden]')),
      'Sitewide canonical editor',
    );
    await waitSaved();
    await pause(80);
    return editor;
  };
  const ensureRoot=async(name)=>{
    let editor=await openProfile();
    let node=await profileNode(name);
    if(node)return{editor,node};
    const before=await snapshot();
    fire(editor.querySelector('[name="newRootPropertyName"]'),name);
    click(editor,'Add root property');
    await waitSequence(before);
    node=await waitFor(()=>profileNode(name),'root '+name);
    await pause(140);
    editor=await openProfile();
    return{editor,node};
  };
  const openCanonicalSection=async(name,section)=>{
    const {editor}=await ensureRoot(name),node=await profileNode(name);
    const action=editor.querySelector('[data-property-id="'+CSS.escape(node.id)+'"] [aria-label^="Property actions"]');
    action.click();
    const menu=await waitFor(()=>latest('[data-property-context-menu="true"]'),'canonical property menu');
    click(menu,section);
    const focused=await waitFor(()=>latest('[data-focused-property-editor="true"]'),'canonical '+section);
    return{editor,node,focused};
  };
  const openShipping=async()=>{
    await closeLayers();
    document.querySelector('#project-tree button[data-kind="pages"]').click();
    const route=await waitFor(
      ()=>[...document.querySelectorAll('#workspace-content .entity-row button')]
        .find(({textContent})=>textContent.trim().startsWith('Shipping')),
      'Shipping route',
    );
    route.click();
    await pause(140);
    const workspace=await waitFor(
      ()=>[...document.querySelectorAll('[aria-label="Effective schema at Shipping"]')]
        .find((candidate)=>candidate.isConnected&&!candidate.closest('[hidden]')),
      'Shipping effective schema',
    );
    await waitSaved();
    await pause(80);
    return workspace;
  };
  const openComposedSection=async(path,section)=>{
    const workspace=await openShipping(),row=await waitFor(
      ()=>workspace.querySelector('[data-effective-property-path="'+CSS.escape(path)+'"]'),
      'Shipping row '+path,
    );
    row.querySelector('[aria-label^="Property actions"]').click();
    const menu=await waitFor(()=>latest('[data-property-context-menu="true"]'),'composed property menu');
    click(menu,section);
    const focused=await waitFor(()=>latest('[data-focused-property-editor="true"]'),'composed '+section);
    return{workspace,row,focused};
  };
  const reviewLayer=async(focused)=>{
    await pause();
    focused=latest('[data-focused-property-editor="true"]')??focused;
    click(focused,'Review changes');
    await pause();
    const review=[...document.querySelectorAll('dialog[open] [aria-label="Review changes"]')].at(-1)
      ??latest('[aria-label="Review changes"]');
    if(!review)throw new Error('Review changes layer unavailable '+JSON.stringify({
      focusedConnected:focused.isConnected,
      focusedButtons:buttons(focused).map(({textContent})=>textContent.trim()),
      modalButtons:buttons(document.querySelector(':modal')).map(({textContent})=>textContent.trim()),
      reviewLabels:[...document.querySelectorAll('[aria-label="Review changes"]')].map((candidate)=>({
        connected:candidate.isConnected,
        modal:Boolean(candidate.closest(':modal')),
        text:candidate.textContent.slice(0,160),
      })),
      focusedLayers:[...document.querySelectorAll('[data-focused-property-editor="true"]')].map((candidate)=>({
        modal:Boolean(candidate.closest(':modal')),
        hidden:Boolean(candidate.closest('[hidden]')),
        text:candidate.textContent.slice(0,160),
      })),
      feedback:document.querySelector('[aria-label="Canonical command result"]')?.textContent,
    }));
    return review;
  };
  const confirmCanonical=async(focused,before)=>{
    const review=await reviewLayer(focused);
    click(review,'Confirm changes');
    const impact=await waitFor(
      ()=>latest('[aria-label="Property impact review"]')||!document.querySelector(':modal')&&true,
      'canonical confirmation result',
    );
    if(impact!==true)click(impact,'Confirm impact');
    return waitSequence(before);
  };

  await ensureRoot('shippingLabel');
  const literalCases=[
    {allowed:'home, in-store',values:['home','in-store'],rendered:'home, in-store',example:'partner',stored:'partner'},
    {allowed:'"home, in-store"',values:['home, in-store'],rendered:'"home, in-store"',example:'"home, in-store"',stored:'home, in-store'},
    {allowed:'"home, in-store", pickup',values:['home, in-store','pickup'],rendered:'"home, in-store", pickup',example:'"say \\"hello\\""',stored:'say "hello"'},
    {allowed:'""',values:[''],rendered:'""',example:'"C:\\\\Temp"',stored:'C:\\Temp'},
  ];
  const literalResults=[];
  for(const spec of literalCases){
    let {focused}=await openCanonicalSection('shippingLabel','Definition');
    focused=await stageFocused(focused,'[name="ordinaryValue"]',spec.allowed);
    focused=await stageFocused(focused,'[name="exampleMethod"]','custom');
    focused=await stageFocused(focused,'[name="exampleValue"]',spec.example);
    const before=await snapshot();
    const staged=unchanged(before,await snapshot());
    await confirmCanonical(focused,before);
    const node=await profileNode('shippingLabel');
    ({focused}=await openCanonicalSection('shippingLabel','Definition'));
    const rendered=focused.querySelector('[name="ordinaryValue"]').value;
    literalResults.push(
      staged
      &&JSON.stringify(node.allowedValues.map(({value})=>value))===JSON.stringify(spec.values)
      &&node.documentation.example.value===spec.stored
      &&rendered===spec.rendered,
    );
    await closeLayers();
  }
  let {focused:malformedFocused}=await openCanonicalSection('shippingLabel','Definition');
  const malformedBefore=await snapshot();
  malformedFocused=await stageFocused(malformedFocused,'[name="ordinaryValue"]','"unterminated');
  const malformed=malformedFocused.querySelector('[name="ordinaryValue"]');
  const malformedAfter=await snapshot(),malformedRejected=
    malformed.validationMessage.includes('quoted String literal')
    &&unchanged(malformedBefore,malformedAfter);
  await closeLayers();

  const arrayCases=[
    {name:'values',itemType:'number',allowed:'123, 1234',input:'[123, 1234]',expected:[123,1234]},
    {name:'stringValues',itemType:'string',allowed:'"home, in-store", pickup',input:'["home, in-store", "pickup"]',expected:['home, in-store','pickup']},
    {name:'objectValues',itemType:'object',input:'[{"method":"home"}, {"method":"in-store"}]',expected:[{method:'home'},{method:'in-store'}]},
  ];
  const arrayResults=[];
  for(const spec of arrayCases){
    await ensureRoot(spec.name);
    let {focused}=await openCanonicalSection(spec.name,'Definition');
    focused=await stageFocused(focused,'[name="propertyType"]','array');
    focused=await stageFocused(focused,'[name="itemType"]',spec.itemType);
    if(spec.allowed!==undefined)focused=await stageFocused(focused,'[name="itemAllowedValues"]',spec.allowed);
    focused=await stageFocused(focused,'[name="exampleMethod"]','custom');
    focused=await stageFocused(focused,'[name="exampleValue"]',spec.input);
    const before=await snapshot(),staged=unchanged(before,await snapshot());
    await confirmCanonical(focused,before);
    const node=await profileNode(spec.name);
    arrayResults.push(
      staged
      &&node.type==='array'
      &&node.itemSchema?.type===spec.itemType
      &&JSON.stringify(node.documentation.example.value)===JSON.stringify(spec.expected)
      &&(spec.allowed===undefined||JSON.stringify(node.itemSchema.allowedValues)===JSON.stringify(spec.expected)),
    );
  }
  let {focused:invalidArrayFocused}=await openComposedSection('/values','Definition');
  invalidArrayFocused=await stageFocused(invalidArrayFocused,'[name="exampleMethod"]','custom');
  const invalidArrayInput=invalidArrayFocused.querySelector('[name="exampleValue"]'),invalidArrayBefore=await snapshot();
  fire(invalidArrayInput,'[123, "1234"]');
  const inputDiagnostic=invalidArrayFocused.querySelector('[aria-label="Custom example diagnostic"]')?.textContent;
  const invalidArrayStaged=unchanged(invalidArrayBefore,await snapshot());
  let invalidReview=await reviewLayer(invalidArrayFocused),invalidConfirm=click(invalidReview,'Confirm changes');
  await pause();
  invalidReview=latest('[aria-label="Review changes"]');
  const invalidArrayAfter=await snapshot(),invalidArrayRejected=
    inputDiagnostic.includes('Item 2: Expected Number')
    &&invalidArrayStaged
    &&invalidReview.querySelector('[role="alert"]')?.textContent.includes('Item 2: Expected Number')
    &&unchanged(invalidArrayBefore,invalidArrayAfter)
    &&invalidConfirm.isConnected===false;
  await closeLayers();

  const reviewGeometry=(review)=>{
    const dialog=review.closest('dialog');
    const layers=[...dialog.querySelectorAll('[data-schema-overlay-layer]')];
    const control=buttons(review).find(({textContent})=>textContent.trim()==='Confirm changes'),box=control.getBoundingClientRect();
    control.focus({preventScroll:true});
    const center=document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
    return{
      layers:layers.length===3&&layers.at(-1)===review,
      enabled:!control.disabled,
      viewport:box.top>=0&&box.left>=0&&box.bottom<=innerHeight&&box.right<=innerWidth,
      keyboard:document.activeElement===control,
      pointer:center===control||control.contains(center),
      control,
      layerCount:layers.length,
      layerLabels:layers.map((layer)=>layer.getAttribute('aria-label')),
    };
  };
  const operableGeometry=({layers,enabled,viewport,keyboard,pointer})=>
    layers&&enabled&&viewport&&keyboard&&pointer;
  let {focused:definitionFocused}=await openCanonicalSection('shippingLabel','Definition');
  definitionFocused=await stageFocused(definitionFocused,'[name="description"]','Presented shipping options');
  const definitionBefore=await snapshot(),definitionReview=await reviewLayer(definitionFocused),definitionGeometry=reviewGeometry(definitionReview);
  const definitionInventory=definitionReview.textContent.includes('Edited documentation')&&definitionReview.textContent.includes('Prospective effective result');
  definitionGeometry.control.click();
  const definitionAfter=await waitSequence(definitionBefore),definitionClosed=!document.querySelector(':modal [data-focused-property-editor="true"]');
  const definitionSaved=(await profileNode('shippingLabel')).documentation.description==='Presented shipping options';

  let {focused:structureFocused}=await openComposedSection('/shippingRoot','Structure');
  fire(structureFocused.querySelector('[name="newStructureName"]'),'shipping_method');
  click(structureFocused,'Add child');
  await pause();
  structureFocused=latest('[data-focused-property-editor="true"]');
  const structureBefore=await snapshot(),structureReview=await reviewLayer(structureFocused),structureGeometry=reviewGeometry(structureReview);
  const structureInventory=structureReview.textContent.includes('add-child')&&structureReview.textContent.includes('prospective structural result');
  structureGeometry.control.click();
  const structureAfter=await waitSequence(structureBefore),structureClosed=!document.querySelector(':modal [data-focused-property-editor="true"]');
  const structurePersisted=(await repository.loadProject(projectId)).state.project.collections.pages
    .find(({name})=>name==='Shipping').localSchemaContributions.some(({path})=>path==='/shippingRoot/shipping_method');
  const focusedReview=
    operableGeometry(definitionGeometry)
    &&definitionInventory&&definitionAfter.sequence===definitionBefore.sequence+1&&definitionSaved&&definitionClosed
    &&operableGeometry(structureGeometry)
    &&structureInventory&&structureAfter.sequence===structureBefore.sequence+1&&structurePersisted&&structureClosed;

  const ruleCases=[
    {kind:'presence',field:'newRulePresence',value:'required',clear:'newRuleName',diagnostic:'Enter a rule name'},
    {kind:'allowed-values',field:'newRuleOrdinaryValue',value:'home, pickup',diagnostic:'Enter at least one allowed value'},
    {kind:'pattern',field:'newRulePattern',value:'^home$',diagnostic:'Enter a regular expression'},
    {kind:'range',field:'newRuleMinimum',value:'1',diagnostic:'Enter a minimum or maximum'},
    {kind:'cardinality',field:'newRuleMinItems',value:'1',diagnostic:'Enter minimum or maximum items'},
  ];
  const exerciseRules=async(openRules,propertyName)=>{
    let focused=await openRules(),before=await snapshot(),results=[];
    for(const spec of ruleCases){
      click(focused,'Add rule');
      let panel=await waitFor(()=>latest('[aria-label="Add rule editor"]'),'Add rule editor');
      fire(panel.querySelector('[name="ruleKind"]'),spec.kind);
      const add=buttons(panel.querySelector('[aria-label="Rule actions"]')).find(({textContent})=>textContent.trim()==='Add rule'),identity=add,initiallyDisabled=add.disabled;
      fire(panel.querySelector('[name="newRuleName"]'),'Shipping '+spec.kind);
      fire(panel.querySelector('[name="'+spec.field+'"]'),spec.value);
      click(panel,'Add condition');
      const property=panel.querySelector('[aria-label="Condition property"]');
      property.focus();fire(property,propertyName);await pause();
      const option=[...panel.querySelectorAll('[role="option"]')].find(({textContent})=>textContent.trim()===propertyName);
      if(!option)throw new Error('Missing condition property '+propertyName);
      option.click();
      fire(panel.querySelector('[aria-label="Type-valid operator"]'),'Exists');
      await pause();
      const conditionIds=[...panel.querySelectorAll('[data-condition-id]')].map(({dataset})=>dataset.conditionId),requiredName=spec.clear??spec.field,required=panel.querySelector('[name="'+requiredName+'"]'),complete=!add.disabled;
      const retainedControls=[...panel.querySelectorAll('input,select')]
        .filter(({name})=>name!==requiredName)
        .map(({name,value})=>[name,value]);
      fire(required,'');
      const disabled=add.disabled&&panel.querySelector('[role="status"]').textContent===spec.diagnostic;
      fire(required,spec.clear?'Shipping '+spec.kind:spec.value);
      const retained=
        add===identity&&!add.disabled
        &&JSON.stringify(conditionIds)===JSON.stringify([...panel.querySelectorAll('[data-condition-id]')].map(({dataset})=>dataset.conditionId))
        &&JSON.stringify(retainedControls)===JSON.stringify([...panel.querySelectorAll('input,select')]
          .filter(({name})=>name!==requiredName)
          .map(({name,value})=>[name,value]));
      add.click();
      await pause();
      focused=latest('[data-focused-property-editor="true"]');
      results.push(initiallyDisabled&&complete&&disabled&&retained);
    }
    const stagedRules=focused.querySelectorAll('[data-rule-id][data-ownership="local"]').length>=ruleCases.length,after=await snapshot(),noWrites=unchanged(before,after);
    await closeLayers();
    return results.every(Boolean)&&stagedRules&&noWrites;
  };
  const canonicalRules=await exerciseRules(
    async()=>{const opened=await openCanonicalSection('shippingLabel','Rules');return opened.focused;},
    'shippingLabel',
  );
  const composedRules=await exerciseRules(
    async()=>{const opened=await openComposedSection('/shippingRoot','Rules');return opened.focused;},
    'shippingRoot',
  );

  return{
    authoring064:literalResults.every(Boolean)&&malformedRejected,
    authoring065:arrayResults.every(Boolean)&&invalidArrayRejected,
    authoring066:focusedReview,
    authoring067:canonicalRules&&composedRules,
  };
})()`;
