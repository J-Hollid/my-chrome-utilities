export const canonicalValues=(values)=>[...new Set(values)].sort();
export const stableSliceId=(value)=>typeof value==="string"&&/^[a-z0-9][a-z0-9_-]*$/u.test(value);
export const uniqueStrings=(values)=>Array.isArray(values)&&values.length===new Set(values).size&&
  values.every((value)=>typeof value==="string"&&value.length>0);

export function isRepositoryPath(value) {
  if (typeof value!=="string"||!value.length) return false;
  if (["/","../","./"].some((prefix)=>value.startsWith(prefix))) return false;
  if (["\\","\0","//"].some((part)=>value.includes(part))) return false;
  return !value.split("/").some((segment)=>segment==="."||segment==="..");
}

function normalizeConsumers(values,packs,prefix) {
  if (!Array.isArray(values)) {
    throw new Error(`Ownership intent proposed prefix conflicts with declared consumers: ${prefix}`);
  }
  const consumers=values.map((consumer)=>{
    const consumerPack=packs.find(({id})=>id===consumer?.packId);
    if (!consumerPack||consumer.sliceId!==undefined&&!stableSliceId(consumer.sliceId)) {
      throw new Error(`Ownership intent proposed prefix names an unknown consumer: ${prefix}`);
    }
    return {packId:consumerPack.id,...(consumer.sliceId===undefined?{}:{sliceId:consumer.sliceId})};
  }).sort((left,right)=>JSON.stringify(left).localeCompare(JSON.stringify(right)));
  if (new Set(consumers.map((consumer)=>JSON.stringify(consumer))).size!==consumers.length) {
    throw new Error(`Ownership intent proposed prefix repeats a consumer: ${prefix}`);
  }
  return consumers;
}

function matchingSlices(packs,prefix) {
  return packs.flatMap((pack)=>(pack.verificationSlices??[])
    .filter((slice)=>(slice.sourcePrefixes??[]).includes(prefix)||(slice.sourcePaths??[]).includes(prefix))
    .map((slice)=>({pack,slice})));
}

function validateKnownOwner(proposal,parentPackId,sliceId,packs) {
  if (!new Set(packs.map(({id})=>id)).has(parentPackId)) {
    throw new Error(`Ownership intent proposed prefix requires one known parent owner and slice: ${proposal.prefix}`);
  }
  if (!stableSliceId(sliceId)) {
    throw new Error(`Ownership intent proposed prefix requires one known parent owner and slice: ${proposal.prefix}`);
  }
}

function validateDeclaredSelection(proposal,structured,matches,declared) {
  const uniqueDeclared=Boolean(declared)&&matches.length===1;
  if (!uniqueDeclared&&(!structured||matches.length)) {
    throw new Error(`Ownership intent proposed prefix requires one known parent owner and slice: ${proposal.prefix}`);
  }
}

function resolvedDeclaration(proposal,matches) {
  const parentPackId=proposal.parentPackId??matches[0]?.pack.id;
  const sliceId=proposal.sliceId??matches[0]?.slice.id;
  const declared=matches.find(({pack,slice})=>pack.id===parentPackId&&slice.id===sliceId);
  return {parentPackId,sliceId,declared};
}

function currentOwnerFor(packs,prefix) {
  const owners=packs.filter((pack)=>(pack.source??[]).some((source)=>
    prefix===source||prefix.startsWith(`${source}/`)));
  return owners.length===1?owners[0].id:null;
}

function resolveProposal(value,packs) {
  const structured=typeof value!=="string",proposal=structured?value:{prefix:value};
  if (!proposal||Array.isArray(proposal)||!isRepositoryPath(proposal.prefix)) {
    throw new Error("Ownership intent names an invalid proposed prefix");
  }
  const matches=matchingSlices(packs,proposal.prefix);
  const {parentPackId,sliceId,declared}=resolvedDeclaration(proposal,matches);
  validateKnownOwner(proposal,parentPackId,sliceId,packs);
  validateDeclaredSelection(proposal,structured,matches,declared);
  return {structured,proposal,parentPackId,sliceId,declared};
}

function proposalConsumers(proposal,declared,packs) {
  let values=[];
  if (declared) values=declared.slice.consumers??[];
  if (proposal.consumers!==undefined) values=proposal.consumers;
  return normalizeConsumers(values,packs,proposal.prefix);
}

export function normalizeProposedPrefix(value,packs) {
  const {proposal,parentPackId,sliceId,declared}=resolveProposal(value,packs);
  const consumers=proposalConsumers(proposal,declared,packs);
  if (declared&&JSON.stringify(consumers)!==JSON.stringify(
    normalizeConsumers(declared.slice.consumers??[],packs,proposal.prefix))) {
    throw new Error(`Ownership intent proposed prefix conflicts with declared consumers: ${proposal.prefix}`);
  }
  const currentOwner=currentOwnerFor(packs,proposal.prefix);
  if (currentOwner&&currentOwner!==parentPackId) {
    throw new Error(`Ownership intent proposed prefix conflicts with current owner: ${proposal.prefix}`);
  }
  return {prefix:proposal.prefix,parentPackId,sliceId,consumers:structuredClone(consumers)};
}
