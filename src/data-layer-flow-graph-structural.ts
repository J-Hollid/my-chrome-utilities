import type {DocumentaryPageFrameRecord} from "./data-layer-flow-graph.js";

/** Create the persisted copy for a Page frame without changing its semantic placement. */
export function duplicatePageFrameRecord(source:DocumentaryPageFrameRecord,id:string):DocumentaryPageFrameRecord {
  const copy=structuredClone(source) as DocumentaryPageFrameRecord;
  copy.id=id;
  copy.position={x:Math.max(20,Math.round((source.position.x??40)+240)),y:source.position.y};
  return copy;
}
