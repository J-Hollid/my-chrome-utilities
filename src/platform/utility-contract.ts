export interface UtilityStorageContract { namespace:string; version:number; legacyKeys?:readonly string[]; }
export interface UtilityMountHost { dataset:Record<string,string|undefined>; querySelector<E extends Element=Element>(selectors:string):E|null; querySelectorAll<E extends Element=Element>(selectors:string):NodeListOf<E>; }
export interface UtilityPageLifecycle { addEventListener(type:string,listener:EventListenerOrEventListenerObject,options?:boolean|AddEventListenerOptions):void; }
export interface UtilityLifecycle { activate():void; deactivate():void; mount(root:UtilityMountHost,pageLifecycle:UtilityPageLifecycle):{unmount():void}; }
export interface UtilityModuleEntry {
  id:string;
  identity:{ name:string; description:string };
  commands:readonly string[];
  panels:readonly string[];
  lifecycle:UtilityLifecycle;
  storage:UtilityStorageContract;
}
export interface DataLayerModuleEntry { id:string; capability:string; publicInterface:readonly string[]; }

export function defineUtility<T extends UtilityModuleEntry>(entry:T):T { return Object.freeze(entry); }
