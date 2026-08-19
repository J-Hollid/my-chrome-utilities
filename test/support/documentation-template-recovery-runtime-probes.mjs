export function failedSavedWorkbookSeedExpression(){
  return `(async()=>{
    const repository=await (await import('/data-layer-durable-project-repository.js')).openIndexedDbProjectRepository();
    const renderer=await import('/documentation-templates/excel-renderer.js');
    const projectId=await repository.activeProjectId();
    const book=new ExcelJS.Workbook();
    await book.xlsx.load(await renderer.writeDocumentationTemplateStarter('flow'));
    book.getWorksheet('Template').getCell('A1').value={formula:'1+1'};
    const bytes=new Uint8Array(await book.xlsx.writeBuffer());
    const body=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const bodyDigest='sha256:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join('');
    await repository.storeDocumentationTemplateBody(projectId,bodyDigest,body);
    const database=await new Promise((resolve,reject)=>{const request=indexedDB.open('my-chrome-utilities.project-repository');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    const transaction=database.transaction(['projectRoots'],'readwrite'),store=transaction.objectStore('projectRoots');
    const root=await new Promise((resolve,reject)=>{const request=store.get(projectId);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    const id='documentation-template:failed-saved-workbook',sourceSet=root.project.documentation.sets[0];
    root.project.documentation.templates.push({id,name:'Failed saved flow workbook',format:'excel',kind:'flow',contractVersion:2,digest:'sha256:'+'e'.repeat(64),body:{assetId:'documentation-template-body:failed-saved-workbook',digest:bodyDigest,byteLength:body.size},validation:{valid:true,findings:[]}});
    sourceSet.templateAssignments={...(sourceSet.templateAssignments||{}),'excel:flow':id};
    store.put(root,projectId);
    await new Promise((resolve,reject)=>{transaction.oncomplete=resolve;transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error);});
    database.close();
    return{id,bodyDigest};
  })()`;
}

export function failedSavedWorkbookProbeExpression(){
  return `(async()=>{
    const pause=(ms=40)=>new Promise(resolve=>setTimeout(resolve,ms));
    const all=(selector,root=document)=>root?[...root.querySelectorAll(selector)]:[];
    const button=(text,root=document)=>all('button',root).find(item=>item.textContent.trim()===text);
    const waitFor=async read=>{for(let attempt=0;attempt<180;attempt+=1){const value=await read();if(value)return value;await pause();}};
    const repository=await (await import('/data-layer-durable-project-repository.js')).openIndexedDbProjectRepository();
    await waitFor(()=>document.querySelector('#project-tree'));
    document.querySelector('#project-tree button[data-kind="documentation"]')?.click();
    const workspace=await waitFor(()=>document.querySelector('[aria-label="Project Documentation workspace"]'));
    button('Build',workspace)?.click();await pause();button('Templates',workspace)?.click();
    const library=await waitFor(()=>document.querySelector('[aria-label="Documentation Template Library"]'));
    const select=all('button',library).find(item=>item.textContent.includes('Failed saved flow workbook'));
    select?.click();
    const detail=await waitFor(()=>{const value=document.querySelector('[aria-label="Selected template detail"]');return value?.textContent.includes('Failed saved flow workbook')&&value;});
    const projectId=await repository.activeProjectId(),before=await repository.loadProject(projectId),template=before.state.project.documentation.templates.find(item=>item.id==='documentation-template:failed-saved-workbook');
    const beforeBody=new Uint8Array(await (await repository.loadDocumentationTemplateBody(projectId,template.body.digest)).arrayBuffer());
    const beforePreview=document.querySelector('[aria-label="Preview freshness"]')?.textContent??'';
    button('Revalidate saved workbook',detail)?.click();
    const findings=await waitFor(()=>detail.querySelector('[aria-label="Current workbook findings"] [aria-label="Excel template findings"]'));
    const after=await repository.loadProject(projectId),afterTemplate=after.state.project.documentation.templates.find(item=>item.id===template.id),afterBody=new Uint8Array(await (await repository.loadDocumentationTemplateBody(projectId,template.body.digest)).arrayBuffer());
    const controls=['Revalidate saved workbook','Assign Built-in','Remove template'].every(label=>Boolean(button(label,detail)))&&Boolean(detail.querySelector('[aria-label="Replace workbook"]'));
    const unchanged=JSON.stringify(afterTemplate)===JSON.stringify(template)&&JSON.stringify(after.state.project.documentation.sets.map(item=>item.templateAssignments))===JSON.stringify(before.state.project.documentation.sets.map(item=>item.templateAssignments))&&after.draftSequence===before.draftSequence&&JSON.stringify([...afterBody])===JSON.stringify([...beforeBody])&&(document.querySelector('[aria-label="Preview freshness"]')?.textContent??'')===beforePreview;
    return{passed:Boolean(findings&&controls&&unchanged),controls,unchanged,findings:findings?.textContent??'',beforeSequence:before.draftSequence,afterSequence:after.draftSequence};
  })()`;
}

export function invalidTemplateTransitionProbeExpression(){
  return `(async()=>{
    const pause=(ms=50)=>new Promise(resolve=>setTimeout(resolve,ms));
    const all=(selector,root=document)=>root?[...root.querySelectorAll(selector)]:[];
    const button=(text,root=document)=>all('button',root).find(item=>item.textContent.trim()===text);
    const waitFor=async read=>{for(let attempt=0;attempt<180;attempt+=1){const value=await read();if(value)return value;await pause();}};
    const setFile=(input,file)=>{const transfer=new DataTransfer();transfer.items.add(file);Object.defineProperty(input,'files',{configurable:true,value:transfer.files});input.dispatchEvent(new Event('change',{bubbles:true}));};
    const repository=await (await import('/data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),projectId=await repository.activeProjectId(),before=await repository.loadProject(projectId),invalid=before.state.project.documentation.templates.find(item=>item.id==='documentation-template:failed-saved-workbook'),savedBody=await repository.loadDocumentationTemplateBody(projectId,invalid.body.digest),book=new ExcelJS.Workbook();
    await book.xlsx.load(await savedBody.arrayBuffer());book.getWorksheet('Template').getCell('E1').value='Distinct rejected transition';const bytes=new Uint8Array(await book.xlsx.writeBuffer()),digest='sha256:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join(''),file=new File([bytes],'distinct-invalid-flow.xlsx',{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),same=loaded=>loaded.draftSequence===before.draftSequence&&JSON.stringify(loaded.state.project.documentation)===JSON.stringify(before.state.project.documentation);
    const workspace=document.querySelector('[aria-label="Project Documentation workspace"]');button('Build',workspace)?.click();await pause();let library=document.querySelector('[aria-label="Documentation Template Library"]');if(!library){button('Templates',workspace)?.click();library=await waitFor(()=>document.querySelector('[aria-label="Documentation Template Library"]'));}
    const flowGroup=()=>all('[aria-label="Template list"] > section',document).find(item=>item.querySelector('h3')?.textContent==='Excel · Flow');setFile(flowGroup().querySelector('[aria-label="Select Excel template for Flow"]'),file);const uploadFinding=await waitFor(()=>document.querySelector('[aria-label="Selected template detail"] [aria-label="Excel template findings"]')),afterUpload=await repository.loadProject(projectId),uploadBodyAbsent=await repository.loadDocumentationTemplateBody(projectId,digest).then(()=>false,()=>true),upload=Boolean(uploadFinding&&same(afterUpload)&&uploadBodyAbsent);
    all('button',library).find(item=>item.textContent.includes('Failed saved flow workbook'))?.click();let detail=await waitFor(()=>{const value=document.querySelector('[aria-label="Selected template detail"]');return value?.textContent.includes('Failed saved flow workbook')&&value;});setFile(detail.querySelector('[aria-label="Replace workbook"]'),file);const replacementFinding=await waitFor(()=>detail.querySelector('[aria-label="Current workbook findings"] [aria-label="Excel template findings"]')),afterReplacement=await repository.loadProject(projectId),replacement=Boolean(replacementFinding&&same(afterReplacement)&&button('Assign Built-in',detail)&&button('Revalidate saved workbook',detail)&&detail.querySelector('[aria-label="Replace workbook"]'));
    const setPicker=workspace.querySelector('[aria-label="Documentation Set"]'),companion=[...setPicker.options].find(option=>option.textContent==='Recovery companion');setPicker.value=companion.value;setPicker.dispatchEvent(new Event('change',{bubbles:true}));await pause();library=await waitFor(()=>document.querySelector('[aria-label="Documentation Template Library"]'));const assignment=library.querySelector('[aria-label="Flow excel template assignment"]');assignment.value=invalid.id;assignment.dispatchEvent(new Event('change',{bubbles:true}));await pause(800);const afterAssignment=await repository.loadProject(projectId),assignmentRejected=same(afterAssignment)&&afterAssignment.state.project.documentation.sets.find(item=>item.id===companion.value)?.templateAssignments?.['excel:flow']!==invalid.id;
    return{passed:Boolean(upload&&replacement&&assignmentRejected),upload,replacement,assignmentRejected,uploadBodyAbsent,beforeSequence:before.draftSequence,afterSequence:afterAssignment.draftSequence};
  })()`;
}
