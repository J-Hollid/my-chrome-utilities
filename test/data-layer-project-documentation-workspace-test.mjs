import assert from "node:assert/strict";
import {
  applyProjectDocumentationTheme,
  compileProjectDocumentationSnapshot,
  createProjectDocumentationSet,
  createProjectDocumentationTheme,
  projectDocumentationSnapshotStale,
  renderProjectDocumentationClipboard,
  selectProjectDocumentationTables,
  themeFingerprint,
  writeProjectDocumentationWorkbook,
} from "../dist/data-layer-project-documentation-workspace.js";
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

const workbook=writeProjectDocumentationWorkbook(snapshot,{scope:"complete"});
const binary=new TextDecoder().decode(workbook);
for(const name of ["Overview","Checkout journey","Article journey","Data capture matrix","Sitewide","Opened Article"])assert.match(binary,new RegExp(name));
for(const forbidden of ["diagnostic","provenance","revision hash","repair action"])assert.doesNotMatch(binary,new RegExp(forbidden,"i"));
assert.doesNotMatch(binary,/<f>/);

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

console.log("Project documentation workspace tests passed");
