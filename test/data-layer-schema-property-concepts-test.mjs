import assert from "node:assert/strict";

import {
  canonicalConceptIndex,
  canonicalConceptSortedRows,
  canonicalConstraints,
  canonicalJsonSchemaDocument,
  canonicalSchemaFromJsonSchema,
  createCanonicalSchema,
} from "../dist/data-layer-canonical-schema.js";
import {canonicalTableQuickEditPatch} from "../dist/data-layer-canonical-schema-ui.js";
import {schemaTableColumns,schemaTableEditableFacets} from "../dist/data-layer-schema-table.js";
import {createProjectDocumentationSet} from "../dist/data-layer-project-documentation-records.js";
import {groupProjectDocumentationConceptRows,reconcileProjectDocumentationConcepts} from "../dist/data-layer-project-documentation-compiler.js";
import {compileProjectDocumentationSnapshot,renderProjectDocumentationClipboard,writeProjectDocumentationWorkbook} from "../dist/data-layer-project-documentation-workspace.js";

const documentation={displayText:"",description:"",comments:"",example:{method:"blank"}};
const property=(id,name,order,concept,parentId)=>({
  id,name,order,...(parentId?{parentId}:{}),type:"string",presence:{mode:"optional"},
  allowedValues:[],rules:[],documentation,provenance:[{source:"created"}],
  overrideReferences:[],...(concept?{concept}:{}),
});
const page=property("property:page","page_name",0," Page ");
const commerce={...property("property:commerce","commerce",1,"ecommerce"),type:"object"};
const child=property("property:child","transaction_id",0,undefined,commerce.id);
const ungrouped=property("property:ungrouped","visitor_id",2);
const document={
  ...createCanonicalSchema({id:"schema:concept",contributorId:"profile:sitewide",contributorName:"Sitewide"}),
  rootIds:[page.id,commerce.id,ungrouped.id],
  nodes:{[page.id]:page,[commerce.id]:commerce,[child.id]:child,[ungrouped.id]:ungrouped},
};

assert.deepEqual(
  canonicalConceptIndex([
    document,
    {...document,id:"schema:other",nodes:{...document.nodes,[page.id]:{...page,concept:"page"},[commerce.id]:{...commerce,concept:"  Ecommerce "}}},
  ]),
  ["ecommerce","Page"],
  "concept suggestions trim and deduplicate case-insensitively while retaining first spelling",
);
assert.deepEqual(
  canonicalConceptSortedRows(document).map(({id})=>id),
  [commerce.id,page.id,child.id,ungrouped.id],
  "concept sorting is alphabetical with path order in each group and Ungrouped last",
);
assert.equal(child.concept,undefined,"a child property does not inherit its parent concept");
assert.deepEqual(
  canonicalTableQuickEditPatch(page,"concept","Checkout",()=> "unused"),
  {concept:"Checkout"},
  "Table concept editing writes only the property-level facet",
);
assert.deepEqual(
  canonicalTableQuickEditPatch(page,"concept","  ",()=> "unused"),
  {concept:undefined},
  "blank Table concept editing removes the stored facet",
);
assert.equal(canonicalConstraints(document).find(({path})=>path==="/page_name").concept,"Page");
assert.equal(canonicalJsonSchemaDocument(document).properties.page_name["x-concept"],"Page");
const roundTrip=canonicalSchemaFromJsonSchema({id:"schema:round-trip",contributorId:"profile:round-trip",contributorName:"Round trip",sourceIdentity:"json:concept",sourceRevision:1,document:canonicalJsonSchemaDocument(document),idFactory:(kind)=>`${kind}:round-trip`});
assert.equal(Object.values(roundTrip.nodes).find(({name})=>name==="page_name").concept,"Page");
assert.equal(Object.values(roundTrip.nodes).find(({name})=>name==="transaction_id").concept,undefined,"concept does not propagate from a parent during JSON Schema import");
assert.deepEqual(schemaTableColumns.map(({label})=>label),["","Path","Concept","Type","Presence","Description","Allowed values","Example","Source","State"]);
assert.deepEqual(schemaTableEditableFacets,["concept","type","presence","description","expected-or-allowed","example"]);
const documentationSet=createProjectDocumentationSet({id:"set:concept",name:"Concept docs",themeId:"theme:concept",sections:[{id:"section:matrix",kind:"matrix",name:"Data capture matrix",selected:true}],concepts:[{name:"Page",included:false},{name:"Ungrouped",included:true}],includeConceptSubheadings:true});
assert.deepEqual(reconcileProjectDocumentationConcepts(documentationSet,["page","Commerce"]),[
  {name:"Page",included:false},
  {name:"Commerce",included:true},
  {name:"Ungrouped",included:true},
],"new concepts append before Ungrouped without replacing saved choices");
assert.deepEqual(groupProjectDocumentationConceptRows(documentationSet,[
  {path:"/z",concept:"Page",cells:["/z"]},
  {path:"/b",concept:"Commerce",cells:["/b"]},
  {path:"/a",concept:"Commerce",cells:["/a"]},
  {path:"/u",cells:["/u"]},
]),{
  rows:[["/a"],["/b"],["/u"]],
  groups:[{name:"Commerce",start:0,count:2},{name:"Ungrouped",start:2,count:1}],
  concepts:[{name:"Page",included:false},{name:"Commerce",included:true},{name:"Ungrouped",included:true}],
},"filtering stays active independently of headings and retains path order inside configured groups");
const theme={id:"theme:concept",name:"Concept theme",clientName:"",logo:"",colors:{heading:"#222222",accent:"#666666",stripe:"#f4f4f4"},typography:{family:"Arial",headingSize:16,bodySize:11},density:"comfortable",borders:true,striping:false,highlightedHeadings:true,columnWidths:{},headerText:"",footerText:""};
const snapshot=compileProjectDocumentationSnapshot({projectId:"project:concept",projectName:"Concept project",set:documentationSet,theme,sourceRevisions:{},generatedAt:"2026-07-28T00:00:00.000Z",diagnostics:[],tables:[{id:"section:matrix",title:"Data capture matrix",headings:["Property","Page"],rows:[["/a","Mandatory"],["/b","Optional"],["/u","Optional"]],conceptGroups:[{name:"Commerce",start:0,count:2},{name:"Ungrouped",start:2,count:1}]}]});
const rich=renderProjectDocumentationClipboard(snapshot,{scope:"complete"});
assert.match(rich.html,/<th[^>]+scope="rowgroup"[^>]*>Commerce<\/th>/);
assert.match(rich.plain,/Commerce\t*\n\/a\tMandatory/);
assert.match(new TextDecoder().decode(writeProjectDocumentationWorkbook(snapshot,{scope:"complete"})),/<mergeCell ref="A3:B3"\/>/);

console.log("schema property concept model tests passed");
