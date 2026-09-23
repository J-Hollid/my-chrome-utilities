const LOCK_NAME="my-chrome-utilities.configuration-window-view";
const CHANNEL_NAME="my-chrome-utilities.configuration-window-view.v1";
const PAUSE_TIMEOUT_MS=15_000;
const RECOVERY_RELOAD_MS=30_000;

type Message={type:"pause"|"resume"|"reload";id:string};

export interface ConfigurationWindowCoordinator {
  start():Promise<void>;
  run<T>(work:()=>Promise<T>):Promise<T>;
}

export function createConfigurationWindowCoordinator(input:{
  document:Document;
  settle:()=>Promise<void>;
  reload?:()=>void;
}):ConfigurationWindowCoordinator{
  const locks=globalThis.navigator?.locks;
  const channel=typeof BroadcastChannel==="function"?new BroadcastChannel(CHANNEL_NAME):undefined;
  const ownId=crypto.randomUUID();
  let releaseLease:(()=>void)|undefined,leaseReady:Promise<void>|undefined,
    frozen=false,activeRequest:string|undefined,overlay:HTMLElement|undefined,
    recoveryReload:ReturnType<typeof setTimeout>|undefined;
  const previousInert=new Map<HTMLElement,boolean>();
  const reload=input.reload??(()=>globalThis.location.reload());

  const acquireLease=():Promise<void>=>{
    if(!locks)throw new DOMException("This browser cannot pause open configuration windows. Close other windows and use a supported browser.","NotSupportedError");
    if(leaseReady)return leaseReady;
    leaseReady=new Promise<void>((resolve,reject)=>{
      void locks.request(LOCK_NAME,{mode:"shared"},()=>new Promise<void>((release)=>{
        releaseLease=release;resolve();
      })).catch((error)=>{leaseReady=undefined;reject(error);});
    });
    return leaseReady;
  };
  const show=()=>{
    if(overlay)return;
    overlay=input.document.createElement("div");
    overlay.id="configuration-setup-loading";
    overlay.setAttribute("role","status");
    overlay.setAttribute("aria-live","assertive");
    overlay.textContent="Configuration setup is in progress. This window will reload when setup is complete.";
    overlay.style.cssText="position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:2rem;background:#111d;color:#fff;font:600 1.2rem system-ui;text-align:center";
    for(const child of Array.from(input.document.body.children))if(child instanceof HTMLElement){
      previousInert.set(child,child.inert);child.inert=true;
    }
    input.document.body.append(overlay);
  };
  const hide=()=>{
    for(const [child,wasInert] of previousInert)child.inert=wasInert;
    previousInert.clear();overlay?.remove();overlay=undefined;
  };
  const pause=async(id:string)=>{
    if(frozen)return;
    activeRequest=id;frozen=true;show();
    if(id!==ownId)recoveryReload=setTimeout(reload,RECOVERY_RELOAD_MS);
    await input.settle();
    releaseLease?.();releaseLease=undefined;leaseReady=undefined;
  };
  const resume=async(id:string)=>{
    if(activeRequest!==id)return;
    if(recoveryReload)clearTimeout(recoveryReload);
    recoveryReload=undefined;
    await acquireLease();
    activeRequest=undefined;frozen=false;hide();
  };
  channel?.addEventListener("message",(event:MessageEvent<Message>)=>{
    const message=event.data;
    if(!message||message.id===ownId)return;
    if(message.type==="pause")void pause(message.id).catch(()=>{});
    if(message.type==="resume")void resume(message.id).catch(()=>{});
    if(message.type==="reload"&&frozen){
      if(recoveryReload)clearTimeout(recoveryReload);
      reload();
    }
  });
  return{
    start:acquireLease,
    async run<T>(work:()=>Promise<T>):Promise<T>{
      if(!locks||!channel)throw new DOMException(
        "This browser cannot pause all open configuration windows. Setup was not started.","NotSupportedError");
      const id=ownId,timeout=new AbortController(),timer=setTimeout(()=>timeout.abort(),PAUSE_TIMEOUT_MS);
      channel.postMessage({type:"pause",id} satisfies Message);
      try{
        await pause(id);
        let committed=false;
        const result=await locks.request(LOCK_NAME,{mode:"exclusive",signal:timeout.signal},async()=>{
          clearTimeout(timer);
          const value=await work();committed=true;return value;
        });
        if(committed){
          channel.postMessage({type:"reload",id} satisfies Message);
          setTimeout(reload,300);
        }
        return result;
      }catch(error){
        channel.postMessage({type:"resume",id} satisfies Message);
        await resume(id);
        throw error;
      }finally{clearTimeout(timer);}
    },
  };
}
