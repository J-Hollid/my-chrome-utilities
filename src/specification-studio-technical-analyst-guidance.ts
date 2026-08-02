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
    tip("project-overview","Project overview","A project with no collection is merely a clipboard with ambitions. Pick one on the left and give the specification somewhere to begin."),
    tip("project-overview-context","Project overview","Set the project context before the cast arrives. One measurement purpose keeps every collection reading from the same gloriously sensible script."),
    tip("project-overview-search","Project overview","Lost an entity in the filing-cabinet jungle? Global search finds it without rearranging a single saved Draft."),
    tip("project-overview-validate","Project overview","Run preflight before publishing. It is considerably cheaper than discovering a missing target while the brass band is already playing."),
    tip("project-overview-inspector","Project overview","Keep the Inspector open when a selected part looks suspicious. It is a magnifying glass with less chance of setting the desk alight."),
  ]),
  "Shared Profiles":Object.freeze([
    tip("shared-profiles","Shared Profiles","If Pages keep borrowing the same fields, stop issuing duplicates like raffle tickets. Put them in a Shared Profile and let inheritance do the legwork."),
    tip("shared-profiles-canonical","Shared Profiles","Author each reusable property once in the canonical Profile. Clones seem efficient until they grow moustaches and disagree."),
    tip("shared-profiles-library","Shared Profiles","Adopt a published Saved Schema when lineage matters. It keeps the family tree attached, including the branch everyone insists is not theirs."),
    tip("shared-profiles-concepts","Shared Profiles","Concepts arrange Profile properties into sensible documentation gangs. Validation remains unmoved; it has its own clipboard."),
    tip("shared-profiles-policy","Shared Profiles","Only defined fields shuts the schema gate to surprise extras. Inherited policy still has a key, because bureaucracy loves hierarchy."),
  ]),
  "Pages":Object.freeze([
    tip("pages","Pages","Give each Page its observed page event before polishing the schema. Even a splendid room needs a doorbell before anyone can prove they visited."),
    tip("pages-location","Pages","Path conditions are the Page's doorman: they inspect each observed location and politely—or firmly—decide whether it belongs."),
    tip("pages-groups","Pages","Order Page Group memberships deliberately. Otherwise their schema contributions arrive like five inspectors all claiming the same chair."),
    tip("pages-profiles","Pages","Attach a Shared Profile when a Page needs reusable fields. Copying them by hand only breeds tiny paperwork rebellions later."),
    tip("pages-schema","Pages","Review the effective Page schema before adding a local override. Magnify first, meddle second; the ancestors may already have done the work."),
  ]),
  "Page Groups":Object.freeze([
    tip("page-groups-membership","Page Groups","Group Pages that share applicability or schema contributions. It is a club with useful paperwork, not matching blazers."),
    tip("page-groups-conditions","Page Groups","Page Group conditions decide where the shared contribution applies. Make them observable; crystal balls produce dreadful test evidence."),
    tip("page-groups-schema","Page Groups","Keep shared fields canonical at the group level so member Pages inherit one story instead of exchanging contradictory telegrams."),
    tip("page-groups-order","Page Groups","Reorder group contributions only after checking affected Pages and Flow instances. Moving one chair can upset the entire schema orchestra."),
    tip("page-groups-repair","Page Groups","When contributions quarrel, open the named Page Group from the evidence. Repair the culprit, not every innocent bystander in the corridor."),
  ]),
  "Events":Object.freeze([
    tip("events-name","Events","Give the Event its exact production name. Aliases are charming at parties and catastrophic when the observer is taking attendance."),
    tip("events-source","Events","Choose the source that truly carries this Event. Listening at the wrong pipe produces silence, confusion, and an unnecessarily stern clipboard."),
    tip("events-target","Events","Set the payload target before wiring Assignments. Otherwise the data arrives heroically with nowhere to put its hat."),
    tip("events-pages","Events","Associate interaction Events with the Pages and Flows where they occur. Context keeps the custard pie attached to the correct scene."),
    tip("events-schema","Events","Refine Event data through canonical contributors instead of duplicating properties. One trustworthy witness beats a chorus of improvisers."),
  ]),
  "Applicability":Object.freeze([
    tip("applicability-priority","Applicability","Order Applicability Sets deliberately; higher matches speak first. Without priority, every candidate lunges for the same megaphone."),
    tip("applicability-conditions","Applicability","Build conditions from observable, type-compatible data. The engine understands evidence, not meaningful eyebrow movements."),
    tip("applicability-fallback","Applicability","Keep one truthful fallback for observations matching nothing specific. Every mystery needs a sensible exit, preferably not through the shrubbery."),
    tip("applicability-overlap","Applicability","Run preflight for overlapping Applicability Sets. Two winners are not twice as correct; they are one argument wearing two hats."),
    tip("applicability-assignments","Applicability","Use Applicability Sets to steer Assignments toward the right contributor. It is traffic control for data, minus the tiny fluorescent jacket."),
  ]),
  "Flows":Object.freeze([
    tip("flows","Flows","Pages are the rooms; Events are the custard pies. Add the rooms first, then put each splat where it actually happened."),
    tip("flows-frames","Flows","Use Page frames to show where each journey step occurs. A loose Event on the carpet is evidence, but not the helpful sort."),
    tip("flows-occurrences","Flows","Place each Event occurrence inside its owning Page frame and state its obligation. Containment keeps the plot from wandering off at intermission."),
    tip("flows-relationships","Flows","Connect Page frames to Page frames. Events belong inside them; asking an Event to become a road sign is above its pay grade."),
    tip("flows-documentation","Flows","Refresh Documentation after changing a selected Flow. The old value map is loyal, polished, and confidently describing yesterday."),
  ]),
  "Fixtures":Object.freeze([
    tip("fixtures-observations","Fixtures","Capture representative observations for the path you mean to test. One heroic sample cannot impersonate the entire visiting public."),
    tip("fixtures-expected","Fixtures","Record the expected outcome, not merely the raw sample. Evidence without an expectation is just data loitering near a clipboard."),
    tip("fixtures-context","Fixtures","Link each Fixture to the Page, Event, and Flow it demonstrates. Context tells the detective which room contains the footprint."),
    tip("fixtures-guided","Fixtures","Use guided validation to compare a Fixture with the compiled specification. Let the machinery argue with the evidence while you supervise."),
    tip("fixtures-warning","Fixtures","Incomplete Fixture coverage is advisory, not a schema blockade. It waves a small warning flag; canonical validation still guards the gate."),
  ]),
  "Assignments":Object.freeze([
    tip("assignments-event","Assignments","Choose the observed Event before mapping its Assignment. Even the finest parcel needs a name on the label."),
    tip("assignments-applicability","Assignments","Select an Applicability Set that yields one clear context. Ambiguity is simply two confident ushers pointing at different seats."),
    tip("assignments-target","Assignments","Point the Assignment at the contributor that owns the schema. Data dislikes being delivered to a building marked Probably Here."),
    tip("assignments-priority","Assignments","Use priority only to settle otherwise valid competing candidates. It is a tie-breaker, not a ceremonial crown for your favourite."),
    tip("assignments-preflight","Assignments","Run preflight before testing. Missing targets and tied candidates are easier to catch before they put on matching moustaches."),
  ]),
  "Documentation":Object.freeze([
    tip("documentation","Documentation","Refresh the preview after changing a Documentation Set. Yesterday's snapshot is beautifully formatted and completely unaware of today."),
    tip("documentation-sections","Documentation","Select only the sections this audience needs. A document containing everything is a cupboard falling open, not a briefing."),
    tip("documentation-concepts","Documentation","Order and include Concepts to keep grouped tables consistent. Otherwise the headings queue like shoppers who have spotted a second till."),
    tip("documentation-theme","Documentation","Save the project-local theme before refreshing the preview. Unsaved branding is just a splendid waistcoat left on the chair."),
    tip("documentation-export","Documentation","Generate rich copy or Excel only after refreshing the preview. Exporting stale work merely gives yesterday better stationery."),
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

export function studioAnalystControlHint(route:string,target:StudioAnalystControlTarget):StudioAnalystHint|undefined{
  const targetKey=slug(target.id||target.name),targetName=target.name.trim();
  const text=
    route==="Pages"&&(targetKey==="add-page"||/^Add Page(?:\b| to )/u.test(targetName))
      ?"Every grand journey needs somewhere for the trouble to begin. Add Page creates a real location before you send it marching onto a Flow."
    :route==="Project overview"&&(targetKey==="run-preflight"||targetName==="Run preflight")
      ?"Run preflight before publishing. It is considerably cheaper than discovering a missing target while the brass band is already playing."
    :route==="Project overview"&&(targetKey==="show-coverage"||targetName==="Coverage matrix")
      ?"The Coverage matrix catches untested properties hiding behind the curtains. Open it when surely something covers that stops sounding scientific."
    :route==="Pages"&&(targetKey==="undo-project"||targetName==="Undo")
      ?"Made a magnificent blunder? Undo rewinds the latest change on this page while the published revision remains safely behind glass."
    :route==="Project overview"&&(targetKey==="publish-project"||targetName==="Publish release")
      ?"Publish release turns today's Draft into an immutable revision. Give the review one heroic squint first; even boffins check the parachute."
    :undefined;
  return text?{
    id:`control:${slug(route)}:${slug(target.id||target.name)}`,
    route,
    text,
  }:undefined;
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

  const setAnalystPose=(pose:"idle"|"speaking"|"holding"):void=>{
    if(options.analystControl)options.analystControl.dataset.analystPose=pose;
  };

  const cancelPrint=():void=>{
    printSequence+=1;
    if(printTimer!==undefined){clearInterval(printTimer);printTimer=undefined;}
  };
  const hideBubble=():void=>{
    cancelPrint();
    setAnalystPose("idle");
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
    const motionReduced=reducedMotion();
    setAnalystPose(motionReduced?"holding":"speaking");
    if(!reserve||!visual||!announcement){
      options.bubble.textContent=hint.text;
      return;
    }
    reserve.textContent=hint.text;
    visual.textContent=motionReduced?hint.text:"";
    announcement.textContent="";
    queueMicrotask(()=>{if(sequence===printSequence)announcement.textContent=hint.text;});
    if(motionReduced)return;
    let elapsed=0;
    printTimer=setInterval(()=>{
      elapsed+=STUDIO_ANALYST_PRINT_INTERVAL_MS;
      visual.textContent=studioAnalystVisibleText(hint.text,elapsed,false);
      if(visual.textContent===hint.text&&printTimer!==undefined){
        clearInterval(printTimer);
        printTimer=undefined;
        setAnalystPose("holding");
      }
    },STUDIO_ANALYST_PRINT_INTERVAL_MS);
  };
  const restoreHint=(hint:StudioAnalystHint):void=>{
    cancelPrint();
    options.bubble.dataset.hintId=hint.id;
    options.bubble.dataset.completeText=hint.text;
    options.bubble.hidden=false;
    setAnalystPose("holding");
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
    const controlHint=dwellTarget?studioAnalystControlHint(route,dwellTarget):undefined;
    if(controlHint)apply(schedule.present(controlHint,{active,route}));
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
  setAnalystPose("idle");
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
