import type {mountCanonicalSchemaEditor} from "../data-layer-canonical-schema-ui.js";
import type {ContextExportSource} from "./contracts.js";

export function studioCanonicalExportSource(options:Parameters<typeof mountCanonicalSchemaEditor>[0],pending:()=>boolean):()=>ContextExportSource {
  return ()=>{const canonical=options.load();return {key:canonical.id,name:canonical.contributorName,role:options.host.dataset.schemaContributorScope??"Shared Profile",context:"",version:"Draft",canonical,pending:pending()};};
}
