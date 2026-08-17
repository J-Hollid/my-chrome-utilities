import {installProjectDocumentationWorkspaceUi} from "../data-layer-project-documentation-workspace-ui.js";

export type ProjectDocumentationWorkspaceContributionOptions=Parameters<typeof installProjectDocumentationWorkspaceUi>[0];
export type ProjectDocumentationWorkspaceContribution=ReturnType<typeof installProjectDocumentationWorkspaceUi>;

export const installProjectDocumentationWorkspaceContribution = (
  options:ProjectDocumentationWorkspaceContributionOptions,
):ProjectDocumentationWorkspaceContribution => installProjectDocumentationWorkspaceUi(options);
