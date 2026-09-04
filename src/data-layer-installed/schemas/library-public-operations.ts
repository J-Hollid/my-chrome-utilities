import { discardSchemaWorkingDraft, updateSchemaWorkingDraft, validateEvent, validateWithSchema,
  type SchemaDefinition, type SchemaWorkingDraft } from "../../utilities/data-layer/schemas.js";
import type { SchemaLibraryController } from "./library-controller.js";

export interface SchemaLibraryPublicPorts {
  library:SchemaLibraryController;
  active():SchemaDefinition;
  activeIndex():number;
  persist():void;
  render():void;
  publish():SchemaDefinition;
  exportButton:HTMLButtonElement|null;
  mounted():boolean;
}

/** Projects library and draft lifecycle operations without owning their state. */
export function createSchemaLibraryPublicOperations(ports:SchemaLibraryPublicPorts) {
  const library=ports.library, commit=(schema:SchemaDefinition) => {
    library.replaceActive(schema); ports.persist(); ports.render();
  };
  return {
    open:(id:string) => { if (!library.schemas.some((schema) => schema.id === id)) throw new Error(`Unknown schema ${id}`);
      library.activeSchemaId=id; library.draft=structuredClone(ports.active()); ports.render(); },
    beginDraft:() => commit(updateSchemaWorkingDraft(ports.active(),{})),
    updateDraft:(changes:Partial<Pick<SchemaWorkingDraft,"name"|"document"|"assignments"|"attachedRules"|"parentSchemaId"|"inheritedRuleOverrides"|"documentation"|"canonicalSchema">>,change?:string) =>
      commit(updateSchemaWorkingDraft(ports.active(),changes,change)),
    publish:() => structuredClone(ports.publish()),
    discard:() => commit(discardSchemaWorkingDraft(ports.active())),
    add:(schema:SchemaDefinition) => { library.schemas=[...library.schemas,structuredClone(schema)];
      library.activeSchemaId=schema.id; library.draft=structuredClone(schema); ports.persist(); ports.render(); },
    replace:(next:readonly SchemaDefinition[]) => { library.schemas=structuredClone([...next]);
      if (!library.schemas.some(({id}) => id === library.activeSchemaId)) { library.activeSchemaId=undefined; library.draft=undefined; }
      ports.persist(); ports.render(); },
    validate:(event:Parameters<typeof validateEvent>[0]) => validateEvent(event,library.schemas),
    validateAgainstSchema:(event:Parameters<typeof validateEvent>[0],schemaId:string) => {
      const schema=library.schemas.find((candidate) => candidate.id === schemaId);
      if (!schema) return { message:"Select a schema to refresh Library draft validation." };
      const result=validateWithSchema(event,schema,library.schemas);
      return { message:`Library draft validation: ${result.state} · ${schema.name} v${schema.version}.`,result }; },
    reviewLibraryImport:(serialized:string) => library.reviewImport(serialized),
    requestDeletion:(id:string) => library.requestDeletion(id),
    openExportChoices:(schemaId?:string) => { if (!ports.exportButton) return false;
      const schema=schemaId ? library.schemas.find(({id}) => id === schemaId) : undefined;
      if (schemaId && !schema) return false; library.openExportChoices(ports.exportButton,schema); return true; },
    omittedRuleStatus:(count:number) => library.omittedStatus(count),
    schemas:():readonly SchemaDefinition[] => structuredClone(library.schemas),
    state:() => ({ ...(library.activeSchemaId ? {activeSchemaId:library.activeSchemaId} : {}),
      draftDirty:Boolean((library.activeSchemaId||library.draft)&&ports.active().workingDraft),
      ...(ports.activeIndex()<0&&library.draft ? {transientDraft:structuredClone(library.draft)} : {}),
      schemaCount:library.schemas.length,mounted:ports.mounted() }),
  };
}
