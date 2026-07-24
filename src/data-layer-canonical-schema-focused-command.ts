import {canonicalCommandOutcome,type CanonicalCommand,type CanonicalCommandResult,type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";

export interface CanonicalFocusedCommandContext {
  current:()=>CanonicalSchemaDocument;dispatch:(command:CanonicalCommand)=>CanonicalCommandResult;renderAfterDispatch:boolean|undefined;host:HTMLElement;setFeedback:(message:string)=>void;render:()=>void;
}

export function dispatchFocusedCanonicalCommand(next:CanonicalCommand,context:CanonicalFocusedCommandContext):CanonicalCommandResult {
  const prior=context.current(),result=context.dispatch(next);
  if(result.status==="conflict")context.setFeedback(result.message);
  else if(result.status==="applied"||result.status==="rebased")context.setFeedback(canonicalCommandOutcome(next,result,prior));
  if((context.renderAfterDispatch!==false||result.status==="confirmation-required"||next.kind==="add"||next.kind==="select"||next.kind==="duplicate"||next.kind==="move"||next.kind==="delete"||next.kind==="rename"||next.kind==="type"||next.kind==="set"||next.kind==="view")&&context.host.isConnected)context.render();
  return result;
}
