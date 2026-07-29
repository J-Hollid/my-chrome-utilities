export const STUDIO_ANALYST_FIRST_HINT_MS=10_000;
export const STUDIO_ANALYST_HINT_LIFETIME_MS=10_000;
export const STUDIO_ANALYST_COOLDOWN_MS=120_000;
export const STUDIO_ANALYST_CONTROL_DWELL_MS=3_000;
export const STUDIO_ANALYST_PRINT_INTERVAL_MS=20;

export interface StudioAnalystHint{
  readonly id:string;
  readonly route:string;
  readonly text:string;
}

export interface StudioAnalystControlTarget{
  readonly id:string;
  readonly name:string;
}

const tip=(id:string,route:string,text:string):StudioAnalystHint=>Object.freeze({id,route,text});
const tipPools:Readonly<Record<string,readonly StudioAnalystHint[]>>=Object.freeze({
  "Project overview":Object.freeze([
    tip("project-overview","Project overview","Crikey! Pick a collection on the left to start shaping your specification."),
    tip("project-overview-context","Project overview","Start with the project context so every collection shares the same measurement purpose."),
    tip("project-overview-search","Project overview","Use Global search to find a collection or entity without changing the saved Draft."),
    tip("project-overview-validate","Project overview","Run preflight when you want a project-wide view of blockers and advisory warnings."),
    tip("project-overview-inspector","Project overview","Keep the Inspector open when you need context for the currently selected project part."),
  ]),
  "Shared Profiles":Object.freeze([
    tip("shared-profiles","Shared Profiles","Smashing! Put reusable fields here so Pages and Events can inherit them."),
    tip("shared-profiles-canonical","Shared Profiles","Author each reusable property once in the canonical Shared Profile schema."),
    tip("shared-profiles-library","Shared Profiles","Adopt a published Saved Schema when its source lineage should remain visible."),
    tip("shared-profiles-concepts","Shared Profiles","Use Concepts to group Profile properties for project documentation without changing validation."),
    tip("shared-profiles-policy","Shared Profiles","Only defined fields closes a Profile schema while preserving its inherited policy."),
  ]),
  "Pages":Object.freeze([
    tip("pages","Pages","Jolly good! Give each Page its observed page event before refining its schema."),
    tip("pages-location","Pages","Describe host and path conditions so observations resolve to the intended Page."),
    tip("pages-groups","Pages","Order Page Group memberships to make their effective schema contribution predictable."),
    tip("pages-profiles","Pages","Attach Shared Profiles when the Page should inherit reusable canonical fields."),
    tip("pages-schema","Pages","Review the effective Page schema before adding a sparse local override."),
  ]),
  "Page Groups":Object.freeze([
    tip("page-groups-membership","Page Groups","Group Pages that share applicability or schema contributions, then review their effective order."),
    tip("page-groups-conditions","Page Groups","Use Page Group conditions to describe where a shared contribution applies."),
    tip("page-groups-schema","Page Groups","Keep reusable group-level fields canonical so member Pages inherit them consistently."),
    tip("page-groups-order","Page Groups","Reorder memberships only after checking the affected Page instances and compiled targets."),
    tip("page-groups-repair","Page Groups","Open a conflicting Page Group directly from effective-schema evidence to repair its contribution."),
  ]),
  "Events":Object.freeze([
    tip("events-name","Events","Give each Event the exact observed event name used by its production source."),
    tip("events-source","Events","Choose the observation source that actually carries this Event in the active project."),
    tip("events-target","Events","Set the payload target before connecting Assignments to the Event."),
    tip("events-pages","Events","Associate interaction Events with the Pages and Flows where they are expected."),
    tip("events-schema","Events","Refine Event data through canonical contributors instead of duplicating property definitions."),
  ]),
  "Applicability":Object.freeze([
    tip("applicability-priority","Applicability","Order Applicability Sets deliberately because higher-priority matches resolve first."),
    tip("applicability-conditions","Applicability","Build conditions from observable project data and keep each comparison type-compatible."),
    tip("applicability-fallback","Applicability","Retain one truthful fallback for observations that match no more specific set."),
    tip("applicability-overlap","Applicability","Run preflight to find ambiguous Applicability Sets before publishing."),
    tip("applicability-assignments","Applicability","Use Applicability Sets on Assignments to select the right contributor for an observation."),
  ]),
  "Flows":Object.freeze([
    tip("flows","Flows","Cor! Add Pages to the canvas first, then place interaction Events inside them."),
    tip("flows-frames","Flows","Use Page frames to show where each journey step occurs."),
    tip("flows-occurrences","Flows","Place Event occurrences inside their owning Page frame and state their obligation."),
    tip("flows-relationships","Flows","Connect Page frames with Page-to-Page relationships; Event availability comes from containment, never relationship endpoints."),
    tip("flows-documentation","Flows","Refresh project Documentation after changing a selected Flow's value map."),
  ]),
  "Fixtures":Object.freeze([
    tip("fixtures-observations","Fixtures","Capture representative observations so guided testing can exercise the intended event path."),
    tip("fixtures-expected","Fixtures","Record expected outcomes that distinguish a useful Fixture from raw sample data."),
    tip("fixtures-context","Fixtures","Link each Fixture to the Page, Event, and Flow context it is meant to demonstrate."),
    tip("fixtures-guided","Fixtures","Use guided validation to compare a Fixture with the current compiled specification."),
    tip("fixtures-warning","Fixtures","Treat incomplete Fixture coverage as advisory while canonical validation remains authoritative."),
  ]),
  "Assignments":Object.freeze([
    tip("assignments-event","Assignments","Choose the observed Event before mapping an Assignment to a canonical contributor."),
    tip("assignments-applicability","Assignments","Select an Applicability Set that makes the Assignment's winning context unambiguous."),
    tip("assignments-target","Assignments","Point the Assignment at the Shared Profile, Page, Event, or Flow instance that owns the schema."),
    tip("assignments-priority","Assignments","Use priority only to resolve otherwise valid competing Assignment candidates."),
    tip("assignments-preflight","Assignments","Run preflight to find unresolved targets or ties before testing observations."),
  ]),
  "Documentation":Object.freeze([
    tip("documentation","Documentation","Splendid! Refresh the preview after changing a Documentation Set."),
    tip("documentation-sections","Documentation","Select only the Flow, matrix, and Profile sections required by this audience."),
    tip("documentation-concepts","Documentation","Order and include Concepts to control grouped property tables consistently."),
    tip("documentation-theme","Documentation","Save project-local theme choices before refreshing the immutable preview."),
    tip("documentation-export","Documentation","Generate rich copy or Excel from the same current preview snapshot."),
  ]),
});

export function studioAnalystHintsForRoute(route:string):StudioAnalystHint[]{
  return (tipPools[route]??[]).map((hint)=>({...hint}));
}

export function studioAnalystHintForRoute(route:string,shown:readonly string[]):StudioAnalystHint|undefined{
  const excluded=new Set(shown);
  const hint=(tipPools[route]??[]).find((candidate)=>!excluded.has(candidate.id));
  return hint?{...hint}:undefined;
}

const slug=(value:string):string=>value.toLowerCase().replace(/[^a-z0-9]+/gu,"-").replace(/^-|-$/gu,"");

export function studioAnalystControlHint(route:string,target:StudioAnalystControlTarget):StudioAnalystHint{
  return{
    id:`control:${slug(route)}:${slug(target.id||target.name)}`,
    route,
    text:`“${target.name}” is available in ${route}; use it to work with this part of the specification.`,
  };
}

export function studioAnalystVisibleText(text:string,elapsedMilliseconds:number,reducedMotion:boolean):string{
  if(reducedMotion)return text;
  const characters=Math.floor(Math.max(0,elapsedMilliseconds)/STUDIO_ANALYST_PRINT_INTERVAL_MS);
  return text.slice(0,characters);
}

export interface StudioAnalystControlDwell{
  enter(target:StudioAnalystControlTarget,modality:"pointer"|"focus"):void;
  leave(modality:"pointer"|"focus"):void;
  advance(elapsedMilliseconds:number,active:boolean):StudioAnalystControlTarget|undefined;
  reset():void;
}

export function createStudioAnalystControlDwell():StudioAnalystControlDwell{
  let target:StudioAnalystControlTarget|undefined;
  let pointer=false,focus=false,elapsed=0,triggered=false;
  const reset=():void=>{target=undefined;pointer=false;focus=false;elapsed=0;triggered=false;};
  return{
    enter(next,modality){
      if(!target||target.id!==next.id)reset();
      target={...next};
      if(modality==="pointer")pointer=true;else focus=true;
    },
    leave(modality){
      if(modality==="pointer")pointer=false;else focus=false;
      if(!pointer&&!focus)reset();
    },
    advance(elapsedMilliseconds,active){
      if(!active||!target||(!pointer&&!focus)||triggered)return undefined;
      elapsed+=Math.max(0,elapsedMilliseconds);
      if(elapsed<STUDIO_ANALYST_CONTROL_DWELL_MS)return undefined;
      triggered=true;
      return{...target};
    },
    reset,
  };
}

export type StudioAnalystGuidanceAction=
  |{readonly kind:"waiting"}
  |{readonly kind:"show";readonly hint:StudioAnalystHint}
  |{readonly kind:"visible";readonly hint:StudioAnalystHint}
  |{readonly kind:"hide"};

export interface StudioAnalystGuidanceContext{
  readonly active:boolean;
  readonly route:string;
}

export interface StudioAnalystGuidanceSchedule{
  advance(elapsedMilliseconds:number,context:StudioAnalystGuidanceContext):StudioAnalystGuidanceAction;
  request(context:StudioAnalystGuidanceContext):StudioAnalystGuidanceAction;
  present(hint:StudioAnalystHint,context:StudioAnalystGuidanceContext):StudioAnalystGuidanceAction;
}

export interface StudioAnalystGuidanceController{
  evaluate():void;
  requestNext():void;
  dispose():void;
}

export function studioAnalystGuidanceIsActive(options:{
  readonly document:Document;
  readonly populated:boolean;
  readonly workspace:HTMLElement;
  readonly navigation:HTMLElement;
  readonly region:HTMLElement;
}):boolean{
  const view=options.document.defaultView;
  return options.populated
    &&!options.document.hidden
    &&!options.workspace.hidden
    &&view?.getComputedStyle(options.navigation).display!=="none"
    &&view?.getComputedStyle(options.region).display!=="none"
    &&!options.document.querySelector('dialog[open], .actions details[open], [aria-modal="true"], [data-schema-row-overlay="true"]');
}

export function createStudioAnalystGuidanceSchedule():StudioAnalystGuidanceSchedule{
  let route:string|undefined;
  let untilNext=STUDIO_ANALYST_FIRST_HINT_MS;
  let current:StudioAnalystHint|undefined;
  let visibleRemaining=0;
  let rendered=false;
  const shownByRoute=new Map<string,Set<string>>();

  const synchronizeRoute=(nextRoute:string):"same"|"changed"|"hide"=>{
    if(route===undefined){route=nextRoute;return"same";}
    if(route===nextRoute)return"same";
    const result=current&&rendered?"hide":"changed";
    route=nextRoute;
    current=undefined;
    visibleRemaining=0;
    rendered=false;
    untilNext=STUDIO_ANALYST_FIRST_HINT_MS;
    return result;
  };
  const nextGeneralHint=(nextRoute:string):StudioAnalystHint|undefined=>{
    const pool=tipPools[nextRoute]??[];
    if(!pool.length)return undefined;
    const shown=shownByRoute.get(nextRoute)??new Set<string>();
    if(shown.size>=pool.length)shown.clear();
    shownByRoute.set(nextRoute,shown);
    const hint=studioAnalystHintForRoute(nextRoute,[...shown]);
    if(hint)shown.add(hint.id);
    return hint;
  };
  const show=(hint:StudioAnalystHint):StudioAnalystGuidanceAction=>{
    current={...hint};
    rendered=true;
    visibleRemaining=STUDIO_ANALYST_HINT_LIFETIME_MS;
    untilNext=STUDIO_ANALYST_COOLDOWN_MS;
    return{kind:"show",hint:{...hint}};
  };

  return{
    advance(elapsedMilliseconds,context){
      const routeState=synchronizeRoute(context.route);
      if(routeState==="hide")return{kind:"hide"};
      if(routeState==="changed")return{kind:"waiting"};
      const elapsed=Math.max(0,elapsedMilliseconds);
      if(!context.active){
        if(current&&rendered){rendered=false;return{kind:"hide"};}
        return{kind:"waiting"};
      }

      if(current){
        visibleRemaining=Math.max(0,visibleRemaining-elapsed);
        untilNext=Math.max(0,untilNext-elapsed);
        if(visibleRemaining===0){current=undefined;rendered=false;return{kind:"hide"};}
        rendered=true;
        return{kind:"visible",hint:{...current}};
      }

      untilNext=Math.max(0,untilNext-elapsed);
      if(untilNext>0)return{kind:"waiting"};
      const hint=nextGeneralHint(context.route);
      return hint?show(hint):{kind:"waiting"};
    },
    request(context){
      synchronizeRoute(context.route);
      if(!context.active)return{kind:"waiting"};
      const hint=nextGeneralHint(context.route);
      return hint?show(hint):{kind:"waiting"};
    },
    present(hint,context){
      synchronizeRoute(context.route);
      return context.active?show(hint):{kind:"waiting"};
    },
  };
}

const namedControl=(root:HTMLElement,analyst:HTMLElement|undefined,eventTarget:EventTarget|null):{element:HTMLElement;target:StudioAnalystControlTarget}|undefined=>{
  if(!(eventTarget instanceof Element))return undefined;
  const element=eventTarget.closest<HTMLElement>("button,input,select,textarea,summary,a[href]");
  if(!element||element===analyst||!root.contains(element)||!element.getClientRects().length)return undefined;
  const labeled=element instanceof HTMLInputElement||element instanceof HTMLSelectElement||element instanceof HTMLTextAreaElement
    ?element.labels?.[0]?.textContent
    :undefined;
  const name=(element.getAttribute("aria-label")??labeled??element.textContent??"").replace(/\s+/gu," ").trim();
  if(!name)return undefined;
  return{element,target:{id:element.id||name,name}};
};

export function installStudioAnalystGuidance(options:{
  readonly bubble:HTMLOutputElement;
  readonly route:()=>string;
  readonly active:()=>boolean;
  readonly analystControl?:HTMLButtonElement;
  readonly controlRoot?:HTMLElement;
  readonly reducedMotion?:()=>boolean;
  readonly now?:()=>number;
  readonly intervalMilliseconds?:number;
}):StudioAnalystGuidanceController{
  const schedule=createStudioAnalystGuidanceSchedule();
  const dwell=createStudioAnalystControlDwell();
  const now=options.now??(()=>performance.now());
  const ownerDocument=options.bubble.ownerDocument;
  const reserve=options.bubble.querySelector?.<HTMLElement>("[data-analyst-tip-reserve]");
  const visual=options.bubble.querySelector?.<HTMLElement>("[data-analyst-tip-visual]");
  const announcement=options.bubble.querySelector?.<HTMLElement>("[data-analyst-tip-announcement]");
  const reducedMotion=options.reducedMotion??(()=>ownerDocument.defaultView?.matchMedia("(prefers-reduced-motion: reduce)").matches??false);
  let previous=now(),dwellPrevious=previous,intervalWasActive=options.active(),printTimer:ReturnType<typeof setInterval>|undefined,printSequence=0;

  const cancelPrint=():void=>{
    printSequence+=1;
    if(printTimer!==undefined){clearInterval(printTimer);printTimer=undefined;}
  };
  const hideBubble=():void=>{
    cancelPrint();
    options.bubble.hidden=true;
    options.bubble.removeAttribute("data-hint-id");
    options.bubble.removeAttribute("data-complete-text");
  };
  const showHint=(hint:StudioAnalystHint):void=>{
    cancelPrint();
    const sequence=printSequence;
    options.bubble.dataset.hintId=hint.id;
    options.bubble.dataset.completeText=hint.text;
    options.bubble.hidden=false;
    if(!reserve||!visual||!announcement){
      options.bubble.textContent=hint.text;
      return;
    }
    reserve.textContent=hint.text;
    visual.textContent=reducedMotion()?hint.text:"";
    announcement.textContent="";
    queueMicrotask(()=>{if(sequence===printSequence)announcement.textContent=hint.text;});
    if(reducedMotion())return;
    let elapsed=0;
    printTimer=setInterval(()=>{
      elapsed+=STUDIO_ANALYST_PRINT_INTERVAL_MS;
      visual.textContent=studioAnalystVisibleText(hint.text,elapsed,false);
      if(visual.textContent===hint.text&&printTimer!==undefined){
        clearInterval(printTimer);
        printTimer=undefined;
      }
    },STUDIO_ANALYST_PRINT_INTERVAL_MS);
  };
  const restoreHint=(hint:StudioAnalystHint):void=>{
    cancelPrint();
    options.bubble.dataset.hintId=hint.id;
    options.bubble.dataset.completeText=hint.text;
    options.bubble.hidden=false;
    if(!reserve||!visual||!announcement){
      options.bubble.textContent=hint.text;
      return;
    }
    reserve.textContent=hint.text;
    visual.textContent=hint.text;
  };
  const apply=(action:StudioAnalystGuidanceAction):void=>{
    if(action.kind==="show")showHint(action.hint);
    else if(action.kind==="visible"&&options.bubble.hidden)restoreHint(action.hint);
    else if(action.kind==="hide")hideBubble();
  };
  const evaluate=():void=>{
    const currentTime=now(),active=options.active(),route=options.route();
    const elapsed=active&&intervalWasActive?currentTime-previous:0;
    apply(schedule.advance(elapsed,{active,route}));
    const dwellTarget=dwell.advance(active?Math.max(0,currentTime-dwellPrevious):0,active);
    if(dwellTarget)apply(schedule.present(studioAnalystControlHint(route,dwellTarget),{active,route}));
    previous=currentTime;
    dwellPrevious=currentTime;
    intervalWasActive=active;
  };
  const requestNext=():void=>{
    const active=options.active();
    apply(schedule.request({active,route:options.route()}));
    previous=now();
    intervalWasActive=active;
  };
  const beginDwell=(event:Event,modality:"pointer"|"focus"):void=>{
    if(!options.controlRoot)return;
    const control=namedControl(options.controlRoot,options.analystControl,event.target);
    if(!control)return;
    dwell.enter(control.target,modality);
    dwellPrevious=now();
  };
  const endDwell=(event:Event,modality:"pointer"|"focus"):void=>{
    if(!options.controlRoot)return;
    const control=namedControl(options.controlRoot,options.analystControl,event.target);
    const related="relatedTarget" in event?event.relatedTarget:null;
    if(!control||related instanceof Node&&control.element.contains(related))return;
    dwell.leave(modality);
    dwellPrevious=now();
  };
  const pointerOver=(event:PointerEvent):void=>beginDwell(event,"pointer");
  const pointerOut=(event:PointerEvent):void=>endDwell(event,"pointer");
  const focusIn=(event:FocusEvent):void=>beginDwell(event,"focus");
  const focusOut=(event:FocusEvent):void=>endDwell(event,"focus");
  const routeClick=():void=>queueMicrotask(evaluate);
  const analystKeyDown=(event:KeyboardEvent):void=>{
    if(event.key!=="Enter"&&event.key!==" ")return;
    event.preventDefault();
    requestNext();
  };
  const timer=setInterval(evaluate,options.intervalMilliseconds??250);
  ownerDocument.addEventListener("visibilitychange",evaluate);
  ownerDocument.addEventListener("click",routeClick);
  options.analystControl?.addEventListener("click",requestNext);
  options.analystControl?.addEventListener("keydown",analystKeyDown);
  options.controlRoot?.addEventListener("pointerover",pointerOver);
  options.controlRoot?.addEventListener("pointerout",pointerOut);
  options.controlRoot?.addEventListener("focusin",focusIn);
  options.controlRoot?.addEventListener("focusout",focusOut);
  return{
    evaluate,
    requestNext,
    dispose(){
      clearInterval(timer);
      hideBubble();
      ownerDocument.removeEventListener("visibilitychange",evaluate);
      ownerDocument.removeEventListener("click",routeClick);
      options.analystControl?.removeEventListener("click",requestNext);
      options.analystControl?.removeEventListener("keydown",analystKeyDown);
      options.controlRoot?.removeEventListener("pointerover",pointerOver);
      options.controlRoot?.removeEventListener("pointerout",pointerOut);
      options.controlRoot?.removeEventListener("focusin",focusIn);
      options.controlRoot?.removeEventListener("focusout",focusOut);
    },
  };
}
