export type ProjectEntityKind = "profiles" | "pages" | "pageGroups" | "events" | "applicabilitySets" | "flows" | "fixtures";
export type IdFactory = (kind: string) => string;

export interface Requirement { path: string; type?: string; required?: boolean; forbidden?: boolean; allowedValues?: readonly unknown[]; origin?: string; }
export interface ProjectEntity { id: string; name: string; [key: string]: unknown; }
export interface Profile extends ProjectEntity { requirements: Requirement[]; }
export interface Predicate { kind: "predicate"; field: string; operator: string; value?: unknown; }
export interface ConditionGroup { kind: "all" | "any" | "not"; conditions: Condition[]; }
export type Condition = Predicate | ConditionGroup;
export interface SpecificationCollections {
  profiles: Profile[];
  pages: ProjectEntity[];
  pageGroups: ProjectEntity[];
  events: ProjectEntity[];
  applicabilitySets: ProjectEntity[];
  flows: ProjectEntity[];
  fixtures: ProjectEntity[];
}
export interface ProjectRelease extends ProjectEntity { revision: number; createdAt: string; snapshot: SpecificationCollections; }
export interface SpecificationProject extends ProjectEntity {
  description: string;
  site: string;
  environments: string[];
  namingConventions: Record<string, string>;
  publicationPolicy: { warningsBlock: boolean; fixturesRequired: boolean };
  collections: SpecificationCollections;
  releases: ProjectRelease[];
  currentRelease?: string;
  compatibility?: { legacySnapshot: string };
}
export interface ProjectState {
  project: SpecificationProject;
  draft?: { id: string; status: "Saved" | "Saving" | "Recovery required"; updatedAt: string };
  history: { undo: { label: string; project: SpecificationProject }[]; redo: { label: string; project: SpecificationProject }[] };
}

const clone = <T>(value: T): T => structuredClone(value);
const now = (): string => new Date().toISOString();

export function createSpecificationProject(input: { name: string; description?: string; site: string; environments?: readonly string[]; id: IdFactory }): ProjectState {
  const project: SpecificationProject = {
    id:input.id("project"), name:input.name, description:input.description ?? "", site:input.site,
    environments:[...(input.environments ?? ["Production"])],
    namingConventions:{ property:"snake_case", event:"snake_case" },
    publicationPolicy:{ warningsBlock:false, fixturesRequired:true },
    collections:{ profiles:[], pages:[], pageGroups:[], events:[], applicabilitySets:[], flows:[], fixtures:[] },
    releases:[],
  };
  return { project, draft:{ id:input.id("draft"), status:"Saved", updatedAt:now() }, history:{ undo:[], redo:[] } };
}

export function transactProject(state: ProjectState, label: string, update: (project: SpecificationProject) => SpecificationProject): ProjectState {
  if (!state.draft) throw new Error("Create or restore a project draft before editing.");
  const before = clone(state.project); const project = update(clone(state.project));
  if (project.id !== state.project.id) throw new Error("A project transaction cannot replace project identity.");
  return { project, draft:{ ...state.draft, status:"Saved", updatedAt:now() }, history:{ undo:[...state.history.undo, { label, project:before }], redo:[] } };
}

export function undoProjectTransaction(state: ProjectState): ProjectState {
  const entry = state.history.undo.at(-1); if (!entry) return state;
  return { ...state, project:clone(entry.project), history:{ undo:state.history.undo.slice(0,-1), redo:[...state.history.redo,{ label:entry.label, project:clone(state.project) }] } };
}

export function redoProjectTransaction(state: ProjectState): ProjectState {
  const entry = state.history.redo.at(-1); if (!entry) return state;
  return { ...state, project:clone(entry.project), history:{ undo:[...state.history.undo,{ label:entry.label, project:clone(state.project) }], redo:state.history.redo.slice(0,-1) } };
}

export function addProjectEntity<T extends Omit<ProjectEntity,"id">>(state: ProjectState, kind: ProjectEntityKind, entity: T, id: IdFactory): ProjectState {
  return transactProject(state,`Add ${entity.name}`,(project)=>({ ...project, collections:{ ...project.collections, [kind]:[...project.collections[kind], { ...clone(entity), id:id(kind.slice(0,-1) || kind) }] } } as SpecificationProject));
}

export function composeRequirementProfiles(profiles: readonly Pick<Profile,"id"|"name"|"requirements">[]): { requirements: Requirement[]; conflicts: { path: string; origins: string[]; reason: string }[] } {
  const requirements = new Map<string,Requirement>(); const conflicts: { path:string; origins:string[]; reason:string }[] = [];
  for (const profile of profiles) for (const requirement of profile.requirements) {
    const prior = requirements.get(requirement.path);
    if (prior && prior.type && requirement.type && prior.type !== requirement.type) conflicts.push({ path:requirement.path, origins:[prior.origin ?? "unknown",profile.id], reason:`Incompatible types ${prior.type} and ${requirement.type}` });
    if (prior?.required && requirement.forbidden || prior?.forbidden && requirement.required) conflicts.push({ path:requirement.path, origins:[prior.origin ?? "unknown",profile.id], reason:"Required and forbidden conflict" });
    const allowedValues = prior?.allowedValues && requirement.allowedValues ? prior.allowedValues.filter((value)=>requirement.allowedValues!.some((candidate)=>Object.is(candidate,value))) : requirement.allowedValues ?? prior?.allowedValues;
    if (prior?.allowedValues && requirement.allowedValues && !allowedValues?.length) conflicts.push({ path:requirement.path, origins:[prior.origin ?? "unknown",profile.id], reason:"Allowed-value intersection is empty" });
    requirements.set(requirement.path,{ ...prior, ...clone(requirement), ...(allowedValues ? { allowedValues } : {}), origin:profile.id });
  }
  return { requirements:[...requirements.values()], conflicts };
}

function fieldValue(context: Record<string,unknown>, field: string): unknown {
  if (field.startsWith("payload.")) return field.slice(8).split(".").reduce<unknown>((value,key)=>value && typeof value === "object" ? (value as Record<string,unknown>)[key] : undefined,context.payload);
  return context[field];
}
function predicateMatches(predicate: Predicate, context: Record<string,unknown>): boolean {
  const actual=fieldValue(context,predicate.field), expected=predicate.value;
  if (predicate.operator === "exists") return actual !== undefined;
  if (predicate.operator === "equals") return String(actual) === String(expected);
  if (predicate.operator === "contains") return String(actual).includes(String(expected));
  if (predicate.operator === "glob") return new RegExp(`^${String(expected).replace(/[.+^${}()|[\]\\]/g,"\\$&").replaceAll("*",".*")}$`).test(String(actual));
  if (predicate.operator === "regex") { try { return new RegExp(String(expected)).test(String(actual)); } catch { return false; } }
  return false;
}
export function conditionMatches(condition: Condition, context: Record<string,unknown>): boolean {
  if (condition.kind === "predicate") return predicateMatches(condition,context);
  if (condition.kind === "all") return condition.conditions.every((item)=>conditionMatches(item,context));
  if (condition.kind === "any") return condition.conditions.some((item)=>conditionMatches(item,context));
  return !condition.conditions.some((item)=>conditionMatches(item,context));
}

export function resolveApplicability(project: SpecificationProject, context: Record<string,unknown>): { candidates: { id:string; name:string; matched:boolean; priority:number; evidence:string }[]; winner?: { id:string; name:string }; ties: { id:string; name:string }[] } {
  const candidates = project.collections.applicabilitySets.map((entry)=>{ const condition=entry.condition as Condition|undefined; const matched=condition ? conditionMatches(condition,context) : false; return { id:entry.id,name:entry.name,matched,priority:Number(entry.priority??0),evidence:matched?"All configured predicates matched":"At least one predicate did not match" }; });
  const matched=candidates.filter(({matched})=>matched).sort((a,b)=>b.priority-a.priority), top=matched[0]?.priority, ties=matched.filter(({priority})=>priority===top).map(({id,name})=>({id,name}));
  return { candidates, ...(ties.length===1 ? { winner:ties[0] } : {}), ties };
}

const valueAtPath = (payload: unknown,path:string): unknown => path.split("/").filter(Boolean).reduce<unknown>((value,key)=>value && typeof value === "object" ? (value as Record<string,unknown>)[key] : undefined,payload);
export function runProjectFixture(project: SpecificationProject, fixture: ProjectEntity): { status:"pass"|"fail"; issues:string[]; applicability:ReturnType<typeof resolveApplicability> } {
  const profiles=(fixture.profileIds as string[]|undefined ?? []).map((id)=>project.collections.profiles.find((profile)=>profile.id===id)).filter((profile):profile is Profile=>Boolean(profile));
  const composed=composeRequirementProfiles(profiles), payload=fixture.payload, issues=[...composed.conflicts.map(({reason,path})=>`${path}: ${reason}`)];
  for(const requirement of composed.requirements){const value=valueAtPath(payload,requirement.path);if(requirement.required&&value===undefined)issues.push(`${requirement.path}: Required value`);if(requirement.forbidden&&value!==undefined)issues.push(`${requirement.path}: Forbidden value`);if(value!==undefined&&requirement.allowedValues&&!requirement.allowedValues.some((candidate)=>Object.is(candidate,value)))issues.push(`${requirement.path}: Value is not allowed`);}
  const applicability=resolveApplicability(project,(fixture.context as Record<string,unknown>|undefined)??{});if(applicability.ties.length>1)issues.push("Applicability is ambiguous");
  return { status:issues.length?"fail":"pass",issues,applicability };
}

function predicateFields(condition: Condition|undefined): Map<string,string> { const fields=new Map<string,string>(); if(!condition)return fields;if(condition.kind==="predicate"){if(condition.operator==="equals")fields.set(condition.field,String(condition.value));return fields;}for(const item of condition.conditions)for(const [field,value]of predicateFields(item))fields.set(field,value);return fields; }
export function projectPreflight(project: SpecificationProject): { blockers:{kind:string;message:string;ids:string[]}[]; warnings:{kind:string;message:string;ids:string[]}[] } {
  const blockers:{kind:string;message:string;ids:string[]}[]=[];
  const sets=project.collections.applicabilitySets;
  for(let left=0;left<sets.length;left+=1)for(let right=left+1;right<sets.length;right+=1){const a=sets[left]!,b=sets[right]!;if(Number(a.priority??0)!==Number(b.priority??0))continue;const af=predicateFields(a.condition as Condition|undefined),bf=predicateFields(b.condition as Condition|undefined);let exclusive=false;for(const [field,value]of af)if(bf.has(field)&&bf.get(field)!==value)exclusive=true;if(!exclusive)blockers.push({kind:"ambiguous-applicability",message:`${a.name} and ${b.name} can tie`,ids:[a.id,b.id]});}
  for(const fixture of project.collections.fixtures){const result=runProjectFixture(project,fixture),expected=fixture.expect??"pass";if(result.status!==expected)blockers.push({kind:"fixture-outcome",message:`${fixture.name} was ${result.status}, expected ${expected}`,ids:[fixture.id]});}
  return {blockers,warnings:[]};
}

const supportedTypes=new Set(["string","number","boolean","object","array"]);
export function commitBulkProperties(state:ProjectState,profileId:string,properties:readonly {path:string;type:string}[]):{state:ProjectState;errors:{index:number;path:string;message:string}[]}{const errors=properties.flatMap((property,index)=>!property.path.startsWith("/")?[{index,path:property.path,message:"Use a canonical /path"}]:!supportedTypes.has(property.type)?[{index,path:property.path,message:"Choose a supported type"}]:[]);if(errors.length)return{state,errors};return{errors:[],state:transactProject(state,`Import ${properties.length} properties`,(project)=>({...project,collections:{...project.collections,profiles:project.collections.profiles.map((profile)=>profile.id===profileId?{...profile,requirements:[...profile.requirements,...properties.map((property)=>({...property}))]}:profile)}}))};}
export function applyBulkRequirement(state:ProjectState,profileId:string,paths:readonly string[],update:Partial<Requirement>):ProjectState{return transactProject(state,`Update ${paths.length} requirements`,(project)=>({...project,collections:{...project.collections,profiles:project.collections.profiles.map((profile)=>profile.id===profileId?{...profile,requirements:profile.requirements.map((requirement)=>paths.includes(requirement.path)?{...requirement,...update}:requirement)}:profile)}}));}

export function publishProjectRelease(state:ProjectState,options:{id:IdFactory;write:(project:SpecificationProject)=>void}):ProjectState {if(!state.draft)throw new Error("There is no project draft to publish.");const preflight=projectPreflight(state.project);if(preflight.blockers.length)throw new Error(`Project preflight has ${preflight.blockers.length} blockers.`);const revision=state.project.releases.length+1,release:ProjectRelease={id:options.id("release"),name:`Release ${revision}`,revision,createdAt:now(),snapshot:clone(state.project.collections)};const project={...state.project,releases:[...state.project.releases,release],currentRelease:release.id};options.write(project);return{project,history:{undo:[],redo:[]}};}

export function exportSpecificationProject(project:SpecificationProject):string{return JSON.stringify({format:"my-chrome-utilities.specification-project",version:1,project});}
export function importSpecificationProject(serialized:string,options:{existingProjects:readonly SpecificationProject[];id:IdFactory}):{project:SpecificationProject;collisions:string[]}{const parsed=JSON.parse(serialized) as {format?:string;version?:number;project?:SpecificationProject};if(parsed.format!=="my-chrome-utilities.specification-project"||parsed.version!==1||!parsed.project)throw new Error("Unsupported Specification Project format.");const collisions=options.existingProjects.some(({id})=>id===parsed.project!.id)?[parsed.project.id]:[];return{project:clone(parsed.project),collisions};}

export function migrateLegacyLibrary(legacy:{schemas?:readonly Record<string,unknown>[];rules?:readonly Record<string,unknown>[]},options:{id:IdFactory}):{project:SpecificationProject;issues:{sourceId:string;message:string}[]}{const state=createSpecificationProject({name:"Legacy Schema Library",site:"compatibility.local",id:options.id});const issues:{sourceId:string;message:string}[]=[];const events=(legacy.schemas??[]).flatMap((schema)=>((schema.assignments as readonly Record<string,unknown>[]|undefined)??[]).flatMap((assignment)=>{if(!assignment.id||!assignment.eventName)return issues.push({sourceId:String(assignment.id??schema.id??"unknown"),message:"Assignment identity or event name is unresolved"}),[];return[{id:String(assignment.id),name:String(assignment.eventName),eventName:assignment.eventName,sourceId:assignment.sourceId,target:assignment.target,legacySchemaId:schema.id}];}));const profiles=(legacy.schemas??[]).map((schema)=>({id:String(schema.id),name:String(schema.name??schema.id),requirements:[],legacyVersion:schema.version}));return{project:{...state.project,collections:{...state.project.collections,profiles,events},compatibility:{legacySnapshot:JSON.stringify(legacy)}},issues};}
