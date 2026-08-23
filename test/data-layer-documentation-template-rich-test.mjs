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
assert.deepEqual(["page.concepts","event.concepts","page.visual.description","page.visual.caption","page.visual.sourceReference"].map(binding=>richTemplateHelpBindingsFor("flow").includes(binding)),[true,true,true,true,true],"Flow help exposes scoped concept groups and presentation-safe visual metadata");
assert.equal(richTemplateHelpBindingsFor("flow").includes("page.visual.image"),false,"image bytes are never offered as a text binding");

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

const visualImage="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+XkZ8WQAAAABJRU5ErkJggg==",semanticFlow={...template,blocks:[{id:"pages",type:"repeat",items:"flow.pages",variable:"page",children:[{id:"groups",type:"concept-group",source:"page.concepts"},{id:"visual",type:"page-visual",source:"page.visual"}]}]},semanticContext={table:{columns:[{heading:"Example"}]},flow:{pages:[{concepts:[{name:"Identity",rows:[{property:"user_id",cells:[{value:"one"}]}]}],visual:{image:visualImage,description:"Cart after address",caption:"Checkout review",sourceReference:"https://example.test/inert"}},{concepts:[],events:[]}]}};
assert.equal(validateRichDocumentationTemplate(semanticFlow).valid,true,"a Page repeat may contain scoped concept and semantic visual blocks");
const semanticOutput=renderRichDocumentationTemplate(semanticFlow,semanticContext);assert.match(semanticOutput.html,/<section[^>]*data-concept-group="Identity"/u);assert.match(semanticOutput.html,/<figure[^>]*data-page-visual/u);assert.match(semanticOutput.html,/alt="Cart after address"/u);assert.match(semanticOutput.html,/<figcaption>Checkout review<\/figcaption>/u);assert.match(semanticOutput.html,/data-visual-source[^>]*>https:\/\/example\.test\/inert/u);assert.equal(semanticOutput.plain,"Identity\nuser_id\tone\nCart after address\nCheckout review\nhttps://example.test/inert");assert.doesNotMatch(semanticOutput.plain,/data:image|base64/u,"plain fallback never contains image bytes");
assert.match(validateRichDocumentationTemplate({...template,blocks:[{id:"visual",type:"page-visual",source:"page.visual"}]}).findings.map(({message})=>message).join("\n"),/outside this block scope/u,"a Page visual block cannot escape its Page repeat");
assert.match(validateRichDocumentationTemplate({...template,blocks:[{id:"groups",type:"concept-group",source:"page.concepts"}]}).findings.map(({message})=>message).join("\n"),/outside this block scope/u,"Page concepts cannot be selected at the Flow root");
assert.match(validateRichDocumentationTemplate({...template,blocks:[{id:"groups",type:"concept-group",source:"event.concepts"}]}).findings.map(({message})=>message).join("\n"),/outside this block scope/u,"Event concepts cannot be selected at the Flow root");
assert.match(validateRichDocumentationTemplate({...template,blocks:[{id:"pages",type:"repeat",items:"flow.pages",variable:"page",children:[{id:"events",type:"repeat",items:"page.events",variable:"event",children:[{id:"wrong-groups",type:"concept-group",source:"page.concepts"}]}]}]}).findings.map(({message})=>message).join("\n"),/outside this block scope/u,"an Event repeat cannot reach back into its owning Page concept collection");
assert.match(validateRichDocumentationTemplate({...template,blocks:[{id:"pages",type:"repeat",items:"flow.pages",variable:"page",children:[{id:"events",type:"repeat",items:"page.events",variable:"event",children:[{id:"wrong-visual",type:"page-visual",source:"page.visual"}]}]}]}).findings.map(({message})=>message).join("\n"),/outside this block scope/u,"a Page visual cannot be repeated once per contained Event");
assert.equal(validateRichDocumentationTemplate({...template,blocks:[{id:"pages",type:"repeat",items:"flow.pages",variable:"page",children:[{id:"events",type:"repeat",items:"page.events",variable:"event",children:[{id:"event-groups",type:"concept-group",source:"event.concepts"}]}]}]}).valid,true,"Event concepts remain valid inside their owning Event repeat");
assert.equal(validateRichDocumentationTemplate({...template,blocks:[{id:"table-groups",type:"concept-group",source:"table.concepts"}]}).valid,true,"the presentation-safe root table concept collection remains valid");
assert.match(validateRichDocumentationTemplate({...template,blocks:[{id:"pages",type:"repeat",items:"flow.pages",variable:"page",children:[{id:"wrong-root-groups",type:"concept-group",source:"table.concepts"}]}]}).findings.map(({message})=>message).join("\n"),/outside this block scope/u,"a root concept collection cannot cross into a Page repeat");

const compilerShapedFlow={...semanticFlow,blocks:[{id:"pages",type:"repeat",items:"flow.pages",variable:"page",children:[{id:"groups",type:"concept-group",source:"page.concepts"}]}]},compilerShapedContext={table:{columns:[{key:"description",heading:"Description"},{key:"example",heading:"Documented example"},{key:"value",heading:"Value"}]},flow:{pages:[{concepts:[{name:"Commerce",rows:[{property:"page_name",example:"cart-instance",value:"cart-value",cells:[{columnKey:"property",heading:"Property",value:"page_name"},{columnKey:"example",heading:"Documented example",value:"cart-instance"},{columnKey:"value",heading:"Value",value:"cart-value"}]}]}]}]}};
const compilerShapedOutput=renderRichDocumentationTemplate(compilerShapedFlow,compilerShapedContext);assert.equal((compilerShapedOutput.html.match(/<td>page_name<\/td>/gu)??[]).length,1,"compiler-shaped contextual rows render Property exactly once");assert.match(compilerShapedOutput.html,/<tr><td>page_name<\/td><td>cart-instance<\/td><td>cart-value<\/td><\/tr>/u);assert.equal(compilerShapedOutput.plain,"Commerce\npage_name\tcart-instance\tcart-value","plain output uses the same contextual Property, metadata, and Value shape");

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
