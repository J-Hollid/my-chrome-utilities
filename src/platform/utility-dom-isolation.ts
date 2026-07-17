export interface UtilityDomScope { utilityId:string; panelIds:readonly string[]; removeSelectors?:readonly string[]; }
export interface OwnedUtilityElement { id:string; owner:string|undefined; }

export function retainUtilityElement(element:OwnedUtilityElement,scope:UtilityDomScope):boolean {
  return element.owner===scope.utilityId&&scope.panelIds.includes(element.id);
}

export function utilityDomScopeFromSearch(search:string):UtilityDomScope|undefined {
  const parameters=new URLSearchParams(search),utilityId=parameters.get("utility"),panelIds=parameters.getAll("panel");
  if(!utilityId||panelIds.length===0)return undefined;
  const removeSelectors=parameters.getAll("remove");
  return {utilityId,panelIds,...(removeSelectors.length?{removeSelectors}:{})};
}

export function isolateUtilityDom(root:ParentNode,scope:UtilityDomScope):void {
  for(const selector of scope.removeSelectors??[])root.querySelector(selector)?.remove();
  for(const element of Array.from(root.querySelectorAll<HTMLElement>("[data-utility-owner]"))){
    if(!retainUtilityElement({id:element.id,owner:element.dataset.utilityOwner},scope))element.remove();
  }
  const tabs=Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"][aria-controls]'));
  for(const tab of tabs)if(!root.querySelector(`#${tab.getAttribute("aria-controls")}`))tab.remove();
  const tabLists=new Set(tabs.filter((tab)=>tab.isConnected).map((tab)=>tab.parentElement));
  for(const tabList of tabLists){
    const group=tabs.filter((tab)=>tab.isConnected&&tab.parentElement===tabList);
    const selected=group.find((tab)=>scope.panelIds.includes(tab.getAttribute("aria-controls")??""));
    if(!selected)continue;
    for(const tab of group){
      const active=tab===selected;tab.setAttribute("aria-selected",String(active));tab.tabIndex=active?0:-1;
      const panel=root.querySelector<HTMLElement>(`#${tab.getAttribute("aria-controls")}`);if(panel)panel.hidden=!active;
    }
  }
}

export function isolateUtilityDomFromSearch(root:ParentNode,search:string):UtilityDomScope|undefined {
  const scope=utilityDomScopeFromSearch(search);if(!scope)return undefined;
  isolateUtilityDom(root,scope);
  const documentRoot=(root as Document).documentElement;
  if(documentRoot)documentRoot.dataset.utilityIsolation=scope.utilityId;
  return scope;
}
