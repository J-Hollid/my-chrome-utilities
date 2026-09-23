interface EnumeratedStorage {
  readonly length:number;
  key(index:number):string|null;
  getItem(key:string):string|null;
}

const EXCLUDED_KEYS=new Set([
  "my-chrome-utilities.complete-configuration-journal.v1",
  "my-chrome-utilities.data-layer-view.v1",
  "my-chrome-utilities.saved-through-event-count.v1",
  "my-chrome-utilities.saved-event-feed-filter-working.v1",
  "my-chrome-utilities.saved-session-live-feed.v1",
  "my-chrome-utilities.flow-instances.v1",
  "my-chrome-utilities.flow-routing.v1",
  "my-chrome-utilities.guided-validation-continuations.v1",
  "my-chrome-utilities.schema-validation-records.v1",
  "my-chrome-utilities.specification-project.v1",
  "my-chrome-utilities.specification-project-library.v1",
  "my-chrome-utilities.specification-project-navigation.v1",
  "my-chrome-utilities.specification-project-start.v1",
  "my-chrome-utilities.workspace-tab.v1",
  "my-chrome-utilities.command-palette",
  "my-chrome-utilities.shell",
]);
const ENVELOPES=["my-chrome-utilities.data-layer","my-chrome-utilities.hotkeys"];

export function assertKnownConfigurationStorage(storage:EnumeratedStorage|undefined,includedKeys:readonly string[]):void{
  if(!storage)return;
  const known=new Set([...includedKeys,...EXCLUDED_KEYS,...ENVELOPES]);
  const check=(key:string)=>{
    if(key.startsWith("my-chrome-utilities.")&&!known.has(key))throw new DOMException(
      `Saved configuration key ${key} has no export rule. Update the domain inventory before export.`,"DataError");
  };
  for(let index=0;index<storage.length;index+=1){
    const key=storage.key(index);
    if(key&&storage.getItem(key)!==null)check(key);
  }
  for(const envelope of ENVELOPES){
    const serialized=storage.getItem(envelope);
    if(!serialized)continue;
    let values:unknown;
    try{values=JSON.parse(serialized);}catch{throw new DOMException(
      `Saved configuration envelope ${envelope} is unreadable.`,"DataError");}
    if(!values||typeof values!=="object"||Array.isArray(values))throw new DOMException(
      `Saved configuration envelope ${envelope} is invalid.`,"DataError");
    for(const key of Object.keys(values))check(key);
  }
}
