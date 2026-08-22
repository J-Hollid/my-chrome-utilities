import assert from "node:assert/strict";

import {
  builtInRichTemplate,
  richTemplateHelpBindingsFor,
  renderRichDocumentationTemplate,
  validateRichDocumentationTemplate,
} from "../dist/documentation-templates/rich-template.js";
import {renderProjectDocumentationRichWithTemplates} from "../dist/documentation-templates/rich-renderer.js";

for(const kind of ["overview","flow","matrix","profile"]){
  const template=builtInRichTemplate(kind,`template:${kind}`,`${kind} page`);
  assert.equal(template.kind,kind);
  assert.equal(validateRichDocumentationTemplate(template).valid,true);
}

assert.deepEqual(richTemplateHelpBindingsFor("overview").filter(binding=>binding.startsWith("field.")),["field.label","field.value"]);
assert.deepEqual(
  ["page.pageName","event.eventName","row.property","cell.value"].map(binding=>richTemplateHelpBindingsFor("flow").includes(binding)),
  [true,true,true,true],
  "Flow help includes every reachable nested-scope binding",
);
assert.equal(richTemplateHelpBindingsFor("profile").includes("concept.name"),true);
assert.equal(richTemplateHelpBindingsFor("profile").includes("page.pageName"),false);

const template={id:"template:flow",name:"Acme flow page",format:"rich",kind:"flow",contractVersion:1,digest:"rich:first",blocks:[
  {id:"heading",type:"heading",level:1,content:[{text:"Journey "},{binding:"section.name"}]},
  {id:"pages",type:"repeat",items:"flow.pages",variable:"page",children:[
    {id:"page",type:"paragraph",content:[{binding:"page.pageName"}]},
    {id:"events",type:"repeat",items:"page.events",variable:"event",children:[{id:"event",type:"paragraph",content:[{binding:"event.eventName"}]}]},
  ]},
]};
assert.equal(validateRichDocumentationTemplate(template).valid,true);
const context={section:{name:"Checkout",kind:"flow"},flow:{pages:[
  {pageName:"<Cart>",events:[{eventName:"<script>bad()</script>"}]},
  {pageName:"Payment",events:[]},
]}};
const rendered=renderRichDocumentationTemplate(template,context);
assert.match(rendered.html,/&lt;Cart&gt;/u);
assert.doesNotMatch(rendered.html,/<script>/u);
assert.doesNotMatch(rendered.html,/template:flow/u,"generated HTML does not expose project-owned template identity");
assert.match(rendered.html,/data-documentation-template="rich"/u);
assert.equal(rendered.plain,"Journey Checkout\n<Cart>\n<script>bad()</script>\nPayment");

const renamed={...template,blocks:[{id:"pages",type:"repeat",items:"flow.pages",variable:"entry",children:[{id:"page",type:"paragraph",content:[{text:"Page ",emphasis:"emphasis"},{binding:"entry.pageName",emphasis:"strong"}]},{id:"events",type:"repeat",items:"entry.events",variable:"occurrence",children:[{id:"event",type:"paragraph",content:[{binding:"occurrence.eventName"}]}]}]}]};
assert.equal(validateRichDocumentationTemplate(renamed).valid,true,"renamed repeat variables own their child bindings and collections");
const renamedOutput=renderRichDocumentationTemplate(renamed,context);assert.match(renamedOutput.html,/<em>Page <\/em><strong>&lt;Cart&gt;<\/strong>/u);assert.equal(renamedOutput.plain,"Page <Cart>\n<script>bad()</script>\nPage Payment");

const grouped={...template,kind:"profile",blocks:[
  {id:"groups",type:"concept-group",source:"profile.concepts"},
]};
const groupedOutput=renderRichDocumentationTemplate(grouped,{profile:{concepts:[
  {name:"Commerce",rows:[{property:"commerce.order_id",cells:[{value:"Cart identifier"}]}]},
  {name:"Empty",rows:[]},
]},table:{columns:[{heading:"Property"},{heading:"Description"}]}});
assert.match(groupedOutput.html,/<section[^>]*data-concept-group="Commerce"/u);
assert.match(groupedOutput.html,/Cart identifier/u);
assert.doesNotMatch(groupedOutput.html,/Empty/u);
assert.equal(groupedOutput.plain,"Commerce\ncommerce.order_id\tCart identifier");

const invalid={...template,blocks:[{id:"bad",type:"paragraph",content:[{binding:"page.pageName"}]}]};
assert.match(validateRichDocumentationTemplate(invalid).findings[0].message,/page\.pageName/u);
assert.match(validateRichDocumentationTemplate({...template,blocks:[{id:"bad-table",type:"data-table",source:"profile.rows"}]}).findings[0].message,/outside this template kind/u);
assert.equal(validateRichDocumentationTemplate({...template,blocks:[{id:"bad-shape",type:"paragraph",content:[{text:"unsafe",emphasis:"blink"}]}]}).valid,false,"persisted rich blocks reject unsupported inline structure");

const assigned={id:template.id,name:template.name,format:"rich",kind:"flow",contractVersion:1,digest:"rich:first",validation:{valid:true,findings:[]},richBlocks:template.blocks};
const snapshot={projectId:"project",projectName:"Shop",generatedAt:"2026-08-17T00:00:00.000Z",title:"Specification",incomplete:false,snapshotHash:"snapshot",sourceRevisions:{},set:{id:"set",name:"Set",themeId:"theme",sections:[{id:"flow",name:"Checkout",kind:"flow",selected:true}],templateAssignments:{"rich:flow":assigned.id}},theme:{id:"theme",name:"Theme",clientName:"",logo:"",headerText:"",footerText:"",typography:{family:"Verdana",headingSize:16,bodySize:11},colors:{heading:"#000000",accent:"#000000",stripe:"#ffffff"},density:"comfortable",borders:true,striping:true,highlightedHeadings:true,columnWidths:{}},templateDigests:{"rich:flow":assigned.digest},templates:[assigned],tables:[{id:"flow",title:"Checkout",headings:["Step","Page","Event"],rows:[["1","Cart","Purchase"]],templateData:{columns:[{key:"step",heading:"Step"},{key:"page",heading:"Page"},{key:"event",heading:"Event"}],rows:[{step:"1",page:"Cart",event:"Purchase",cells:[{columnKey:"step",heading:"Step",value:"1"},{columnKey:"page",heading:"Page",value:"Cart"},{columnKey:"event",heading:"Event",value:"Purchase"}]}],pages:[{stepLabel:"1",pageName:"<Cart>",sourcePageName:"Cart",eventName:"Purchase",heading:"Cart",rows:[],events:[{eventName:"<script>bad()</script>",heading:"Purchase",rows:[]}]}],concepts:[],legend:""}}],diagnostics:[]};
const assignedOutput=renderProjectDocumentationRichWithTemplates(snapshot,{scope:"current",currentSectionId:"flow"});
assert.match(assignedOutput.html,/Journey Checkout/u);
assert.match(assignedOutput.html,/&lt;Cart&gt;/u);
assert.doesNotMatch(assignedOutput.html,/<script>/u);
assert.equal(assignedOutput.plain,"Journey Checkout\n<Cart>\n<script>bad()</script>");
assert.throws(()=>renderProjectDocumentationRichWithTemplates({...snapshot,templates:[]},{scope:"current",currentSectionId:"flow"}),/unavailable or invalid/u);

console.log("documentation rich template unit test passed");
