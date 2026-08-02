import assert from "node:assert/strict";
import {
  filterSchemaRelationshipTree,
  projectSchemaRelationshipTree,
  restoreSchemaRelationshipTreeView,
  saveSchemaRelationshipTreeView,
} from "../dist/schema-relationship-tree.js";

const entity=(id,name,extra={})=>({id,name,...extra});
const state={
  project:{
    id:"project:shop",name:"Shop",
    collections:{
      profiles:[entity("profile:sitewide","Sitewide")],
      pageGroups:[entity("group:checkout","Checkout"),entity("group:promotions","Promotions")],
      pages:[entity("page:cart","Cart",{pageGroupIds:["group:checkout","group:promotions"]})],
      events:[entity("event:purchase","Purchase")],
      flows:[entity("flow:checkout","Checkout journey"),entity("flow:express","Express checkout")],
      applicabilitySets:[],fixtures:[],assignments:[],
    },
    documentationFlowGraphs:{
      "flow:checkout":{pageFrames:[entity("frame:checkout-cart","Cart",{pageId:"page:cart",pageGroupId:"group:checkout"})],occurrences:[entity("occurrence:checkout-purchase","Purchase occurrence",{pageFrameId:"frame:checkout-cart",pageId:"page:cart",eventId:"event:purchase"})]},
      "flow:express":{pageFrames:[entity("frame:express-cart","Cart",{pageId:"page:cart",pageGroupId:"group:checkout"})],occurrences:[entity("occurrence:express-purchase","Purchase occurrence",{pageFrameId:"frame:express-cart",pageId:"page:cart",eventId:"event:purchase"})]},
    },
  },
  history:{undo:[],redo:[]},
};
const saved=[{id:"schema:article-opened",name:"Opened Article",version:3}];
const tree=projectSchemaRelationshipTree(state,saved);
const flatten=(nodes)=>nodes.flatMap((node)=>[node,...flatten(node.children)]);
const nodes=flatten(tree);

assert.deepEqual(tree.map(({name})=>name),["Saved schemas","Project Shop"]);
assert.deepEqual(tree[1].children.map(({name})=>name),["Shared Profiles","Property Sets","Pages","Events","Flows"]);
const cartReferences=nodes.filter(({targetKey})=>targetKey==="pages:page:cart");
assert.equal(cartReferences.length,3,"Cart has one canonical Pages row and one reference under each Property Set");
assert.deepEqual(new Set(cartReferences.map(({targetKey})=>targetKey)),new Set(["pages:page:cart"]),"references route one stable canonical target");
assert.ok(cartReferences.every(({relationshipPath})=>relationshipPath.includes("Cart")&&!relationshipPath.includes("page:cart")),"paths are human-readable");
const purchaseOccurrences=nodes.filter(({targetKey})=>targetKey?.startsWith("occurrences:"));
assert.equal(purchaseOccurrences.length,4,"each occurrence appears below its Event and owning Flow Page instance");
assert.equal(new Set(purchaseOccurrences.map(({targetKey})=>targetKey)).size,2,"repeated occurrence references preserve stable targets");

const ordinaryTree=filterSchemaRelationshipTree(tree,{category:"All",query:""});
assert.equal(flatten(ordinaryTree).filter(({expanded})=>expanded).length,0,"blank-query filtering leaves expansion under operator control");
assert.deepEqual(flatten(filterSchemaRelationshipTree(tree,{category:"Pages",query:""})).filter(({targetKey})=>targetKey).map(({targetKey})=>targetKey),["pages:page:cart"],"category filters expose canonical results from their relationship branch");

const pageGroupSearch=filterSchemaRelationshipTree(tree,{category:"Property Sets",query:"cart"});
const pageGroupNodes=flatten(pageGroupSearch);
assert.deepEqual(pageGroupNodes.filter(({targetKey})=>targetKey==="pages:page:cart").map(({relationshipPath})=>relationshipPath),[
  "Shop → Property Sets → Checkout → Cart",
  "Shop → Property Sets → Promotions → Cart",
]);
assert.ok(pageGroupNodes.every(({name})=>name!=="Flows"),"unrelated siblings are pruned");
assert.ok(pageGroupNodes.filter(({targetKey})=>targetKey==="pages:page:cart").every(({match})=>match),"matching references are marked for result semantics");

const occurrenceSearch=filterSchemaRelationshipTree(tree,{category:"Event occurrences",query:"express"});
const occurrenceNodes=flatten(occurrenceSearch);
assert.deepEqual(occurrenceNodes.filter(({targetKey})=>targetKey==="occurrences:flow:express:occurrence:express-purchase").map(({relationshipPath})=>relationshipPath),[
  "Shop → Flows → Express checkout → Cart → Purchase occurrence",
]);
assert.ok(occurrenceNodes.some(({name,expanded})=>name==="Express checkout"&&expanded));

const storage=new Map();
saveSchemaRelationshipTreeView(storage,"project:shop",{query:"Cart",category:"Pages",expandedKeys:["project:project:shop","missing"],scrollTop:71});
assert.deepEqual(restoreSchemaRelationshipTreeView(storage,"project:shop",new Set(nodes.map(({key})=>key))),{
  query:"Cart",category:"Pages",expandedKeys:["project:project:shop"],scrollTop:71,
});
assert.deepEqual(restoreSchemaRelationshipTreeView(storage,"project:trade",new Set()),{
  query:"",category:"All",expandedKeys:[],scrollTop:0,
});
assert.doesNotThrow(()=>saveSchemaRelationshipTreeView({setItem(){throw new DOMException("quota","QuotaExceededError");}},"project:shop",{query:"Cart",category:"Pages",expandedKeys:[],scrollTop:0}),"ephemeral tree view state cannot break the canonical library when storage is full");
assert.deepEqual(restoreSchemaRelationshipTreeView({getItem(){throw new Error("storage unavailable");}},"project:shop",new Set()),{query:"",category:"All",expandedKeys:[],scrollTop:0});

console.log("data-layer schema relationship tree tests passed");
