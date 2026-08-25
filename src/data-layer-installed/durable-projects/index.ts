export type DurableProjectMigration =
  | Readonly<{ status:"none" }>
  | Readonly<{ status:"review-required"; projectId:string; conflictingFields:readonly string[];
      sources:readonly Readonly<{ source:"library" | "active"; revision:number; checksum:string }>[] }>
  | Readonly<{ status:"invalid-source-review"; actions:readonly string[];
      sources:readonly Readonly<{ key:string; valid:boolean; error:string; bytes:number; checksum:string }>[] }>;

export interface DurableProjectsInstalledPorts {
  root: ParentNode;
  startRepository(): Promise<() => void>;
  migration(): DurableProjectMigration;
  resolveMigration(choice: "library" | "active"): Promise<void>;
  readLegacySource(key: string): string | null;
  downloadMigrationSources(name: string, serialized: string): void;
  reload(): void;
  reviewMigration(): Promise<void>;
  retryFailedSave(): Promise<void>;
  rejectFailedSave(): Promise<void>;
  storageRecoveryClosed(): void;
}

export function createDurableProjectsInstalledController(ports: DurableProjectsInstalledPorts) {
  const durableStorageRecovery = ports.root.querySelector<HTMLDialogElement>("#durable-storage-recovery");
  const durableMigrationReview = ports.root.querySelector<HTMLElement>("#durable-migration-review");
  const durableMigrationReviewSummary = ports.root.querySelector<HTMLElement>("#durable-migration-review-summary");
  const durableMigrationReviewResult = ports.root.querySelector<HTMLOutputElement>("#durable-migration-review-result");
  const exportLegacyMigrationSourcesButton = ports.root.querySelector<HTMLButtonElement>("#export-legacy-migration-sources");
  const migrateLegacyLibrarySourceButton = ports.root.querySelector<HTMLButtonElement>("#migrate-legacy-library-source");
  const migrateLegacyActiveSourceButton = ports.root.querySelector<HTMLButtonElement>("#migrate-legacy-active-source");
  let phase: "idle" | "starting" | "ready" | "failed" = "idle";
  let migrationPending = false;
  let stop: (() => void) | undefined;
  let mounting: Promise<void> | undefined;
  let generation = 0;
  const storageRecoveryClosed = (): void => ports.storageRecoveryClosed();
  const migrationChoice = (control: HTMLButtonElement | null): "library" | "active" | undefined =>
    control === migrateLegacyLibrarySourceButton ? "library" : control === migrateLegacyActiveSourceButton ? "active" : undefined;
  const migrationSourceKey = (choice: "library" | "active"): string => choice === "library"
    ? "my-chrome-utilities.specification-project-library.v1" : "my-chrome-utilities.specification-project.v1";
  function renderMigrationReview(): void {
    const migration = ports.migration();
    if (!durableMigrationReview || migration.status === "none") return;
    durableMigrationReview.hidden = false;
    if (migration.status === "review-required") {
      if (durableMigrationReviewSummary) durableMigrationReviewSummary.textContent = `${migration.projectId} differs between ${migration.sources
        .map(({ source, revision, checksum }) => `${source} generation ${revision} checksum ${checksum}`).join(" and ")}. Conflicting fields: ${migration.conflictingFields.join(", ")}. No source was deleted or imported.`;
      if (migrateLegacyLibrarySourceButton) migrateLegacyLibrarySourceButton.disabled = false;
      if (migrateLegacyActiveSourceButton) migrateLegacyActiveSourceButton.disabled = false;
      return;
    }
    if (durableMigrationReviewSummary) durableMigrationReviewSummary.textContent = `Invalid legacy source recovery only; zero durable project records were written. ${migration.sources
      .map(({ key, valid, error, bytes, checksum }) => `${key}: ${valid ? "valid" : "invalid"} · ${bytes} bytes · checksum ${checksum} · ${error}`).join(" | ")}. Export every preserved byte, repair the named invalid key and reload, or explicitly choose a valid project source.`;
    const schemaSource = migration.sources.find(({ key }) => key === "my-chrome-utilities.schema-library.v1");
    const validChoice = (choice: "library" | "active"): boolean => migration.sources
      .find(({ key }) => key === migrationSourceKey(choice))?.valid === true && schemaSource?.valid !== false;
    if (migrateLegacyLibrarySourceButton) migrateLegacyLibrarySourceButton.disabled = !validChoice("library");
    if (migrateLegacyActiveSourceButton) migrateLegacyActiveSourceButton.disabled = !validChoice("active");
  }
  const exportLegacyMigrationSources = (): void => {
    const migration = ports.migration();
    if (migration.status === "review-required") {
      const sources = migration.sources.map((source) => { const key = migrationSourceKey(source.source);
        return { ...source, key, payload:ports.readLegacySource(key) }; });
      ports.downloadMigrationSources(`${migration.projectId}-legacy-migration-sources.json`, JSON.stringify({
        format:"my-chrome-utilities.legacy-migration-sources", version:1, projectId:migration.projectId, sources,
      }));
      if (durableMigrationReviewResult) durableMigrationReviewResult.textContent = "Exported both complete legacy source payloads with their identities and checksums.";
    } else if (migration.status === "invalid-source-review") {
      ports.downloadMigrationSources("invalid-legacy-migration-sources.json", JSON.stringify({
        format:"my-chrome-utilities.invalid-legacy-migration-sources", version:1, actions:migration.actions, sources:migration.sources,
      }));
      if (durableMigrationReviewResult) durableMigrationReviewResult.textContent = "Exported every invalid and valid legacy source byte-for-byte with errors and checksums.";
    }
  };
  const resolveReviewedMigration = (event: Event): void => {
    if (migrationPending) return;
    const control = event.currentTarget as HTMLButtonElement | null;
    const choice = migrationChoice(control);
    if (!choice || control?.disabled) return;
    const operation = generation; migrationPending = true;
    const invalid = ports.migration().status === "invalid-source-review";
    if (durableMigrationReviewResult) durableMigrationReviewResult.textContent = invalid
      ? `Migrating only the explicitly reviewed valid ${choice} source; rejected bytes remain in backup…`
      : `Migrating the reviewed ${choice} source…`;
    void ports.resolveMigration(choice).then(() => {
      if (operation === generation && phase !== "idle") ports.reload();
    }, (error: unknown) => {
      if (operation !== generation || phase === "idle" || !durableMigrationReviewResult) return;
      durableMigrationReviewResult.textContent = invalid
        ? `Migration was not committed; every legacy source remains byte-identical. ${error instanceof Error ? error.message : String(error)}`
        : `Migration was not committed; both legacy sources remain unchanged. ${error instanceof Error ? error.message : String(error)}`;
    }).finally(() => { if (operation === generation) migrationPending = false; });
  };
  return {
    mount(): Promise<void> {
      if (phase === "ready") return Promise.resolve();
      if (mounting) return mounting;
      const operation = ++generation;
      phase = "starting";
      durableStorageRecovery?.addEventListener("close", storageRecoveryClosed);
      exportLegacyMigrationSourcesButton?.addEventListener("click", exportLegacyMigrationSources);
      for (const control of [migrateLegacyLibrarySourceButton, migrateLegacyActiveSourceButton]) control?.addEventListener("click", resolveReviewedMigration);
      renderMigrationReview();
      mounting = ports.startRepository().then((dispose) => {
        if (operation !== generation) { dispose(); return; }
        stop = dispose; phase = "ready";
      }, (error) => { if (operation === generation) phase = "failed"; throw error; })
        .finally(() => { if (operation === generation) mounting = undefined; });
      return mounting;
    },
    dispose(): void { generation += 1; durableStorageRecovery?.removeEventListener("close", storageRecoveryClosed);
      exportLegacyMigrationSourcesButton?.removeEventListener("click", exportLegacyMigrationSources);
      for (const control of [migrateLegacyLibrarySourceButton, migrateLegacyActiveSourceButton]) control?.removeEventListener("click", resolveReviewedMigration);
      stop?.(); stop = undefined; mounting = undefined; migrationPending = false; phase = "idle"; },
    reviewMigration:ports.reviewMigration,
    retryFailedSave:ports.retryFailedSave,
    rejectFailedSave:ports.rejectFailedSave,
    state:() => ({ phase, migrationPending }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"durable-projects",
  capabilities:["startup", "migration", "save recovery", "repository lifecycle"],
});
