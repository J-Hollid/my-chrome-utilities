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

export interface SchemaProjectHydrationPorts {
  activeProjectId():string|undefined;
  generation():number;
  isMounted():boolean;
  ensure(projectId:string):Promise<{ name:string }>;
  invalidate():void;
  render():void;
  result:HTMLElement|null;
}

/** Owns project identity and stale-result control for schema contributor hydration. */
export class SchemaProjectHydrationCoordinator {
  readonly #ports:SchemaProjectHydrationPorts;
  readonly #slot=createProjectHydrationSlot();
  #hydratedProjectId:string|undefined;

  constructor(ports:SchemaProjectHydrationPorts) { this.#ports=ports; }

  needs(projectId:string):boolean { return this.#hydratedProjectId !== projectId; }

  hydrate(projectId:string):Promise<void> {
    const ports=this.#ports, operation=ports.generation();
    if (ports.result) ports.result.textContent="Loading active project schema contributors from durable storage…";
    return this.#slot.run(projectId,() => ports.ensure(projectId)
      .then(({ name }) => {
        if (!ports.isMounted() || operation !== ports.generation() || ports.activeProjectId() !== projectId) return;
        this.#hydratedProjectId=projectId; ports.invalidate(); ports.render();
        if (ports.result) ports.result.textContent=`Loaded schema contributors for ${name}.`;
      })
      .catch((error:unknown) => {
        if (ports.isMounted() && operation === ports.generation() && ports.activeProjectId() === projectId && ports.result) {
          ports.result.textContent=`Schema contributors are unavailable. ${error instanceof Error ? error.message : String(error)}`;
        }
      }));
  }

  hydrateActive():Promise<void>|undefined {
    const projectId=this.#ports.activeProjectId();
    return projectId ? this.hydrate(projectId) : undefined;
  }

  reset():void { this.#hydratedProjectId=undefined; this.#slot.reset(); }
}
