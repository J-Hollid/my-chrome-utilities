import {
  SCHEMA_LIBRARY_STORAGE_KEY,
  restoreSchemaLibrary,
  serializeSchemaLibrary,
  type SchemaDefinition,
} from "../../utilities/data-layer/schemas.js";
import { SchemaLibraryOperations, type SchemaLibraryBehaviorPorts } from "./library-operations.js";

export interface SchemaLibraryPorts {
  storage: Pick<Storage, "getItem" | "setItem">;
  changed(schemas:readonly SchemaDefinition[]):void;
}

export class SchemaLibraryController {
  readonly #ports:SchemaLibraryPorts;
  readonly #initialProjection:readonly SchemaDefinition[];
  #schemas:SchemaDefinition[];
  #activeSchemaId:string | undefined;
  #draft:SchemaDefinition | undefined;
  #operations:SchemaLibraryOperations | undefined;

  constructor(ports:SchemaLibraryPorts) {
    this.#ports = ports;
    const stored = ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY);
    this.#schemas = restoreSchemaLibrary(stored);
    try {
      const parsed = JSON.parse(stored ?? "[]") as unknown;
      this.#initialProjection = Array.isArray(parsed) ? parsed as SchemaDefinition[] : [];
    } catch {
      this.#initialProjection = [];
    }
  }
  configure(behavior:SchemaLibraryBehaviorPorts):void { this.#operations = new SchemaLibraryOperations(this, behavior); }

  get schemas():SchemaDefinition[] { return structuredClone(this.#schemas); }
  get activeSchemaId():string | undefined { return this.#activeSchemaId; }
  get draft():SchemaDefinition | undefined { return this.#draft ? structuredClone(this.#draft) : undefined; }
  replaceSchemas(next:readonly SchemaDefinition[]):void { this.#schemas=structuredClone([...next]); }
  select(id:string,draft?:SchemaDefinition):void { this.#activeSchemaId=id;this.#draft=structuredClone(draft??this.#schemas.find((schema) => schema.id===id)); }
  setDraft(next:SchemaDefinition|undefined):void { this.#draft=next?structuredClone(next):undefined; }
  clearSelection():void { this.#activeSchemaId=undefined;this.#draft=undefined; }
  append(schema:SchemaDefinition):void { this.#schemas=[...this.#schemas,structuredClone(schema)];this.select(schema.id,schema); }

  activeIndex():number { return this.#schemas.findIndex(({ id }) => id === this.#activeSchemaId); }
  active():SchemaDefinition {
    const schema = this.#schemas[this.activeIndex()] ?? this.#draft;
    if (!schema) throw new Error("Open a schema before editing its draft");
    return schema;
  }
  replaceActive(schema:SchemaDefinition):void {
    const index = this.activeIndex();
    if (index < 0) {
      if (!this.#draft) throw new Error("Open a schema before editing its draft");
      this.#draft = structuredClone(schema);
      return;
    }
    this.#schemas = this.#schemas.map((candidate, candidateIndex) => candidateIndex === index ? schema : candidate);
    this.#draft = structuredClone(schema);
  }
  reload():void { this.#schemas = restoreSchemaLibrary(this.#ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY)); }
  serialize(next:readonly SchemaDefinition[] = this.#schemas):string {
    const storedById = new Map(this.#initialProjection.map((schema) => [schema.id, schema]));
    const entries = next.map((schema) => {
      const canonical = JSON.parse(serializeSchemaLibrary([schema]))[0] as SchemaDefinition;
      const stored = storedById.get(schema.id);
      return { canonical, changed:!stored || serializeSchemaLibrary([stored]) !== JSON.stringify([canonical]) };
    });
    return JSON.stringify([...entries.filter(({ changed }) => changed), ...entries.filter(({ changed }) => !changed)]
      .map(({ canonical }) => canonical));
  }
  persist():void {
    this.#ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, this.serialize());
    this.#ports.changed(this.#schemas);
  }
  openImportFile():void { this.#operations?.openImportFile(); }
  reviewImport(serialized:string):void { this.#operations?.reviewImport(serialized); }
  async readImportFile():Promise<void> { await this.#operations?.readImportFile(); }
  replaceImport():void { this.#operations?.replaceImport(); }
  appendImport():void { this.#operations?.appendImport(); }
  cancelImport():void { this.#operations?.cancelImport(); }
  requestDeletion(id:string):boolean { return this.#operations?.requestDeletion(id) ?? false; }
  confirmDeletion():void { this.#operations?.confirmDeletion(); }
  cancelDeletion():void { this.#operations?.cancelDeletion(); }
  openExportChoices(trigger:HTMLButtonElement, schema?:SchemaDefinition):void { this.#operations?.openExportChoices(trigger,schema); }
  requestExport():void { this.#operations?.requestExport(); }
  omittedStatus(count:number):string { return this.#operations?.omittedStatus(count) ?? `${count} omitted ${count === 1 ? "rule" : "rules"}`; }
  resetBehaviorState():void { this.#operations?.reset(); }
}
