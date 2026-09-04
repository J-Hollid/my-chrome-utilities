import type { SchemaValidationRecord } from "./index.js";
import { validateEvent, type SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { CapturedValidationContinuation } from "./index.js";

export const MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY = "my-chrome-utilities.manual-schema-overrides.v1";
export const SCHEMA_VALIDATION_RECORD_STORAGE_KEY = "my-chrome-utilities.schema-validation-records.v1";

interface CapturedEvent { id:string; sourceId:string; name:string; payload:unknown; rawInput:unknown; pageUrl?:string }
export interface SchemaValidationBehaviorPorts {
  list:HTMLElement|null; issues:HTMLElement|null; result:HTMLElement|null; guidedRoot:HTMLElement|null; document:Document|undefined;
  prepare?(record:SchemaValidationRecord):Promise<CapturedValidationContinuation>;
  schemas():SchemaDefinition[];
  generation():number;
  isCurrent(generation:number):boolean;
}

export class SchemaValidationController {
  readonly #storage:Pick<Storage, "getItem" | "setItem">;
  #behavior:SchemaValidationBehaviorPorts | undefined;
  records:SchemaValidationRecord[];
  manualOverrides:Record<string, string>;
  readonly #rowDisposers:Array<() => void> = [];
  readonly #dialogDisposers:Array<() => void> = [];

  constructor(storage:Pick<Storage, "getItem" | "setItem">, behavior?:SchemaValidationBehaviorPorts) {
    this.#storage = storage;
    this.#behavior = behavior;
    try {
      const parsed = JSON.parse(storage.getItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY) ?? "{}");
      this.manualOverrides = parsed && typeof parsed === "object" ? parsed : {};
    } catch { this.manualOverrides = {}; }
    try {
      const parsed = JSON.parse(storage.getItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY) ?? "[]");
      this.records = Array.isArray(parsed) ? parsed : [];
    } catch { this.records = []; }
  }
  configure(behavior:SchemaValidationBehaviorPorts):void { this.#behavior = behavior; }
  replaceRecords(records:readonly SchemaValidationRecord[]):void {
    this.records = structuredClone([...records]).slice(-50);
    this.#storage.setItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY, JSON.stringify(this.records));
  }
  addRecord(record:SchemaValidationRecord):void { this.replaceRecords([...this.records, record]); }
  setManualOverride(eventId:string, schemaId?:string):void {
    if (schemaId) this.manualOverrides[eventId] = schemaId; else delete this.manualOverrides[eventId];
    this.#storage.setItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY, JSON.stringify(this.manualOverrides));
  }
  render():void {
    const ports = this.#behavior; if (!ports?.list || !ports.document) return; this.clearRows(); this.clearDialog();
    ports.list.replaceChildren(...this.records.map((record) => {
      const item = ports.document!.createElement("li"), summary = ports.document!.createElement("span"), button = ports.document!.createElement("button");
      summary.textContent = `${record.eventName} · ${record.state} · ${record.schemaName ? `${record.schemaName} v${record.schemaVersion} · ${record.target ?? "payload"}` : "No matching schema"}${record.assignmentId ? ` · assignment ${record.assignmentName ?? record.assignmentId} (${record.assignmentId})` : ""}${record.assignmentEvidence ? ` · ${record.assignmentEvidence}` : ""} · ${record.checkedAt}`;
      if (ports.prepare) { button.type = "button"; button.textContent = "Continue in project"; button.disabled = !record.schemaId || !record.evaluated;
        const review = ():void => { void this.reviewContinuation(record, button); }; button.addEventListener("click", review); this.ownRow(() => button.removeEventListener("click", review)); item.append(summary, button); }
      else item.append(summary); return item;
    }));
  }
  async reviewContinuation(record:SchemaValidationRecord, trigger:HTMLButtonElement):Promise<void> {
    const ports = this.#behavior, generation = ports?.generation(); if (!ports?.prepare || !ports.guidedRoot || !ports.document || generation === undefined || !ports.isCurrent(generation)) return;
    let continuation:CapturedValidationContinuation;
    try { continuation = await ports.prepare(structuredClone(record)); }
    catch (error) { if (ports.isCurrent(generation) && ports.result) ports.result.textContent = error instanceof Error ? error.message : String(error); return; }
    if (!ports.isCurrent(generation)) return; this.clearDialog(); const document = ports.document;
    const dialog = document.createElement("dialog"), heading = document.createElement("h4"), summary = document.createElement("p"), review = document.createElement("p"),
      name = document.createElement("input"), confirm = document.createElement("button"), cancel = document.createElement("button");
    const select = (labelText:string, values:readonly {id:string;name:string}[], optional=false):HTMLSelectElement => { const label=document.createElement("label"), control=document.createElement("select");
      label.textContent=labelText; if(optional){const option=document.createElement("option");option.value="";option.textContent=`No ${labelText.toLowerCase()}`;control.append(option);}
      for(const value of values){const option=document.createElement("option");option.value=value.id;option.textContent=value.name;control.append(option);} if(!optional&&values[0])control.value=values[0].id;label.append(control);dialog.append(label);return control; };
    heading.textContent="Continue captured validation in project"; summary.textContent=continuation.summary; review.textContent=continuation.review;
    name.value=continuation.suggestedName; name.setAttribute("aria-label","Test case name"); dialog.append(heading,summary,review,name);
    const destination=select("Destination",[{id:"fixture",name:"Event validation Test case"},{id:"profile",name:"Profile requirements"}]), event=select("Event",continuation.events),
      page=select("Page",continuation.pages,true), step=select("Flow step",continuation.flowSteps,true), profile=select("Profile",continuation.profiles,true);
    confirm.type = cancel.type = "button"; confirm.textContent = "Create Test case and open in Specification Studio"; cancel.textContent = "Cancel";
    const close = (restoreFocus:boolean):void => { this.clearDialog(); dialog.close(); dialog.remove(); if(restoreFocus)trigger.focus({ preventScroll:true }); };
    const selectDestination = ():void => { const toProfile=destination.value==="profile";name.hidden=Boolean(toProfile);event.parentElement!.hidden=toProfile;page.parentElement!.hidden=toProfile;step.parentElement!.hidden=toProfile;
      confirm.textContent=toProfile?"Add requirements and open Profile":"Create Test case and open in Specification Studio"; };
    const confirmContinuation = ():void => { const toProfile=destination.value==="profile";if(toProfile&&!profile.value){summary.textContent="Choose a Profile for the evaluated requirements.";return;} confirm.disabled = true;
      void continuation.commit({destination:toProfile?"profile":"fixture",name:name.value.trim(),eventId:event.value,...(page.value?{pageId:page.value}:{}),...(step.value?{flowStepId:step.value}:{}),...(profile.value?{profileId:profile.value}:{})})
        .then(({entityName}) => { if (ports.isCurrent(generation)) { close(false); if(ports.result)ports.result.textContent=`Saved evaluated capture evidence in ${entityName}; opening it in Specification Studio.`; } },
          (error) => { if (ports.isCurrent(generation)){confirm.disabled=false;summary.textContent=error instanceof Error?error.message:String(error);} }); };
    const cancelContinuation=():void=>close(true); destination.addEventListener("change", selectDestination); confirm.addEventListener("click", confirmContinuation); cancel.addEventListener("click", cancelContinuation);
    this.ownDialog(() => destination.removeEventListener("change", selectDestination), () => confirm.removeEventListener("click", confirmContinuation),
      () => cancel.removeEventListener("click", cancelContinuation), () => { dialog.close(); dialog.remove(); });
    dialog.append(confirm, cancel); ports.guidedRoot.replaceChildren(dialog); dialog.showModal(); name.focus({preventScroll:true});
  }
  recheck(events:readonly CapturedEvent[] = []):readonly SchemaValidationRecord[] {
    const ports = this.#behavior; if (!ports) return []; const checkedAt = new Date().toISOString(), issues:string[] = [];
    const records = events.map((event):SchemaValidationRecord => { const override = this.manualOverrides[event.id], schemas = ports.schemas(), candidates = override ? schemas.filter(({ id }) => id === override) : schemas;
      const result = validateEvent({ sourceId:event.sourceId, eventName:event.name, payload:event.payload, rawInput:event.rawInput }, candidates, event.pageUrl);
      issues.push(...result.issues.map((issue) => `${event.name} · ${issue.instancePath || "root"} · ${issue.message}`));
      return { eventId:event.id, eventName:event.name, state:result.state, checkedAt, ...(result.schema ? { schemaId:result.schema.id, schemaName:result.schema.name, schemaVersion:result.schema.version } : {}), issueCodes:result.issues.map((issue) => issue.rule ?? issue.schemaLocation) }; });
    this.replaceRecords([...this.records, ...records]);
    if (ports.issues && ports.document) ports.issues.replaceChildren(...issues.map((textContent) => Object.assign(ports.document!.createElement("li"), { textContent })));
    this.render(); if (ports.result) ports.result.textContent = events.length ? `Rechecked ${events.length} captured events.` : "No captured events are available to recheck.";
    return structuredClone(records);
  }
  ownRow(dispose:()=>void):void { this.#rowDisposers.push(dispose); }
  ownDialog(...disposers:Array<() => void>):void { this.#dialogDisposers.push(...disposers); }
  clearRows():void { for (const dispose of this.#rowDisposers.splice(0)) dispose(); }
  clearDialog():void { for (const dispose of this.#dialogDisposers.splice(0)) dispose(); }
  dispose():void { this.clearRows(); this.clearDialog(); }
}
