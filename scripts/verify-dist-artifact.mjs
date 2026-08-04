import {assertFreshDist} from "./dist-artifact.mjs";
import {withDistArtifactLock} from "./dist-artifact-lock.mjs";

try {
  const manifest = await withDistArtifactLock(async () => assertFreshDist());
  console.log(
    JSON.stringify({
      buildIdentity: manifest.buildIdentity,
      inputDigest: manifest.inputDigest,
      outputDigest: manifest.outputDigest,
    }),
  );
} catch (error) {
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
