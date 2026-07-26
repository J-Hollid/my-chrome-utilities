import assert from "node:assert/strict";
import {runRenderedWorkflow,workflowPreamble} from "./shared-harness.mjs";

const observation=await runRenderedWorkflow("schemas",`
  ${workflowPreamble}
  const {projectSchemaRelationshipTree,filterSchemaRelationshipTree}=await import("./utilities/data-layer/schemas.js");
  const entity=(id,name,extra={})=>({id,name,...extra});
  const state={project:{id:"project:shop",name:"Shop",collections:{profiles:[entity("profile:sitewide","Sitewide")],pageGroups:[entity("group:checkout","Checkout"),entity("group:promotions","Promotions")],pages:[entity("page:cart","Cart",{pageGroupIds:["group:checkout","group:promotions"]})],events:[entity("event:purchase","Purchase")],flows:[entity("flow:checkout","Checkout journey"),entity("flow:express","Express checkout")],applicabilitySets:[],fixtures:[],assignments:[]},documentationFlowGraphs:{"flow:checkout":{pageFrames:[entity("frame:checkout-cart","Cart",{pageId:"page:cart",pageGroupId:"group:checkout"})],occurrences:[entity("occurrence:checkout-purchase","Purchase occurrence",{pageFrameId:"frame:checkout-cart",pageId:"page:cart",eventId:"event:purchase"})]},"flow:express":{pageFrames:[entity("frame:express-cart","Cart",{pageId:"page:cart",pageGroupId:"group:checkout"})],occurrences:[entity("occurrence:express-purchase","Purchase occurrence",{pageFrameId:"frame:express-cart",pageId:"page:cart",eventId:"event:purchase"})]}}},history:{undo:[],redo:[]}};
  const tree=projectSchemaRelationshipTree(state,[{id:"schema:opened",name:"Opened Article",version:1}]),flat=(nodes)=>nodes.flatMap(node=>[node,...flat(node.children)]),nodes=flat(tree),cart=nodes.filter(({targetKey})=>targetKey==="pages:page:cart"),occurrences=nodes.filter(({targetKey})=>targetKey?.startsWith("occurrences:"));
  q("#data-layer-view-schemas").click();
  const list=q("#schema-list"),filter=q("#schema-category-filter"),search=q("#schema-search"),controls=q("#schema-tree-controls");
  filter.value="Page Groups";filter.dispatchEvent(new Event("change",{bubbles:true}));search.value="Cart";search.dispatchEvent(new Event("input",{bubbles:true}));
  const filtered=flat(filterSchemaRelationshipTree(tree,{category:"Page Groups",query:"Cart"})),paths=filtered.filter(({targetKey})=>targetKey==="pages:page:cart").map(({relationshipPath})=>relationshipPath);
  const before=JSON.stringify(state),live={...state,project:{...state.project,collections:{...state.project.collections,pages:state.project.collections.pages.map(page=>({...page,pageGroupIds:["group:checkout"]}))}}},updated=flat(projectSchemaRelationshipTree(live,[]));
  const treeItems=[...list.querySelectorAll('[role="treeitem"]')],geometry=[360,520].every(width=>controls.scrollWidth<=Math.max(width,controls.clientWidth)&&list.scrollWidth<=Math.max(width,list.clientWidth));
  const evidence={
    installedBoundary:q("#schema-editor")&&q("#schema-list").getAttribute("role")==="tree",
    tree001:tree.map(({name})=>name).join("|")==="Saved schemas|Project Shop"&&tree[1].children.map(({name})=>name).join("|")==="Shared Profiles|Page Groups|Pages|Events|Flows",
    tree002:cart.length===3&&new Set(cart.map(({targetKey})=>targetKey)).size===1,
    tree003:occurrences.length===4&&new Set(occurrences.map(({targetKey})=>targetKey)).size===2,
    tree004:[...filter.options].map(({text})=>text).join("|")==="All|Saved schemas|Shared Profiles|Page Groups|Pages|Events|Flow Page instances|Event occurrences"&&before===JSON.stringify(state),
    tree005:paths.join("|")==="Shop → Page Groups → Checkout → Cart|Shop → Page Groups → Promotions → Cart"&&filtered.every(({relationshipPath})=>!relationshipPath.includes("page:cart")),
    tree006:document.querySelectorAll("#schema-editor").length===1&&q("#schema-count").getAttribute("aria-live")==="polite",
    tree007:updated.filter(({key})=>key==="page-group:group:promotions:page:page:cart").length===0&&updated.filter(({targetKey})=>targetKey==="pages:page:cart").length===2,
    tree008:tree[0].name==="Saved schemas"&&tree[1].name==="Project Shop",
    tree009:geometry&&treeItems.every(item=>item.hasAttribute("aria-level")&&item.hasAttribute("aria-selected"))&&list.scrollWidth<=list.clientWidth,
  };
  return {passed:Object.values(evidence).every(Boolean),width:320,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,evidence};
`);

console.log(JSON.stringify({schemaRelationshipTree:{...observation.evidence}}));
for(const [key,value]of Object.entries(observation.evidence))assert.equal(value,true,key);
