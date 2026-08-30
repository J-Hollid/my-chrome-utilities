export interface ProjectHydrationSlot {
  run(projectId:string, hydrate:()=>Promise<void>):Promise<void>;
  reset():void;
}

export function createProjectHydrationSlot():ProjectHydrationSlot {
  let currentProjectId:string|undefined;
  let current:Promise<void>|undefined;
  return { run(projectId, hydrate) {
    if (current && currentProjectId === projectId) return current;
    let resolve!:()=>void, reject!:(error:unknown)=>void;
    const operation = new Promise<void>((accept, decline) => { resolve = accept; reject = decline; });
    current = operation; currentProjectId = projectId;
    const clear = ():void => {
      if (current === operation) { current = undefined; currentProjectId = undefined; }
    };
    try { void hydrate().then(() => { clear(); resolve(); }, (error:unknown) => { clear(); reject(error); }); }
    catch (error) { clear(); reject(error); }
    return operation;
  }, reset() { current = undefined; currentProjectId = undefined; } };
}
