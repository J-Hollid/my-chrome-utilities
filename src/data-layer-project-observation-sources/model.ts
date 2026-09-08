export interface ProjectObservationSource {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
}

export interface ProjectEventTransportSettings {
  /** Legacy observation path, retained for single-source project compatibility. */
  observationHistoryPath: string;
  defaultPushPath: string;
  observationSources?: readonly ProjectObservationSource[];
}

export type ObservationSourceStatus = "Ready" | "Waiting for path" | "Not an array" | "Disabled" | "Access required";
