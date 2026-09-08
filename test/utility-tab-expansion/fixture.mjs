import { cp, mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

export async function prepareProbeExtension({hosted=true}={}) {
  await mkdir('tmp',{recursive:true});
  const extensionRoot=await mkdtemp(path.resolve('tmp/utility-probe-extension-'));
  try {
    await cp('dist',extensionRoot,{recursive:true});
    for(const file of ['probe.html','probe.css','probe.mjs'])await cp('test/utility-tab-expansion/'+file,path.join(extensionRoot,file));
    if(hosted){
      const {installObservationTarget}=await import('../project-observation-sources/browser/installed.mjs');
      await writeFile(path.join(extensionRoot,'probe-target.js'),`(${installObservationTarget.toString()})();
        const startup=localStorage.getItem('probe.startup');
        if(startup==='failed')indexedDB.open=()=>globalThis.probeStorageRequest={error:new Error('Controlled Data Layer storage failure')};
        if(startup==='waiting')indexedDB.open=()=>({addEventListener(){}});`);
      const html=await readFile(path.join(extensionRoot,'side-panel.html'),'utf8');
      await writeFile(path.join(extensionRoot,'side-panel.html'),html.replace('<head>','<head><script src="probe-target.js"></script>'));
      await writeFile(path.join(extensionRoot,'utility-contributions/index.js'),`export const utilityPageContributions=[{id:'probe',label:'Probe',page:'probe.html',storage:{namespace:'utility.probe.state',version:1}}];\n`);
    }
    return {extensionRoot,dispose:()=>rm(extensionRoot,{recursive:true,force:true})};
  } catch(error){await rm(extensionRoot,{recursive:true,force:true});throw error;}
}
