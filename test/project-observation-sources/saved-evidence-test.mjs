import assert from "node:assert/strict";
import {openSavedSessionLiveFeed} from "../../dist/data-layer-saved-session-live-feed.js";
const event={id:"capture-1",sessionId:"session-1",sourceId:"marketing",sourceName:"Marketing",sourcePath:"dataLayer",
  projectId:"retail",pageLoadId:"page-1",arrayId:"array-1",entryIndex:0,captureSequence:1,name:"purchase",
  payload:{value:10},rawInput:{event:"purchase",value:10},pageUrl:"https://retail.test/",captureTime:"2026-09-08T01:00:00Z"};
const session={id:"saved-1",name:"Evidence",pageScope:event.pageUrl,startedAt:event.captureTime,endedAt:event.captureTime,immutable:true,events:[event]};
const view=openSavedSessionLiveFeed({view:"Live",status:"Live",pageUrl:event.pageUrl,sources:[],events:[],listVisible:true},JSON.parse(JSON.stringify(session))).savedView.events[0];
for(const field of ["projectId","sessionId","sourceId","sourceName","sourcePath","pageLoadId","arrayId","entryIndex","captureSequence"])assert.equal(view[field],event[field],field);
console.log("Saved observation source evidence tests passed");
