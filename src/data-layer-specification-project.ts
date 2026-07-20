import {canonicalConstraints,canonicalRequirements,canonicalSchemaFromJsonSchema,canonicalSchemaWithConstraint,createCanonicalSchema,type CanonicalMigrationPlan,type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";

export type ProjectEntityKind = "profiles" | "pages" | "pageGroups" | "events" | "applicabilitySets" | "flows" | "fixtures" | "schemaDrafts" | "assignments";
export type IdFactory = (kind: string) => string;

export interface Requirement { path: string; type?: string; required?: boolean; forbidden?: boolean; allowedValues?: readonly unknown[]; description?:string; examples?:readonly unknown[]; rules?:readonly Record<string,unknown>[]; introducedIn?:string; origin?: string; evaluationResultIdentity?:string; }
export interface ProjectEntity { id: string; name: string; [key: string]: unknown; }
export interface Profile extends ProjectEntity { requirements: Requirement[]; canonicalSchema?:CanonicalSchemaDocument; }
export interface Predicate { kind: "predicate"; field: string; operator: string; value?: unknown; values?: readonly unknown[]; pattern?: string; valuePath?: string; }
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
  schemaDrafts: ProjectEntity[];
  assignments: ProjectEntity[];
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
  draft?: { id: string; status: "Saved" | "Saving" | "Recovery required" | "Save failed"; updatedAt: string; restoredFromRelease?: string };
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
    collections:{ profiles:[], pages:[], pageGroups:[], events:[], applicabilitySets:[], flows:[], fixtures:[], schemaDrafts:[], assignments:[] },
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

export function confirmCanonicalMigration(state:ProjectState,plan:CanonicalMigrationPlan):ProjectState {
  if(plan.conflicts.length)throw new Error(`Resolve ${plan.conflicts.length} canonical migration conflict${plan.conflicts.length===1?"":"s"} before confirming.`);
  return transactProject(state,"Migrate legacy schema to canonical document",(project)=>({...project,collections:{...project.collections,profiles:project.collections.profiles.map((profile)=>{
    if(profile.id!==plan.profileId)return profile;
    const next={...profile,requirements:[],canonicalSchema:clone(plan.document)} as ProjectEntity;
    delete next.structuredSchema;delete next.structuredDraft;delete next.schemaConstraints;
    return next as Profile;
  })}}));
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
  const identity=id(kind.slice(0,-1)||kind),added={...clone(entity),id:identity} as unknown as ProjectEntity,canonical=added.canonicalSchema as CanonicalSchemaDocument|undefined;if(canonical){canonical.contributorId=identity;canonical.contributorName=String(entity.name);}
  return transactProject(state,`Add ${entity.name}`,(project)=>({ ...project, collections:{ ...project.collections, [kind]:[...project.collections[kind],added] } } as SpecificationProject));
}

export function composeRequirementProfiles(profiles: readonly Pick<Profile,"id"|"name"|"requirements"|"canonicalSchema">[]): { requirements: Requirement[]; conflicts: { path: string; origins: string[]; reason: string }[] } {
  const requirements = new Map<string,Requirement>(); const conflicts: { path:string; origins:string[]; reason:string }[] = [];
  for (const profile of profiles) for (const requirement of profile.canonicalSchema?canonicalRequirements(profile.canonicalSchema):profile.requirements) {
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
  if(field.startsWith("/"))return field.split("/").filter(Boolean).reduce<unknown>((value,key)=>value&&typeof value==="object"?(value as Record<string,unknown>)[key]:undefined,context.payload??context);
  if (field.startsWith("payload.")) return field.slice(8).split(".").reduce<unknown>((value,key)=>value && typeof value === "object" ? (value as Record<string,unknown>)[key] : undefined,context.payload);
  return field.split(".").reduce<unknown>((value,key)=>value&&typeof value==="object"?(value as Record<string,unknown>)[key]:undefined,context);
}
function predicateMatches(predicate: Predicate, context: Record<string,unknown>): boolean {
  const actual=fieldValue(context,predicate.field),expected=predicate.valuePath?fieldValue(context,predicate.valuePath):predicate.value,operator=predicate.operator.toLowerCase().replaceAll("_","-");
  if(operator==="exists")return actual!==undefined;
  if(operator==="does not exist")return actual===undefined;
  if(operator==="equals")return Object.is(actual,expected);
  if(operator==="does not equal"||operator==="not equals")return!Object.is(actual,expected);
  if(operator==="is one of")return(predicate.values??(Array.isArray(expected)?expected:[])).some((candidate)=>Object.is(candidate,actual));
  if(operator==="contains")return String(actual).includes(String(expected));
  if(operator==="glob")return new RegExp(`^${String(expected).replace(/[.+^${}()|[\]\\]/g,"\\$&").replaceAll("*",".*")}$`).test(String(actual));
  if(operator==="regex"||operator==="matches pattern"){try{return new RegExp(predicate.pattern??String(expected)).test(String(actual));}catch{return false;}}
  if(typeof actual==="number"&&typeof expected==="number"){
    if(operator==="is greater than")return actual>expected;
    if(operator==="is at least")return actual>=expected;
    if(operator==="is less than")return actual<expected;
    if(operator==="is at most")return actual<=expected;
  }
  return false;
}
export function conditionMatches(condition: Condition, context: Record<string,unknown>): boolean {
  if (condition.kind === "predicate") return predicateMatches(condition,context);
  if (condition.kind === "all") return condition.conditions.every((item)=>conditionMatches(item,context));
  if (condition.kind === "any") return condition.conditions.some((item)=>conditionMatches(item,context));
  return !condition.conditions.some((item)=>conditionMatches(item,context));
}

function lifecycleAssignments(project:SpecificationProject):ProjectEntity[]{
  if(project.collections.assignments.length)return project.collections.assignments;
  const embedded=project.collections.schemaDrafts.flatMap((entry)=>{
    const schema=entry as unknown as SchemaDefinition;
    return [...(schema.workingDraft?.assignments??schema.assignments??[])].map((assignment)=>({...clone(assignment),id:assignment.id??`${schema.id}:${assignment.sourceId}:${assignment.eventName}:${assignment.target}`,name:assignment.name??assignment.eventName,schemaId:schema.id,...(assignment.schemaVersion!==undefined?{schemaRevision:assignment.schemaVersion}:{})}));
  });
  return embedded.length?embedded:project.collections.assignments;
}

export function resolveApplicability(project: SpecificationProject, context: Record<string,unknown>): { candidates: { id:string; name:string; matched:boolean; priority:number; evidence:string }[]; winner?: { id:string; name:string }; ties: { id:string; name:string }[] } {
  const candidates = [...project.collections.applicabilitySets,...lifecycleAssignments(project)].map((entry)=>{ const condition=entry.condition as Condition|undefined; const matched=condition ? conditionMatches(condition,context) : false; return { id:entry.id,name:entry.name,matched,priority:Number(entry.priority??0),evidence:matched?"All configured predicates matched":"At least one predicate did not match" }; });
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

function conditionConstraints(condition:Condition|undefined,negated=false):{equals:Map<string,string>;notEquals:Map<string,Set<string>>}{const equals=new Map<string,string>(),notEquals=new Map<string,Set<string>>();if(!condition)return{equals,notEquals};if(condition.kind==="predicate"&&condition.operator==="equals"){const value=String(condition.value);if(negated){const values=notEquals.get(condition.field)??new Set<string>();values.add(value);notEquals.set(condition.field,values);}else equals.set(condition.field,value);return{equals,notEquals};}if(condition.kind==="all"||condition.kind==="not")for(const item of condition.conditions){const child=conditionConstraints(item,condition.kind==="not"?!negated:negated);for(const[field,value]of child.equals)equals.set(field,value);for(const[field,values]of child.notEquals){const current=notEquals.get(field)??new Set<string>();for(const value of values)current.add(value);notEquals.set(field,current);}}return{equals,notEquals};}
function conditionsProvablyExclusive(left:Condition|undefined,right:Condition|undefined):boolean{const a=conditionConstraints(left),b=conditionConstraints(right);for(const[field,value]of a.equals){if(b.equals.has(field)&&b.equals.get(field)!==value)return true;if(b.notEquals.get(field)?.has(value))return true;}for(const[field,value]of b.equals)if(a.notEquals.get(field)?.has(value))return true;return false;}
export function projectPreflight(project: SpecificationProject): { blockers:{kind:string;message:string;ids:string[]}[]; warnings:{kind:string;message:string;ids:string[]}[] } {
  const blockers:{kind:string;message:string;ids:string[]}[]=[];
  for(const conflict of searchProjectAssignments(project,"").conflicts)blockers.push({kind:"assignment-ambiguity",message:conflict.message,ids:conflict.ids});
  const sets=project.collections.applicabilitySets;
  for(let left=0;left<sets.length;left+=1)for(let right=left+1;right<sets.length;right+=1){const a=sets[left]!,b=sets[right]!;if(Number(a.priority??0)!==Number(b.priority??0))continue;if(!conditionsProvablyExclusive(a.condition as Condition|undefined,b.condition as Condition|undefined))blockers.push({kind:"ambiguous-applicability",message:`${a.name} and ${b.name} can tie`,ids:[a.id,b.id]});}
  for(const fixture of project.collections.fixtures){const result=runProjectFixture(project,fixture),expected=fixture.expect??"pass";if(result.status!==expected)blockers.push({kind:"fixture-outcome",message:`${fixture.name} was ${result.status}, expected ${expected}`,ids:[fixture.id]});}
  return {blockers,warnings:[]};
}

const supportedTypes=new Set(["string","number","boolean","object","array"]);
export function commitBulkProperties(state:ProjectState,profileId:string,properties:readonly {path:string;type:string}[]):{state:ProjectState;errors:{index:number;path:string;message:string}[]}{const errors=properties.flatMap((property,index)=>!property.path.startsWith("/")?[{index,path:property.path,message:"Use a generated canonical /path"}]:!supportedTypes.has(property.type)?[{index,path:property.path,message:"Choose a supported type"}]:[]);if(errors.length)return{state,errors};const profile=state.project.collections.profiles.find(({id})=>id===profileId);if(!profile)throw new Error(`Unknown Profile ${profileId}.`);let canonical=profile.canonicalSchema??createCanonicalSchema({id:`canonical:${profile.id}`,contributorId:profile.id,contributorName:profile.name}),sequence=0;for(const property of properties)canonical=canonicalSchemaWithConstraint(canonical,property,(kind)=>`${kind}:${profile.id}:bulk:${++sequence}`);return{errors:[],state:transactProject(state,`Import ${properties.length} canonical properties`,(project)=>({...project,collections:{...project.collections,profiles:project.collections.profiles.map((candidate)=>candidate.id===profileId?{...candidate,canonicalSchema:canonical,requirements:[]}:candidate)}}))};}
export function applyBulkRequirement(state:ProjectState,profileId:string,paths:readonly string[],update:Partial<Requirement>):ProjectState{const profile=state.project.collections.profiles.find(({id})=>id===profileId);if(!profile?.canonicalSchema)throw new Error(`Profile ${profileId} has no canonical schema.`);let canonical=profile.canonicalSchema,sequence=0;const existing=new Map(canonicalConstraints(canonical).map((constraint)=>[constraint.path,constraint]));for(const path of paths){const prior=existing.get(path);if(!prior)throw new Error(`Canonical property ${path} is unavailable.`);canonical=canonicalSchemaWithConstraint(canonical,{...prior,...update,path},(kind)=>`${kind}:${profile.id}:bulk-update:${++sequence}`);}return transactProject(state,`Update ${paths.length} canonical properties`,(project)=>({...project,collections:{...project.collections,profiles:project.collections.profiles.map((candidate)=>candidate.id===profileId?{...candidate,canonicalSchema:canonical,requirements:[]}:candidate)}}));}

export function publishProjectRelease(state:ProjectState,options:{id:IdFactory;write:(project:SpecificationProject)=>void}):ProjectState {if(!state.draft)throw new Error("There is no project draft to publish.");const preflight=projectPreflight(state.project);if(preflight.blockers.length)throw new Error(`Project preflight has ${preflight.blockers.length} blockers.`);const publishedSchemas=state.project.collections.schemaDrafts.map((entry)=>{const schema=entry as unknown as SchemaDefinition;return (schema.workingDraft?publishSchemaWorkingDraft(schema):schema) as unknown as ProjectEntity;}),collections={...state.project.collections,schemaDrafts:publishedSchemas};const revision=state.project.releases.length+1,release:ProjectRelease={id:options.id("release"),name:`Release ${revision}`,revision,createdAt:now(),snapshot:clone(collections)};const project={...state.project,collections,releases:[...state.project.releases,release],currentRelease:release.id};options.write(project);return{project,history:{undo:[],redo:[]}};}

export function exportSpecificationProject(project:SpecificationProject):string{return JSON.stringify({format:"my-chrome-utilities.specification-project",version:1,project});}
export function importSpecificationProject(serialized:string,options:{existingProjects:readonly SpecificationProject[];id:IdFactory}):{project:SpecificationProject;collisions:string[]}{const parsed=JSON.parse(serialized) as {format?:string;version?:number;project?:SpecificationProject};if(parsed.format!=="my-chrome-utilities.specification-project"||parsed.version!==1||!parsed.project)throw new Error("Unsupported Specification Project format.");const collisions=options.existingProjects.some(({id})=>id===parsed.project!.id)?[parsed.project.id]:[];return{project:clone(parsed.project),collisions};}

export function migrateLegacyLibrary(legacy:{schemas?:readonly Record<string,unknown>[];rules?:readonly Record<string,unknown>[]},options:{id:IdFactory}):{project:SpecificationProject;issues:{sourceId:string;message:string}[]}{const state=createSpecificationProject({name:"Legacy Schema Library",site:"compatibility.local",id:options.id});const issues:{sourceId:string;message:string}[]=[];const events=(legacy.schemas??[]).flatMap((schema)=>((schema.assignments as readonly Record<string,unknown>[]|undefined)??[]).flatMap((assignment)=>{if(!assignment.id||!assignment.eventName)return issues.push({sourceId:String(assignment.id??schema.id??"unknown"),message:"Assignment identity or event name is unresolved"}),[];return[{id:String(assignment.id),name:String(assignment.eventName),eventName:assignment.eventName,sourceId:assignment.sourceId,target:assignment.target,legacySchemaId:schema.id}];}));const profiles=(legacy.schemas??[]).map((schema)=>({id:String(schema.id),name:String(schema.name??schema.id),requirements:[],legacyVersion:schema.version}));return{project:{...state.project,collections:{...state.project.collections,profiles,events},compatibility:{legacySnapshot:JSON.stringify(legacy)}},issues};}

export interface ProjectSchemaDraftInput { schemaId?:string;name:string;baseRevision:number;description:string; }
export function createProjectSchemaDraft(state:ProjectState,input:ProjectSchemaDraftInput,id:IdFactory):ProjectState{
  return transactProject(state,`Create ${input.name} schema draft`,(project)=>{
    const schemaId=input.schemaId?.trim()||id("schema");if(project.collections.schemaDrafts.some(({id})=>id===schemaId))throw new Error(`Schema ${schemaId} already exists.`);
    const published={...createSchema(input.name,input.baseRevision,{type:"object",properties:{}}),id:schemaId,published:true,documentation:{description:input.description}};
    const schema=createSchemaWorkingDraft(published);
    return{...project,collections:{...project.collections,schemaDrafts:[...project.collections.schemaDrafts,schema as unknown as ProjectEntity]}};
  });
}

export interface SavedSchemaSource {id:string;name:string;version:number;document:Record<string,unknown>;assignments?:readonly unknown[];rules?:readonly Record<string,unknown>[];documentation?:unknown;examples?:readonly unknown[];published?:boolean}
export interface SavedSchemaSynchronizationReview {schemaId:string;fromRevision:number;toRevision:number;changes:{path:string;before:unknown;after:unknown}[];localOverrides:string[];source:SavedSchemaSource}
const equalJson=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
const recordValue=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
function documentChanges(before:unknown,after:unknown,path=""):SavedSchemaSynchronizationReview["changes"]{if(equalJson(before,after))return[];if(recordValue(before)&&recordValue(after)){return[...new Set([...Object.keys(before),...Object.keys(after)])].flatMap((key)=>documentChanges(before[key],after[key],`${path}/${key}`));}return[{path:path||"/",before:clone(before),after:clone(after)}];}
function synchronizeDocument(base:unknown,current:unknown,next:unknown):unknown{if(equalJson(current,base))return clone(next);if(recordValue(base)&&recordValue(current)&&recordValue(next)){const merged:Record<string,unknown>={};for(const key of new Set([...Object.keys(base),...Object.keys(current),...Object.keys(next)])){const value=synchronizeDocument(base[key],current[key],next[key]);if(value!==undefined)merged[key]=value;}return merged;}return clone(current);}

export function adoptSavedSchema(state:ProjectState,source:SavedSchemaSource):ProjectState{
  if(!source.published)throw new Error("Only a published saved schema can be adopted.");
  return transactProject(state,`Adopt saved schema ${source.name}`,(project)=>{
    if(project.collections.schemaDrafts.some(({id})=>id===source.id)||project.collections.profiles.some(({sourceIdentity})=>sourceIdentity===source.id))throw new Error(`Saved schema ${source.name} is already adopted.`);
    let canonicalSequence=0;const profileId=`profile:${source.id}`,canonicalSchema=canonicalSchemaFromJsonSchema({id:`canonical:${source.id}`,contributorId:profileId,contributorName:source.name,sourceIdentity:source.id,sourceRevision:source.version,document:clone(source.document),idFactory:(kind)=>`${profileId}:${kind}:${++canonicalSequence}`});canonicalSchema.sourceContent={document:clone(source.document),rules:clone(source.rules??[]),documentation:clone(source.documentation??""),examples:clone(source.examples??[])};
    const profile:Profile={id:profileId,name:source.name,requirements:[],canonicalSchema,sourceIdentity:source.id,sourceRevision:source.version,adoptionProvenance:{kind:"saved-schema-library",schemaId:source.id,revision:source.version}};
    return{...project,collections:{...project.collections,profiles:[...project.collections.profiles,profile]}};
  });
}

export function stageSavedSchemaSynchronization(state:ProjectState,source:SavedSchemaSource):SavedSchemaSynchronizationReview{
  const adopted=state.project.collections.schemaDrafts.find(({id})=>id===source.id),lineage=adopted?.sourceLineage as {librarySchemaId?:string;synchronizedRevision?:number}|undefined;
  if(!adopted||lineage?.librarySchemaId!==source.id)throw new Error(`Saved schema ${source.name} has not been adopted.`);
  const fromRevision=Number(lineage.synchronizedRevision),base=adopted.sourceDocument,current=(adopted.workingDraft as {document?:unknown}|undefined)?.document??adopted.document;
  if(source.version<=fromRevision)throw new Error(`Saved schema ${source.name} has no newer revision.`);
  const changes=documentChanges(base,source.document),localOverrides=documentChanges(base,current).map(({path})=>path);
  return{schemaId:source.id,fromRevision,toRevision:source.version,changes,localOverrides,source:clone(source)};
}

export function commitSavedSchemaSynchronization(state:ProjectState,review:SavedSchemaSynchronizationReview):ProjectState{
  return transactProject(state,`Synchronize saved schema ${review.schemaId} to revision ${review.toRevision}`,(project)=>{
    const adopted=project.collections.schemaDrafts.find(({id})=>id===review.schemaId),lineage=adopted?.sourceLineage as {synchronizedRevision?:number}|undefined;
    if(!adopted||lineage?.synchronizedRevision!==review.fromRevision)throw new Error("Saved-schema synchronization review is stale.");
    const working=adopted.workingDraft as Record<string,unknown>,document=synchronizeDocument(adopted.sourceDocument,working?.document??adopted.document,review.source.document);
    const schemaDrafts=project.collections.schemaDrafts.map((schema)=>schema.id===review.schemaId?{...schema,sourceDocument:clone(review.source.document),sourceLineage:{...(schema.sourceLineage as Record<string,unknown>),synchronizedRevision:review.toRevision},workingDraft:{...working,document,pendingChanges:[...((working.pendingChanges as string[]|undefined)??[]),`Synchronized saved schema revision ${review.toRevision}`]}}:schema);
    const fixtures=project.collections.fixtures.map((fixture)=>JSON.stringify(fixture).includes(review.schemaId)?{...fixture,evidenceStatus:"stale",staleReason:`Schema ${review.schemaId} synchronized to revision ${review.toRevision}`}:fixture);
    return{...project,collections:{...project.collections,schemaDrafts,fixtures}};
  });
}

export function capturedValidationDestinationChoices(project:SpecificationProject,capture:{eventName:string;sourceId:string}):{events:{id:string;name:string}[];pages:{id:string;name:string}[];flowSteps:{id:string;name:string}[];profiles:{id:string;name:string}[];suggestedFixtureName:string}{
  const named=(entities:readonly ProjectEntity[])=>entities.map(({id,name})=>({id,name})),events=named(project.collections.events.filter((event)=>event.eventName===capture.eventName&&event.sourceId===capture.sourceId));
  const flowSteps=project.collections.flows.flatMap((flow)=>((flow.steps as ProjectEntity[]|undefined)??[]).map((step)=>({id:step.id,name:`${flow.name} / ${step.name}`})));
  return{events,pages:named(project.collections.pages),flowSteps,profiles:named(project.collections.profiles),suggestedFixtureName:`${capture.eventName.replace(/(^|[_-])(\w)/g,(_match,_prefix,letter:string)=>letter.toUpperCase())} captured validation`};
}
export interface CapturedValidationResult {resultIdentity:string;winner?:{schemaId:string;schemaRevision:number};issueDetails:readonly {code:string;path?:string}[]}
export interface CapturedValidationContinuation {name:string;captureId:string;sourceId:string;eventName:string;payload:unknown;schemaId:string;eventId?:string;pageId?:string;flowStepId?:string;profileId?:string;evaluated:CapturedValidationResult}
function assertedEvaluation(input:{schemaId:string;evaluated:CapturedValidationResult}):{status:"pass"|"fail";issueCodes:string[]}{
  if(input.evaluated.winner?.schemaId!==input.schemaId)throw new Error(`Evaluator result ${input.evaluated.resultIdentity} does not prove schema ${input.schemaId}.`);
  const issueCodes=[...new Set(input.evaluated.issueDetails.map(({code})=>code))];
  return{status:input.evaluated.issueDetails.length?"fail":"pass",issueCodes};
}
export function createFixtureFromCapturedValidation(state:ProjectState,input:CapturedValidationContinuation,id:IdFactory):ProjectState{
  if(!state.project.collections.schemaDrafts.some(({id:schemaId})=>schemaId===input.schemaId))throw new Error(`Adopt schema ${input.schemaId} before creating its captured Fixture.`);
  const expected=assertedEvaluation(input),fixture={id:id("fixture"),name:input.name,mode:"event",schemaId:input.schemaId,...(input.eventId?{eventId:input.eventId}:{}),...(input.pageId?{pageId:input.pageId}:{}),...(input.flowStepId?{flowStepId:input.flowStepId}:{}),...(input.profileId?{profileIds:[input.profileId]}:{}),observations:[{sourceId:input.sourceId,eventName:input.eventName,payload:clone(input.payload)}],expected,assertions:[{field:"status",equals:expected.status},{field:"issueCodes",equals:clone(expected.issueCodes)}],evaluationResultIdentity:input.evaluated.resultIdentity,provenance:{kind:"captured-validation",captureId:input.captureId},releasePolicy:"required",evidenceStatus:"current"};
  return transactProject(state,`Create Fixture from capture ${input.captureId}`,(project)=>({...project,collections:{...project.collections,fixtures:[...project.collections.fixtures,fixture]}}));
}

function requirementsFromSchema(document:Record<string,unknown>,prefix=""):Requirement[]{
  const properties=document.properties&&typeof document.properties==="object"?document.properties as Record<string,Record<string,unknown>>:{};
  const required=new Set(Array.isArray(document.required)?document.required.map(String):[]);
  return Object.entries(properties).flatMap(([name,definition])=>{
    const path=`${prefix}/${name}`,own:Requirement={path,...(typeof definition.type==="string"?{type:definition.type}:{}),...(required.has(name)?{required:true}:{}),...(Array.isArray(definition.enum)?{allowedValues:clone(definition.enum)}:{})};
    return[own,...(definition.type==="object"?requirementsFromSchema(definition,path):[])];
  });
}
export function capturedValidationProfileRequirements(project:SpecificationProject,input:{captureId:string;schemaId:string;evaluated:CapturedValidationResult}):Requirement[]{
  assertedEvaluation(input);
  const schema=project.collections.schemaDrafts.find(({id})=>id===input.schemaId);if(!schema)throw new Error(`Adopt schema ${input.schemaId} before creating Profile requirements.`);
  const working=schema.workingDraft as {document?:Record<string,unknown>;profileIds?:string[]}|undefined,profileIds=working?.profileIds??schema.profileIds as string[]|undefined,profiles=(profileIds??[]).map((profileId)=>project.collections.profiles.find(({id})=>id===profileId)).filter((profile):profile is Profile=>Boolean(profile)),document=working?.document??schema.document as Record<string,unknown>|undefined;
  if(!profiles.length&&!document)throw new Error(`Schema ${input.schemaId} has no evaluated document.`);
  const requirements=profiles.length?composeRequirementProfiles(profiles).requirements:requirementsFromSchema(document!);
  return requirements.map((requirement)=>({...clone(requirement),origin:`captured-validation:${input.captureId}`,evaluationResultIdentity:input.evaluated.resultIdentity}));
}
export function applyCapturedValidationToProfile(state:ProjectState,input:{captureId:string;profileId:string;schemaId:string;evaluated:CapturedValidationResult}):ProjectState{
  const profile=state.project.collections.profiles.find(({id})=>id===input.profileId);if(!profile)throw new Error(`Unknown Profile ${input.profileId}.`);
  const proposed=capturedValidationProfileRequirements(state.project,input);
  let canonical=profile.canonicalSchema??createCanonicalSchema({id:`canonical:${profile.id}`,contributorId:profile.id,contributorName:profile.name}),sequence=0;for(const requirement of proposed)canonical=canonicalSchemaWithConstraint(canonical,requirement,(kind)=>`${kind}:${profile.id}:capture:${++sequence}`);return transactProject(state,`Add evaluated capture ${input.captureId} canonical properties to ${profile.name}`,(project)=>({...project,collections:{...project.collections,profiles:project.collections.profiles.map((candidate)=>candidate.id!==profile.id?candidate:{...candidate,canonicalSchema:canonical,requirements:[]})}}));
}

export interface ProjectAssignmentInput extends Omit<ProjectEntity,"id"> { id?:string;name:string;schemaId:string;eventId?:string;eventName:string;applicabilitySetId?:string;sourceId:string;target:string;priority:number;versionPolicy:"pinned"|"follow latest";schemaRevision?:number;condition?:Condition; }
function canonicalAssignmentCondition(project:SpecificationProject,condition:Condition|undefined):Condition|undefined{if(!condition)return undefined;if(condition.kind!=="predicate")return{...condition,conditions:condition.conditions.map((child)=>canonicalAssignmentCondition(project,child)!)};if(condition.field!=="flowId"||typeof condition.value!=="string")return clone(condition);const normalized=condition.value.trim().toLowerCase(),flow=project.collections.flows.find((candidate)=>candidate.id===condition.value||candidate.name.trim().toLowerCase()===normalized);return{...condition,...(flow?{value:flow.id}:{})};}
export function saveProjectAssignment(state:ProjectState,input:ProjectAssignmentInput,id:IdFactory):ProjectState{
  if(!input.schemaId.trim()||!input.eventName.trim()||!input.sourceId.trim()||!input.target.trim())throw new Error("Assignment routing fields must not be blank.");
  if(input.versionPolicy==="pinned"&&!Number.isInteger(input.schemaRevision))throw new Error("Pinned assignments require a real schema revision.");
  const schemaEntry=state.project.collections.schemaDrafts.find(({id:schemaId})=>schemaId===input.schemaId);if(!schemaEntry)throw new Error(`Schema ${input.schemaId} does not have a project working draft.`);const existing=input.id?state.project.collections.assignments.find((assignment)=>assignment.id===input.id):undefined,identity=existing?.id??id("assignment"),generatedApplicabilityId=input.applicabilitySetId??String(existing?.applicabilitySetId??id("applicability")),resolvedEventId=input.eventId??String(existing?.eventId??state.project.collections.events.find((event)=>event.eventName===input.eventName&&event.sourceId===input.sourceId)?.id??"");
  const {condition:rawCondition,...compatible}=clone(input),condition=canonicalAssignmentCondition(state.project,rawCondition),saved:ProjectEntity={...existing,...compatible,id:identity,schemaDraftId:input.schemaId,schemaId:input.schemaId,eventId:resolvedEventId,applicabilitySetId:generatedApplicabilityId,...(input.versionPolicy==="pinned"?{schemaRevision:input.schemaRevision}:{schemaRevision:Number(schemaEntry.version??1)})};delete saved.condition;
  return transactProject(state,`${existing?"Update":"Create"} assignment ${input.name}`,(project)=>{const applicabilitySets=condition?(project.collections.applicabilitySets.some(({id:applicabilityId})=>applicabilityId===generatedApplicabilityId)?project.collections.applicabilitySets.map((entry)=>entry.id===generatedApplicabilityId?{...entry,condition:clone(condition)}:entry):[...project.collections.applicabilitySets,{id:generatedApplicabilityId,name:`${input.name} applicability`,priority:input.priority,condition:clone(condition)}]):project.collections.applicabilitySets;if(!applicabilitySets.some(({id:applicabilityId})=>applicabilityId===generatedApplicabilityId))throw new Error(`Applicability Set ${generatedApplicabilityId} does not exist.`);return{...project,collections:{...project.collections,applicabilitySets,assignments:existing?project.collections.assignments.map((assignment)=>assignment.id===identity?saved:assignment):[...project.collections.assignments,saved]}};});
}
export function searchProjectAssignments(project:SpecificationProject,query:string):{rows:ProjectEntity[];count:number;empty:boolean;conflicts:{ids:string[];message:string}[]}{const normalized=query.trim().toLowerCase(),rows=lifecycleAssignments(project).filter((assignment)=>(assignment.schemaDraftId??assignment.schemaId)&&assignment.eventName&&assignment.sourceId&&assignment.target&&(!normalized||JSON.stringify(assignment).toLowerCase().includes(normalized))),conflicts:{ids:string[];message:string}[]=[];for(let left=0;left<rows.length;left+=1)for(let right=left+1;right<rows.length;right+=1){const a=rows[left]!,b=rows[right]!;if(a.eventId===b.eventId&&Number(a.priority)===Number(b.priority)){const applicability=(assignment:ProjectEntity)=>project.collections.applicabilitySets.find(({id})=>id===assignment.applicabilitySetId)?.condition as Condition|undefined;if(!conditionsProvablyExclusive(applicability(a),applicability(b)))conflicts.push({ids:[a.id,b.id],message:`${a.name} and ${b.name} are equal-priority candidates`});}}return{rows,count:rows.length,empty:rows.length===0,conflicts};}

export interface FlowStepInput extends Omit<ProjectEntity,"id"> { pageId?:string;eventId?:string;minimum:number;maximum:number;optional:boolean;branch?:string;transition?:{from:string;to:string}; }
export function addFlowStep(state:ProjectState,flowId:string,input:FlowStepInput,id:IdFactory):ProjectState{if(input.minimum<0||input.maximum<input.minimum)throw new Error("Flow occurrence bounds are invalid.");const normalized={...clone(input),...(input.pageId?{pageId:input.pageId}:{}),...(input.eventId?{eventId:input.eventId}:{})};if(!input.pageId)delete normalized.pageId;if(!input.eventId)delete normalized.eventId;return transactProject(state,`Add ${input.name} flow step`,(project)=>({...project,collections:{...project.collections,flows:project.collections.flows.map((flow)=>flow.id===flowId?{...flow,steps:[...((flow.steps as ProjectEntity[]|undefined)??[]),{...normalized,id:id("flow-step")}] }:flow)}}));}
export interface FlowStepUpdate {name:string;pageId?:string;eventId?:string;minimum:number;maximum:number;optional:boolean;branch?:string}
export function saveFlowStep(state:ProjectState,flowId:string,stepId:string,input:FlowStepUpdate):ProjectState{if(input.minimum<0||input.maximum<input.minimum)throw new Error("Flow occurrence bounds are invalid.");return transactProject(state,`Save flow step ${stepId}`,(project)=>({...project,collections:{...project.collections,flows:project.collections.flows.map((flow)=>{if(flow.id!==flowId)return flow;const steps=(flow.steps as ProjectEntity[]|undefined)??[];if(!steps.some(({id})=>id===stepId))throw new Error(`Unknown flow step ${stepId}.`);return{...flow,steps:steps.map((step)=>{if(step.id!==stepId)return step;const updated={...step,...clone(input)};if(!input.pageId)delete updated.pageId;if(!input.eventId)delete updated.eventId;return updated;})};})}}));}
export interface FlowTransition{id:string;toStepId:string;condition?:Condition}
export function saveFlowTransition(state:ProjectState,flowId:string,fromStepId:string,transition:FlowTransition):ProjectState{return transactProject(state,`Save flow transition ${transition.id}`,(project)=>({...project,collections:{...project.collections,flows:project.collections.flows.map((flow)=>{if(flow.id!==flowId)return flow;const steps=(flow.steps as ProjectEntity[]|undefined)??[];if(!steps.some(({id})=>id===fromStepId))throw new Error(`Unknown source step ${fromStepId}.`);if(!steps.some(({id})=>id===transition.toStepId))throw new Error(`Unknown target step ${transition.toStepId}.`);return{...flow,steps:steps.map((step)=>{if(step.id!==fromStepId)return step;const transitions=(step.transitions as FlowTransition[]|undefined)??[],existing=transitions.some(({id})=>id===transition.id);return{...step,transitions:existing?transitions.map((candidate)=>candidate.id===transition.id?clone(transition):candidate):[...transitions,clone(transition)]};})};})}}));}
export function reorderFlowStep(state:ProjectState,flowId:string,from:number,to:number):ProjectState{return transactProject(state,"Reorder flow step",(project)=>({...project,collections:{...project.collections,flows:project.collections.flows.map((flow)=>{if(flow.id!==flowId)return flow;const steps=[...((flow.steps as ProjectEntity[]|undefined)??[])],moved=steps.splice(from,1)[0];if(!moved)return flow;steps.splice(Math.max(0,Math.min(to,steps.length)),0,moved);return{...flow,steps};})}}));}

export interface DocumentationExportOptions { fields: readonly string[]; include: { applicability:boolean; flows:boolean; fixtures:boolean; releases:boolean }; }
export function exportDocumentation(project:SpecificationProject,options:DocumentationExportOptions):{preview:string;clipboard:string;lossyCategories:string[]}{
  const header=["Path",...options.fields.filter((field)=>field!=="path").map((field)=>field.replace(/[A-Z]/g,(letter)=>` ${letter}`).replace(/^./,(letter)=>letter.toUpperCase()))];
  const rows=project.collections.profiles.flatMap((profile)=>(profile.canonicalSchema?canonicalRequirements(profile.canonicalSchema):profile.requirements).map((requirement)=>{
    const usage=(Object.entries(project.collections) as [string,ProjectEntity[]][]).flatMap(([kind,entities])=>entities.filter((entity)=>JSON.stringify(entity).includes(profile.id)).map((entity)=>`${kind}/${entity.name}`));
    return options.fields.map((field)=>field==="path"?requirement.path:field==="type"?(requirement.type??""):field==="provenance"?`${profile.name} (${profile.id})`:field==="whereUsed"?usage.join(", "):String((requirement as unknown as Record<string,unknown>)[field]??""));
  }));
  const lossyCategories:string[]=(['applicability','flows','fixtures'] as const).filter((category)=>!options.include[category]);
  if(!options.include.releases)lossyCategories.push("releases");
  const warnings=lossyCategories.length?`\n\nLossy documentation export: omitted ${lossyCategories.join(", ")}. Use Full-fidelity Specification Project for complete interchange.`:"";
  const metadata=options.include.releases&&project.currentRelease?`\n\nRelease: ${project.currentRelease}; revision ${project.releases.length}`:"";
  const table=[header,...rows].map((row)=>`| ${row.join(" | ")} |`).join("\n");const preview=`${table}${metadata}${warnings}`;
  return{preview,clipboard:preview,lossyCategories};
}

export interface FlowInstance { id:string; flowId:string; selector:string; sessionId:string; correlationKey?:string; startedAt?:string; lastObservedAt?:string; currentStepId?:string; occurrences:Record<string,number>; history:{stepId:string;eventId?:string;pageId?:string;observedAt?:string;transitionId?:string}[]; status:"active"|"complete"|"failed"; failureReason?:string; }
export function startFlowInstance(project:SpecificationProject,flowId:string,sessionId:string,options?:{correlationKey?:string;startedAt?:string}):FlowInstance{const flow=project.collections.flows.find(({id})=>id===flowId);if(!flow)throw new Error(`Unknown flow ${flowId}`);return{id:`${flowId}:${sessionId}:${options?.correlationKey??"tab"}`,flowId,selector:flow.name.toLowerCase(),sessionId,...(options?.correlationKey?{correlationKey:options.correlationKey}:{}),...(options?.startedAt?{startedAt:options.startedAt,lastObservedAt:options.startedAt}:{}),occurrences:{},history:[],status:"active"};}
export function advanceFlowInstance(project:SpecificationProject,instance:FlowInstance,input:{eventId?:string;pageId?:string;eventName?:string;observedAt?:string;transitionEvidence?:unknown;[key:string]:unknown}):FlowInstance{
  if(instance.status!=="active")return instance;const flow=project.collections.flows.find(({id})=>id===instance.flowId);if(!flow)throw new Error(`Unknown flow ${instance.flowId}`);const steps=(flow.steps as ProjectEntity[]|undefined)??[],observedAt=typeof input.observedAt==="string"?input.observedAt:undefined,lastAt=instance.lastObservedAt??instance.startedAt,timeout=Number(flow.timeoutMinutes??0);if(timeout>0&&observedAt&&lastAt&&Date.parse(observedAt)-Date.parse(lastAt)>timeout*60_000)return{...instance,lastObservedAt:observedAt,status:"failed",failureReason:`Flow timed out after ${timeout} minutes at ${instance.currentStepId??"entry"}.`};const matches=(candidate:ProjectEntity)=>Boolean(candidate.eventId||candidate.pageId)&&(!candidate.eventId||candidate.eventId===input.eventId)&&(!candidate.pageId||candidate.pageId===input.pageId),partiallyMatches=(candidate:ProjectEntity)=>Boolean(candidate.eventId&&candidate.pageId)&&(input.eventId===undefined||input.pageId===undefined)&&((input.eventId!==undefined&&candidate.eventId===input.eventId)||(input.pageId!==undefined&&candidate.pageId===input.pageId))&&(input.eventId===undefined||candidate.eventId===input.eventId)&&(input.pageId===undefined||candidate.pageId===input.pageId),currentIndex=instance.currentStepId?steps.findIndex(({id})=>id===instance.currentStepId):-1,current=currentIndex>=0?steps[currentIndex]:undefined,nextObservable=current?steps.slice(currentIndex+1).find((candidate)=>Boolean(candidate.eventId||candidate.pageId)):undefined;if(current&&nextObservable&&partiallyMatches(nextObservable))return observedAt?{...instance,lastObservedAt:observedAt}:instance;
  let step=current&&matches(current)?current:undefined,transitionId:string|undefined;if(!step&&current){const count=instance.occurrences[current.id]??0,minimum=Number(current.minimum??(current.optional?0:1));if(count<minimum)return{...instance,status:"failed",failureReason:`Cannot leave ${current.name}; minimum ${minimum}, observed ${count}.`};const transitions=(current.transitions as {id:string;toStepId:string;condition?:Condition}[]|undefined)??[];if(transitions.length){const candidates=transitions.filter((transition)=>conditionMatches(transition.condition??{kind:"all",conditions:[]},input)).map((transition)=>({transition,step:steps.find(({id})=>id===transition.toStepId)})).filter((candidate):candidate is {transition:{id:string;toStepId:string;condition?:Condition};step:ProjectEntity}=>Boolean(candidate.step)).filter(({step:candidate})=>matches(candidate));if(candidates.length!==1)return{...instance,status:"failed",failureReason:candidates.length?`Ambiguous transition from ${current.name}.`:`No valid transition from ${current.name}; observed ${String(input.eventId??input.pageId??"unknown")}.`};step=candidates[0]!.step;transitionId=candidates[0]!.transition.id;}else for(let index=currentIndex+1;index<steps.length;index+=1){const candidate=steps[index]!;if(matches(candidate)){step=candidate;break;}if(!candidate.optional)return{...instance,status:"failed",failureReason:`Invalid transition: expected ${candidate.name}; observed ${String(input.eventId??input.pageId??"unknown")}.`};}}
  if(!step&&!current){for(const candidate of steps){if(matches(candidate)){step=candidate;break;}if(!candidate.optional)break;}}
  if(!step)return observedAt?{...instance,lastObservedAt:observedAt}:instance;const count=(instance.occurrences[step.id]??0)+1,maximum=Number(step.maximum??1),occurrences={...instance.occurrences,[step.id]:count},history=[...instance.history,{stepId:step.id,...(input.eventId?{eventId:String(input.eventId)}:{}),...(input.pageId?{pageId:String(input.pageId)}:{}),...(observedAt?{observedAt}:{}),...(transitionId?{transitionId}:{})}];if(count>maximum)return{...instance,currentStepId:step.id,occurrences,history,...(observedAt?{lastObservedAt:observedAt}:{}),status:"failed",failureReason:`${step.name} exceeded maximum ${maximum} with ${count} occurrences.`};const last=steps.at(-1)?.id===step.id,minimum=Number(step.minimum??(step.optional?0:1)),exit=flow.exitCondition?conditionMatches(flow.exitCondition as Condition,input):false;return{...instance,currentStepId:step.id,occurrences,history,...(observedAt?{lastObservedAt:observedAt}:{}),status:(last&&count>=minimum)||exit?"complete":"active"};
}

export interface ReleaseReview { sections:{kind:"added"|"removed"|"renamed"|"changed";entityKind:string;id:string;before?:string;after?:string}[]; affectedConsumers:{id:string;name:string}[]; breaking:boolean; preflight:ReturnType<typeof projectPreflight>; }
export function buildReleaseReview(previous:SpecificationProject,next:SpecificationProject):ReleaseReview{const sections:ReleaseReview["sections"]=[];for(const kind of Object.keys(next.collections) as ProjectEntityKind[]){const beforeEntities=previous.collections[kind] as ProjectEntity[],afterEntities=next.collections[kind] as ProjectEntity[];const before=new Map(beforeEntities.map((entity)=>[entity.id,entity])),after=new Map(afterEntities.map((entity)=>[entity.id,entity]));for(const [id,entity]of after){const prior=before.get(id);if(!prior)sections.push({kind:"added",entityKind:kind,id,after:entity.name});else if(prior.name!==entity.name)sections.push({kind:"renamed",entityKind:kind,id,before:prior.name,after:entity.name});else if(JSON.stringify(prior)!==JSON.stringify(entity))sections.push({kind:"changed",entityKind:kind,id,before:prior.name,after:entity.name});}for(const [id,entity]of before)if(!after.has(id))sections.push({kind:"removed",entityKind:kind,id,before:entity.name});}const changedIds=new Set(sections.map(({id})=>id));const affectedConsumers=(Object.values(next.collections) as ProjectEntity[][]).flatMap((entities)=>entities.filter((entity)=>changedIds.has(entity.id)||[...changedIds].some((id)=>JSON.stringify(entity).includes(id))).map(({id,name})=>({id,name})));return{sections,affectedConsumers,breaking:sections.some(({kind})=>kind==="removed"),preflight:projectPreflight(next)};}
export function restoreReleaseAsDraft(state:ProjectState,releaseId:string,id:IdFactory):ProjectState{const release=state.project.releases.find((candidate)=>candidate.id===releaseId);if(!release)throw new Error(`Unknown release ${releaseId}`);return{project:{...state.project,collections:clone(release.snapshot)},draft:{id:id("draft"),status:"Saved",updatedAt:now(),restoredFromRelease:releaseId},history:{undo:[],redo:[]}};}

interface FullFidelityPackageV1 { format:"my-chrome-utilities.specification-project-state";version:1;state:ProjectState; }
interface FullFidelityPackageV2 { format:"my-chrome-utilities.specification-project-state";version:2;state:ProjectState;migrations:string[]; }
type FullFidelityPackage=FullFidelityPackageV1|FullFidelityPackageV2;
export function exportSpecificationProjectState(state:ProjectState):string{return JSON.stringify({format:"my-chrome-utilities.specification-project-state",version:2,state,migrations:[]} satisfies FullFidelityPackageV2);}
export interface StagedProjectImport { state:ProjectState; diff:ReleaseReview; blockers:{kind:string;message:string;ids:string[]}[]; source:string;sourceVersion:1|2;targetVersion:2;migrations:string[]; }
export function stageProjectImport(serialized:string,current:ProjectState,options?:{projectId?:string}):StagedProjectImport{
  const parsed=JSON.parse(serialized) as Partial<FullFidelityPackage>;
  if(parsed.format!=="my-chrome-utilities.specification-project-state"||(parsed.version!==1&&parsed.version!==2)||!parsed.state)throw new Error("Unsupported Specification Project format; supported versions are 1 and 2.");
  const sourceVersion=parsed.version,migrations=sourceVersion===1?["project-state-v1-to-v2"]:[...((parsed as Partial<FullFidelityPackageV2>).migrations??[])],imported=clone(parsed.state);
  if(options?.projectId)imported.project.id=options.projectId;
  const blockers=imported.project.id===current.project.id?[{kind:"project-id-collision",message:"Choose replace or remap for the conflicting project identity.",ids:[imported.project.id]}]:[];
  return{state:imported,diff:buildReleaseReview(current.project,imported.project),blockers,source:serialized,sourceVersion,targetVersion:2,migrations};
}
export function commitStagedProjectImport(current:ProjectState,staged:StagedProjectImport,options:{write:(state:ProjectState)=>void}):ProjectState{if(staged.blockers.length)throw new Error(`Import has ${staged.blockers.length} unresolved blockers.`);const next=clone(staged.state);options.write(next);return next;}

export interface CoverageRow { id:string;kind:string;name:string;state:"covered"|"issue"|"waived";issueLink:string; }
export function buildCoverageMatrix(project:SpecificationProject,options:{rowLimit:number}):{rows:CoverageRow[];totalRows:number}{const all=(Object.entries(project.collections) as [string,ProjectEntity[]][]).flatMap(([kind,entities])=>entities.map((entity)=>({id:entity.id,kind,name:entity.name,state:(kind==="profiles"&&(!(entity as Profile).canonicalSchema||canonicalRequirements((entity as Profile).canonicalSchema!).length===0)?"issue":"covered") as CoverageRow["state"],issueLink:`?kind=${encodeURIComponent(kind)}&entity=${encodeURIComponent(entity.id)}&field=${kind==="profiles"?"canonicalSchema":"name"}`})));return{rows:all.slice(0,options.rowLimit),totalRows:all.length};}
export function mergeProjectSchemasIntoLibrary(existing:readonly SchemaDefinition[],projectSchemas:readonly SchemaDefinition[]):SchemaDefinition[]{const projectIds=new Set(projectSchemas.map(({id})=>id));return[...existing.filter(({id})=>!projectIds.has(id)),...projectSchemas];}
import {
  createSchema,
  createSchemaWorkingDraft,
  publishSchemaWorkingDraft,
  updateSchemaWorkingDraft,
  type SchemaAssignment,
  type SchemaDefinition,
} from "./data-layer-schema-verification.js";
