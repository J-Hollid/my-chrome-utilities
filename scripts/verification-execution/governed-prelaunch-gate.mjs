import {validateGovernedPrelaunchIdentities} from
  "../verification-evidence/governed-prelaunch-identities.mjs";
import {recoverVerificationTemporaryStorageAtStartup} from
  "./temporary-storage-runtime.mjs";

export async function runGovernedPrelaunchGate({
  plan,packs,repositoryRoot,digest,
  validate=validateGovernedPrelaunchIdentities,
  recover=recoverVerificationTemporaryStorageAtStartup,
}){
  const result=await validate({plan,packs,repositoryRoot,digest});
  await recover(repositoryRoot);
  return result;
}
