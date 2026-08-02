import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  STUDIO_ANALYST_COOLDOWN_MS,
  STUDIO_ANALYST_FIRST_HINT_MS,
  STUDIO_ANALYST_HINT_LIFETIME_MS,
  STUDIO_ANALYST_CONTROL_DWELL_MS,
  STUDIO_ANALYST_PRINT_INTERVAL_MS,
  createStudioAnalystControlDwell,
  createStudioAnalystGuidanceSchedule,
  installStudioAnalystGuidance,
  studioAnalystControlHint,
  studioAnalystHintForRoute,
  studioAnalystHintsForRoute,
  studioAnalystVisibleText,
} from "../dist/specification-studio-technical-analyst-guidance.js";

assert.equal(STUDIO_ANALYST_FIRST_HINT_MS,10_000);
assert.equal(STUDIO_ANALYST_HINT_LIFETIME_MS,10_000);
assert.equal(STUDIO_ANALYST_COOLDOWN_MS,120_000);
assert.equal(STUDIO_ANALYST_CONTROL_DWELL_MS,3_000);
assert.equal(STUDIO_ANALYST_PRINT_INTERVAL_MS,20);

const studioParts=[
  "Project overview",
  "Shared Profiles",
  "Pages",
  "Page Groups",
  "Events",
  "Applicability",
  "Flows",
  "Fixtures",
  "Assignments",
  "Documentation",
];
const catalogue=readFileSync(new URL("../docs/specification-studio-technical-analyst-copy-R01.md",import.meta.url),"utf8");
const generalCatalogue=new Map();
let catalogueRoute;
for(const line of catalogue.split(/\r?\n/u)){
  const heading=/^### (.+)$/u.exec(line);
  if(heading)catalogueRoute=heading[1];
  const row=/^\| ([a-z][a-z0-9-]+) \| [^|]+ \| (.+) \|$/u.exec(line);
  if(row&&catalogueRoute)generalCatalogue.set(row[1],{route:catalogueRoute,text:row[2]});
}
assert.equal(generalCatalogue.size,50,"the approved catalogue retains all 50 general-tip identities");
for(const part of studioParts){
  for(const hint of studioAnalystHintsForRoute(part)){
    assert.deepEqual({route:hint.route,text:hint.text},generalCatalogue.get(hint.id),`${hint.id} uses its approved exact comic copy`);
  }
}
for(const part of studioParts){
  const partHints=studioAnalystHintsForRoute(part);
  assert.equal(partHints.length>=5,true,`${part} has at least five general tips`);
  assert.equal(new Set(partHints.map(({id})=>id)).size,partHints.length,`${part} tip identities are distinct`);
  assert.equal(partHints.every(({route,text})=>route===part&&text.trim().length>20),true,`${part} tips are complete and part-specific`);
  assert.equal(partHints.every(({text})=>text.length<=180),true,`${part} tips fit the complete bubble copy limit`);
}

const requiredGeneralTips=new Map([
  ["Project overview","Lost an entity in the filing-cabinet jungle? Global search finds it without rearranging a single saved Draft."],
  ["Shared Profiles","Concepts arrange Profile properties into sensible documentation gangs. Validation remains unmoved; it has its own clipboard."],
  ["Pages","Path conditions are the Page's doorman: they inspect each observed location and politely—or firmly—decide whether it belongs."],
  ["Assignments","Run preflight before testing. Missing targets and tied candidates are easier to catch before they put on matching moustaches."],
  ["Documentation","Generate rich copy or Excel only after refreshing the preview. Exporting stale work merely gives yesterday better stationery."],
]);
for(const [route,text] of requiredGeneralTips){
  assert.equal(studioAnalystHintsForRoute(route).some((hint)=>hint.text===text),true,`${route} exposes the specified comic guidance`);
}

const flowTips=studioAnalystHintsForRoute("Flows");
const flowTipText=Object.fromEntries(flowTips.map(({id,text})=>[id,text]));
assert.match(flowTipText.flows,/Pages are the rooms; Events are the custard pies.*Add the rooms first/u);
assert.match(flowTipText["flows-frames"],/Page frames.*journey step/u);
assert.match(flowTipText["flows-occurrences"],/Event occurrence inside its owning Page frame/u);
assert.match(flowTipText["flows-relationships"],/Connect Page frames to Page frames/u);
assert.doesNotMatch(
  flowTipText["flows-relationships"],
  /connect(?:ing)? (?:Event )?occurrences|occurrence(?:s)? (?:as|for|to) relationship endpoints?/iu,
  "Event availability is expressed by containment; occurrences must never be relationship endpoints",
);
assert.match(flowTipText["flows-documentation"],/Refresh Documentation.*selected Flow.*value map/u);

const overview=studioAnalystHintForRoute("Project overview",[]);
assert.deepEqual(overview,{
  id:"project-overview",
  route:"Project overview",
  text:"A project with no collection is merely a clipboard with ambitions. Pick one on the left and give the specification somewhere to begin.",
});
assert.equal(studioAnalystHintForRoute("Project overview",["project-overview"])?.id,"project-overview-context");
assert.equal(studioAnalystHintForRoute("Unknown route",[]),undefined);

const schedule=createStudioAnalystGuidanceSchedule();
assert.deepEqual(schedule.advance(9_999,{active:true,route:"Project overview"}),{kind:"waiting"});
assert.deepEqual(schedule.advance(1,{active:true,route:"Project overview"}),{
  kind:"show",
  hint:overview,
});
assert.deepEqual(schedule.advance(9_999,{active:true,route:"Project overview"}),{kind:"visible",hint:overview});
assert.deepEqual(schedule.advance(1,{active:true,route:"Project overview"}),{kind:"hide"});
assert.deepEqual(schedule.advance(109_999,{active:true,route:"Shared Profiles"}),{kind:"waiting"});
assert.deepEqual(schedule.advance(9_999,{active:true,route:"Shared Profiles"}),{kind:"waiting"});
assert.deepEqual(schedule.advance(1,{active:true,route:"Shared Profiles"}),{
  kind:"show",
  hint:{
    id:"shared-profiles",
    route:"Shared Profiles",
    text:"If Pages keep borrowing the same fields, stop issuing duplicates like raffle tickets. Put them in a Shared Profile and let inheritance do the legwork.",
  },
});

const paused=createStudioAnalystGuidanceSchedule();
assert.deepEqual(paused.advance(5_000,{active:true,route:"Pages"}),{kind:"waiting"});
assert.deepEqual(paused.advance(30_000,{active:false,route:"Pages"}),{kind:"waiting"});
assert.deepEqual(paused.advance(5_000,{active:true,route:"Pages"}),{
  kind:"show",
  hint:{
    id:"pages",
    route:"Pages",
    text:"Give each Page its observed page event before polishing the schema. Even a splendid room needs a doorbell before anyone can prove they visited.",
  },
});
assert.deepEqual(paused.advance(1,{active:false,route:"Pages"}),{kind:"hide"});
assert.deepEqual(paused.advance(9_999,{active:true,route:"Pages"}),{kind:"visible",hint:studioAnalystHintForRoute("Pages",[])});
assert.deepEqual(paused.advance(1,{active:true,route:"Pages"}),{kind:"hide"});

const rotation=createStudioAnalystGuidanceSchedule();
for(const [index,route] of["Project overview","Shared Profiles","Pages","Flows","Documentation"].entries()){
  if(index>0)rotation.advance(0,{active:true,route});
  const result=rotation.advance(10_000,{active:true,route});
  assert.equal(result.kind,"show",`${route} should have one applicable hint`);
  rotation.advance(10_000,{active:true,route});
}
assert.equal(rotation.advance(0,{active:true,route:"Project overview"}).kind,"waiting");
assert.equal(rotation.advance(10_000,{active:true,route:"Project overview"}).kind,"show","returning to a part resumes its unused tip rotation");

const requested=createStudioAnalystGuidanceSchedule();
const requestedOverview=requested.request({active:true,route:"Project overview"});
assert.equal(requestedOverview.kind,"show");
const replacedOverview=requested.request({active:true,route:"Project overview"});
assert.equal(replacedOverview.kind,"show");
assert.notEqual(replacedOverview.hint.id,requestedOverview.hint.id,"activation replaces with the next unused part tip");
assert.equal(requested.advance(10_000,{active:true,route:"Project overview"}).kind,"hide");
assert.equal(requested.advance(109_999,{active:true,route:"Project overview"}).kind,"waiting");
assert.equal(requested.advance(1,{active:true,route:"Project overview"}).kind,"show","activation restarts the ordinary 120-second interval");
assert.equal(requested.advance(0,{active:true,route:"Pages"}).kind,"hide","route change hides a current tip");
assert.equal(requested.advance(9_999,{active:true,route:"Pages"}).kind,"waiting");
assert.equal(requested.advance(1,{active:true,route:"Pages"}).kind,"show","route change restarts the initial timer");
requested.advance(0,{active:true,route:"Project overview"});
const retained=requested.request({active:true,route:"Project overview"});
assert.equal(retained.kind,"show");
assert.equal(
  new Set([requestedOverview.hint.id,replacedOverview.hint.id,retained.hint.id]).size,
  3,
  "route changes retain the session's presented identities",
);

const controlHint=studioAnalystControlHint("Pages",{id:"add-page",name:"Add Page"});
assert.deepEqual(controlHint,{
  id:"control:pages:add-page",
  route:"Pages",
  text:"Every grand journey needs somewhere for the trouble to begin. Add Page creates a real location before you send it marching onto a Flow.",
});
assert.equal(
  studioAnalystControlHint("Project overview",{id:"run-preflight",name:"Run preflight"})?.text,
  "Run preflight before publishing. It is considerably cheaper than discovering a missing target while the brass band is already playing.",
);
assert.equal(
  studioAnalystControlHint("Project overview",{id:"show-coverage",name:"Coverage matrix"})?.text,
  "The Coverage matrix catches untested properties hiding behind the curtains. Open it when surely something covers that stops sounding scientific.",
);
assert.equal(
  studioAnalystControlHint("Pages",{id:"undo-project",name:"Undo"})?.text,
  "Made a magnificent blunder? Undo rewinds the latest change on this page while the published revision remains safely behind glass.",
);
assert.equal(
  studioAnalystControlHint("Project overview",{id:"publish-project",name:"Publish release"})?.text,
  "Publish release turns today's Draft into an immutable revision. Give the review one heroic squint first; even boffins check the parachute.",
);
assert.equal(
  studioAnalystControlHint("Pages",{id:"unregistered",name:"Unregistered action"}),
  undefined,
  "unregistered named controls do not receive fabricated generic guidance",
);

const dwell=createStudioAnalystControlDwell();
dwell.enter({id:"add-page",name:"Add Page"},"pointer");
assert.equal(dwell.advance(2_999,true),undefined);
assert.equal(dwell.advance(1,true)?.id,"add-page");
assert.equal(dwell.advance(30_000,true),undefined,"remaining on one control cannot retrigger");
dwell.enter({id:"add-page",name:"Add Page"},"focus");
dwell.leave("pointer");
assert.equal(dwell.advance(30_000,true),undefined,"focus continuity prevents retrigger after pointer leaves");
dwell.leave("focus");
dwell.enter({id:"add-page",name:"Add Page"},"focus");
assert.equal(dwell.advance(3_000,true)?.id,"add-page","leaving with both modalities permits a later dwell");
const earlyDwell=createStudioAnalystControlDwell();
earlyDwell.enter({id:"validate",name:"Validate"},"pointer");
assert.equal(earlyDwell.advance(2_999,true),undefined);
earlyDwell.leave("pointer");
assert.equal(earlyDwell.advance(30_000,true),undefined,"leaving before three seconds cancels the dwell");

assert.equal(studioAnalystVisibleText("Crikey!",0,false),"");
assert.equal(studioAnalystVisibleText("Crikey!",19,false),"");
assert.equal(studioAnalystVisibleText("Crikey!",20,false),"C");
assert.equal(studioAnalystVisibleText("Crikey!",40,false),"Cr");
assert.equal(studioAnalystVisibleText("Crikey!",0,true),"Crikey!");
assert.equal(studioAnalystVisibleText("Crikey!",10_000,false),"Crikey!");

let controllerNow=0,controllerActive=true;
const listeners=new Map();
const analystListeners=new Map();
const ownerDocument={
  addEventListener(type,listener){listeners.set(type,listener);},
  removeEventListener(type,listener){if(listeners.get(type)===listener)listeners.delete(type);},
};
const analystControl={
  dataset:{},
  addEventListener(type,listener){analystListeners.set(type,listener);},
  removeEventListener(type,listener){if(analystListeners.get(type)===listener)analystListeners.delete(type);},
};
const bubble={
  ownerDocument,
  dataset:{},
  hidden:true,
  textContent:"",
  removeAttribute(name){if(name==="data-hint-id")delete this.dataset.hintId;},
};
const controller=installStudioAnalystGuidance({
  bubble,
  route:()=>"Pages",
  active:()=>controllerActive,
  analystControl,
  now:()=>controllerNow,
  intervalMilliseconds:1_000_000,
});
assert.equal(analystControl.dataset.analystPose,"idle","the installed analyst starts on the idle art");
controllerNow=5_000;
controller.evaluate();
controllerActive=false;
controller.evaluate();
controllerNow=65_000;
controllerActive=true;
controller.evaluate();
assert.equal(bubble.hidden,true,"a paused interval is not charged when activity resumes");
controllerNow=70_000;
controller.evaluate();
assert.equal(bubble.hidden,false,"the remaining active interval resumes from its pause boundary");
assert.equal(bubble.dataset.hintId,"pages");
assert.equal(analystControl.dataset.analystPose,"speaking","a newly presented tip selects speaking art");
controllerActive=false;
controller.evaluate();
assert.equal(analystControl.dataset.analystPose,"idle","inactivity restores idle art");
controller.dispose();
assert.equal(listeners.size,0,"the controller removes its owner-document listener");
assert.equal(analystListeners.size,0,"the controller removes analyst-control listeners");
assert.equal(analystControl.dataset.analystPose,"idle","disposal leaves the analyst idle");

const reducedAnalystControl={
  dataset:{},
  addEventListener(){},
  removeEventListener(){},
};
const reducedController=installStudioAnalystGuidance({
  bubble:{...bubble,dataset:{},hidden:true},
  route:()=>"Pages",
  active:()=>true,
  analystControl:reducedAnalystControl,
  reducedMotion:()=>true,
  now:()=>0,
  intervalMilliseconds:1_000_000,
});
reducedController.requestNext();
assert.equal(
  reducedAnalystControl.dataset.analystPose,
  "holding",
  "reduced motion uses one static speaking pose instead of cycling frames",
);
reducedController.dispose();

console.log("Specification Studio technical analyst guidance unit tests passed");
