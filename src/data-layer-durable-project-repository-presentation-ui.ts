export interface DurableStorageDiagnosticsDisplayInput{
  lastSavedAt:string;publishedRevision:number;unsavedCommand?:string;projectEntityBytes:number;
  releaseBytes:number;fixtureBytes:number;migrationBackupBytes:number;explanation:string;
  browserEstimate?:{usage:number;quota:number;label:string};
}

export interface DurableRepositoryPresentationCallbacks{
  open(origin:HTMLElement):void|Promise<void>;close():void;diagnose():void|Promise<void>;
  retry():void|Promise<void>;reject():void|Promise<void>;exportUnsaved():void;
  exportBackup():void|Promise<void>;reviewDeleteBackup():void;cancelDeleteBackup():void;
  confirmDeleteBackup():void|Promise<void>;
}

export interface DurableRepositoryPresentation{
  status(message:string):void;result(message:string,focus?:boolean):void;
  recoveryControls(input:{retry:boolean;reject:boolean;exportUnsaved:boolean}):void;
  recoveryAvailable(available:boolean):void;backupAvailable(available:boolean):void;
  diagnostics(input:DurableStorageDiagnosticsDisplayInput):void;
  show(origin:HTMLElement):void;close():void;showDeleteReview():void;hideDeleteReview():void;
}

const q=<T extends Element>(root:ParentNode,selector:string):T=>{const element=root.querySelector<T>(selector);if(!element)throw new Error(`Missing durable repository control ${selector}.`);return element;};
const humanBytes=(value:number)=>value<1024?`${value} B`:`${(value/1024).toFixed(1)} KiB`;

export function durableStorageDiagnosticsDisplay(input:DurableStorageDiagnosticsDisplayInput){
  return{lastSavedAt:input.lastSavedAt,publishedRevision:String(input.publishedRevision),
    unsavedCommand:input.unsavedCommand??"None",projectSize:humanBytes(input.projectEntityBytes),
    releaseSize:humanBytes(input.releaseBytes),fixtureSize:humanBytes(input.fixtureBytes),
    migrationBackupSize:humanBytes(input.migrationBackupBytes),browserEstimate:input.browserEstimate
      ?`${humanBytes(input.browserEstimate.usage)} used of ${humanBytes(input.browserEstimate.quota)}`
      :"Browser estimate unavailable",explanation:input.explanation};
}

export function createDurableRepositoryPresentation(root:ParentNode,callbacks:DurableRepositoryPresentationCallbacks):DurableRepositoryPresentation{
  const status=q<HTMLOutputElement>(root,"#durable-repository-status"),open=q<HTMLButtonElement>(root,"#open-storage-recovery"),dialog=q<HTMLDialogElement>(root,"#durable-storage-recovery"),close=q<HTMLButtonElement>(root,"#close-storage-recovery"),retry=q<HTMLButtonElement>(root,"#retry-durable-save"),reject=q<HTMLButtonElement>(root,"#reject-durable-save"),exportUnsaved=q<HTMLButtonElement>(root,"#export-unsaved-draft"),exportBackup=q<HTMLButtonElement>(root,"#export-repository-backup"),diagnose=q<HTMLButtonElement>(root,"#open-storage-diagnostics"),reviewDeleteBackup=q<HTMLButtonElement>(root,"#review-delete-migration-backup"),deleteBackupReview=q<HTMLElement>(root,"#delete-migration-backup-review"),cancelDeleteBackup=q<HTMLButtonElement>(root,"#cancel-delete-migration-backup"),confirmDeleteBackup=q<HTMLButtonElement>(root,"#confirm-delete-migration-backup"),result=q<HTMLOutputElement>(root,"#durable-recovery-result");
  let returnFocus:HTMLElement|undefined;
  open.addEventListener("click",()=>void callbacks.open(open));close.addEventListener("click",()=>callbacks.close());
  diagnose.addEventListener("click",()=>void callbacks.diagnose());retry.addEventListener("click",()=>void callbacks.retry());
  reject.addEventListener("click",()=>void callbacks.reject());exportUnsaved.addEventListener("click",()=>callbacks.exportUnsaved());
  exportBackup.addEventListener("click",()=>void callbacks.exportBackup());reviewDeleteBackup.addEventListener("click",()=>callbacks.reviewDeleteBackup());
  cancelDeleteBackup.addEventListener("click",()=>callbacks.cancelDeleteBackup());confirmDeleteBackup.addEventListener("click",()=>void callbacks.confirmDeleteBackup());
  return{status(message){status.textContent=message;},result(message,focus=false){result.textContent=message;if(focus)result.focus();},
    recoveryControls(input){retry.disabled=!input.retry;reject.disabled=!input.reject;exportUnsaved.disabled=!input.exportUnsaved;},
    recoveryAvailable(available){open.disabled=!available;},backupAvailable(available){reviewDeleteBackup.disabled=!available;},
    diagnostics(input){const display=durableStorageDiagnosticsDisplay(input);q<HTMLElement>(root,"#durable-last-saved").textContent=display.lastSavedAt;q<HTMLElement>(root,"#durable-published-revision").textContent=display.publishedRevision;q<HTMLElement>(root,"#durable-unsaved-command").textContent=display.unsavedCommand;q<HTMLElement>(root,"#durable-project-size").textContent=display.projectSize;q<HTMLElement>(root,"#durable-release-size").textContent=display.releaseSize;q<HTMLElement>(root,"#durable-fixture-size").textContent=display.fixtureSize;q<HTMLElement>(root,"#durable-migration-backup-size").textContent=display.migrationBackupSize;q<HTMLElement>(root,"#durable-browser-estimate").textContent=display.browserEstimate;q<HTMLElement>(root,"#durable-storage-explanation").textContent=display.explanation;},
    show(origin){returnFocus=origin;dialog.showModal();q<HTMLElement>(dialog,"#durable-storage-recovery-title").focus();},
    close(){dialog.close();returnFocus?.focus();},showDeleteReview(){deleteBackupReview.hidden=false;q<HTMLElement>(deleteBackupReview,"#delete-migration-backup-title").focus();},hideDeleteReview(){deleteBackupReview.hidden=true;}};
}

export function installDurableRepositoryStartupFailurePresentation(root:Document,message:string):void{
  const projects=q<HTMLElement>(root,"#data-layer-panel-projects"),status=q<HTMLOutputElement>(root,"#durable-repository-status"),libraryStatus=q<HTMLOutputElement>(root,"#project-library-status"),open=q<HTMLButtonElement>(root,"#open-storage-recovery"),dialog=q<HTMLDialogElement>(root,"#durable-storage-recovery"),close=q<HTMLButtonElement>(root,"#close-storage-recovery"),result=q<HTMLOutputElement>(root,"#durable-recovery-result"),explanation=q<HTMLElement>(root,"#durable-storage-explanation");
  root.querySelectorAll<HTMLElement>('[role="tabpanel"]').forEach((panel)=>{panel.hidden=panel!==projects;});
  const tab=root.querySelector<HTMLElement>("#data-layer-view-projects");if(tab){tab.setAttribute("aria-selected","true");tab.tabIndex=0;}
  projects.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>("button,input,select,textarea").forEach((control)=>{control.disabled=true;});
  status.textContent=message;libraryStatus.textContent=`Projects are unavailable. ${message}`;explanation.textContent=`${message}. No project was loaded and Web Storage was not used as canonical fallback.`;result.textContent=message;
  open.disabled=false;close.disabled=false;open.addEventListener("click",()=>{dialog.showModal();q<HTMLElement>(dialog,"#durable-storage-recovery-title").focus();});close.addEventListener("click",()=>{dialog.close();open.focus();});
}
