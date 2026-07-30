export const stringRuleValidationExpression=String.raw`(async()=>{
  const pause=(ms=35)=>new Promise((resolve)=>setTimeout(resolve,ms));
  const buttons=(root)=>[...root.querySelectorAll("button")];
  const set=(control,value)=>{control.value=String(value);control.dispatchEvent(new Event("input",{bubbles:true}));control.dispatchEvent(new Event("change",{bubbles:true}));};
  const [
    {renderCanonicalRuleAddPanel},
    {renderCanonicalRuleRows},
    {renderSharedConditionTree},
    {compileLayeredSchema,validateLayeredObservation},
    {schemaTableRuleOutcomeSummary},
    {openIndexedDbProjectRepository},
  ]=await Promise.all([
    import("/data-layer-canonical-schema-focused-rule-add.js"),
    import("/data-layer-canonical-schema-focused-rule-rows.js"),
    import("/data-layer-shared-condition-tree-editor.js"),
    import("/data-layer-layered-schema.js"),
    import("/data-layer-schema-table.js"),
    import("/data-layer-durable-project-repository.js"),
  ]);
  let serial=0;
  const property=(type="string",rules=[])=>({id:"property:string-rule",name:"checkout.customer.contact.preferred_delivery_channel",order:0,type,presence:{mode:"optional"},allowedValues:[],rules:structuredClone(rules),documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}},provenance:[{source:"created"}],overrideReferences:[]});
  const properties=[
    {id:"property:delivery-channel",name:"checkout.customer.contact.preferred_delivery_channel",type:"string"},
    {id:"property:delivery-window",name:"checkout.customer.contact.preferred_delivery_window",type:"string"},
  ];
  const mountAdd=(type="string")=>{
    const host=document.createElement("section"),working=property(type);document.body.append(host);
    renderCanonicalRuleAddPanel(host,{dom:document,getWorking:()=>working,properties:()=>properties,id:(kind)=>kind+":"+(++serial),render:()=>{},feedback:()=>{}});
    buttons(host).find(({textContent})=>textContent.trim()==="Add rule").click();
    return{host,working,panel:host.querySelector('[data-rule-editor-mode="add"]')};
  };
  const literalCases=[
    {kind:"starts-with",label:"Starts with",literal:"order-",passing:"order-123",failing:"pre-order-123",summary:"start with order-",code:"STARTS_WITH"},
    {kind:"ends-with",label:"Ends with",literal:".com",passing:"shop.example.com",failing:"shop.example.com.au",summary:"end with .com",code:"ENDS_WITH"},
    {kind:"includes",label:"Includes",literal:"sale",passing:"wholesale-item",failing:"premium-item",summary:"include sale",code:"INCLUDES"},
  ];
  const literalFlows=[];
  for(const example of literalCases){
    const mounted=mountAdd(),selector=mounted.panel.querySelector('[name="ruleKind"]'),optionLabels=[...selector.options].map(({textContent})=>textContent.trim());
    set(selector,example.kind);set(mounted.panel.querySelector('[name="newRuleName"]'),"Named "+example.label);set(mounted.panel.querySelector('[name="newRuleLiteral"]'),example.literal);
    const add=buttons(mounted.panel).find(({textContent})=>textContent.trim()==="Add rule"),enabled=!add.disabled;add.click();
    const stored=mounted.working.rules[0],reloaded=JSON.parse(JSON.stringify(stored)),compiled=compileLayeredSchema([{id:"profile:string-runtime",name:"String runtime",scope:"Shared Profile",constraints:[{path:"/value",type:"string",rules:[reloaded]}]}],{eventId:"event:string-runtime",eventRole:"interaction"}),passing=validateLayeredObservation({targetId:"target:string-runtime",targetName:"String runtime",revision:1,compiled},{value:example.passing}),failing=validateLayeredObservation({targetId:"target:string-runtime",targetName:"String runtime",revision:1,compiled},{value:example.failing}),summary=schemaTableRuleOutcomeSummary(stored);
    const rowHost=document.createElement("section");document.body.append(rowHost);renderCanonicalRuleRows(rowHost,{dom:document,getWorking:()=>mounted.working,properties:()=>properties,removedRuleIds:new Set(),invariant:false,id:(kind)=>kind+":"+(++serial),render:()=>{},feedback:()=>{}});buttons(rowHost).find(({textContent})=>textContent.trim()==="Edit").click();const edit=rowHost.querySelector('[data-rule-editor-mode="edit"]'),editRetained=edit.querySelector('[name="editRuleKind"]').selectedOptions[0].textContent.trim()===example.label&&edit.querySelector('[name="editRuleLiteral"]').value===example.literal;
    literalFlows.push({kind:example.kind,options:literalCases.every(({label})=>optionLabels.includes(label)),enabled,stored:stored?.kind===example.kind&&stored?.literal===example.literal,reloaded:reloaded.kind===example.kind&&reloaded.literal===example.literal,compiled:compiled.properties["/value"].rules[0].kind===example.kind,passing:passing.issues.length===0,failing:failing.issues.length===1&&failing.issues[0].code===example.code&&failing.issues[0].message==="Named "+example.label,summary:summary===example.summary,editRetained});
    rowHost.remove();mounted.host.remove();
  }
  const nonString=mountAdd("number"),nonStringOptions=[...nonString.panel.querySelector('[name="ruleKind"]').options].map(({textContent})=>textContent.trim()),nonStringExcluded=literalCases.every(({label})=>!nonStringOptions.includes(label));nonString.host.remove();
  const repository=await openIndexedDbProjectRepository(),projectId=await repository.activeProjectId(),repositoryBefore=await repository.loadProject(projectId),undoBefore=document.querySelector("#undo-project")?.dataset.undoCount;
  const pattern=mountAdd(),patternPanel=pattern.panel;set(patternPanel.querySelector('[name="ruleKind"]'),"pattern");set(patternPanel.querySelector('[name="newRuleName"]'),"Order identifier pattern");const patternInput=patternPanel.querySelector('[name="newRulePattern"]'),tester=patternPanel.querySelector('[data-pattern-tester="true"]'),sample=tester.querySelector('[aria-label="Test value"]'),result=tester.querySelector('[data-pattern-test-result="true"]'),patternAdd=buttons(patternPanel).find(({textContent})=>textContent.trim()==="Add rule");set(patternInput,"^order-[0-9]+$");const beforeTester=JSON.stringify(pattern.working);set(sample,"order-123");const matching=result.textContent==="Matches pattern"&&result.dataset.patternTestTreatment==="valid-green";set(sample,"pre-order-123");const nonMatching=result.textContent==="Does not match pattern"&&result.dataset.patternTestTreatment==="invalid-red"&&!patternAdd.disabled;set(patternInput,"[");const invalid=result.textContent.includes("Invalid regular expression")&&result.dataset.patternTestState==="invalid"&&!result.dataset.patternTestTreatment&&patternAdd.disabled&&patternPanel.querySelector('[role="status"]').textContent.includes("Invalid regular expression"),repositoryAfter=await repository.loadProject(projectId),undoAfter=document.querySelector("#undo-project")?.dataset.undoCount,repositoryBytes=JSON.stringify(repositoryAfter.state.project),transient=JSON.stringify(pattern.working)===beforeTester&&repositoryAfter.draftSequence===repositoryBefore.draftSequence&&repositoryBytes===JSON.stringify(repositoryBefore.state.project)&&undoAfter===undoBefore&&!["testValue","testerResult","testerColour","valid-green","invalid-red"].some((field)=>repositoryBytes.includes(field));set(patternInput,"^order-[0-9]+$");patternAdd.click();
  const patternRows=document.createElement("section");document.body.append(patternRows);renderCanonicalRuleRows(patternRows,{dom:document,getWorking:()=>pattern.working,properties:()=>properties,removedRuleIds:new Set(),invariant:false,id:(kind)=>kind+":"+(++serial),render:()=>{},feedback:()=>{}});buttons(patternRows).find(({textContent})=>textContent.trim()==="Edit").click();const editPattern=patternRows.querySelector('[data-rule-editor-mode="edit"]'),editTester=editPattern.querySelector('[data-pattern-tester="true"]'),editSample=editTester?.querySelector('[aria-label="Test value"]'),editResult=editTester?.querySelector('[data-pattern-test-result="true"]'),editSave=buttons(editPattern).find(({textContent})=>textContent.trim()==="Save rule");set(editSample,"order-123");const editMatch=editResult.textContent==="Matches pattern";set(editPattern.querySelector('[name="editRulePattern"]'),"[");const editInvalid=editResult.textContent.includes("Invalid regular expression")&&editSave.disabled;patternRows.remove();pattern.host.remove();
  const pickerRun=async(mode)=>{
    const editor=document.createElement("fieldset"),host=document.createElement("div");editor.dataset.ruleEditorMode="add";editor.style.cssText="position:fixed;left:100px;top:100px;width:640px;";editor.append(host);document.body.append(editor);let selected;
    renderSharedConditionTree(host,{dom:document,allowEmpty:true,properties:()=>properties,id:(kind)=>kind+":"+(++serial),onChange:(condition)=>{selected=condition;}});
    buttons(host).find(({textContent})=>textContent.trim()==="Add condition").click();const input=host.querySelector('[aria-label="Condition property"]');input.focus();set(input,"checkout.customer.contact.preferred_delivery_");await pause(100);const listbox=editor.querySelector('[role="listbox"]'),options=[...listbox.querySelectorAll('[role="option"]')],fieldRect=input.getBoundingClientRect(),listRect=listbox.getBoundingClientRect(),styles=options.map((option)=>getComputedStyle(option)),lineCounts=options.map((option)=>{const range=document.createRange();range.selectNodeContents(option);return new Set([...range.getClientRects()].filter(({width})=>width>0).map(({top})=>Math.round(top))).size;}),complete=options.map(({textContent})=>textContent.trim()).join("|")===properties.map(({name})=>name).join("|"),wide=listRect.width>fieldRect.width+1&&listRect.right<=Math.min(innerWidth,editor.getBoundingClientRect().right)+1,oneLine=lineCounts.every((count)=>count===1),unclipped=styles.every((style)=>style.textOverflow==="clip"&&style.overflowX==="visible"&&["normal","nowrap"].includes(style.whiteSpace))&&listbox.scrollWidth<=listbox.clientWidth+1;
    if(mode==="pointer")options.find(({dataset})=>dataset.propertyId==="property:delivery-window").click();else{input.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",bubbles:true,cancelable:true}));input.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",bubbles:true,cancelable:true}));input.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));}
    await pause();set(host.querySelector('[aria-label="Type-valid operator"]'),"Exists");const identity=selected?.children?.[0]?.propertyId==="property:delivery-window",visible=input.value===properties[1].name,geometry={fieldWidth:fieldRect.width,listWidth:listRect.width,lineCounts,optionWidths:options.map((option)=>option.getBoundingClientRect().width),listClientWidth:listbox.clientWidth,listScrollWidth:listbox.scrollWidth};editor.remove();return{complete,wide,oneLine,unclipped,identity,visible,geometry};
  };
  const pointerPicker=await pickerRun("pointer"),keyboardPicker=await pickerRun("keyboard");
  const authoring070=literalFlows.length===3&&literalFlows.every((flow)=>Object.values(flow).every(Boolean))&&nonStringExcluded;
  const authoring071=Boolean(tester&&tester.previousElementSibling===patternInput.closest("label")&&matching&&nonMatching&&transient&&editTester&&editMatch);
  const authoring072=Boolean(invalid&&editInvalid);
  const authoring073=[pointerPicker,keyboardPicker].every(({geometry,...flow})=>Object.values(flow).every(Boolean));
  return{authoring070,authoring071,authoring072,authoring073,literalFlows,nonStringExcluded,matching,nonMatching,transient,invalid,editMatch,editInvalid,pointerPicker,keyboardPicker};
})()`;
