import { runRenderedWorkflow, workflowPreamble } from "./shared-harness.mjs";
await runRenderedWorkflow("event-library",`${workflowPreamble}q('#data-layer-view-library').click();q('#add-new-event').click();return {passed:visible(q('#event-property-editor'))&&document.activeElement===q('#event-template-name'),width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth};`);
