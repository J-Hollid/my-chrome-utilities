export async function runTargetedMutationCheck({mutants,targetCommand},{runCommand}={}) {
  if (!Array.isArray(mutants)) throw new Error("Bootstrap mutation inventory is invalid");
  if (mutants.length===0) return {status:"passed",mutantCount:0,commandStarted:false};
  if (!Array.isArray(targetCommand)||!targetCommand.length||
      targetCommand.some((value)=>typeof value!=="string"||!value.length)) {
    throw new Error("Bootstrap mutation requires a target-specific test command");
  }
  if (typeof runCommand!=="function") throw new Error("Bootstrap mutation requires a command runner");
  await runCommand([...targetCommand]);
  return {status:"passed",mutantCount:mutants.length,commandStarted:true};
}

export function parseMutationDiscovery(output) {
  const total=/Found (\d+) mutation sites\./u.exec(output)?.[1]??
    /Total mutation sites: (\d+)/u.exec(output)?.[1];
  const changed=/Changed mutation sites: (\d+)/u.exec(output)?.[1];
  if (total===undefined||changed===undefined) {
    throw new Error("Bootstrap mutation discovery output is invalid");
  }
  return {total:Number(total),changed:Number(changed)};
}

export function validateMutationTarget(discovery,targetKey,plan) {
  if (!Number.isInteger(discovery?.changed)||discovery.changed<0) {
    throw new Error("Bootstrap mutation discovery result is invalid");
  }
  const target=plan.tasks.find(({key})=>key===targetKey);
  if (discovery.changed>0&&!target) {
    throw new Error("Bootstrap mutation requires a selected target-specific test command");
  }
  return {targetRequired:discovery.changed>0,targetKey:target?.key??null};
}
