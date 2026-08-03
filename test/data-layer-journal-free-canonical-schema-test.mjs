import assert from "node:assert/strict";
import {applyCanonicalCommand,canonicalCommandOutcome,journalFreeCanonicalData} from "../dist/data-layer-canonical-schema.js";
import {createSpecificationProject,exportSpecificationProjectState,stageProjectImport} from "../dist/data-layer-specification-project.js";
import {exportProjectBundle,projectLibrary,restoreProjectLibrary} from "../dist/data-layer-project-library.js";

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

console.log("journal-free canonical schema tests passed");
