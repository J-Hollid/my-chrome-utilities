import { verifyLegacyUnblockerCompatibility } from
  "../swarmforge/scripts/unblocker-legacy-compatibility-contract.mjs";
import { verifyTasklessNoteUnblockerBinding } from
  "../swarmforge/scripts/unblocker-taskless-note-contract.mjs";

await verifyLegacyUnblockerCompatibility();
await verifyTasklessNoteUnblockerBinding();
