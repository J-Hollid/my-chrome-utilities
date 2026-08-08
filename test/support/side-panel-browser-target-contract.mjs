import { sidePanelAssertionLeaves } from "./side-panel-browser-assertion-leaves.mjs";

const targetViewportOverrides = Object.freeze({
  SAVED_EVENT_FEED_FILTERS_BROWSER_ADAPTER:[320],
  ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER:[320],
  ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER:[320],
  GUIDED_VALIDATION_BROWSER_ADAPTER:[320, 720],
  JSON_SCHEMA_EXPORT_BROWSER_ADAPTER:[320],
  LIVE_GUIDED_CONDITIONAL_RULE_BROWSER_ADAPTER:[320],
  LOCAL_RULE_PROMOTION_BROWSER_ADAPTER:[320],
  SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER:[320],
  SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER:[320],
  SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER:[320],
  SCHEMA_PROPERTY_EXAMPLE_VALUES_BROWSER_ADAPTER:[320],
  SCHEMA_PROPERTY_RULE_PICKER_BROWSER_ADAPTER:[320],
  SCHEMA_SPECIFICATION_BUILDER_CUSTOMIZATION_BROWSER_ADAPTER:[320],
  SCHEMA_SPECIFICATION_PREVIEW_LAYOUT_BROWSER_ADAPTER:[320],
  RECURSIVE_PROPERTY_VALIDATION_BROWSER_ADAPTER:[320],
  SCHEMA_PUBLICATION_REFRESH_BROWSER_ADAPTER:[320],
  DEFECT_REPORT_PROVENANCE_PRESENTATION_BROWSER_ADAPTER:[320],
  DEFECT_REPORT_SEMANTIC_DIFFERENCES_BROWSER_ADAPTER:[320],
  DEFECT_REPORT_UNDECLARED_REMOVAL_BROWSER_ADAPTER:[320],
  EVENT_OCCURRENCE_DEFECT_REPORT_BROWSER_ADAPTER:[320],
  REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER:[360, 520],
  REQUIRED_PROPERTY_DEFECT_SCHEMA_CHOICES_BROWSER_ADAPTER:[320],
});

export const sidePanelTargetContract = Object.freeze([
  {
    "id": "FRESH_LIVE_SESSION_BROWSER_ADAPTER",
    "owningPack": "capture",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-capture.mjs",
    "processGroup": "capture-side-panel",
    "configuration": {
      "FRESH_LIVE_SESSION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "freshLiveSession"
    ],
    "assertionLeaves": [],
    "module": "capture"
  },
  {
    "id": "PAYLOAD_PATH_FILTER_BROWSER_ADAPTER",
    "owningPack": "capture",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-capture.mjs",
    "processGroup": "capture-side-panel",
    "configuration": {
      "PAYLOAD_PATH_FILTER_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "payloadPathFilterPicker"
    ],
    "assertionLeaves": [],
    "module": "capture"
  },
  {
    "id": "SAVED_EVENT_FEED_FILTERS_BROWSER_ADAPTER",
    "owningPack": "capture",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-capture.mjs",
    "processGroup": "capture-side-panel",
    "configuration": {
      "SAVED_EVENT_FEED_FILTERS_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "savedEventFeedFilters"
    ],
    "assertionLeaves": [],
    "module": "capture"
  },
  {
    "id": "SAVED_SESSION_LIVE_FEED_BROWSER_ADAPTER",
    "owningPack": "capture",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-capture.mjs",
    "processGroup": "capture-side-panel",
    "configuration": {
      "SAVED_SESSION_LIVE_FEED_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "savedSessionLiveFeed"
    ],
    "assertionLeaves": [],
    "module": "capture"
  },
  {
    "id": "SINGLE_LIVE_EVENT_FEED_BROWSER_ADAPTER",
    "owningPack": "capture",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-capture.mjs",
    "processGroup": "capture-side-panel",
    "configuration": {
      "SINGLE_LIVE_EVENT_FEED_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "singleLiveEventFeed"
    ],
    "assertionLeaves": [],
    "module": "capture"
  },
  {
    "id": "LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER",
    "owningPack": "event-library",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-event-library.mjs",
    "processGroup": "existing-single-target",
    "configuration": {
      "LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "libraryDirectTemplatePush"
    ],
    "assertionLeaves": [],
    "module": "event-library"
  },
  {
    "id": "SCHEMA_WORKSPACE_BROWSER_ADAPTER:default",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_WORKSPACE_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaWorkspace"
    ],
    "assertionLeaves": [],
    "module": "schema-workspace",
    "outputGroup": "schema-workspace-configurations"
  },
  {
    "id": "SCHEMA_WORKSPACE_BROWSER_ADAPTER:1:3",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_WORKSPACE_BROWSER_ADAPTER": "1",
      "SCHEMA_LIBRARY_EXPORT_FIXTURE": "1:3"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaWorkspace"
    ],
    "assertionLeaves": [],
    "module": "schema-workspace",
    "outputGroup": "schema-workspace-configurations"
  },
  {
    "id": "SCHEMA_WORKSPACE_BROWSER_ADAPTER:2:4",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_WORKSPACE_BROWSER_ADAPTER": "1",
      "SCHEMA_LIBRARY_EXPORT_FIXTURE": "2:4"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaWorkspace"
    ],
    "assertionLeaves": [],
    "module": "schema-workspace",
    "outputGroup": "schema-workspace-configurations"
  },
  {
    "id": "ALLOWED_VALUES_RULE_MIGRATION_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "ALLOWED_VALUES_RULE_MIGRATION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "allowedValuesRuleMigration"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "allowedValueExpansion"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "arrayValidationRollup"
    ],
    "assertionLeaves": [],
    "module": "schema-validation"
  },
  {
    "id": "CANONICAL_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "CANONICAL_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "canonicalDeclaredPropertyValidation"
    ],
    "assertionLeaves": [],
    "module": "schema-validation"
  },
  {
    "id": "CONDITIONAL_VALIDATION_RULES_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "CONDITIONAL_VALIDATION_RULES_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "conditionalValidationRules"
    ],
    "assertionLeaves": [],
    "module": "schema-validation"
  },
  {
    "id": "GUIDED_ASSIGNMENT_COVERAGE_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "GUIDED_ASSIGNMENT_COVERAGE_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "guidedAssignmentCoverage"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "GUIDED_DRAFT_CONTINUATION_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "GUIDED_DRAFT_CONTINUATION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "guidedDraftContinuation"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "GUIDED_NESTED_PROPERTY_MERGE_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "GUIDED_NESTED_PROPERTY_MERGE_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "guidedNestedPropertyMerge"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "GUIDED_VALIDATION_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "GUIDED_VALIDATION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "guidedValidation",
      "guidedSchemaPicker"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "JSON_SCHEMA_EXPORT_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "JSON_SCHEMA_EXPORT_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "jsonSchemaExport"
    ],
    "assertionLeaves": [],
    "module": "schema-documentation"
  },
  {
    "id": "LIVE_GUIDED_CONDITIONAL_RULE_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "LIVE_GUIDED_CONDITIONAL_RULE_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "liveGuidedConditionalRule"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "LIVE_SCHEMA_PROPERTY_DECLARATION_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "LIVE_SCHEMA_PROPERTY_DECLARATION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "liveSchemaPropertyDeclaration"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "LIVE_VALIDATION_VISUALS_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "LIVE_VALIDATION_VISUALS_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "liveValidationVisuals"
    ],
    "assertionLeaves": [],
    "module": "schema-validation"
  },
  {
    "id": "LOCAL_RULE_EDITING_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "LOCAL_RULE_EDITING_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "localRuleEditing"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "LOCAL_RULE_PROMOTION_AVAILABILITY_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "LOCAL_RULE_PROMOTION_AVAILABILITY_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "localRulePromotionAvailability"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "LOCAL_RULE_PROMOTION_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "LOCAL_RULE_PROMOTION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "localRulePromotion"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "RECURSIVE_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "RECURSIVE_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "recursiveDeclaredPropertyValidation"
    ],
    "assertionLeaves": [],
    "module": "schema-validation"
  },
  {
    "id": "REQUIRED_RULE_TYPE_INDEPENDENCE_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "REQUIRED_RULE_TYPE_INDEPENDENCE_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "requiredRuleTypeIndependence"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "REUSABLE_RULE_SYNC_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "REUSABLE_RULE_SYNC_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "reusableRuleSync"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaAssignmentDataConditions"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "SCHEMA_CARDINALITY_COMPARISON_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_CARDINALITY_COMPARISON_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaCardinalityComparison"
    ],
    "assertionLeaves": [],
    "module": "schema-validation"
  },
  {
    "id": "SCHEMA_DECLARED_PROPERTY_EXCEPTIONS_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_DECLARED_PROPERTY_EXCEPTIONS_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaDeclaredPropertyExceptions"
    ],
    "assertionLeaves": [],
    "module": "schema-validation"
  },
  {
    "id": "SCHEMA_DOCUMENTATION_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_DOCUMENTATION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaDocumentation"
    ],
    "assertionLeaves": [],
    "module": "schema-documentation"
  },
  {
    "id": "SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaManualProperty",
      "schemaContainerChild"
    ],
    "assertionLeaves": [],
    "module": "schema-workspace"
  },
  {
    "id": "SCHEMA_NESTED_PATH_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_NESTED_PATH_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaNestedPath"
    ],
    "assertionLeaves": [],
    "module": "schema-workspace"
  },
  {
    "id": "SCHEMA_PROPERTY_COMMENTS_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_PROPERTY_COMMENTS_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaPropertyComments"
    ],
    "assertionLeaves": [],
    "module": "schema-documentation"
  },
  {
    "id": "SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaPropertyCopy"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "SCHEMA_PROPERTY_EXAMPLE_VALUES_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_PROPERTY_EXAMPLE_VALUES_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaPropertyExampleValues"
    ],
    "assertionLeaves": [],
    "module": "schema-documentation"
  },
  {
    "id": "SCHEMA_PROPERTY_FILTER_SORT_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_PROPERTY_FILTER_SORT_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaPropertyFilterSort"
    ],
    "assertionLeaves": [],
    "module": "schema-workspace"
  },
  {
    "id": "SCHEMA_PROPERTY_REMOVAL_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_PROPERTY_REMOVAL_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaPropertyRemoval"
    ],
    "assertionLeaves": [],
    "module": "schema-workspace"
  },
  {
    "id": "SCHEMA_PROPERTY_RULE_PICKER_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_PROPERTY_RULE_PICKER_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaPropertyRulePicker"
    ],
    "assertionLeaves": [],
    "module": "schema-workspace"
  },
  {
    "id": "SCHEMA_PROPERTY_TYPE_EDITING_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_PROPERTY_TYPE_EDITING_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaPropertyTypeEditing"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "SCHEMA_RENAMING_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_RENAMING_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaRenaming"
    ],
    "assertionLeaves": [],
    "module": "schema-workspace"
  },
  {
    "id": "SCHEMA_REVISION_LIFECYCLE_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_REVISION_LIFECYCLE_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaRevisionLifecycle"
    ],
    "assertionLeaves": [],
    "module": "schema-workspace"
  },
  {
    "id": "SCHEMA_RULE_PROPERTY_IDENTITY_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_RULE_PROPERTY_IDENTITY_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaRulePropertyIdentity"
    ],
    "assertionLeaves": [],
    "module": "schema-validation"
  },
  {
    "id": "SCHEMA_SPECIFICATION_BUILDER_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_SPECIFICATION_BUILDER_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaSpecificationBuilder"
    ],
    "assertionLeaves": [],
    "module": "schema-documentation"
  },
  {
    "id": "SCHEMA_SPECIFICATION_BUILDER_CUSTOMIZATION_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_SPECIFICATION_BUILDER_CUSTOMIZATION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaSpecificationBuilderCustomization"
    ],
    "assertionLeaves": [],
    "module": "schema-documentation"
  },
  {
    "id": "SCHEMA_SPECIFICATION_CONTAINER_DEFAULTS_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_SPECIFICATION_CONTAINER_DEFAULTS_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaSpecificationContainerDefaults"
    ],
    "assertionLeaves": [],
    "module": "schema-documentation"
  },
  {
    "id": "SCHEMA_SPECIFICATION_EXAMPLE_SELECTION_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_SPECIFICATION_EXAMPLE_SELECTION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaSpecificationExampleSelection"
    ],
    "assertionLeaves": [],
    "module": "schema-documentation"
  },
  {
    "id": "SCHEMA_SPECIFICATION_PREVIEW_LAYOUT_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_SPECIFICATION_PREVIEW_LAYOUT_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaSpecificationPreviewLayout"
    ],
    "assertionLeaves": [],
    "module": "schema-documentation"
  },
  {
    "id": "VALIDATION_PRESENCE_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "VALIDATION_PRESENCE_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "validationPresenceSemantics"
    ],
    "assertionLeaves": [],
    "module": "schema-validation"
  },
  {
    "id": "RECURSIVE_PROPERTY_VALIDATION_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "RECURSIVE_PROPERTY_VALIDATION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "recursivePropertyValidation"
    ],
    "assertionLeaves": [],
    "module": "schema-validation"
  },
  {
    "id": "SCHEMA_PUBLICATION_REFRESH_BROWSER_ADAPTER",
    "owningPack": "schemas",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-schemas.mjs",
    "processGroup": "schemas-side-panel",
    "configuration": {
      "SCHEMA_PUBLICATION_REFRESH_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaPublicationRefresh"
    ],
    "assertionLeaves": [],
    "module": "schema-guided"
  },
  {
    "id": "DEFECT_LIBRARY_BROWSER_ADAPTER",
    "owningPack": "defects",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-defects.mjs",
    "processGroup": "defects-side-panel",
    "configuration": {
      "DEFECT_LIBRARY_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "defectLibrary"
    ],
    "assertionLeaves": [],
    "module": "defects"
  },
  {
    "id": "DEFECT_REPORT_COMPONENT_OPTIONS_BROWSER_ADAPTER",
    "owningPack": "defects",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-defects.mjs",
    "processGroup": "defects-side-panel",
    "configuration": {
      "DEFECT_REPORT_COMPONENT_OPTIONS_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "defectReportComponentOptions"
    ],
    "assertionLeaves": [],
    "module": "defects"
  },
  {
    "id": "DEFECT_REPORT_PROVENANCE_PRESENTATION_BROWSER_ADAPTER",
    "owningPack": "defects",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-defects.mjs",
    "processGroup": "defects-side-panel",
    "configuration": {
      "DEFECT_REPORT_PROVENANCE_PRESENTATION_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "defectReportProvenancePresentation"
    ],
    "assertionLeaves": [],
    "module": "defects"
  },
  {
    "id": "DEFECT_REPORT_SEMANTIC_DIFFERENCES_BROWSER_ADAPTER",
    "owningPack": "defects",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-defects.mjs",
    "processGroup": "defects-side-panel",
    "configuration": {
      "DEFECT_REPORT_SEMANTIC_DIFFERENCES_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "defectReportSemanticDifferences"
    ],
    "assertionLeaves": [],
    "module": "defects"
  },
  {
    "id": "DEFECT_REPORT_UNDECLARED_REMOVAL_BROWSER_ADAPTER",
    "owningPack": "defects",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-defects.mjs",
    "processGroup": "defects-side-panel",
    "configuration": {
      "DEFECT_REPORT_UNDECLARED_REMOVAL_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "defectReportUndeclaredRemoval"
    ],
    "assertionLeaves": [],
    "module": "defects"
  },
  {
    "id": "EVENT_OCCURRENCE_DEFECT_REPORT_BROWSER_ADAPTER",
    "owningPack": "defects",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-defects.mjs",
    "processGroup": "defects-side-panel",
    "configuration": {
      "EVENT_OCCURRENCE_DEFECT_REPORT_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "eventOccurrenceDefectReport"
    ],
    "assertionLeaves": [],
    "module": "defects"
  },
  {
    "id": "MISSING_EVENT_DEFECT_FIDELITY_BROWSER_OBSERVATION",
    "owningPack": "defects",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-defects.mjs",
    "processGroup": "defects-side-panel",
    "configuration": {
      "MISSING_EVENT_DEFECT_REPORT_BROWSER_ADAPTER": "1",
      "MISSING_EVENT_REPORT_FIDELITY_BROWSER_ADAPTER": "1",
      "UNIFIED_DEFECT_BUILDER_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "missingEventDefectReport",
      "missingEventReportFidelity",
      "unifiedDefectBuilder"
    ],
    "assertionLeaves": [],
    "module": "defects"
  },
  {
    "id": "REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER",
    "owningPack": "defects",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-defects.mjs",
    "processGroup": "defects-side-panel",
    "configuration": {
      "REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "reproductionStepActionRows"
    ],
    "assertionLeaves": [],
    "module": "defects"
  },
  {
    "id": "REQUIRED_PROPERTY_DEFECT_SCHEMA_CHOICES_BROWSER_ADAPTER",
    "owningPack": "defects",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-defects.mjs",
    "processGroup": "defects-side-panel",
    "configuration": {
      "REQUIRED_PROPERTY_DEFECT_SCHEMA_CHOICES_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "requiredPropertyDefectSchemaChoices"
    ],
    "assertionLeaves": [],
    "module": "defects"
  },
  {
    "id": "SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER",
    "owningPack": "shell",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-shell.mjs",
    "processGroup": "shell-containment",
    "configuration": {
      "SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "schemaViewContainment"
    ],
    "assertionLeaves": [
      [
        "schemaViewContainment",
        "containedControls"
      ],
      [
        "schemaViewContainment",
        "editorContainsActions"
      ],
      [
        "schemaViewContainment",
        "closeReviewContainsActions"
      ],
      [
        "schemaViewContainment",
        "assignmentContainsPolicy"
      ],
      [
        "schemaViewContainment",
        "editorStates",
        "assignmentWasOpen"
      ],
      [
        "schemaViewContainment",
        "editorStates",
        "assignmentHiddenWhileAway"
      ],
      [
        "schemaViewContainment",
        "editorStates",
        "ruleWasOpen"
      ],
      [
        "schemaViewContainment",
        "editorStates",
        "ruleHiddenWhileAway"
      ],
      [
        "schemaViewContainment",
        "restored",
        "editorVisible"
      ]
    ],
    "module": "shell"
  },
  {
    "id": "WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER",
    "owningPack": "shell",
    "oldProgram": "test/side-panel-component-layout-runtime-test.mjs",
    "newProgram": "test/browser-packs/side-panel-shell.mjs",
    "processGroup": "shell-containment",
    "configuration": {
      "WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER": "1"
    },
    "viewport": [
      720
    ],
    "observationKeys": [
      "workspacePanelContainment"
    ],
    "assertionLeaves": [
      [
        "workspacePanelContainment",
        "peers"
      ],
      [
        "workspacePanelContainment",
        "storageOwnership",
        "dataLayer"
      ],
      [
        "workspacePanelContainment",
        "storageOwnership",
        "shell"
      ],
      [
        "workspacePanelContainment",
        "utilityDirectory",
        "visible"
      ],
      [
        "workspacePanelContainment",
        "afterActivation",
        "dataLayerHidden"
      ],
      [
        "workspacePanelContainment",
        "afterActivation",
        "hotkeysVisible"
      ],
      [
        "workspacePanelContainment",
        "afterActivation",
        "headingVisible"
      ],
      [
        "workspacePanelContainment",
        "afterActivation",
        "searchVisible"
      ],
      [
        "workspacePanelContainment",
        "afterActivation",
        "registeredGroupsVisible"
      ]
    ],
    "module": "shell"
  }
].map((record) =>
  Object.freeze({ ...record,
    viewport:Object.freeze(targetViewportOverrides[record.id] ?? record.viewport),
    configuration:Object.freeze(record.configuration),
    observationKeys:Object.freeze(record.observationKeys),
    assertionLeaves:record.assertionLeaves.length
      ? Object.freeze(record.assertionLeaves.map((leaf) => Object.freeze(leaf)))
      : sidePanelAssertionLeaves[record.id] })));

export function targetDefinitionsForModule(moduleName) {
  return sidePanelTargetContract.filter((record) => record.module === moduleName);
}

export function createExecutableTargetDefinitions(moduleName, fixturePrograms, hooks = {}) {
  return targetDefinitionsForModule(moduleName).map((record) => Object.freeze({
    ...record,
    fixturePrograms,
    setup:async ({ context }) => {
      context.activeFixtureModule = moduleName;
    },
    observe:async ({ context }) => {
      if (typeof context.executeFixture !== "function") {
        throw new Error(`${record.id} requires an executable installed fixture context`);
      }
      return hooks.observe
        ? hooks.observe({ context, fixturePrograms, target:record })
        : context.executeFixture({ fixturePrograms, target:record });
    },
    cleanup:async ({ context }) => {
      context.activeFixtureModule = null;
    },
  }));
}
