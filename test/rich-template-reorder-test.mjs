import assert from "node:assert/strict";

import {moveRichBlock,richBlockMoveDestinations} from "../dist/project-documentation/workspace-template-library-ui.js";

const blocks=[
  {id:"alpha",type:"paragraph",content:[{text:"Alpha"}]},
  {id:"bravo",type:"repeat",items:"table.rows",variable:"row",children:[
    {id:"bravo-child",type:"paragraph",content:[{text:"Child"}]},
  ]},
  {id:"charlie",type:"repeat",items:"table.rows",variable:"row",children:[
    {id:"charlie-child",type:"paragraph",content:[{text:"Destination"}]},
  ]},
];

const destinations=richBlockMoveDestinations(blocks,"bravo");
assert.ok(destinations.some(({parentId,itemId})=>parentId==="charlie"&&itemId==="charlie-child"));
assert.ok(!destinations.some(({itemId,parentId})=>itemId==="bravo-child"||parentId==="bravo"),
  "Move… excludes the moving block and every descendant");

const moved=moveRichBlock(blocks,"bravo","charlie","charlie-child","after");
assert.deepEqual(moved.map(({id})=>id),["alpha","charlie"]);
assert.deepEqual(moved[1].children.map(({id})=>id),["charlie-child","bravo"]);
assert.equal(moved[1].children[1],blocks[1],"the moved block retains its identity and descendants");
const restored=moveRichBlock(moved,"bravo",null,"charlie","before");
assert.deepEqual(restored.map(({id})=>id),["alpha","bravo","charlie"]);
assert.equal(restored[1],blocks[1],"one inverse move restores the former hierarchy");

console.log("Rich template hierarchy reorder tests passed");
