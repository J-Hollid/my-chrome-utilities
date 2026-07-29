import assert from "node:assert/strict";
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
for(const part of studioParts){
  const partHints=studioAnalystHintsForRoute(part);
  assert.equal(partHints.length>=5,true,`${part} has at least five general tips`);
  assert.equal(new Set(partHints.map(({id})=>id)).size,partHints.length,`${part} tip identities are distinct`);
  assert.equal(partHints.every(({route,text})=>route===part&&text.trim().length>20),true,`${part} tips are complete and part-specific`);
}

const flowTips=studioAnalystHintsForRoute("Flows");
const flowTipText=Object.fromEntries(flowTips.map(({id,text})=>[id,text]));
assert.match(flowTipText.flows,/Add Pages to the canvas first.*place interaction Events inside them/u);
assert.match(flowTipText["flows-frames"],/Page frames.*journey step/u);
assert.match(flowTipText["flows-occurrences"],/Event occurrences inside their owning Page frame/u);
assert.match(flowTipText["flows-relationships"],/Page-to-Page relationships/u);
assert.match(flowTipText["flows-relationships"],/Page frames/u);
assert.doesNotMatch(
  flowTipText["flows-relationships"],
  /connect(?:ing)? (?:Event )?occurrences|occurrence(?:s)? (?:as|for|to) relationship endpoints?/iu,
  "Event availability is expressed by containment; occurrences must never be relationship endpoints",
);
assert.match(flowTipText["flows-documentation"],/Documentation.*Flow's value map/u);

const overview=studioAnalystHintForRoute("Project overview",[]);
assert.deepEqual(overview,{
  id:"project-overview",
  route:"Project overview",
  text:"Crikey! Pick a collection on the left to start shaping your specification.",
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
    text:"Smashing! Put reusable fields here so Pages and Events can inherit them.",
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
    text:"Jolly good! Give each Page its observed page event before refining its schema.",
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
  text:'“Add Page” is available in Pages; use it to work with this part of the specification.',
});

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
const ownerDocument={
  addEventListener(type,listener){listeners.set(type,listener);},
  removeEventListener(type,listener){if(listeners.get(type)===listener)listeners.delete(type);},
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
  now:()=>controllerNow,
  intervalMilliseconds:1_000_000,
});
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
controller.dispose();
assert.equal(listeners.size,0,"the controller removes its owner-document listener");

console.log("Specification Studio technical analyst guidance unit tests passed");
