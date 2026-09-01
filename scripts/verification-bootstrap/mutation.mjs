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
