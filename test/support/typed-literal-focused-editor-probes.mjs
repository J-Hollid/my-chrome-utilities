export const typedLiteralFocusedEditorExpression=String.raw`(async()=>{
  const pause=()=>new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const fire=(control,value)=>{
    control.value=String(value);
    control.dispatchEvent(new Event('input',{bubbles:true}));
    control.dispatchEvent(new Event('change',{bubbles:true}));
  };
  const buttons=(root)=>[...(root?.querySelectorAll('button')??[])];
  const [
    {schemaTableAllowedValues,schemaTableStageAllowedValues},
    {typedCanonicalValue},
    {canonicalJsonSchemaDocument},
    {validateLayeredObservation},
    {mountComposedSchemaWorkspace},
    {renderCanonicalRuleAddPanel},
  ]=await Promise.all([
    import('/data-layer-schema-table.js'),
    import('/data-layer-canonical-schema-facets.js'),
    import('/data-layer-canonical-array-items.js'),
    import('/layered-schema/validation.js'),
    import('/data-layer-composed-schema-workspace-ui.js'),
    import('/data-layer-canonical-schema-focused-rule-add.js'),
  ]);

  const literalCases=[
    ['home, in-store',['home','in-store'],'home, in-store'],
    ['"home, in-store"',['home, in-store'],'"home, in-store"'],
    ['"home, in-store", pickup',['home, in-store','pickup'],'"home, in-store", pickup'],
    ['""',[''],'""'],
    ['"say \\"hello\\"", "C:\\\\Temp"',['say "hello"','C:\\Temp'],'"say \\"hello\\"", "C:\\\\Temp"'],
  ];
  const stringValues=literalCases.every(([input,stored,rendered])=>{
    const values=schemaTableStageAllowedValues([],input,'string');
    return JSON.stringify(values)===JSON.stringify(stored)&&schemaTableAllowedValues({allowedValues:values})===rendered;
  });
  const stringExamples=
    typedCanonicalValue('string','"home, in-store"')==='home, in-store'
    &&typedCanonicalValue('string','"say \\"hello\\""')==='say "hello"'
    &&typedCanonicalValue('string','"C:\\\\Temp"')==='C:\\Temp'
    &&typedCanonicalValue('string','""')==='';

  const numberItems={id:'item:number',type:'number',allowedValues:[123,1234]};
  const stringItems={id:'item:string',type:'string',allowedValues:['home, in-store','pickup']};
  const objectItems={id:'item:object',type:'object'};
  const numberArray=typedCanonicalValue('array','[123, 1234]',numberItems);
  const stringArray=typedCanonicalValue('array','["home, in-store", "pickup"]',stringItems);
  const objectArray=typedCanonicalValue('array','[{"method":"home"}, {"method":"in-store"}]',objectItems);
  let mixedIssue='';
  try{typedCanonicalValue('array','[123, "1234"]',numberItems);}catch(error){mixedIssue=String(error);}
  const property={
    id:'property:values',name:'values',order:0,type:'array',presence:{mode:'optional'},
    itemSchema:numberItems,allowedValues:[],rules:[],
    documentation:{displayText:'',description:'',comments:'',example:{method:'blank'}},
    provenance:[],overrideReferences:[],
  };
  const exported=canonicalJsonSchemaDocument({nodes:{[property.id]:property}});
  const validation=validateLayeredObservation(
    {targetId:'target:values',targetName:'Values',revision:1,compiled:{
      status:'ready',conflicts:[],provenance:[],exclusions:[],
      properties:{'/values':{path:'/values',type:'array',itemSchema:numberItems,origins:[],superseded:[]}},
    }},
    {values:[123,7]},
  );
  const arrays=
    JSON.stringify(numberArray)==='[123,1234]'
    &&JSON.stringify(stringArray)==='["home, in-store","pickup"]'
    &&JSON.stringify(objectArray)==='[{"method":"home"},{"method":"in-store"}]'
    &&mixedIssue.includes('Item 2: Expected Number')
    &&JSON.stringify(exported.properties?.values?.items?.enum)==='[123,1234]'
    &&validation.issues.some(({path,code})=>path==='/values/1'&&code==='ALLOWED_VALUE');

  const reviewCase=async(sectionName)=>{
    let saves=0,savedStructure=[];
    const host=document.createElement('section');
    document.body.append(host);
    const constraint={path:'/shippingLabel',type:'string',presence:'optional',documentation:'',allowedValues:[],rules:[]};
    const row={
      path:'/shippingLabel',local:{path:'/shippingLabel'},effective:constraint,
      source:'Local',validationState:'valid',message:'Ready',provenance:[],repairs:[],
    };
    mountComposedSchemaWorkspace({
      host,
      model:{heading:'Focused review probe',status:'ready',conflictSummary:'none',rows:[row]},
      effectiveText:({effective})=>JSON.stringify(effective),
      onSave:(_row,_facets,structure)=>{saves+=1;savedStructure=[...(structure??[])];},
      onReset:()=>{},
      onStructure:()=>{},
    });
    host.querySelector('[aria-label^="Property actions"]').click();
    await pause();
    const menu=document.querySelector(':modal [data-property-context-menu="true"]');
    buttons(menu).find(({textContent})=>textContent.trim()===sectionName).click();
    await pause();
    const focused=document.querySelector(':modal [data-focused-property-editor="true"]');
    if(sectionName==='Definition')fire(focused.querySelector('[name="description"]'),'Presented shipping options');
    else{
      fire(focused.querySelector('[name="newStructureName"]'),'shipping_method');
      buttons(focused).find(({textContent})=>textContent.trim()==='Add child').click();
      await pause();
    }
    const before=saves===0;
    buttons(document.querySelector(':modal [data-focused-property-editor="true"]'))
      .find(({textContent})=>textContent.trim()==='Review changes').click();
    await pause();
    const dialog=document.querySelector(':modal');
    const layers=[...dialog.querySelectorAll('[data-schema-overlay-layer]')];
    const review=dialog.querySelector('[aria-label="Review changes"]');
    const confirm=buttons(review).find(({textContent})=>textContent.trim()==='Confirm changes');
    const box=confirm.getBoundingClientRect();
    const viewport=box.top>=0&&box.left>=0&&box.bottom<=innerHeight&&box.right<=innerWidth;
    confirm.focus({preventScroll:true});
    const keyboard=document.activeElement===confirm;
    const center=document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
    const pointer=center===confirm||confirm.contains(center);
    const change=sectionName==='Definition'
      ?review.textContent.includes('Presented shipping options')
      :review.textContent.includes('shippingLabel')&&review.textContent.includes('add-child');
    confirm.click();
    await pause();
    const saved=saves===1
      &&(sectionName==='Definition'||savedStructure.length===1&&savedStructure[0].name==='shipping_method');
    const closed=!document.querySelector(':modal [data-focused-property-editor="true"]');
    host.remove();
    return before&&layers.length===3&&layers.at(-1)===review&&!confirm.disabled&&viewport&&keyboard&&pointer&&change&&saved&&closed;
  };
  const focusedReview=await reviewCase('Definition')&&await reviewCase('Structure');

  const ruleCases=[
    {kind:'presence',field:'newRulePresence',value:'required',diagnostic:'Enter a rule name',clear:'newRuleName'},
    {kind:'value',field:'newRuleOrdinaryValue',value:'home, pickup',diagnostic:'Enter at least one allowed value'},
    {kind:'pattern',field:'newRulePattern',value:'^home$',diagnostic:'Enter a regular expression'},
    {kind:'range',field:'newRuleMinimum',value:'1',diagnostic:'Enter a minimum or maximum'},
    {kind:'cardinality',field:'newRuleMinItems',value:'1',diagnostic:'Enter minimum or maximum items'},
  ];
  const ruleResults=[];
  for(const spec of ruleCases){
    let sequence=0,durableWrites=0;
    const working={
      id:'property:customer',name:'lineOfCustomer',order:0,type:'string',
      presence:{mode:'optional'},allowedValues:[],rules:[],
      documentation:{displayText:'',description:'',comments:'',example:{method:'blank'}},
      provenance:[],overrideReferences:[],
    };
    const host=document.createElement('section');
    document.body.append(host);
    renderCanonicalRuleAddPanel(host,{
      dom:document,getWorking:()=>working,
      properties:()=>[{id:'property:customer',name:'lineOfCustomer',type:'string'}],
      id:(kind)=>kind+':'+(++sequence),render:()=>{},feedback:()=>{},
    });
    buttons(host)[0].click();
    fire(host.querySelector('[name="ruleKind"]'),spec.kind);
    const add=buttons(host.querySelector('[aria-label="Rule actions"]'))
      .find(({textContent})=>textContent.trim()==='Add rule');
    const initiallyDisabled=add.disabled;
    fire(host.querySelector('[name="newRuleName"]'),'Shipping '+spec.kind);
    fire(host.querySelector('[name="'+spec.field+'"]'),spec.value);
    const property=host.querySelector('[aria-label="Condition property"]');
    fire(property,'lineOfCustomer');
    await pause();
    [...host.querySelectorAll('[role="option"]')]
      .find(({textContent})=>textContent.trim()==='lineOfCustomer').click();
    fire(host.querySelector('[aria-label="Type-valid operator"]'),'Exists');
    await pause();
    const identity=add;
    const conditionIds=[...host.querySelectorAll('[data-condition-id]')].map(({dataset})=>dataset.conditionId);
    const otherValues=[...host.querySelectorAll('input,select')]
      .filter((control)=>control.name!==spec.field&&control.name!==(spec.clear??spec.field))
      .map((control)=>[control.name,control.value]);
    const complete=!add.disabled;
    const required=host.querySelector('[name="'+(spec.clear??spec.field)+'"]');
    fire(required,'');
    const disabled=add.disabled&&host.querySelector('[role="status"]').textContent===spec.diagnostic;
    fire(required,spec.clear?'Shipping '+spec.kind:spec.value);
    const retained=
      add===identity&&!add.disabled
      &&JSON.stringify(conditionIds)===JSON.stringify([...host.querySelectorAll('[data-condition-id]')].map(({dataset})=>dataset.conditionId))
      &&JSON.stringify(otherValues)===JSON.stringify([...host.querySelectorAll('input,select')]
        .filter((control)=>control.name!==spec.field&&control.name!==(spec.clear??spec.field))
        .map((control)=>[control.name,control.value]));
    add.click();
    ruleResults.push(initiallyDisabled&&complete&&disabled&&retained&&working.rules.length===1&&durableWrites===0);
    host.remove();
  }
  return{
    authoring064:stringValues&&stringExamples,
    authoring065:arrays,
    authoring066:focusedReview,
    authoring067:ruleResults.every(Boolean),
  };
})()`;
