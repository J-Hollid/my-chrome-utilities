import {conditionMatches,type Condition,type ProjectEntity,type SpecificationProject} from "./data-layer-specification-project.js";

export type GuidedAssignmentConditionKind="Environment"|"Host"|"Pathname"|"Query"|"Hash"|"Context data";
export interface GuidedAssignmentConditionDescriptor {kind:GuidedAssignmentConditionKind;guidedInput:string;field:string;comparisons:readonly string[];valueKind:"environment"|"text"|"typed"|"schema-property";}

export const guidedAssignmentConditionKinds:readonly GuidedAssignmentConditionDescriptor[]=[
  {kind:"Environment",guidedInput:"one configured project environment",field:"environment",comparisons:["equals","does not equal"],valueKind:"environment"},
  {kind:"Host",guidedInput:"host comparison and host value",field:"host",comparisons:["equals","does not equal","starts with","matches pattern"],valueKind:"text"},
  {kind:"Pathname",guidedInput:"exact, starts-with, or pattern comparison and path",field:"pathname",comparisons:["equals","starts with","matches pattern"],valueKind:"text"},
  {kind:"Query",guidedInput:"parameter name, comparison, and typed value",field:"query",comparisons:["equals","does not equal","exists","does not exist","is one of"],valueKind:"typed"},
  {kind:"Hash",guidedInput:"hash comparison and value",field:"hash",comparisons:["equals","does not equal","starts with","matches pattern"],valueKind:"text"},
  {kind:"Context data",guidedInput:"schema property, compatible comparison, and typed value",field:"context",comparisons:["equals","does not equal","exists","does not exist","is one of","is greater than","is at least","is less than","is at most"],valueKind:"schema-property"},
] as const;

export interface AssignmentRoutingEvidence {accepted:boolean;evidence:string;}
export interface AssignmentRoutingCandidate {assignmentId:string;name:string;priority:number;event:AssignmentRoutingEvidence;applicability:AssignmentRoutingEvidence;reasons:string[];resolution:"winner"|"tied"|"lower priority"|"rejected";}
export interface AssignmentRoutingResult {summary:string;candidates:AssignmentRoutingCandidate[];winner?:{assignmentId:string;name:string};ties:{assignmentId:string;name:string}[];}

const fieldLabel=(field:string):string=>field.split(/[./]/).filter(Boolean)[0]??"applicability";
function rejectedConditionFields(condition:Condition,observation:Record<string,unknown>):string[]{
  if(conditionMatches(condition,observation))return[];
  if(condition.kind==="predicate")return[fieldLabel(condition.field)];
  if(condition.kind==="not")return["applicability"];
  const children=condition.conditions.flatMap((child)=>rejectedConditionFields(child,observation));
  return children.length?[...new Set(children)]:["applicability"];
}

export function testAssignmentRouting(project:Pick<SpecificationProject,"collections">,observation:Record<string,unknown>):AssignmentRoutingResult{
  const preliminary=project.collections.assignments.map((assignment:ProjectEntity)=>{
    const event=project.collections.events.find(({id})=>id===assignment.eventId),eventName=String(event?.eventName??event?.name??""),sourceAccepted=String(assignment.sourceId??event?.sourceId??"")===String(observation.sourceId??""),eventAccepted=Boolean(event)&&eventName===String(observation.eventName??""),set=project.collections.applicabilitySets.find(({id})=>id===assignment.applicabilitySetId),condition=set?.condition as Condition|undefined,applicabilityAccepted=!assignment.applicabilitySetId||Boolean(set)&&(!condition||conditionMatches(condition,observation)),reasons:string[]=[];
    if(!sourceAccepted)reasons.push("source");
    if(!eventAccepted)reasons.push("Event");
    if(!applicabilityAccepted)reasons.push(...(condition?rejectedConditionFields(condition,observation):["applicability"]));
    return{assignmentId:assignment.id,name:assignment.name,priority:Number(assignment.priority??0),event:{accepted:sourceAccepted&&eventAccepted,evidence:`Source ${sourceAccepted?"accepted":"rejected"}; Event ${eventAccepted?"accepted":"rejected"} (${(event?.name??eventName)||"missing Event"})`},applicability:{accepted:applicabilityAccepted,evidence:applicabilityAccepted?`${set?.name??"No Applicability Set"} accepted`:`${set?.name??"Applicability Set"} rejected by ${reasons.filter((reason)=>reason!=="source"&&reason!=="Event").join(", ")||"applicability"}`},reasons:[...new Set(reasons)]};
  }),matches=preliminary.filter(({reasons})=>!reasons.length).sort((left,right)=>right.priority-left.priority),highest=matches[0]?.priority,tied=matches.filter(({priority})=>priority===highest),winner=tied.length===1?tied[0]:undefined,ties=tied.length>1?tied.map(({assignmentId,name})=>({assignmentId,name})):[],candidates:AssignmentRoutingCandidate[]=preliminary.map((candidate)=>({...candidate,resolution:candidate.reasons.length?"rejected":ties.some(({assignmentId})=>assignmentId===candidate.assignmentId)?"tied":winner?.assignmentId===candidate.assignmentId?"winner":"lower priority"}));
  if(winner)return{summary:`${winner.name} is the sole winner`,candidates,winner:{assignmentId:winner.assignmentId,name:winner.name},ties};
  if(ties.length)return{summary:`Routing is ambiguous between ${ties.map(({name})=>name).join(" and ")}`,candidates,ties};
  const only=candidates.length===1?candidates[0]:undefined,reason=only?.reasons[0];
  return{summary:only&&reason?`${only.name} is rejected by ${reason}`:"No Assignment matched",candidates,ties};
}
