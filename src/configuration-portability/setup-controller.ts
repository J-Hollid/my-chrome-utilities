import {createCompleteConfigurationArchive,inspectCompleteConfigurationArchive,
  COMPLETE_CONFIGURATION_EXCLUSIONS} from "./archive-format.js";
import {stageCompleteConfigurationSetup,type CompleteConfigurationRepository,
  type ConfigurationConflictPolicy} from "./configuration-repository.js";
import {inspectConfigurationImportRoute} from "./format-router.js";
import {inspectLegacyRepositoryRecovery} from "./legacy-recovery.js";
import type {CompleteConfigurationSnapshot} from "./domain-inventory.js";

export interface CompleteConfigurationPort extends CompleteConfigurationRepository {
  buildIdentity:string;
}

const element=<T extends Element>(root:ParentNode,selector:string):T=>{
  const found=root.querySelector<T>(selector);
  if(!found)throw new Error(`Missing complete configuration control ${selector}`);
  return found;
};

function downloadArchive(archive:Blob):void{
  const link=document.createElement("a");
  link.href=URL.createObjectURL(archive);
  link.download="my-chrome-utilities-complete-configuration.zip";
  link.click();URL.revokeObjectURL(link.href);
}

export function mountCompleteConfigurationSetup(root:ParentNode,port:CompleteConfigurationPort,routes:{
  project?:(file:File)=>Promise<void>;
  schemaLibrary?:(file:File)=>Promise<void>;
}={}):()=>void{
  const exportButton=element<HTMLButtonElement>(root,"#export-complete-configuration");
  const cancelExport=element<HTMLButtonElement>(root,"#cancel-complete-configuration-export");
  const importButton=element<HTMLButtonElement>(root,"#import-complete-configuration");
  const file=element<HTMLInputElement>(root,"#import-complete-configuration-file");
  const dialog=element<HTMLDialogElement>(root,"#complete-configuration-review");
  const summary=element<HTMLElement>(root,"#complete-configuration-review-summary");
  const policy=element<HTMLSelectElement>(root,"#complete-configuration-conflict-policy");
  const setup=element<HTMLButtonElement>(root,"#setup-from-configuration");
  const cancel=element<HTMLButtonElement>(root,"#cancel-configuration-setup");
  const status=element<HTMLOutputElement>(root,"#complete-configuration-status");
  const exportPreview=element<HTMLElement>(root,"#complete-configuration-export-preview");
  let staged:Awaited<ReturnType<typeof stageCompleteConfigurationSetup>>|undefined;
  let legacyRecovery=false;
  let busy=false,setupInProgress=false,operation:AbortController|undefined,
    exportOperation:AbortController|undefined;
  const setBusy=(value:boolean)=>{busy=value;exportButton.disabled=value;importButton.disabled=value;setup.disabled=value;};
  const onExport=()=>{if(busy||exportOperation)return;setBusy(true);cancelExport.hidden=false;
    cancelExport.disabled=false;
    const controller=exportOperation=new AbortController();status.textContent="Reading saved configuration…";
    void port.read({signal:controller.signal,onProgress:(completed,total)=>{
      if(!controller.signal.aborted)status.textContent=`Reading saved project ${completed} of ${total}…`;}}).then((snapshot)=>{
      controller.signal.throwIfAborted();
      exportPreview.textContent=`Included: ${Object.entries(snapshot.sections).map(([domain,records])=>
        `${domain} ${records.length}`).join(", ")}; binary bodies ${snapshot.bodies.length}. Excluded: `+
        COMPLETE_CONFIGURATION_EXCLUSIONS.map(({id})=>id).join(", ")+".";
      return createCompleteConfigurationArchive(snapshot,{buildIdentity:port.buildIdentity,
      signal:controller.signal,onProgress:(written)=>{if(!controller.signal.aborted)
        status.textContent=`Preparing complete configuration: ${written} bytes…`;}});})
      .then((archive)=>{if(controller.signal.aborted){status.textContent="Complete configuration export cancelled; no file was created.";return;}
        downloadArchive(archive);status.textContent="Exported complete configuration with manifest, digests, dependencies, and exclusions.";},
        (error)=>{status.textContent=controller.signal.aborted?"Complete configuration export cancelled; no file was created.":
          `Complete configuration export failed. ${error instanceof Error?error.message:String(error)}`;})
      .finally(()=>{exportOperation=undefined;cancelExport.hidden=true;cancelExport.disabled=true;
        setBusy(false);});};
  const onCancelExport=()=>{if(!exportOperation)return;exportOperation.abort();
    cancelExport.disabled=true;status.textContent="Cancelling complete configuration export…";};
  const onImport=()=>file.click();
  const showReview=async(snapshot:CompleteConfigurationSnapshot,sourceLabel:string,size:number,
    excluded:string[])=>{
    staged=await stageCompleteConfigurationSetup({snapshot},port);
    legacyRecovery=sourceLabel.startsWith("Legacy recovery JSON:");
    const counts=Object.entries(snapshot.sections).map(([name,records])=>`${name}: ${records.length}`).join(" · ");
    const conflicts=staged.conflicts.map(({domain,id,recipientId,reason})=>
      `${domain}/${id} (${reason} conflict with ${recipientId})`).join("; ");
    summary.textContent=`${sourceLabel} · ${size} bytes · ${counts} · ${snapshot.bodies.length} binary bodies · Excluded: ${excluded.join(", ")}. `+
      (conflicts?`Conflicts: ${conflicts}. Non-conflicting import skips: ${staged.skippedRecords.join(", ")}.`:
        "No conflicts. Select Set up from configuration to import all available sections.");
    status.textContent="Inspection is complete. Review conflicts before setup.";
    dialog.showModal();summary.focus();
  };
  const onFile=()=>{const selected=file.files?.[0];file.value="";if(!selected||busy)return;setBusy(true);const controller=operation=new AbortController();
    status.textContent="Inspecting configuration without changing local data…";
    void inspectConfigurationImportRoute(selected).then(async(routing)=>{
      if(routing.route!=="complete-configuration"){
        if(routing.route==="project"&&routes.project){
          await routes.project(selected);
          status.textContent="Opened the project import review. No configuration was changed.";
          return;
        }
        if(routing.route==="schema-library"&&routes.schemaLibrary){
          await routes.schemaLibrary(selected);
          status.textContent="Opened the Schema Library import review. No configuration was changed.";
          return;
        }
        if(routing.route==="repository-recovery"&&!routing.blockers.length){
          const snapshot=await inspectLegacyRepositoryRecovery(JSON.parse(await selected.text()));
          await showReview(snapshot,"Legacy recovery JSON: projects and saved schemas only",selected.size,
            ["domains absent from the old recovery file","binary assets absent by format"]);
          return;
        }
        const label=routing.route==="project"?"project import review":routing.route==="schema-library"?"Schema Library import review":"repository recovery review";
        status.textContent=routing.blockers.length?routing.blockers.join(" "):`File inspection selected the ${label}. No configuration was changed.`;
        return;
      }
      const inspected=await inspectCompleteConfigurationArchive(selected,{signal:controller.signal});
      await showReview(inspected.snapshot,`Compatible version ${inspected.manifest.version} archive`,selected.size,
        inspected.manifest.exclusions.map(({id})=>id));
    }).catch((error)=>{status.textContent=`Configuration inspection failed. ${error instanceof Error?error.message:String(error)}`;})
      .finally(()=>{operation=undefined;setBusy(false);});};
  const onSetup=()=>{if(!staged||busy)return;setBusy(true);setupInProgress=true;
    operation=new AbortController();
    const selected=(staged.conflicts.length===0?"replace-all":policy.value) as ConfigurationConflictPolicy;
    status.textContent=selected==="cancel"?"Cancelling configuration setup…":"Committing all reviewed configuration sections together…";
    void staged.commit(selected,{signal:operation.signal,onProgress:(completed,total)=>{
      status.textContent=`Staging project ${completed} of ${total}…`;}}).then((result)=>{
      dialog.close();staged=undefined;status.textContent=result==="cancelled"
        ?"Configuration setup cancelled; no data changed."
        :result==="no-change"?"The imported configuration matches the saved data. No changes were made."
          :legacyRecovery?"Imported the projects and saved schemas available in the legacy recovery file. Other configuration was not in that file. Reloading now."
            :"Configuration setup is complete. Reloading now.";
    },(error)=>{const message=error instanceof Error?error.message:String(error);
      status.textContent=message.startsWith("Setup recovery could not finish")
        ?`Configuration setup needs recovery. ${message}`
        :`Configuration setup was not committed. ${message}`;})
      .finally(()=>{operation=undefined;setupInProgress=false;setBusy(false);});};
  const onCancel=()=>{if(setupInProgress){operation?.abort();status.textContent="Cancellation requested. Waiting for the storage result…";return;}
    dialog.close();staged=undefined;status.textContent="Configuration setup cancelled; no data changed.";};
  exportButton.addEventListener("click",onExport);cancelExport.addEventListener("click",onCancelExport);
  importButton.addEventListener("click",onImport);
  file.addEventListener("change",onFile);setup.addEventListener("click",onSetup);cancel.addEventListener("click",onCancel);
  return()=>{operation?.abort();exportOperation?.abort();exportButton.removeEventListener("click",onExport);
    cancelExport.removeEventListener("click",onCancelExport);importButton.removeEventListener("click",onImport);
    file.removeEventListener("change",onFile);setup.removeEventListener("click",onSetup);cancel.removeEventListener("click",onCancel);};
}
