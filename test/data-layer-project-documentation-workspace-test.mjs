import assert from "node:assert/strict";
import {
  applyProjectDocumentationTheme,
  compileProjectDocumentationSnapshot,
  createProjectDocumentationSet,
  createProjectDocumentationTheme,
  parseProjectDocumentationTheme,
  projectDocumentationSnapshotStale,
  renderProjectDocumentationClipboard,
  serializeProjectDocumentationTheme,
  selectProjectDocumentationTables,
  themeFingerprint,
  writeProjectDocumentationWorkbook,
} from "../dist/data-layer-project-documentation-workspace.js";
import {compileProjectDocumentation,projectDocumentationSources} from "../dist/data-layer-project-documentation-compiler.js";
import {createSpecificationProject,exportSpecificationProject,importSpecificationProject,transactProject} from "../dist/data-layer-specification-project.js";

const theme=createProjectDocumentationTheme({
  id:"theme:acme",name:"Acme",clientName:"Acme",
  logo:"data:image/png;base64,AA==",colors:{heading:"#112233",accent:"#445566",stripe:"#eef2f4"},
  typography:{family:"Arial",headingSize:16,bodySize:11},density:"compact",borders:true,
  striping:true,highlightedHeadings:true,columnWidths:{Property:28,Description:48},
  headerText:"Client specification",footerText:"Internal",
});
assert.equal(theme.id,"theme:acme");
assert.doesNotMatch(JSON.stringify(theme),/(<style|javascript:|workbookCode)/i);
const hostileTheme=createProjectDocumentationTheme({...theme,id:"theme:hostile",typography:{...theme.typography,family:'Arial";background:url(javascript:alert(1))'},logo:"data:image/svg+xml,<svg onload=alert(1)>"});
assert.equal(hostileTheme.typography.family,"Arial");
assert.equal(hostileTheme.logo,"");
const copiedTheme=parseProjectDocumentationTheme(serializeProjectDocumentationTheme(theme),{id:"theme:copied",name:"Acme copy"});
assert.equal(copiedTheme.id,"theme:copied");
assert.equal(copiedTheme.name,"Acme copy");
assert.deepEqual({...copiedTheme,id:theme.id,name:theme.name},theme);

const set=createProjectDocumentationSet({
  id:"documentation-set:client",name:"Client specification",themeId:theme.id,
  sections:[
    {id:"section:overview",kind:"overview",name:"Overview",selected:true},
    {id:"section:checkout",kind:"flow",name:"Checkout journey",targetId:"flow:checkout",selected:true,configuration:{paths:["/page_name"]}},
    {id:"section:article",kind:"flow",name:"Article journey",targetId:"flow:article",selected:true,configuration:{paths:["/article_id"]}},
    {id:"section:matrix",kind:"matrix",name:"Data capture matrix",selected:true,configuration:{contextIds:["page:cart","event:purchase","frame:cart","occurrence:opened"]}},
    {id:"section:sitewide",kind:"profile",name:"Sitewide",targetId:"profile:sitewide",selected:true},
    {id:"section:opened",kind:"profile",name:"Opened Article",targetId:"profile:article",selected:true},
  ],
});
assert.deepEqual(set.sections.map(({kind})=>kind),["overview","flow","flow","matrix","profile","profile"]);
assert.deepEqual(set.sections.find(({kind})=>kind==="matrix").configuration.contextIds,["page:cart","event:purchase","frame:cart","occurrence:opened"]);
assert.throws(()=>createProjectDocumentationSet({...set,sections:set.sections.filter(({kind})=>kind!=="matrix")}),/exactly one/i);
assert.throws(()=>createProjectDocumentationSet({...set,sections:[...set.sections,{...set.sections.find(({kind})=>kind==="matrix"),id:"matrix:duplicate"}]}),/exactly one/i);
const optionalOverviewSet=createProjectDocumentationSet({
  id:"documentation-set:no-overview",name:"No overview",themeId:theme.id,
  sections:[{id:"section:only-matrix",kind:"matrix",name:"Data capture matrix",selected:true,configuration:{contextIds:[]}}],
});
assert.equal(optionalOverviewSet.sections.some(({kind})=>kind==="overview"),false);

const table=(id,title,headings,rows)=>({id,title,headings,rows});
const source={
  projectId:"project:shop",projectName:"Shop",set,theme,
  sourceRevisions:{project:8,"flow:checkout":4,"flow:article":5,"profile:sitewide":2,"profile:article":3},
  generatedAt:"2026-07-26T10:00:00.000Z",
  tables:[
    table("section:overview","Overview",["Project","Value"],[["Name","Shop"]]),
    table("section:checkout","Checkout journey",["Property","Cart"],[["page_name","checkout"]]),
    table("section:article","Article journey",["Property","Article"],[["article_id","42"]]),
    table("section:matrix","Data capture matrix",["Property","Cart","Purchase","Checkout journey / Cart instance","Article journey / Article / Opened occurrence"],[
      ["page_name","Mandatory","Optional","Mandatory","Not defined"],
      ["article_id","Not defined","Not defined","Not expected","Conditional"],
    ],"Mandatory · Optional · Conditional · Not expected · Not defined · Blocked"),
    table("section:sitewide","Sitewide",["Property","Description","Required","Allowed values","Example","Comments"],[["site_id","Site","Yes","shop","shop",""]]),
    table("section:opened","Opened Article",["Property","Description","Required","Allowed values","Example","Comments"],[["article_id","Article","Yes","","42",""]]),
  ],
  diagnostics:[],
};
const snapshot=compileProjectDocumentationSnapshot(source);
assert.equal(Object.isFrozen(snapshot),true);
assert.equal(snapshot.incomplete,false);
assert.equal(snapshot.title,"Client specification");
assert.equal(snapshot.snapshotHash.length>10,true);

assert.deepEqual(selectProjectDocumentationTables(snapshot,{scope:"complete"}).map(({title})=>title),[
  "Overview","Checkout journey","Article journey","Data capture matrix","Sitewide","Opened Article",
]);
assert.deepEqual(selectProjectDocumentationTables(snapshot,{scope:"current",currentSectionId:"section:matrix"}).map(({title})=>title),["Data capture matrix"]);
assert.deepEqual(selectProjectDocumentationTables(snapshot,{scope:"selected",selectedSectionIds:["section:article","section:sitewide"]}).map(({title})=>title),["Article journey","Sitewide"]);

const themed=applyProjectDocumentationTheme(snapshot.tables[1],theme);
assert.equal(themed.themeFingerprint,themeFingerprint(theme));
const clipboard=renderProjectDocumentationClipboard(snapshot,{scope:"selected",selectedSectionIds:["section:checkout","section:matrix"]});
assert.equal((clipboard.html.match(/<table/g)??[]).length,2);
assert.match(clipboard.html,/data-theme-fingerprint="/);
assert.match(clipboard.plain,/Checkout journey[\s\S]*Data capture matrix/);
for(const shared of ["Acme","Client specification","Internal"])assert.match(clipboard.html+clipboard.plain,new RegExp(shared));
assert.match(clipboard.html,/<img[^>]+data:image\/png/);
assert.match(clipboard.html,/width:28ch/);

const workbook=writeProjectDocumentationWorkbook(snapshot,{scope:"complete"});
const binary=new TextDecoder().decode(workbook);
const unzipStored=(bytes)=>{const files=new Map(),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let offset=0;while(offset+30<=bytes.length&&view.getUint32(offset,true)===0x04034b50){const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true),name=new TextDecoder().decode(bytes.slice(offset+30,offset+30+nameLength)),start=offset+30+nameLength+extraLength;files.set(name,bytes.slice(start,start+size));offset=start+size;}return files;};
const workbookFiles=unzipStored(workbook),workbookText=(name)=>new TextDecoder().decode(workbookFiles.get(name));
for(const name of ["Overview","Checkout journey","Article journey","Data capture matrix","Sitewide","Opened Article"])assert.match(binary,new RegExp(name));
for(const forbidden of ["diagnostic","provenance","revision hash","repair action"])assert.doesNotMatch(binary,new RegExp(forbidden,"i"));
assert.doesNotMatch(binary,/<f>/);
assert.match(binary,/data-theme-fingerprint=/);
assert.match(binary,/wrapText="1"/);
assert.match(binary,/oddHeader>Acme · Client specification/);
assert.doesNotMatch(binary,/oddHeader>[^<]*Logo/);
assert.match(binary,/oddFooter>Internal/);
assert.deepEqual(workbookFiles.get("xl/media/documentation-logo.png"),Uint8Array.from([0]));
for(let index=1;index<=set.sections.length;index+=1){
  assert.match(workbookText(`xl/worksheets/sheet${index}.xml`),/<drawing r:id="rId1"\/>/);
  assert.match(workbookText(`xl/worksheets/_rels/sheet${index}.xml.rels`),new RegExp(`Target="../drawings/drawing${index}\\.xml"`));
  assert.match(workbookText(`xl/drawings/drawing${index}.xml`),/<xdr:pic>/);
  assert.match(workbookText(`xl/drawings/_rels/drawing${index}.xml.rels`),/Target="\.\.\/media\/documentation-logo\.png"/);
}
assert.match(workbookText("[Content_Types].xml"),/ContentType="image\/png"/);

const unsafe=compileProjectDocumentationSnapshot({...source,set:{...set,name:"=Client<script>",sections:set.sections.map((section,index)=>({...section,name:index<2?"A/B*?":"A:B"}))},diagnostics:[{sectionId:"section:article",message:"Blocked identity profile:article",repair:"Open raw revision hash"}]});
assert.equal(unsafe.incomplete,true);
assert.equal(unsafe.title,"Draft — incomplete");
const unsafeWorkbook=new TextDecoder().decode(writeProjectDocumentationWorkbook(unsafe,{scope:"complete",confirmIncomplete:true}));
assert.match(unsafeWorkbook,/Draft — incomplete/);
assert.doesNotMatch(unsafeWorkbook,/Blocked identity|profile:article|revision hash|repair/);
assert.doesNotMatch(unsafeWorkbook,/<script>/);

assert.deepEqual(projectDocumentationSnapshotStale(snapshot,source.sourceRevisions),{stale:false,changedSources:[]});
assert.deepEqual(projectDocumentationSnapshotStale(snapshot,{...source.sourceRevisions,"flow:article":6}),{stale:true,changedSources:["flow:article"]});
assert.throws(()=>writeProjectDocumentationWorkbook(unsafe,{scope:"complete"}),/confirm incomplete/i);

let identity=0;
const projectState=createSpecificationProject({name:"Shop",site:"shop.example",id:(kind)=>`${kind}:${++identity}`});
const savedState=transactProject(projectState,"Save Documentation Set",(project)=>({...project,documentation:{sets:[set],themes:[theme]}}));
assert.equal(savedState.history.undo.at(-1).label,"Save Documentation Set");
const portableProject=importSpecificationProject(exportSpecificationProject(savedState.project),{existingProjects:[],id:(kind)=>`${kind}:imported`}).project;
assert.deepEqual(portableProject.documentation,{sets:[set],themes:[theme]});
assert.equal(portableProject.releases.length,0);

const compilerState={
  project:{
    id:"project:compiler",name:"Compiler Shop",description:"Configured documentation",site:"compiler.example",environments:["Production"],namingConventions:{property:"snake_case",event:"snake_case"},publicationPolicy:{warningsBlock:false,fixturesRequired:false},releases:[],
    collections:{
      profiles:[{id:"profile:compiler",name:"Compiler Sitewide",requirements:[{path:"/site_id",type:"string",required:true,description:"Site",examples:["shop"]},{path:"/locale",type:"string",description:"Locale"}]}],
      pageGroups:[{id:"group:compiler",name:"Checkout",pageIds:["page:compiler"],schemaConstraints:[{path:"/currency",type:"string",allowedValues:["EUR"]}]}],
      pages:[{id:"page:compiler",name:"Cart",eventName:"pageview",profileIds:["profile:compiler"],pageGroupIds:["group:compiler"],schemaConstraints:[{path:"/page_name",type:"string",presence:"required",documentation:"Page"}]}],
      events:[{id:"event:compiler",name:"Purchase",eventName:"purchase",schemaConstraints:[{path:"/purchase_id",type:"string",presence:"required"}]}],
      flows:[{id:"flow:compiler",name:"Checkout compiler journey"}],applicabilitySets:[],fixtures:[],assignments:[],
    },
    documentationFlowGraphs:{"flow:compiler":{pageGroupIds:["group:compiler"],pageFrames:[{id:"frame:compiler",name:"Cart instance",pageId:"page:compiler",pageGroupId:"group:compiler",localSchemaContributions:[{path:"/instance_only",type:"string"}]}],occurrences:[{id:"occurrence:compiler",name:"Purchase occurrence",pageFrameId:"frame:compiler",pageId:"page:compiler",pageGroupId:"group:compiler",eventId:"event:compiler",localSchemaContributions:[{path:"/occurrence_only",type:"string",presence:"forbidden"}]}],relationships:[]}},
    releases:[],
  },
  draft:{id:"draft:compiler",status:"Saved",updatedAt:"2026-07-26T00:00:00.000Z"},history:{undo:[],redo:[]},
};
const compilerSources=projectDocumentationSources(compilerState,"2026-07-26T00:00:00.000Z",4);
assert.deepEqual([...new Set(compilerSources.matrixContexts.map(({kind})=>kind))],["page-definition","event-definition","page-instance","event-occurrence"]);
assert.equal(compilerSources.matrixContexts.find(({kind})=>kind==="page-instance").groupLabel,"Checkout compiler journey");
assert.equal(compilerSources.matrixContexts.find(({kind})=>kind==="event-occurrence").parentLabel,"Cart");
const contextByKind=Object.fromEntries(compilerSources.matrixContexts.map((context)=>[context.kind,context.id])),compilerTheme=createProjectDocumentationTheme({...theme,id:"theme:compiler"}),compilerSet=createProjectDocumentationSet({id:"set:compiler",name:"Configured",themeId:compilerTheme.id,sections:[
  {id:"flow-section",kind:"flow",name:"Checkout configured",targetId:"flow:compiler",selected:true,configuration:{contextIds:[contextByKind["event-occurrence"],contextByKind["page-instance"]],paths:["/purchase_id","/page_name"],columns:["description"],labels:{[contextByKind["event-occurrence"]]:"Purchase label"}}},
  {id:"matrix-section",kind:"matrix",name:"Data capture matrix",selected:true,configuration:{contextIds:[contextByKind["page-definition"],contextByKind["event-definition"],contextByKind["page-instance"],contextByKind["event-occurrence"]]}},
  {id:"profile-section",kind:"profile",name:"Compiler Sitewide",targetId:"profile:compiler",selected:true,configuration:{paths:["/locale","/site_id"],columns:["Property","Required","Description"]}},
]});
const compiledProject=compileProjectDocumentation({state:compilerState,set:compilerSet,theme:compilerTheme,revision:4,generatedAt:"2026-07-26T00:00:00.000Z"});
assert.deepEqual(compiledProject.tables.map(({title})=>title),["Checkout configured","Data capture matrix","Compiler Sitewide"]);
assert.deepEqual(compiledProject.tables[0].rows.map(([path])=>path),["/purchase_id","/page_name"]);
assert.equal(compiledProject.tables[0].headings[1],"Description");
assert.match(compiledProject.tables[0].headings.join("|"),/Purchase label/);
assert.deepEqual(compiledProject.tables[1].headings.slice(1),compilerSources.matrixContexts.map(({label})=>label));
assert.equal(new Set(compiledProject.tables[1].rows.flatMap((row)=>row.slice(1))).size>=3,true);
assert.deepEqual(compiledProject.tables[2].headings,["Property","Required","Description"]);
assert.deepEqual(compiledProject.tables[2].rows.map(([path])=>path),["/locale","/site_id"]);
assert.equal(compiledProject.tables[1].headings.some((value)=>value.includes("Compiler Sitewide")),false);

console.log("Project documentation workspace tests passed");
