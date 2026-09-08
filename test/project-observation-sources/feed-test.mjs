import assert from "node:assert/strict";
import {filteredLiveEvents} from "../../dist/data-layer-live-observer.js";
const events=[{id:"1",name:"purchase",sourceId:"m"},{id:"2",name:"purchase",sourceId:"a"},{id:"3",name:"pageview",sourceId:"m"}];
const state={events,sourceFilterId:"m",filter:{kind:"event name",value:"purchase"}};
assert.deepEqual(filteredLiveEvents(state).map(e=>e.id),["1"]);
assert.deepEqual(filteredLiveEvents({...state,filter:undefined}).map(e=>e.id),["1","3"]);
assert.deepEqual(filteredLiveEvents({...state,sourceFilterId:undefined}).map(e=>e.id),["1","2"]);
assert.equal(events.length,3);
console.log("Observation source feed intersection tests passed");
