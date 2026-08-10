import { rm } from "node:fs/promises";

export async function removeVerificationFixtureRoot(root, {
  remove = rm,
  maxRetries = 8,
  retryDelay = 50,
} = {}) {
  await remove(root, { recursive:true, force:true, maxRetries, retryDelay });
}
