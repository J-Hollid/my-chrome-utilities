import assert from "node:assert/strict";
import {
  applySavedEventFeedFilter,
  commitSavedEventFeedFilterLibrary,
  createSavedEventFeedFilter,
  deleteSavedEventFeedFilter,
  eventFeedFilterDisplayState,
  inspectSavedEventFeedFilter,
  renameSavedEventFeedFilter,
  restoreSavedEventFeedFilterLibrary,
  savedEventFeedFilterNameResult,
  savedEventFeedFilterQueryEqual,
  serializeSavedEventFeedFilterLibrary,
  setDefaultSavedEventFeedFilter,
  updateSavedEventFeedFilter,
} from "../dist/data-layer-saved-event-feed-filters.js";
import { filterEventsByQuery } from "../dist/data-layer-event-feed-query.js";
import { openSavedSessionLiveFeed, returnToCurrentLiveFeed, updateSavedSessionLiveFeedView } from "../dist/data-layer-saved-session-live-feed.js";

const checkoutQuery={conditions:[
  {id:"editor-9",field:"Event name",operator:"is",values:["purchase"]},
  {id:"editor-15",field:"Validation state",operator:"is",values:["Issues"]},
]};
const productQuery={conditions:[{id:"temporary",field:"Event name",operator:"is",values:["product_view"]}]};

let library=restoreSavedEventFeedFilterLibrary(null);
const checkout=createSavedEventFeedFilter(library,"Checkout issues",checkoutQuery,"filter:checkout");
library=checkout.library;
assert.equal(checkout.filter.id,"filter:checkout");
assert.equal(checkout.filter.version,1);
assert.deepEqual(checkout.filter.conditions.map(({id,field,operator,values})=>[id,field,operator,values]),[
  ["filter:checkout:condition:1","Event name","is",["purchase"]],
  ["filter:checkout:condition:2","Validation state","is",["Issues"]],
]);
assert.deepEqual(Object.keys(checkout.filter).sort(),["conditions","id","match","name","valueMatch","version"]);
assert.equal(savedEventFeedFilterQueryEqual(checkout.filter,{conditions:checkoutQuery.conditions.map((condition,index)=>({...condition,id:`other-${index}`}))}),true,"semantic equality must ignore transient editor identifiers");

assert.deepEqual(eventFeedFilterDisplayState({conditions:[]},undefined,library),{label:"All events",save:"unavailable",modified:false});
assert.deepEqual(eventFeedFilterDisplayState(productQuery,undefined,library),{label:"Custom · Unsaved",save:"create",modified:false});
assert.deepEqual(eventFeedFilterDisplayState(checkoutQuery,checkout.filter.id,library),{label:"Checkout issues",save:"none",modified:false});
assert.deepEqual(eventFeedFilterDisplayState(productQuery,checkout.filter.id,library),{label:"Checkout issues · Modified",save:"update-or-copy",modified:true});

const product=createSavedEventFeedFilter(library,"Product events",productQuery,"filter:product"); library=product.library;
assert.deepEqual(applySavedEventFeedFilter({conditions:[{id:"unrelated",field:"Source",operator:"is",values:["Adobe"]}]},checkout.filter),{
  conditions:checkout.filter.conditions,
},"switching must replace rather than merge the working query");

assert.deepEqual(savedEventFeedFilterNameResult(library,"  "),{accepted:false,assistance:"Enter a saved filter name"});
assert.deepEqual(savedEventFeedFilterNameResult(library," checkout ISSUES "),{accepted:false,assistance:"A saved filter with this name exists"});
assert.deepEqual(savedEventFeedFilterNameResult(library," Checkout warnings "),{accepted:true,name:"Checkout warnings",assistance:"Ready to save Checkout warnings"});

const updated=updateSavedEventFeedFilter(library,checkout.filter.id,productQuery); library=updated.library;
assert.equal(updated.filter.id,checkout.filter.id);
assert.deepEqual(updated.filter.conditions.map(({field})=>field),["Event name"]);
const renamed=renameSavedEventFeedFilter(setDefaultSavedEventFeedFilter(library,checkout.filter.id).library,checkout.filter.id,"Purchase defects"); library=renamed.library;
assert.equal(renamed.filter.id,checkout.filter.id);
assert.equal(library.defaultFilterId,checkout.filter.id);
assert.deepEqual(library.filters.map(({name})=>name),["Product events","Purchase defects"],"selector order must be name sorted");

const deleted=deleteSavedEventFeedFilter(library,checkout.filter.id,productQuery); library=deleted.library;
assert.equal(library.filters.some(({id})=>id===checkout.filter.id),false);
assert.equal(library.defaultFilterId,undefined);
assert.deepEqual(deleted.workingQuery,productQuery,"deleting must not clear the working feed");
assert.equal(deleted.activeFilterId,undefined);

const legacySerialized=JSON.stringify({version:1,filters:[{
  id:"filter:legacy",name:"Legacy failures",version:1,match:"all",valueMatch:"any",conditions:[
    {id:"legacy-1",field:"Event name",operator:"is",values:["purchase"]},
    {id:"legacy-2",field:"Future field",operator:"approximately",values:["broken"]},
  ],
}]});
const legacyLibrary=restoreSavedEventFeedFilterLibrary(legacySerialized);
const inspection=inspectSavedEventFeedFilter(legacyLibrary.filters[0],[]);
assert.deepEqual(inspection.conditions.map(({status})=>status),["not observed","needs repair"]);
assert.equal(inspection.query.conditions.length,2,"unsupported conditions must never be silently discarded");
assert.equal(inspection.ready,false);
assert.deepEqual(filterEventsByQuery([{name:"purchase",sourceId:"history"}],inspection.query),[],"unsupported conditions must never be treated as successful matches");

const currentView={view:"Live",status:"Live",pageUrl:"https://shop.test",sources:[],events:[{id:"current",name:"purchase",sourceId:"history",captureTime:"now"}],query:productQuery,savedFilterId:"filter:product",listVisible:true};
const archived={id:"session:saved",name:"Archive",pageScope:"https://shop.test",startedAt:"2026-01-01T00:00:00Z",endedAt:"2026-01-01T00:01:00Z",events:[{id:"saved",sourceId:"history",sourceName:"History",name:"purchase",payload:{},rawInput:[],captureOrder:1}],provenance:{source:"test",capturedAt:"2026-01-01T00:01:00Z"}};
let feed=openSavedSessionLiveFeed(currentView,archived);
feed=updateSavedSessionLiveFeedView(feed,{query:checkoutQuery});
assert.deepEqual(feed.savedView.query,checkoutQuery);
assert.deepEqual(returnToCurrentLiveFeed(feed).state.query,productQuery,"saved-session working queries must not overwrite the current Live working query");
assert.equal(returnToCurrentLiveFeed(feed).state.savedFilterId,"filter:product");

const snapshot=serializeSavedEventFeedFilterLibrary(legacyLibrary);
const proposed=renameSavedEventFeedFilter(legacyLibrary,"filter:legacy","Renamed").library;
const failed=commitSavedEventFeedFilterLibrary(legacyLibrary,proposed,()=>{throw new Error("quota");},"Renaming saved filter failed");
assert.equal(failed.committed,false);
assert.equal(failed.library,legacyLibrary);
assert.equal(failed.feedback,"Renaming saved filter failed");
assert.equal(serializeSavedEventFeedFilterLibrary(failed.library),snapshot);
const writes=[];
const committed=commitSavedEventFeedFilterLibrary(legacyLibrary,proposed,(serialized)=>writes.push(serialized),"Renaming saved filter failed");
assert.equal(committed.committed,true);
assert.equal(committed.library,proposed);
assert.deepEqual(writes,[serializeSavedEventFeedFilterLibrary(proposed)]);

console.log("data-layer saved event feed filter tests passed");
