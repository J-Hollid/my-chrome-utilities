export type EvaluationStatus = "pass" | "warning" | "error" | "not-applicable";

export interface ValidationEvaluation {
  propertyPath: string;
  templatePath?: string;
  status: EvaluationStatus;
  message: string;
  expected: string;
  actual: string;
  rule: string;
  ruleVersion: number;
  severity: string;
  schemaName: string;
  schemaVersion: number;
  ruleId?: string;
  operator?: string;
  schemaId?: string;
  actualValue?: unknown;
  allowedValues?: readonly (string | number | boolean | null)[];
  notApplicableReason?: "target-absent" | "condition-not-satisfied";
}
