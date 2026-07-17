export interface UtilityDomScope { utilityId:string; panelIds:readonly string[]; removeSelectors?:readonly string[]; }
export interface OwnedUtilityElement { id:string; owner:string|undefined; }

export function retainUtilityElement(element:OwnedUtilityElement,scope:UtilityDomScope):boolean {
  return element.owner===scope.utilityId&&scope.panelIds.includes(element.id);
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
