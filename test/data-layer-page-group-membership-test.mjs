import assert from "node:assert/strict";
import {
  addPageGroupMembership,
  confirmPageGroupMembershipMigration,
  inspectPageGroupMembershipRemoval,
  movePageGroupMembership,
  orderedPageGroupIds,
  pageGroupMembers,
  removePageGroupMembership,
  stagePageGroupMembershipMigration,
} from "../dist/data-layer-page-group-membership.js";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:membership-${++sequence}`;
let state=createSpecificationProject({name:"Ordered memberships",site:"shop.example",id});
const cart={id:id("page"),name:"Cart",pageGroupIds:["group:checkout"]};
const checkout={id:"group:checkout",name:"Checkout"},retail={id:"group:retail",name:"Retail Checkout"},trade={id:"group:trade",name:"Trade Checkout",pageIds:[cart.id]},delivery={id:"group:delivery",name:"Delivery"};
state={...state,project:{...state.project,collections:{...state.project.collections,pages:[cart],pageGroups:[checkout,retail,trade,delivery],flows:[{id:"flow:checkout",name:"Checkout journey"}]},documentationFlowGraphs:{"flow:checkout":{pageGroupIds:[checkout.id,retail.id,delivery.id],pageFrames:[],occurrences:[],relationships:[]}}}};

assert.deepEqual(orderedPageGroupIds(state.project,cart.id),[checkout.id],"Page-owned order is authoritative when present");
state=addPageGroupMembership(state,cart.id,retail.id);
state=addPageGroupMembership(state,cart.id,trade.id);
assert.deepEqual(orderedPageGroupIds(state.project,cart.id),[checkout.id,retail.id,trade.id]);
assert.throws(()=>addPageGroupMembership(state,cart.id,retail.id),/already belongs/);
assert.throws(()=>addPageGroupMembership(state,cart.id,"group:missing"),/Unknown Page Group/);
assert.deepEqual(pageGroupMembers(state.project,trade.id).map(({id})=>id),[cart.id],"group members derive from Page-owned membership");

const beforeOrderProject=structuredClone(state.project),beforeOrderHistory=state.history.undo.length;
state=movePageGroupMembership(state,cart.id,trade.id,-1);
assert.deepEqual(orderedPageGroupIds(state.project,cart.id),[checkout.id,trade.id,retail.id]);
assert.deepEqual({...state.project.collections.pages[0],pageGroupIds:undefined},{...beforeOrderProject.collections.pages[0],pageGroupIds:undefined},"reorder changes no Page fields beyond membership order");
assert.deepEqual(state.project.collections.pageGroups,beforeOrderProject.collections.pageGroups,"reorder does not rewrite Page Group projections");
assert.equal(state.history.undo.length,beforeOrderHistory+1);

state={...state,project:{...state.project,documentationFlowGraphs:{"flow:checkout":{pageGroupIds:[checkout.id,retail.id,delivery.id],pageFrames:[{id:"frame:cart",pageId:cart.id,pageGroupId:retail.id,position:{y:90}}],occurrences:[{id:"occurrence:purchase",name:"Purchase",pageFrameId:"frame:cart",pageId:cart.id,pageGroupId:retail.id,eventId:"event:purchase",position:{y:130}}],relationships:[]}}}};
const removal=inspectPageGroupMembershipRemoval(state.project,cart.id,retail.id);
assert.equal(removal.blocked,true);
assert.match(removal.message,/Checkout journey.*Cart.*Retail Checkout/);
assert.deepEqual(removal.actions.map(({label})=>label),["Move to Checkout","Remove Page frame"]);
const beforeBlocked=state;
assert.equal(removePageGroupMembership(state,cart.id,retail.id),beforeBlocked,"in-use membership removal is a byte-identical no-op");

const legacyState={...state,project:{...state.project,collections:{...state.project.collections,pages:[{...state.project.collections.pages[0],pageGroupIds:[checkout.id,retail.id]}],pageGroups:[checkout,retail,{...trade,pageIds:[cart.id]},delivery]}}};
const migration=stagePageGroupMembershipMigration(legacyState.project,cart.id);
assert.deepEqual(migration.proposedPageGroupIds,[checkout.id,retail.id,trade.id],"legacy group-only memberships append in stable group order");
assert.deepEqual(migration.missingPageGroupIds,[]);
const migrated=confirmPageGroupMembershipMigration(legacyState,migration);
assert.deepEqual(orderedPageGroupIds(migrated.project,cart.id),[checkout.id,retail.id,trade.id]);
assert.equal(migrated.project.collections.pageGroups.some(({pageIds})=>pageIds?.includes(cart.id)),false,"confirmed migration removes the competing legacy source");
assert.equal(migrated.history.undo.at(-1).label,"Migrate ordered Page Group membership for Cart");
const missingState={...legacyState,project:{...legacyState.project,collections:{...legacyState.project.collections,pages:[{...cart,pageGroupIds:[checkout.id,"group:missing"]}]}}};
const missing=stagePageGroupMembershipMigration(missingState.project,cart.id);
assert.deepEqual(missing.missingPageGroupIds,["group:missing"]);
assert.throws(()=>confirmPageGroupMembershipMigration(missingState,missing),/missing Page Group/);

console.log("data-layer Page Group membership tests passed");
