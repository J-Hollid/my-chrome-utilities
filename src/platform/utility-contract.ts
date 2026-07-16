export interface UtilityStorageContract { namespace:string; version:number; legacyKeys?:readonly string[]; }
export interface UtilityModuleEntry {
  id:string;
  identity:{ name:string; description:string };
  commands:readonly string[];
  panels:readonly string[];
  lifecycle:{ activate():void; deactivate():void };
  storage:UtilityStorageContract;
}
export interface DataLayerModuleEntry { id:string; capability:string; publicInterface:readonly string[]; }

export function defineUtility<T extends UtilityModuleEntry>(entry:T):T { return Object.freeze(entry); }
