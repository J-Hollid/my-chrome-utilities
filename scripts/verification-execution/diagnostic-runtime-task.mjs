import { isDeepStrictEqual } from "node:util";
import { loadVerificationPacks, planVerification, verificationTaskIdentity } from "../verification-packs.mjs";

export async function loadDiagnosticRuntimeTask(task) {
  const packs = await loadVerificationPacks();
  const tasks = packs.some(({ id }) => id === task.packId)
    ? planVerification(packs, { packIds:[task.packId], includeProperties:true }).tasks : [];
  return diagnosticRuntimeTask(task, tasks);
}

export function diagnosticRuntimeTask(task, registeredTasks) {
  const registered = registeredTasks.find(({ key }) => key === task.key);
  if (registered && !isDeepStrictEqual(verificationTaskIdentity(registered),
    verificationTaskIdentity(task))) {
    throw new Error(`Diagnostic runtime task identity changed: ${task.key}`);
  }
  return { ...structuredClone(task), ...(registered?.temporaryPathClass
    ? { temporaryPathClass:registered.temporaryPathClass } : {}) };
}
