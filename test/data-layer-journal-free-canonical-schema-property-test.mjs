import assert from "node:assert/strict";
import {journalFreeCanonicalData} from "../dist/data-layer-canonical-schema.js";

let seed=0x51a7e;
const random=()=>((seed=(seed*1664525+1013904223)>>>0)/0x100000000);
const journalKeys=["changes","commandJournal","patchJournal","editJournal","editCountRevision"];

for(let sample=0;sample<256;sample+=1){
  const revision=Math.floor(random()*50),propertyId=`property:${sample}`,journal=Object.fromEntries(journalKeys.map((key,index)=>[key,index===4?Math.floor(random()*100):[{sample,index,payload:`entry:${random()}`}]])),document={
    id:`canonical:${sample}`,state:"Draft",revision,contributorId:`profile:${sample}`,contributorName:`Profile ${sample}`,
    rootIds:[propertyId],nodes:{[propertyId]:{id:propertyId,name:`value_${sample}`,order:0,type:"string",presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:`Description ${random()}`,comments:"",example:{method:"blank"}},provenance:[{source:"created"}],overrideReferences:[]}},
    ...journal,
  },nonCanonical={state:"Draft",rootIds:"not-an-array",nodes:{},changes:[{must:"survive"}]},input={project:{profiles:[{canonicalSchema:document}],metadata:{nonCanonical}}},before=structuredClone(input),cleaned=journalFreeCanonicalData(input),cleanedDocument=cleaned.project.profiles[0].canonicalSchema;
  assert.deepEqual(input,before,`sample ${sample} does not mutate its input`);
  assert.equal(cleanedDocument.revision,revision,`sample ${sample} preserves the publication revision`);
  assert.deepEqual(cleanedDocument.nodes,document.nodes,`sample ${sample} preserves current canonical content`);
  for(const key of journalKeys)assert.equal(Object.hasOwn(cleanedDocument,key),false,`sample ${sample} removes ${key}`);
  assert.deepEqual(cleaned.project.metadata.nonCanonical.changes,[{must:"survive"}],`sample ${sample} does not scrub a non-canonical record`);
  assert.deepEqual(journalFreeCanonicalData(cleaned),cleaned,`sample ${sample} is idempotent`);
}

console.log("journal-free canonical schema properties passed: 256 generated cases");
