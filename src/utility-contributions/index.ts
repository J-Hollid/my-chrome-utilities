import type { UtilityPageContribution } from "../utility-host/contribution.js";

// New utilities contribute metadata here. Their private modules load in their own pages.
export const utilityPageContributions: readonly UtilityPageContribution[] = [
  {id: 'tealium', label: 'Tealium', page: 'tealium/live/index.html',
    storage: {namespace: 'utility.tealium.state', version: 1}},
];
