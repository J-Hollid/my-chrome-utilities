import {agentKinds, type AgentProposal, type AgentChange} from "./types.js";

export const record = (input:unknown):input is Record<string, unknown> =>
  input !== null && typeof input === "object" && !Array.isArray(input);
export function parseRecord(text:string):Record<string, unknown> {
  const value:unknown = JSON.parse(text);
  if (!record(value)) throw new Error("A proposed record must be a JSON object.");
  const visit = (entry:unknown):void => {
    if (!entry || typeof entry !== "object") return;
    for (const [key, child] of Object.entries(entry)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) throw new Error(`Unsupported field: ${key}`);
      visit(child);
    }
  };
  visit(value);
  return value;
}
const text = (value:unknown):value is string => typeof value === "string";
const texts = (value:unknown):value is string[] => Array.isArray(value) && value.every(text);
export function parseProposal(input:unknown):AgentProposal {
  if (!record(input) || !text(input.summary) || !Array.isArray(input.changes) ||
      !Array.isArray(input.templates) || !Array.isArray(input.coverage) || !texts(input.questions)) {
    throw new Error("The agent did not return a complete proposal.");
  }
  if (input.changes.length > 1000 || input.templates.length > 30) throw new Error("Split this task into smaller sections.");
  const identities = new Set<string>();
  for (const item of input.changes) {
    if (!record(item) || !text(item.id) || !/^[a-zA-Z0-9:_-]{1,160}$/u.test(item.id) || identities.has(item.id) ||
        !agentKinds.includes(item.kind as AgentChange["kind"]) || !["create", "update", "reuse"].includes(String(item.action)) ||
        !(item.targetId === null || text(item.targetId)) || !text(item.name) || !item.name.trim() ||
        !text(item.recordJson) || !text(item.reason) || !texts(item.dependsOn) || !texts(item.questions) || !Array.isArray(item.sources)) {
      throw new Error("A proposed change has invalid fields or a duplicate identity.");
    }
    parseRecord(item.recordJson);
    for (const source of item.sources) if (!record(source) || !text(source.fileId) || !text(source.sheet) || !text(source.range)) throw new Error("A source reference is invalid.");
    identities.add(item.id);
  }
  for (const item of input.templates) {
    if (!record(item) || !text(item.id) || !/^[a-zA-Z0-9_-]{1,100}$/u.test(item.id) || identities.has(item.id) || !text(item.name) ||
        !["overview", "flow", "matrix", "profile"].includes(String(item.kind)) ||
        !text(item.fileId) || !text(item.sheet) || !text(item.prototypeJson) || !texts(item.limitations)) throw new Error("A template proposal is invalid.");
    parseRecord(item.prototypeJson);
    identities.add(item.id);
  }
  for (const item of input.coverage) if (!record(item) || !text(item.fileId) || !text(item.sheet) ||
      !text(item.range) || !text(item.reason) || !["mapped", "excluded", "unresolved"].includes(String(item.status))) throw new Error("A coverage entry is invalid.");
  return structuredClone(input) as unknown as AgentProposal;
}

export function stableJson(value:unknown):string {
  const sort = (entry:unknown):unknown => Array.isArray(entry) ? entry.map(sort) : record(entry)
    ? Object.fromEntries(Object.keys(entry).sort().map(key => [key, sort(entry[key])])) : entry;
  return JSON.stringify(sort(value));
}
