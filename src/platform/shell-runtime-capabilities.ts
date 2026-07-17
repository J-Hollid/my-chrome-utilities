interface ListenerContract { addListener(listener:(...args:any[])=>void):void; }
interface ChromeShellRuntime {
  runtime?:{onMessage?:ListenerContract};
  tabs?:{query?:Function;onUpdated?:ListenerContract;onRemoved?:ListenerContract};
  permissions?:{onRemoved?:ListenerContract};
  scripting?:{executeScript?:Function};
}

export function shellRuntimeCapabilities(runtime:ChromeShellRuntime|undefined):string[] {
  const capabilities:string[]=[];
  if(runtime?.runtime?.onMessage?.addListener)capabilities.push("runtime.messaging");
  if(runtime?.tabs?.query)capabilities.push("tabs.query");
  if(runtime?.tabs?.onUpdated?.addListener&&runtime.tabs.onRemoved?.addListener)capabilities.push("tabs.lifecycle");
  if(runtime?.permissions?.onRemoved?.addListener)capabilities.push("permissions.lifecycle");
  if(runtime?.scripting?.executeScript)capabilities.push("scripting.execute");
  return capabilities;
}
