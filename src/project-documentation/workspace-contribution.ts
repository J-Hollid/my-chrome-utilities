import {installProjectDocumentationWorkspaceUi} from "../data-layer-project-documentation-workspace-ui.js";
import type {ProjectAssetBodyStore} from "../project-asset-body-contribution.js";

export type ProjectDocumentationWorkspaceContributionOptions=Parameters<typeof installProjectDocumentationWorkspaceUi>[0]&{
  assetBodies:ProjectAssetBodyStore;
};
export type ProjectDocumentationWorkspaceContribution=ReturnType<typeof installProjectDocumentationWorkspaceUi>;

export const installProjectDocumentationWorkspaceContribution = (
  {assetBodies:_assetBodies,...options}:ProjectDocumentationWorkspaceContributionOptions,
):ProjectDocumentationWorkspaceContribution => installProjectDocumentationWorkspaceUi(options);
