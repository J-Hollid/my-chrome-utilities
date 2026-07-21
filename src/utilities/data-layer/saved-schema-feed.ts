export interface SavedSchemaFeedReconciliation<T>{mode:"unknown"|"unchanged"|"install"|"close"|"conflict";draft?:T;baseline?:T;incoming?:T;}

const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);

export function reconcileSavedSchemaFeed<T>(input:{baseline?:T;draft?:T;incoming?:T;cleanProjection:(schema:T)=>T;editableProjection?:(schema:T)=>unknown}):SavedSchemaFeedReconciliation<T>{
  const{baseline,draft,incoming}=input;
  if(!draft)return incoming?{mode:"install",baseline:structuredClone(incoming)}:{mode:"unchanged"};
  if(!baseline)return{mode:"unknown",draft:structuredClone(draft)};
  const editable=input.editableProjection??((schema:T)=>schema),project=(schema:T)=>editable(input.cleanProjection(schema)),draftProjection=editable(draft),clean=same(draftProjection,project(baseline)),remoteChanged=!same(incoming,baseline);
  if(!remoteChanged)return{mode:"unchanged",draft:structuredClone(draft),baseline:structuredClone(baseline)};
  if(incoming&&same(draftProjection,project(incoming)))return{mode:"install",draft:input.cleanProjection(incoming),baseline:structuredClone(incoming)};
  if(!clean)return{mode:"conflict",draft:structuredClone(draft),baseline:structuredClone(baseline),...(incoming?{incoming:structuredClone(incoming)}:{})};
  return incoming?{mode:"install",draft:input.cleanProjection(incoming),baseline:structuredClone(incoming)}:{mode:"close"};
}
