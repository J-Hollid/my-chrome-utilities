import {
  GUIDED_CONTINUATION_STORAGE_KEY,
  restoreGuidedContinuationSelections,
  selectGuidedContinuation,
  type GuidedContinuationSelections,
} from "../../utilities/data-layer/schemas.js";

export type GuidedPropertyReturn =
  | { kind:"schema"; schemaId:string; propertyPath:string; generation:number }
  | { kind:"capture"; eventId:string; propertyPath:string; generation:number };

export class SchemaGuidedValidationController {
  readonly #storage:Pick<Storage, "getItem" | "setItem">;
  selections:GuidedContinuationSelections;
  propertyReturn:GuidedPropertyReturn | undefined;
  readonly #dialogDisposers:Array<() => void> = [];
  readonly #livePropertyDisposers:Array<() => void> = [];
  readonly #allowedValueDisposers:Array<() => void> = [];

  constructor(storage:Pick<Storage, "getItem" | "setItem">) {
    this.#storage = storage;
    this.selections = restoreGuidedContinuationSelections(storage.getItem(GUIDED_CONTINUATION_STORAGE_KEY));
  }
  select(event:Pick<{ sourceId:string; name:string }, "sourceId" | "name">, schemaId:string):void {
    this.selections = selectGuidedContinuation(this.selections, event, schemaId);
    this.#storage.setItem(GUIDED_CONTINUATION_STORAGE_KEY, JSON.stringify(this.selections));
  }
  ownDialog(dispose:()=>void):void { this.#dialogDisposers.push(dispose); }
  ownLiveProperty(dispose:()=>void):void { this.#livePropertyDisposers.push(dispose); }
  ownAllowedValue(dispose:()=>void):void { this.#allowedValueDisposers.push(dispose); }
  clearDialog():void { for (const dispose of this.#dialogDisposers.splice(0)) dispose(); }
  clearLiveProperty():void { for (const dispose of this.#livePropertyDisposers.splice(0)) dispose(); }
  clearAllowedValue():void { for (const dispose of this.#allowedValueDisposers.splice(0)) dispose(); }
  dialogListenerCount():number { return this.#dialogDisposers.length; }
  dispose():void {
    this.clearDialog(); this.clearLiveProperty(); this.clearAllowedValue(); this.propertyReturn = undefined;
  }
}
