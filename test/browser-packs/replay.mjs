import { runRenderedWorkflow, workflowPreamble } from "./shared-harness.mjs";
await runRenderedWorkflow("replay",`${workflowPreamble}q('#data-layer-view-library').click();return {passed:visible(q('#sequence-library'))&&visible(q('#sequence-empty-state')),width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth};`);
