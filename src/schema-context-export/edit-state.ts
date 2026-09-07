const states=new WeakMap<HTMLElement,()=>boolean>();
export function registerSchemaExportEditState(host:HTMLElement,pending:()=>boolean):void {
  host.dataset.schemaExportEditState="true";states.set(host,pending);
}
export function hasUnconfirmedSchemaEdits(root:HTMLElement|null):boolean {
  if(!root)return false;
  return [root,...Array.from(root.querySelectorAll<HTMLElement>("[data-schema-export-edit-state]"))].some(host=>states.get(host)?.()===true);
}
