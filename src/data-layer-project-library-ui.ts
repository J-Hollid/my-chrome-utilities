import { openEditProjectDialog } from "./project-library-dialogs/edit.js";
import { openCreateProjectDialog } from "./project-library-dialogs/create.js";
import { openSwitchProjectDialog } from "./project-library-dialogs/switch.js";
import { openImportProjectDialog, openImportErrorDialog } from "./project-library-dialogs/import.js";
import { focusProjectControl } from "./project-library-dialogs/focus.js";
import { activateProject, createProjectInLibrary, deactivateProject, migrateSingletonProject, preferredProjectLibraryTransport, projectMetadata, replayProjectCommand, resolveProjectWrite, restoreProjectLibrary, saveProjectState, serializeProjectLibrary, stageProjectImport, updateProjectMetadata, type ProjectLibrary, type ProjectLibraryInspectedImport, type ProjectLibraryTransport, type ProjectLibraryTransportHost, PROJECT_LIBRARY_STORAGE_KEY } from "./data-layer-project-library.js";
import { type ProjectState } from "./data-layer-specification-project.js";
import { restoreCanonicalProjectEnvelope, restoreCanonicalProjectState, serializeCanonicalProjectState } from "./data-layer-specification-repository.js";
import { renderProjectLibraryPresentation } from "./data-layer-project-library-presentation-ui.js";
interface LibraryStorage extends ProjectLibraryTransportHost {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
export interface ProjectLibraryStorageChange {
    key: string | null;
    newValue: string | null;
}
export interface ProjectLibraryChangeTarget {
    addEventListener(type: "storage", listener: (event: ProjectLibraryStorageChange) => void): void;
    removeEventListener(type: "storage", listener: (event: ProjectLibraryStorageChange) => void): void;
}
interface ProjectLibraryUiOptions {
    root: ParentNode;
    storage: LibraryStorage;
    projectStorageKey: string;
    navigationStorageKey: string;
    openStudio: (url: string) => void;
    exportProject: (projectId: string) => Promise<string>;
    importProject: (serialized: string, input: {
        projectId: string;
        name: string;
    }) => Promise<void>;
    subscribe: (listener: (library: ProjectLibrary) => void) => () => void;
    blocked?: () => boolean;
    onChange?: () => void;
    now?: () => string;
    id?: (kind: string) => string;
    prepareProject?: (projectId: string) => Promise<void>;
    settled?: () => Promise<void>;
    undoProject?: (projectId: string) => Promise<void>;
}
export interface ProjectLibraryUi {
    render(): void;
    library(): ProjectLibrary;
    activate(projectId: string): void;
    syncActiveProject(): void;
    captureActiveProject(state: ProjectState, revision: number): void;
}
const q = <T extends Element>(root: ParentNode, selector: string): T => {
    const value = root.querySelector<T>(selector);
    if (!value)
        throw new Error(`Missing ${selector}`);
    return value;
};
const button = (text: string, aria: string, run: (this: HTMLButtonElement, event: MouseEvent) => unknown): HTMLButtonElement => {
    const control = document.createElement("button");
    control.type = "button";
    control.textContent = text;
    control.setAttribute("aria-label", aria);
    control.addEventListener("click", run);
    return control;
};
const publishedRevision = (record: ProjectLibrary["projects"][string]): number => record.publishedRevision ?? Math.max(0, ...record.state.project.releases.map(({ revision }) => revision));
const compatibilityTransport = (options: ProjectLibraryUiOptions, library: () => ProjectLibrary, id: (kind: string) => string, now: () => string): ProjectLibraryTransport => ({
    async prepareExport(projectId) {
        let bytes: Uint8Array | undefined = new TextEncoder().encode(await options.exportProject(projectId));
        let started = false;
        return {
            formatVersion: 2, mediaType: "application/json", extension: "json", estimatedBytes: bytes.byteLength, async write(sink, input = {}) {
                if (!bytes)
                    throw new Error("Prepared project export was released.");
                if (started)
                    throw new Error("Prepared project export already started.");
                started = true;
                if (input.signal?.aborted)
                    throw new DOMException("Project transport was cancelled.", "AbortError");
                await sink.write(bytes);
            }, release() {
                bytes = undefined;
            }
        };
    },
    async inspectImport(source) {
        let serialized: string | undefined = await source.text();
        let parsed: Record<string, unknown> | undefined;
        try {
            parsed = JSON.parse(serialized) as Record<string, unknown>;
        }
        catch {
        }
        const staged = stageProjectImport(serialized, library(), {
            id: (oldId) => `${id("import")}:${oldId.split(":")[0]}`, now
        });
        let started = false;
        return {
            formatVersion: Number(parsed?.version ?? 0), sourceName: staged.sourceName, targetName: staged.targetName, projectId: staged.projectId, entityCounts: staged.entityCounts, referenceIntegrity: staged.referenceIntegrity, migrations: staged.migrations, blockers: staged.blockers, async commit(input) {
                if (!serialized)
                    throw new Error("Inspected project import was released.");
                if (started)
                    throw new Error("Inspected project import already started.");
                started = true;
                if (input.signal?.aborted)
                    throw new DOMException("Project transport was cancelled.", "AbortError");
                await options.importProject(serialized, {
                    projectId: staged.projectId, name: input.name
                });
            }, release() {
                serialized = undefined;
                parsed = undefined;
            }
        };
    },
});
export function subscribeProjectLibraryChanges(target: ProjectLibraryChangeTarget, current: () => ProjectLibrary, notify: (library: ProjectLibrary) => void): () => void {
    const listener = (event: ProjectLibraryStorageChange): void => {
        if (event.key !== PROJECT_LIBRARY_STORAGE_KEY || !event.newValue)
            return;
        const next = restoreProjectLibrary(event.newValue);
        if (next && serializeProjectLibrary(next) !== serializeProjectLibrary(current()))
            notify(next);
    };
    target.addEventListener("storage", listener);
    return () => target.removeEventListener("storage", listener);
}
export function mountProjectLibraryUi(options: ProjectLibraryUiOptions): ProjectLibraryUi {
    const now = options.now ?? (() => new Date().toISOString());
    const id = options.id ?? ((kind) => `${kind}:${crypto.randomUUID()}`);
    const activeHeader = q<HTMLElement>(options.root, "#active-project-header");
    const activeCard = q<HTMLElement>(options.root, "#active-project-card");
    const search = q<HTMLInputElement>(options.root, "#project-library-search");
    const sort = options.root.querySelector<HTMLSelectElement>("#project-library-sort");
    const list = q<HTMLUListElement>(options.root, "#project-library-list");
    const create = q<HTMLButtonElement>(options.root, "#create-library-project");
    const importControl = q<HTMLButtonElement>(options.root, "#import-library-project");
    const file = q<HTMLInputElement>(options.root, "#import-library-project-file");
    const status = q<HTMLOutputElement>(options.root, "#project-library-status");
    const singleton = options.storage.getItem(options.projectStorageKey);
    const state = restoreCanonicalProjectState(singleton);
    const envelope = restoreCanonicalProjectEnvelope(singleton);
    const navigation = options.storage.getItem(options.navigationStorageKey);
    let library = migrateSingletonProject(restoreProjectLibrary(options.storage.getItem(PROJECT_LIBRARY_STORAGE_KEY)), state && envelope ? {
        state, revision: envelope.revision, ...(navigation ? { navigation: JSON.parse(navigation) } : {})
    } : undefined, now);
    const active = () => library.activeProjectId ? library.projects[library.activeProjectId] : undefined;
    const prepare = async (projectId: string) => {
        await options.prepareProject?.(projectId);
        library = restoreProjectLibrary(options.storage.getItem(PROJECT_LIBRARY_STORAGE_KEY)) ?? library;
    };
    const projectProjection = () => {
        const record = active();
        if (record)
            options.storage.setItem(options.projectStorageKey, serializeCanonicalProjectState(record.state, record.revision));
        else
            options.storage.removeItem(options.projectStorageKey);
    };
    const latestPersistedActive = () => {
        const current = active();
        const serialized = options.storage.getItem(options.projectStorageKey);
        const state = restoreCanonicalProjectState(serialized);
        const envelope = restoreCanonicalProjectEnvelope(serialized);
        return current && state?.project.id === current.state.project.id && envelope && envelope.revision >= current.revision ? {
            state, revision: envelope.revision
        } : current ? {
            state: current.state, revision: current.revision
        } : undefined;
    };
    const persist = (next: ProjectLibrary, projection = false) => {
        library = next;
        options.storage.setItem(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(library));
        if (projection)
            projectProjection();
        status.textContent = "Saving durable Draft…";
        void options.settled?.().then(() => {
            status.textContent = "Saved to durable project storage.";
        }, error => {
            status.textContent = `Save failed; last Saved Draft is unchanged. ${error instanceof Error ? error.message : String(error)}`;
        });
        options.onChange?.();
        render();
    };
    library = {
        ...structuredClone(library), projects: Object.fromEntries(Object.entries(library.projects).map(([projectId, entry]) => [projectId, {
                ...structuredClone(entry), state: {
                    ...structuredClone(entry.state), history: {
                        undo: [], redo: []
                    }
                }
            }]))
    };
    const transport = preferredProjectLibraryTransport(options.storage, compatibilityTransport(options, () => library, id, now));
    const operationCancel = button("Cancel project transfer", "Cancel project import or export", () => operationController?.abort());
    let operationController: AbortController | undefined;
    operationCancel.hidden = true;
    status.insertAdjacentElement("afterend", operationCancel);
    const beginTransfer = () => {
        operationController?.abort();
        operationController = new AbortController();
        operationCancel.hidden = false;
        operationCancel.disabled = false;
        return operationController;
    };
    const endTransfer = (controller: AbortController) => {
        if (operationController !== controller)
            return;
        operationController = undefined;
        operationCancel.hidden = true;
    };
    const blocked = () => Boolean(options.blocked?.());
    const open = (projectId: string, route = "overview") => {
        if (blocked()) {
            status.textContent = "A failed Draft save blocks project switching until Retry succeeds or the unsaved Draft is exported and explicitly rejected.";
            return;
        }
        if (projectId === library.activeProjectId) {
            status.textContent = "Opening the current Saved Draft in Specification Studio…";
            void Promise.resolve(options.settled?.()).then(() => options.openStudio(`specification-builder.html?project=${encodeURIComponent(projectId)}&route=${encodeURIComponent(route)}`), error => {
                status.textContent = `Specification Studio was not opened because the pending durable save failed. ${error instanceof Error ? error.message : String(error)}`;
            });
            return;
        }
        void prepare(projectId).then(() => {
            persist(activateProject(library, projectId, now), true);
            return options.settled?.();
        }).then(() => options.openStudio(`specification-builder.html?project=${encodeURIComponent(projectId)}&route=${encodeURIComponent(route)}`), error => {
            status.textContent = `Project switch was not committed. ${error instanceof Error ? error.message : String(error)}`;
        });
    };
    const download = async (projectId: string) => {
        const controller = beginTransfer();
        const record = library.projects[projectId]!;
        const baseName = record.state.project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
        status.textContent = `Preparing durable export for ${record.state.project.name}…`;
        let prepared;
        try {
            prepared = await transport.prepareExport(projectId);
            const archive = prepared.formatVersion >= 3;
            const picker = archive ? (globalThis as typeof globalThis & {
                showSaveFilePicker?: (options: unknown) => Promise<{
                    createWritable(): Promise<{
                        write(chunk: Uint8Array): Promise<void>;
                        close(): Promise<void>;
                        abort?(): Promise<void>;
                    }>;
                }>;
            }).showSaveFilePicker : undefined;
            if (archive)
                status.textContent = `Estimated export size ${prepared.estimatedBytes} bytes. Choose a destination or use the bounded browser download fallback.`;
            if (picker) {
                const handle = await picker({
                    suggestedName: `${baseName}-project.${prepared.extension}`, types: [{
                            description: "Project archive", accept: { [prepared.mediaType]: [`.${prepared.extension}`] }
                        }]
                });
                const writable = await handle.createWritable();
                try {
                    await prepared.write({ write: chunk => writable.write(chunk) }, {
                        signal: controller.signal, onProgress: progress => {
                            status.textContent = progress.message;
                        }
                    });
                    await writable.close();
                }
                catch (error) {
                    await writable.abort?.();
                    throw error;
                }
            }
            else {
                const fallbackLimit = 256 * 1024 * 1024;
                if (archive && prepared.estimatedBytes > fallbackLimit)
                    throw new DOMException(`The estimated ${prepared.estimatedBytes}-byte archive exceeds the ${fallbackLimit}-byte browser-download fallback. Choose a browser with writable-file support.`, "QuotaExceededError");
                const chunks: ArrayBuffer[] = [];
                await prepared.write({ write: async (chunk) => {
                        chunks.push(Uint8Array.from(chunk).buffer);
                    } }, {
                    signal: controller.signal, onProgress: progress => {
                        status.textContent = progress.message;
                    }
                });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(new Blob(chunks, { type: prepared.mediaType }));
                link.download = `${baseName}-project.${prepared.extension}`;
                link.click();
                URL.revokeObjectURL(link.href);
            }
            status.textContent = archive ? `Exported ${record.state.project.name} with its Draft, Published snapshot, digest-addressed originals, and no thumbnail cache or window Undo/Redo.` : `Exported ${record.state.project.name} with its Draft, domain Published snapshot, releases, fixtures, and no window Undo/Redo.`;
        }
        catch (error) {
            status.textContent = `Project export failed or was cancelled. ${error instanceof Error ? error.message : String(error)}`;
        }
        finally {
            prepared?.release();
            endTransfer(controller);
        }
    };
    const edit = (projectId: string, returnFocus: HTMLElement) => {
        const record = library.projects[projectId]!;
        openEditProjectDialog({
            projectId,
            name: record.state.project.name,
            metadata: projectMetadata(library, projectId),
            save: values => {
                persist(updateProjectMetadata(library, projectId, values, now));
                const current = library.projects[projectId]!;
                return `Saving durable Draft for ${current.state.project.name}. Stable identity ${projectId}; Published revision ${publishedRevision(current)}.`;
            },
            undo: async () => {
                await options.settled?.();
                if (!options.undoProject)
                    throw new Error("This project surface has no page-scoped Undo command.");
                await options.undoProject(projectId);
                library = restoreProjectLibrary(options.storage.getItem(PROJECT_LIBRARY_STORAGE_KEY)) ?? library;
                render();
                return projectMetadata(library, projectId);
            },
            restoreFocus: () => focusProjectControl(list.querySelector(`[data-project-id="${CSS.escape(projectId)}"]`), "Edit details", returnFocus),
        });
    };
    const switchReview = (projectId: string, returnFocus: HTMLElement) => {
        const target = library.projects[projectId]!;
        const current = active();
        openSwitchProjectDialog({
            name: target.state.project.name,
            summary: blocked() ? "A failed durable Draft blocks this switch until its exact Retry succeeds."
                : `${current?.state.project.name ?? "No active project"} (${library.activeProjectId ?? "none"}) → ${target.state.project.name} (${projectId}). Schema, Pages, Property Sets, Events, Flows, documentation, assignments, and Specification Studio will replace context atomically. Current Draft ${current?.pendingWrite ? "has a pending write" : "is saved"}.`,
            ...(current?.pendingWrite ? { pendingLabel: current.pendingWrite.label } : {}),
            blocked,
            confirm: () => {
                if (blocked())
                    throw new Error("A failed durable Draft still blocks project switching.");
                persist(activateProject(library, projectId, now), true);
            },
            resolve: choice => {
                const pending = current!.pendingWrite!;
                const latest = choice === "merge" ? latestPersistedActive() : undefined;
                const persisted = choice === "merge" && latest ? {
                    state: replayProjectCommand(latest.state, pending),
                    revision: Math.max(latest.revision, current!.revision, pending.baseRevision) + 1,
                } : undefined;
                persist(resolveProjectWrite(library, library.activeProjectId!, choice, persisted, now));
                return choice === "retry"
                    ? `Replayed ${pending.label} into the latest Saved Draft. Retry switching to ${target.state.project.name}.`
                    : `Resolved ${pending.label} with ${choice}. Retry switching to ${target.state.project.name}.`;
            },
            restoreFocus: () => focusProjectControl(list.querySelector(`[data-project-id="${CSS.escape(projectId)}"]`), "Switch", returnFocus),
            focusSelection: () => list.querySelector<HTMLElement>(`[data-project-id="${CSS.escape(projectId)}"]`)?.focus(),
        });
    };
    const creation = (returnFocus: HTMLElement = create) => openCreateProjectDialog({
        review: values => {
            if (!values.name.trim())
                throw new Error("Name rejects blank text.");
            if (Object.values(library.projects).some(({ state }) => state.project.name.toLowerCase() === values.name.trim().toLowerCase())) {
                throw new Error("Name rejects a case-insensitive existing project name.");
            }
            return `Impact review: ${values.name.trim()} will become active while ${active()?.state.project.name ?? "all existing projects"} remains saved.`;
        },
        create: values => {
            const next = createProjectInLibrary(library, values, {
                id, now
            });
            persist(next);
            return `${next.projects[next.activeProjectId!]!.state.project.name} is active. Recommended next action: Open in Specification Studio.`;
        },
        openStudio: () => {
            if (library.activeProjectId)
                open(library.activeProjectId);
        },
        restoreFocus: () => returnFocus.focus(),
    });
    const importReview = (staged: ProjectLibraryInspectedImport, returnFocus: HTMLElement = importControl) => {
        let commitController: AbortController | undefined;
        let released = false;
        const release = () => {
            if (released)
                return;
            released = true;
            staged.release();
        };
        openImportProjectDialog({
            targetName: staged.targetName,
            summary: staged.blockers.length
                ? staged.blockers.map(({ section, message }) => `${section}: ${message}`).join(" · ")
                : `Format version ${staged.formatVersion} · source ${staged.sourceName} · Saved Draft · entity counts ${JSON.stringify(staged.entityCounts)} · reference integrity ${staged.referenceIntegrity} · migrations ${staged.migrations.join(", ") || "none"} · unique target name ${staged.targetName} · Import as new project.`,
            blocked: Boolean(staged.blockers.length),
            commit: async (nextName, progress) => {
                try {
                    if (!nextName)
                        throw new Error("Enter a unique target project name.");
                    if (Object.values(library.projects).some(({ state }) => state.project.name.toLowerCase() === nextName.toLowerCase())) {
                        throw new Error("Target project name must be unique.");
                    }
                    commitController = new AbortController();
                    progress(`Importing ${nextName} into durable storage…`);
                    await staged.commit({
                        name: nextName, signal: commitController.signal, onProgress: value => progress(value.message)
                    });
                    await options.settled?.();
                    release();
                    options.onChange?.();
                    return staged.formatVersion >= 3
                        ? `Imported ${nextName} atomically as inactive project ${staged.projectId}, including its validated digest-addressed visual originals. Open it explicitly to activate.`
                        : `Imported ${nextName} as inactive project ${staged.projectId}. Its Published domain snapshot was remapped into a new local immutable revision. Open it explicitly to activate.`;
                }
                finally {
                    release();
                    commitController = undefined;
                }
            },
            cancel: () => commitController?.abort(),
            dispose: () => {
                commitController?.abort();
                release();
            },
            restoreFocus: () => returnFocus.focus(),
        });
    };
    function render(): void {
        const record = active();
        const term = search.value.trim().toLowerCase();
        const blockedNow = blocked();
        create.disabled = blockedNow;
        const entries = Object.entries(library.projects).filter(([, entry]) => [entry.state.project.name, entry.state.project.site, String(entry.state.project.owner ?? "")].some((value) => value.toLowerCase().includes(term))).sort(([, left], [, right]) => sort?.value === "last-saved" ? right.lastModifiedAt.localeCompare(left.lastModifiedAt) || left.state.project.name.localeCompare(right.state.project.name) : left.state.project.name.localeCompare(right.state.project.name));
        renderProjectLibraryPresentation({
            activeHeader, activeCard, list
        }, {
            activeHeader: record ? `Active project: ${record.state.project.name} · Saved Draft · Published revision ${publishedRevision(record)}` : "No active project · Open project or Create project",
            ...(record ? { active: {
                    id: record.state.project.id, name: record.state.project.name, summary: `${record.state.project.site} · Saved Draft · last saved ${record.lastModifiedAt} · Published revision ${publishedRevision(record)}`
                } } : {}),
            entries: entries.map(([projectId, entry]) => ({
                id: projectId, name: entry.state.project.name, active: projectId === library.activeProjectId, savedAt: entry.lastModifiedAt, summary: `${entry.state.project.site} · Saved Draft · Published revision ${publishedRevision(entry)}`
            })), blocked: blockedNow,
        }, {
            focusSearch: () => search.focus(), createProject: (control) => creation(control), openProject: (projectId) => open(projectId),
            editProject: (projectId, control) => void prepare(projectId).then(() => edit(projectId, control)), exportProject: (projectId) => void download(projectId),
            closeProject: () => {
                try {
                    const projectId = library.activeProjectId;
                    persist(deactivateProject(library), true);
                    focusProjectControl(list.querySelector(`[data-project-id="${CSS.escape(projectId ?? "")}"]`), "Switch", search);
                }
                catch (error) {
                    status.textContent = error instanceof Error ? error.message : String(error);
                }
            },
            switchProject: (projectId, control) => {
                if (blocked())
                    return;
                control.disabled = true;
                void prepare(projectId).then(() => {
                    control.disabled = false;
                    switchReview(projectId, control);
                }, error => {
                    control.disabled = false;
                    status.textContent = `Project switch could not load its Saved Draft. ${error instanceof Error ? error.message : String(error)}`;
                });
            },
        });
    }
    search.addEventListener("input", render);
    sort?.addEventListener("change", render);
    create.addEventListener("click", () => creation(create));
    importControl.addEventListener("click", () => file.click());
    file.addEventListener("change", async () => {
        const selected = file.files?.[0];
        const controller = selected ? beginTransfer() : undefined;
        if (selected && controller)
            try {
                importReview(await transport.inspectImport(selected, {
                    signal: controller.signal, onProgress: progress => {
                        status.textContent = progress.message;
                    }
                }), importControl);
            }
            catch (error) {
                openImportErrorDialog(error, () => importControl.focus());
            }
            finally {
                if (controller)
                    endTransfer(controller);
            }
        file.value = "";
    });
    options.subscribe((next) => {
        library = {
            ...structuredClone(next), projects: Object.fromEntries(Object.entries(next.projects).map(([projectId, entry]) => [projectId, {
                    ...structuredClone(entry), state: {
                        ...structuredClone(entry.state), history: {
                            undo: [], redo: []
                        }
                    }
                }]))
        };
        render();
        options.onChange?.();
    });
    render();
    const captureActiveProject = (state: ProjectState, revision: number) => {
        if (library.activeProjectId !== state.project.id)
            return;
        library = saveProjectState(library, state.project.id, {
            ...structuredClone(state), history: {
                undo: [], redo: []
            }
        }, revision, now);
        options.storage.setItem(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(library));
        render();
    };
    const activate = (projectId: string) => {
        if (blocked())
            throw new Error("A failed durable Draft blocks project switching.");
        persist(activateProject(library, projectId, now), true);
    };
    return {
        render, library: () => cloneLibrary(library), activate, syncActiveProject: projectProjection, captureActiveProject
    };
}
const cloneLibrary = (library: ProjectLibrary): ProjectLibrary => structuredClone(library);
