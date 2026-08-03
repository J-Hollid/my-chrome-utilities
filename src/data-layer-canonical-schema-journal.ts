const clone=<T>(value:T):T=>structuredClone(value);
const record=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
const journalKeys=new Set(["changes","commandJournal","patchJournal","editJournal","editCountRevision"]);

export function journalFreeCanonicalData<T>(value:T):T{
  const visit=(candidate:unknown):unknown=>{
    if(Array.isArray(candidate))return candidate.map(visit);
    if(!record(candidate))return clone(candidate);
    const canonical=candidate.state==="Draft"&&record(candidate.nodes)&&Array.isArray(candidate.rootIds);
    return Object.fromEntries(Object.entries(candidate).flatMap(([key,entry])=>canonical&&journalKeys.has(key)?[]:[[key,visit(entry)]]));
  };
  return visit(value) as T;
}
