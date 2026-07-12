export type EvaluationStatus = "pass" | "warning" | "error";

export interface ValidationEvaluation {
  propertyPath: string;
  status: EvaluationStatus;
  message: string;
  expected: string;
  actual: string;
  rule: string;
  ruleVersion: number;
  severity: string;
  schemaName: string;
  schemaVersion: number;
}
