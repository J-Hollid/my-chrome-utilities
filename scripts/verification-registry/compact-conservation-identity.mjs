import {createHash} from "node:crypto";

export const sha256=(value)=>createHash("sha256").update(value).digest("hex");
export const canonicalValue=(value)=>Array.isArray(value)?value.map(canonicalValue):
  value&&typeof value==="object"?Object.fromEntries(Object.entries(value)
    .sort(([left],[right])=>left.localeCompare(right))
    .map(([key,nested])=>[key,canonicalValue(nested)])):value;
export const digestValue=(value)=>sha256(JSON.stringify(canonicalValue(value)));

const categoryCounts=(inventory)=>Object.fromEntries(Object.entries(inventory??{})
  .sort(([left],[right])=>left.localeCompare(right))
  .map(([category,items])=>[category,items.length]));

const generationSummary=(generation)=>({
  id:generation.id,
  authority:structuredClone(generation.authority),
  ownerSources:{count:generation.ownerSources.length,digest:digestValue(generation.ownerSources)},
  totals:structuredClone(generation.totals),
  inventory:{counts:categoryCounts(generation.inventory),digest:digestValue(generation.inventory)},
});

export function legacyConservationSummary(document){
  const required=["version","owners","provenance","totals","inventory","transitions",
    "generations","ownerTransitions"];
  if(!document||required.some((key)=>!Object.hasOwn(document,key))||
      !Array.isArray(document.owners)||!Array.isArray(document.generations)||
      !Array.isArray(document.transitions)||!Array.isArray(document.ownerTransitions)){
    throw new Error("Legacy conservation baseline is incomplete");
  }
  return {
    schema:"verification-contract-legacy-baseline-v1",
    documentDigest:digestValue(document),
    owners:{count:document.owners.length,digest:digestValue(document.owners)},
    provenanceDigest:digestValue(document.provenance),
    totals:structuredClone(document.totals),
    inventory:{counts:categoryCounts(document.inventory),digest:digestValue(document.inventory)},
    transitions:{count:document.transitions.length,digest:digestValue(document.transitions)},
    generations:document.generations.map(generationSummary),
    ownerTransitions:{count:document.ownerTransitions.length,
      digest:digestValue(document.ownerTransitions)},
  };
}

export function compactGeneratorIdentity(sourcesByPath){
  const paths=Object.keys(sourcesByPath??{}).sort();
  if(!paths.length||paths.some((path)=>typeof sourcesByPath[path]!=="string")){
    throw new Error("Compact conservation generator sources are incomplete");
  }
  const inputs=paths.map((path)=>({path,sha256:sha256(sourcesByPath[path])}));
  return {schema:"verification-contract-compact-generator-v1",inputs,digest:digestValue(inputs)};
}

export function compactSourceIdentity(sourceDigest){
  if(!/^[a-f0-9]{64}$/u.test(sourceDigest??"")){
    throw new Error("Compact conservation source identity is incomplete");
  }
  return {kind:"content-sha256",digest:sourceDigest};
}
