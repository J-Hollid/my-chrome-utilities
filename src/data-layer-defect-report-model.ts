import type { SchemaChoiceProvenance, SchemaChoiceValue } from "./data-layer-defect-schema-choices.js";
import type { SchemaPropertyExample } from "./utilities/data-layer/schemas.js";

export type DefectSeverity = "error" | "warning" | "pass";

export interface DefectIssue {
  id: string;
  severity: DefectSeverity;
  pointer: string;
  violation?: string;
  constraint: string;
  expectedValue?: unknown;
  actual: unknown;
  rule: string;
  ruleVersion: number;
  allowedValues?: readonly SchemaChoiceValue[];
  schemaChoiceProvenance?: SchemaChoiceProvenance;
  schemaChoiceConflict?: string;
  example?: SchemaPropertyExample;
}
export interface DefectCapturedEvent {
  id: string;
  name: string;
  source: string;
  pageUrl: string;
  pathname: string;
  captureTime: string;
  payload: unknown;
  schema: { name: string; version: number };
  issues: readonly DefectIssue[];
  flowContext?: {
    flowId:string;flowName:string;selectedStepId:string;selectedStepName:string;eventId:string;
    eventStepLink:{eventId:string;stepId:string};
    path:readonly {stepId:string;stepName:string;relationshipId?:string;eventId:string;captureTime:string}[];
    linkEvidence:
      | {kind:"path";label:string;relationshipIds:readonly string[]}
      | {kind:"start";label:string;pageFrameId:string};
    effectiveTarget:{id:string;name:string};
    effectiveSchemaRevision:number;
    effectiveSchemaRevisionIdentity:string;
    provenance:readonly {contributorId:string;contributorName:string;scope:string}[];
  };
}

export interface ReportIssue extends DefectIssue { selected: boolean }
export interface ReportDifference {
  issueId?: string;
  pointer: string;
  violation?: string;
  actualPresence?: "present" | "missing";
  marker: "+" | "−";
  treatment: "green" | "red";
  value: unknown;
}
export interface ExpectedCorrection {
  issueId: string;
  pointer: string;
  operation: "add" | "replace" | "remove" | "none";
  response?: unknown;
  responseSource?: string;
  operatorProvided?: boolean;
  responsePresentation?: ExpectedResponsePresentation;
  responseProvenance?: SchemaChoiceProvenance;
  marker?: "+";
}

export type ExpectedResponsePresentation =
  | { kind: "constraint"; property: string; allowedValues: SchemaChoiceValue[] }
  | {
      kind: "value";
      property: string;
      value: unknown;
      quoteValue: boolean;
      allowedValuesComment?: SchemaChoiceValue[];
    };

export interface DefectReport {
  event: DefectCapturedEvent;
  issues: ReportIssue[];
  actual: { payload: unknown; differences: ReportDifference[] };
  expected: { payload: unknown; corrections: ExpectedCorrection[]; explanations: string[] };
  reproductionSteps: ReproductionStep[];
  timeline: SupportingTimelineEntry[];
  components?: DefectReportComponents;
}

export interface DefectReportComponents {
  differences: boolean;
  validationRules: boolean;
  captureMetadata: boolean;
}

export interface ExpectedResultChoice {
  issueId: string;
  method: "choose an allowed value" | "enter a valid response" | "apply the rule" | "keep the rule generic";
  response?: unknown;
  responseSource?: string;
  quoteResponse?: boolean;
  operatorProvided?: boolean;
  includeAllowedValuesComment?: boolean;
  responseProvenance?: SchemaChoiceProvenance;
}

export interface ExpectedResultAssistance {
  genericConstraint: string;
  schemaValues: SchemaChoiceValue[];
  customAvailable: true;
  provenance?: SchemaChoiceProvenance;
  conflict?: string;
}

export interface PathnameVisit { id: string; pathname: string; eventIds: readonly string[] }
export type ReproductionStepTemplate =
  | { kind: "click"; componentName: string; description?: string }
  | { kind: "login"; persona: string }
  | { kind: "scroll"; target: "bottom" | "top" | "component" | "custom"; detail?: string }
  | { kind: "custom"; text: string };
export interface ReproductionPathnameStep {
  kind: "pathname";
  visitId: string;
  pathname: string;
  text: string;
}
export interface ReproductionManualStep {
  kind: "manual";
  id: string;
  visitId: string;
  pathname: string;
  text: string;
  template: ReproductionStepTemplate;
}
export type ReproductionStep = ReproductionPathnameStep | ReproductionManualStep;

export interface TimelineEvent {
  id: string;
  captureTime: string;
  name: string;
  source: string;
  pathname: string;
  validation: string;
  payload?: unknown;
  summary?: string;
  validationDetails?: unknown;
}
export interface TimelineFilter { search?: string; name?: string; source?: string; pathname?: string; validation?: string }
export interface TimelineSelection {
  eventId: string;
  includeSummary?: boolean;
  includePayload?: boolean;
  includeValidation?: boolean;
}
export interface SupportingTimelineEntry {
  captureTime: string;
  name: string;
  source: string;
  pathname: string;
  summary?: string;
  payload?: unknown;
  validationDetails?: unknown;
}

export interface GeneratedDefectReport extends DefectReport {
  summary: string;
  description: string;
  expectedExplanation: string;
  editable: readonly ["summary", "description", "expectedExplanation"];
  evidence: {
    schema: string;
    validation: Array<{
      rule: string;
      ruleVersion: number;
      severity: DefectSeverity;
      pointer: string;
      violation?: string;
      constraint: string;
      actual: unknown;
    }>;
    capture: { eventName: string; source: string; pageUrl: string; captureTime: string };
    flow?: NonNullable<DefectCapturedEvent["flowContext"]>;
  };
}

export interface DefectReportClipboard {
  writeRich?(html: string, text: string): Promise<void>;
  writeText?(text: string): Promise<void>;
}

export interface DefectReportBuilderNavigation {
  backToCapturedEvent(): void;
  backToLiveFeed(): void;
}
