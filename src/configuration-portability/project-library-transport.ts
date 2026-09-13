import {
  stageProjectImport,
  type ProjectLibrary,
  type ProjectLibraryTransport,
} from "../data-layer-project-library.js";

export interface CompatibilityProjectLibraryTransportOptions {
  exportProject(projectId:string):Promise<string>;
  importProject(serialized:string,input:{projectId:string;name:string}):Promise<void>;
  library():ProjectLibrary;
  id(kind:string):string;
  now():string;
}

export function createCompatibilityProjectLibraryTransport(options:CompatibilityProjectLibraryTransportOptions):ProjectLibraryTransport {
  return {
    async prepareExport(projectId) {
      let bytes:Uint8Array|undefined=new TextEncoder().encode(await options.exportProject(projectId));
      let started=false;
      return {
        formatVersion:2,
        mediaType:"application/json",
        extension:"json",
        estimatedBytes:bytes.byteLength,
        async write(sink,input={}) {
          if(!bytes)throw new Error("Prepared project export was released.");
          if(started)throw new Error("Prepared project export already started.");
          started=true;
          if(input.signal?.aborted)throw new DOMException("Project transport was cancelled.","AbortError");
          await sink.write(bytes);
        },
        release(){bytes=undefined;},
      };
    },
    async inspectImport(source) {
      let serialized:string|undefined=await source.text();
      let parsed:Record<string,unknown>|undefined;
      try{parsed=JSON.parse(serialized) as Record<string,unknown>;}catch{}
      const staged=stageProjectImport(serialized,options.library(),{
        id:oldId=>`${options.id("import")}:${oldId.split(":")[0]}`,
        now:options.now,
      });
      let started=false;
      return {
        formatVersion:Number(parsed?.version??0),
        sourceName:staged.sourceName,
        targetName:staged.targetName,
        projectId:staged.projectId,
        entityCounts:staged.entityCounts,
        referenceIntegrity:staged.referenceIntegrity,
        migrations:staged.migrations,
        blockers:staged.blockers,
        async commit(input) {
          if(!serialized)throw new Error("Inspected project import was released.");
          if(started)throw new Error("Inspected project import already started.");
          started=true;
          if(input.signal?.aborted)throw new DOMException("Project transport was cancelled.","AbortError");
          await options.importProject(serialized,{projectId:staged.projectId,name:input.name});
        },
        release(){serialized=undefined;parsed=undefined;},
      };
    },
  };
}
