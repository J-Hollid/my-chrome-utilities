import type { UtilityLifecycle, UtilityMountHost, UtilityPageLifecycle } from "./utility-contract.js";

export interface DomUtilityLifecycleOptions { onMount?(root:UtilityMountHost):void|(()=>void); }

export function createDomUtilityLifecycle(id:string,panels:readonly string[],options:DomUtilityLifecycleOptions={}):UtilityLifecycle {
  let active=false;
  return {
    activate():void { active=true; },
    deactivate():void { active=false; },
    mount(root:UtilityMountHost,pageLifecycle:UtilityPageLifecycle):{unmount():void} {
      for(const panelId of panels){
        const panel=root.querySelector<HTMLElement>(`#${panelId}`);
        if(!panel)throw new Error(`Registered utility panel is missing: ${panelId}`);
        panel.dataset.utilityOwner=id;
      }
      const dispose=options.onMount?.(root);
      this.activate();
      root.dataset.registeredUtilities=id;
      root.dataset.activeUtilities=id;
      let mounted=true;
      const unmount=():void=>{if(!mounted)return;mounted=false;dispose?.();this.deactivate();root.dataset.activeUtilities="";};
      pageLifecycle.addEventListener("pagehide",unmount,{once:true});
      return {unmount};
    },
  };
}
