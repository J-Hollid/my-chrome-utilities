import { runRenderedWorkflow, workflowPreamble } from "./shared-harness.mjs";
await runRenderedWorkflow("schemas",`${workflowPreamble}q('#data-layer-view-schemas').click();q('#create-schema').click();return {passed:visible(q('#schema-editor'))&&q('#data-layer-panel-schemas').contains(q('#schema-editor')),width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth};`);
