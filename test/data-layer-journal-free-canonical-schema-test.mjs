import assert from "node:assert/strict";
import {applyCanonicalCommand,canonicalCommandOutcome,journalFreeCanonicalData} from "../dist/data-layer-canonical-schema.js";
import {createSpecificationProject,exportSpecificationProjectState,stageProjectImport} from "../dist/data-layer-specification-project.js";
import {exportProjectBundle,projectLibrary,restoreProjectLibrary} from "../dist/data-layer-project-library.js";
import {composedCanonicalSchema,saveComposedCanonicalDocument,saveComposedEventCanonicalDocument,saveEventOccurrenceCanonicalDocument,saveFlowPageInstanceCanonicalDocument} from "../dist/data-layer-composed-schema-workspace.js";

const property=(id,name,order)=>({
  id,name,order,type:"string",presence:{mode:"optional"},allowedValues:[],rules:[],
  documentation:{displayText:name,description:"",comments:"",example:{method:"blank"}},
  provenance:[{source:"created"}],overrideReferences:[],
});

for(const revision of [0,2]){
  const status=property("property:legacy-status","legacy_status",0),total=property("property:legacy-total","legacy_total",1);
  const document={
    id:`canonical:legacy:${revision}`,revision,state:"Draft",contributorId:`profile:legacy:${revision}`,
    contributorName:"Legacy",rootIds:[status.id,total.id],nodes:{[status.id]:status,[total.id]:total},view:"table",
  };
  const result=applyCanonicalCommand(document,{
    kind:"set",baseRevision:revision,propertyId:status.id,
    patch:{documentation:{...status.documentation,description:"Restored legacy status"}},
  });
  assert.equal(result.status,"applied");
  assert.equal(result.document.revision,revision,"a Draft edit does not advance the publication-only Schema revision");
  assert.equal(result.document.nodes[status.id].documentation.description,"Restored legacy status");
  assert.equal(result.document.nodes[total.id].name,"legacy_total","the sibling property survives the edit");
  assert.equal(Object.hasOwn(result.document,"changes"),false,"editing does not restore the absent legacy journal");
  assert.doesNotThrow(()=>canonicalCommandOutcome({kind:"set",baseRevision:revision,propertyId:status.id,patch:{}},result,document));
}

const legacyState=createSpecificationProject({name:"Journal-free legacy",site:"legacy.example",id:(kind)=>`${kind}:journal-free`}),legacyStatus=property("property:entry-status","legacy_status",0),entryDocument={id:"canonical:entry",revision:2,state:"Draft",contributorId:"profile:entry",contributorName:"Entry",rootIds:[legacyStatus.id],nodes:{[legacyStatus.id]:legacyStatus},view:"table",changes:[{revision:9,propertyIds:[legacyStatus.id],kind:"set"}],commandJournal:[{kind:"set"}],patchJournal:[{op:"replace"}],editCountRevision:9};
legacyState.project.collections.profiles.push({id:"profile:entry",name:"Entry",requirements:[],canonicalSchema:entryDocument});
legacyState.project.documentationFlowGraphs={"flow:entry":{pageFrames:[{id:"frame:entry",name:"Frame",canonicalSchema:entryDocument}],occurrences:[{id:"occurrence:entry",name:"Occurrence",canonicalSchema:entryDocument}],relationships:[]}};
const scrubbed=journalFreeCanonicalData(legacyState),scrubbedBytes=JSON.stringify(scrubbed);
assert.equal(scrubbed.project.collections.profiles[0].canonicalSchema.revision,2,"journal cleanup preserves the Published Schema revision");
for(const forbidden of ['"changes"','"commandJournal"','"patchJournal"','"editCountRevision"'])assert.equal(scrubbedBytes.includes(forbidden),false,`journal cleanup removes ${forbidden} recursively`);

const portable=exportSpecificationProjectState(legacyState);
assert.equal(portable.includes('"changes"'),false,"ordinary full-fidelity export excludes canonical edit history");
const imported=stageProjectImport(portable,createSpecificationProject({name:"Target",site:"target.example",id:(kind)=>`${kind}:target`}),{projectId:"project:imported"});
assert.equal(JSON.stringify(imported.state).includes('"commandJournal"'),false,"portable import admits and retains journal-free canonical data");

const record={state:legacyState,revision:4,publishedRevision:2,createdAt:"2026-01-01T00:00:00.000Z",lastModifiedAt:"2026-01-01T00:00:00.000Z"},library=projectLibrary([record],legacyState.project.id),restored=restoreProjectLibrary(JSON.stringify(library));
assert.ok(restored,"legacy Web Storage restores the project");
assert.equal(JSON.stringify(restored).includes('"changes"'),false,"legacy Web Storage migration removes canonical journals before editor mounting");
assert.equal(exportProjectBundle(library,legacyState.project.id).includes('"patchJournal"'),false,"portable project export remains journal-free");

const composedState=createSpecificationProject({name:"Legacy composed",site:"legacy.example",id:(kind)=>`${kind}:legacy-composed`});
const composedStatus=property("property:composed-status","legacy_status",0),composedTotal=property("property:composed-total","legacy_total",1),composedDocument={id:"canonical:legacy-composed",revision:2,state:"Draft",contributorId:"contributor:legacy-composed",contributorName:"Legacy composed",rootIds:[composedStatus.id,composedTotal.id],nodes:{[composedStatus.id]:composedStatus,[composedTotal.id]:composedTotal},view:"table"};
const propertySet={id:"property-set:legacy-composed",name:"Legacy Property Set",requirements:[],canonicalSchema:structuredClone(composedDocument)},page={id:"page:legacy-composed",name:"Legacy Page",canonicalSchema:structuredClone(composedDocument)},event={id:"event:legacy-composed",name:"Legacy Event",canonicalSchema:structuredClone(composedDocument)},flow={id:"flow:legacy-composed",name:"Legacy Flow"},frame={id:"frame:legacy-composed",name:"Legacy frame",pageId:page.id,canonicalSchema:structuredClone(composedDocument)},occurrence={id:"occurrence:legacy-composed",name:"Legacy occurrence",eventId:event.id,pageFrameId:frame.id,canonicalSchema:structuredClone(composedDocument)};
composedState.project.collections.propertySets.push(propertySet);composedState.project.collections.pages.push(page);composedState.project.collections.events.push(event);composedState.project.collections.flows.push(flow);composedState.project.documentationFlowGraphs={[flow.id]:{pageFrames:[frame],occurrences:[occurrence],relationships:[]}};
const composedCases=[
  ["Property Set",propertySet,undefined,(state,document)=>saveComposedCanonicalDocument(state,"propertySets",propertySet.id,document),state=>state.project.collections.propertySets[0]],
  ["Page",page,undefined,(state,document)=>saveComposedCanonicalDocument(state,"pages",page.id,document),state=>state.project.collections.pages[0]],
  ["Event",event,undefined,(state,document)=>saveComposedEventCanonicalDocument(state,event.id,document),state=>state.project.collections.events[0]],
  ["Flow Page-instance",frame,flow.id,(state,document)=>saveFlowPageInstanceCanonicalDocument(state,flow.id,frame.id,document),state=>state.project.documentationFlowGraphs[flow.id].pageFrames[0]],
  ["Event-occurrence",occurrence,flow.id,(state,document)=>saveEventOccurrenceCanonicalDocument(state,flow.id,occurrence.id,document),state=>state.project.documentationFlowGraphs[flow.id].occurrences[0]],
];
for(const[scope,entity,flowId,save,select]of composedCases){
  const mounted=composedCanonicalSchema(composedState,entity,scope,flowId);
  assert.deepEqual(mounted,composedDocument,`${scope} mounts the admitted legacy canonical Draft without deriving a replacement`);
  const edited=structuredClone(mounted);edited.nodes[composedStatus.id].documentation.description="Restored legacy status";
  const saved=save(composedState,edited),stored=select(saved).canonicalSchema;
  assert.equal(stored.revision,2,`${scope} retains the publication-only Schema revision`);
  assert.equal(stored.nodes[composedStatus.id].documentation.description,"Restored legacy status");
  assert.equal(stored.nodes[composedTotal.id].name,"legacy_total");
  assert.equal(JSON.stringify(stored).includes('"changes"'),false,`${scope} remains journal-free`);
}

console.log("journal-free canonical schema tests passed");
