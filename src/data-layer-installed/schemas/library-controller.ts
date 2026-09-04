import {
  SCHEMA_LIBRARY_STORAGE_KEY,
  restoreSchemaLibrary,
  serializeSchemaLibrary,
  type SchemaDefinition,
} from "../../utilities/data-layer/schemas.js";

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

  get schemas():SchemaDefinition[] { return this.#schemas; }
  set schemas(next:SchemaDefinition[]) { this.#schemas = next; }
  get activeSchemaId():string | undefined { return this.#activeSchemaId; }
  set activeSchemaId(next:string | undefined) { this.#activeSchemaId = next; }
  get draft():SchemaDefinition | undefined { return this.#draft; }
  set draft(next:SchemaDefinition | undefined) { this.#draft = next; }

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
}
