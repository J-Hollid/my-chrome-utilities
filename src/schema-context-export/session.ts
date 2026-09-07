import {contextExportIdentity,createContextExportSnapshot,type ContextExportSnapshot,type ContextExportSource} from "./snapshot.js";
export interface ContextExportPorts {
  copy(text:string):Promise<void>;
  download(snapshot:ContextExportSnapshot):Promise<void>;
}
/** One confirmation and one immutable snapshot per open preview. */
export class ContextExportSession {
  snapshot:ContextExportSnapshot|undefined;
  #confirmed=false;
  #closed=false;
  constructor(private readonly load:()=>ContextExportSource,private readonly ports:ContextExportPorts){}
  get stale():boolean {
    try{return !this.snapshot||this.snapshot.identity!==contextExportIdentity(this.load());}catch{return true;}
  }
  get needsConfirmation():boolean {
    return !this.#confirmed&&Boolean(this.snapshot&&(this.snapshot.compatibility.omitted.length||this.snapshot.compatibility.conversions.length));
  }
  refresh():ContextExportSnapshot {
    if(this.#closed)throw new Error("The export preview is closed.");
    this.#confirmed=false;
    this.snapshot=createContextExportSnapshot(this.load());
    return this.snapshot;
  }
  confirm():void {
    if(this.stale||this.#closed)throw new Error("Refresh export before confirmation.");
    this.#confirmed=true;
  }
  private current():ContextExportSnapshot {
    if(this.#closed)throw new Error("The export preview is closed.");
    if(this.stale||!this.snapshot)throw new Error("The schema changed. Refresh export before Copy or Download.");
    const source=this.load();
    if(source.pending)throw new Error("Wait for the current save to finish.");
    if(source.unconfirmed)throw new Error("Confirm or cancel the property edits before export.");
    if(this.needsConfirmation)throw new Error("Confirm the compatibility review before export.");
    return this.snapshot;
  }
  async copy():Promise<void>{await this.ports.copy(this.current().text);}
  async download():Promise<void>{await this.ports.download(this.current());}
  close():void{this.#closed=true;this.#confirmed=false;}
}
