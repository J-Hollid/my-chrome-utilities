import assert from "node:assert/strict";
import {
  addPageGroupMembership,
  confirmPageGroupMembershipMigration,
  inspectPageGroupMembershipRemoval,
  movePageGroupMembership,
  orderedPageGroupIds,
  pageGroupMembers,
  previewPageGroupMembershipMove,
  removePageGroupMembership,
  stagePageGroupMembershipMigration,
} from "../dist/data-layer-page-group-membership.js";
import {addFlowPageFrame} from "../dist/data-layer-flow-graph.js";
import {createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:membership-${++sequence}`;
let state=createSpecificationProject({name:"Ordered memberships",site:"shop.example",id});
const cart={id:id("page"),name:"Cart",pageGroupIds:["group:checkout"]};
const checkout={id:"group:checkout",name:"Checkout"},retail={id:"group:retail",name:"Retail Checkout"},trade={id:"group:trade",name:"Trade Checkout"},delivery={id:"group:delivery",name:"Delivery"};
state={...state,project:{...state.project,collections:{...state.project.collections,pages:[cart],pageGroups:[checkout,retail,trade,delivery],flows:[{id:"flow:checkout",name:"Checkout journey"}]},documentationFlowGraphs:{"flow:checkout":{pageGroupIds:[checkout.id,retail.id,delivery.id],pageFrames:[],occurrences:[],relationships:[]}}}};

assert.deepEqual(orderedPageGroupIds(state.project,cart.id),[checkout.id],"Page-owned order is authoritative when present");
const canonicalFixture=state,divergentFixture={...state,project:{...state.project,collections:{...state.project.collections,pageGroups:[checkout,retail,{...trade,pageIds:[cart.id]},delivery]}}},divergentBytes=JSON.stringify(divergentFixture);
assert.deepEqual(orderedPageGroupIds(divergentFixture.project,cart.id),[checkout.id,trade.id],"group-only membership remains visible until explicit migration");
assert.deepEqual(pageGroupMembers(divergentFixture.project,trade.id).map(({id})=>id),[cart.id],"derived members retain group-only legacy membership until confirmation");
assert.equal(addPageGroupMembership(divergentFixture,cart.id,retail.id),divergentFixture,"add cannot silently discard a divergent group-only membership");
assert.equal(movePageGroupMembership(divergentFixture,cart.id,trade.id,-1),divergentFixture,"reorder cannot silently reconcile divergent membership sources");
assert.equal(removePageGroupMembership(divergentFixture,cart.id,checkout.id),divergentFixture,"remove cannot silently reconcile divergent membership sources");
assert.equal(addFlowPageFrame(divergentFixture,"flow:checkout",{pageId:cart.id,pageGroupId:checkout.id,y:90},id),divergentFixture,"Flow placement waits for ordered-membership migration confirmation");
assert.equal(JSON.stringify(divergentFixture),divergentBytes,"blocked ordinary commands preserve bytes, revision, and complete dual-source membership");
state=addPageGroupMembership(state,cart.id,retail.id);
state=addPageGroupMembership(state,cart.id,trade.id);
assert.deepEqual(orderedPageGroupIds(state.project,cart.id),[checkout.id,retail.id,trade.id]);
assert.throws(()=>addPageGroupMembership(state,cart.id,retail.id),/already belongs/);
assert.throws(()=>addPageGroupMembership(state,cart.id,"group:missing"),/Unknown Page Group/);
assert.deepEqual(pageGroupMembers(state.project,trade.id).map(({id})=>id),[cart.id],"group members derive from Page-owned membership");

const beforeOrderProject=structuredClone(state.project),beforeOrderHistory=state.history.undo.length;
const stagedOrder=previewPageGroupMembershipMove(state.project,cart.id,trade.id,-1);
assert.deepEqual(stagedOrder,[checkout.id,trade.id,retail.id],"reorder preview exposes the requested order before commit");
assert.deepEqual(orderedPageGroupIds(state.project,cart.id),[checkout.id,retail.id,trade.id],"preview does not mutate canonical membership");
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

const legacyState={...canonicalFixture,project:{...canonicalFixture.project,collections:{...canonicalFixture.project.collections,pageGroups:[checkout,retail,{...trade,pageIds:[cart.id]},delivery]}}};
const migration=stagePageGroupMembershipMigration(legacyState.project,cart.id);
assert.deepEqual(migration.proposedPageGroupIds,[checkout.id,trade.id],"legacy group-only memberships append in stable group order");
assert.deepEqual(migration.missingPageGroupIds,[]);
const migrated=confirmPageGroupMembershipMigration(legacyState,migration);
assert.deepEqual(orderedPageGroupIds(migrated.project,cart.id),[checkout.id,trade.id]);
assert.equal(migrated.project.collections.pageGroups.some(({pageIds})=>pageIds?.includes(cart.id)),false,"confirmed migration removes the competing legacy source");
assert.equal(migrated.history.undo.at(-1).label,"Migrate ordered Page Group membership for Cart");
assert.deepEqual(undoProjectTransaction(migrated).project,legacyState.project,"one Undo restores the complete divergent dual-source fixture");
const missingState={...legacyState,project:{...legacyState.project,collections:{...legacyState.project.collections,pages:[{...cart,pageGroupIds:[checkout.id,"group:missing"]}]}}};
const missing=stagePageGroupMembershipMigration(missingState.project,cart.id);
assert.deepEqual(missing.missingPageGroupIds,["group:missing"]);
assert.throws(()=>confirmPageGroupMembershipMigration(missingState,missing),/missing Page Group/);

console.log("data-layer Page Group membership tests passed");
