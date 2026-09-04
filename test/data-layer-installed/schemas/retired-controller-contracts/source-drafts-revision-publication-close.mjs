/** Composes the focused Source behavior contract families. */
import { checks as creation } from "./source-draft-creation.mjs";
import { checks as publication } from "./source-publication-lifecycle.mjs";
import { checks as revisionClose } from "./source-revision-close-routing.mjs";

export const group = {
  group:"source drafts, revision lifecycle, publication, and close routing",
  lines:"247-396",
  checks:[...creation, ...publication, ...revisionClose],
};
