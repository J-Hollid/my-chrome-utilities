/** Original retired assertions and their exact direct bindings. */
import { checks as firstChecks } from "./source-drafts-revision-publication-close-part-one.mjs";
import { checks as secondChecks } from "./source-drafts-revision-publication-close-part-two.mjs";

export const group = {
  group: "source drafts, revision lifecycle, publication, and close routing",
  lines: "247-396",
  checks: [...firstChecks, ...secondChecks],
};
