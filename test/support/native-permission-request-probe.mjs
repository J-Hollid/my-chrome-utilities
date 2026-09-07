/** Injected into the installed page; the host driver owns the native prompt deadline. */
export function installNativePermissionRequestProbe(permissions,requests){
  const nativeRequest=permissions.request.bind(permissions);
  permissions.request=async request=>{
    requests.push(request);
    globalThis.__swarmforgePermissionRequestObservation={requested:true};
    const pending=nativeRequest(request);
    globalThis.__swarmforgePermissionRequestPromise=pending;
    const granted=await pending;
    globalThis.__swarmforgePermissionRequestObservation={requested:true,granted};
    return granted;
  };
}
