import { createSchema, type SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { SchemaSourceDraftInput } from "./contracts.js";
import { schemaDocumentFromValue } from "./schema-model.js";

interface SchemaSourcePorts {
  setDraft(schema:SchemaDefinition|undefined):void;
  setSelectedPath(path:string):void;
  showSchemas():void;
  render():void;
  result(message:string):void;
  focusName():void;
}

/** Owns creation of transient Schema drafts from new and captured sources. */
export class SchemaSourceController {
  readonly #ports:SchemaSourcePorts;
  constructor(ports:SchemaSourcePorts) { this.#ports=ports; }
  createEmpty():void {
    const created=createSchema("",1,{ type:"object" }), transient:SchemaDefinition={ ...created,published:false,
      workingDraft:{ name:"",baseVersion:1,sourceVersion:1,document:{ type:"object" },assignments:[],pendingChanges:[] } };
    this.#ports.setDraft(transient); this.#ports.setSelectedPath(""); this.#ports.render(); this.#ports.focusName();
  }
  open(source:SchemaSourceDraftInput):SchemaDefinition {
    const inferred=schemaDocumentFromValue(source.payload), document:SchemaDefinition["document"]=inferred.type==="object"
      ? inferred : { type:"object",properties:{ value:inferred } }, assignment={ sourceId:source.sourceId,eventName:source.eventName,target:"payload" as const },
      created=createSchema(`${source.name} schema`,1,document), schema:SchemaDefinition={ ...created,published:false,assignments:[assignment],
        workingDraft:{ baseVersion:1,sourceVersion:1,document:structuredClone(document),assignments:[assignment],pendingChanges:["Create schema from captured source"] } };
    this.#ports.setDraft(schema); this.#ports.setSelectedPath(Object.keys(document.properties ?? {})[0] ?? "value"); this.#ports.showSchemas(); this.#ports.render();
    this.#ports.result(`${source.label} fields loaded into a new schema draft.`); this.#ports.focusName(); return structuredClone(schema);
  }
}
