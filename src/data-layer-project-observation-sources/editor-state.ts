import type {ProjectObservationSource} from "./model.js";
import {validateObservationSources} from "./settings.js";

export interface ObservationSourceConfiguration {
  projectId: string;
  sources: readonly ProjectObservationSource[];
}
export function createObservationSourceEditor(ports: {
  projectId?(): string | undefined;
  load(): Promise<ObservationSourceConfiguration | undefined>;
  save(projectId: string, sources: readonly ProjectObservationSource[]): Promise<void>;
  changed(): void;
  id(): string;
}) {
  let configuration: ObservationSourceConfiguration | undefined;
  let draft: ProjectObservationSource | undefined, removeId: string | undefined;
  let saving = false, error = "", generation = 0;
  async function refresh(): Promise<void> {
    const operation = ++generation;
    if (configuration && ports.projectId && ports.projectId() !== configuration.projectId) {
      configuration = undefined; draft = undefined; removeId = undefined; error = "";
      ports.changed();
    }
    const next = await ports.load();
    if (operation !== generation) return;
    if (next?.projectId !== configuration?.projectId) {
      configuration = next; draft = undefined; removeId = undefined; error = "";
    } else if (!saving && !error) configuration = next;
    ports.changed();
  }
  async function commit(sources: readonly ProjectObservationSource[]): Promise<boolean> {
    if (!configuration || saving) return false;
    const projectId = configuration.projectId;
    saving = true; error = ""; ports.changed();
    try {
      const expected = validateObservationSources(sources);
      await ports.save(projectId, expected);
      const stored = await ports.load();
      if (configuration?.projectId !== projectId) return false;
      if (stored?.projectId !== projectId || JSON.stringify(stored.sources) !== JSON.stringify(expected)) {
        throw new Error("Saved observation sources could not be verified. Retry.");
      }
      configuration = stored; draft = undefined; removeId = undefined;
      return true;
    } catch (failure) {
      if (configuration?.projectId === projectId) error = failure instanceof Error ? failure.message : String(failure);
      return false;
    } finally { saving = false; ports.changed(); }
  }
  async function save(): Promise<boolean> {
    if (!configuration || !draft) return false;
    const sources = [...configuration.sources], index = sources.findIndex(source => source.id === draft!.id);
    if (index === -1) sources.push({...draft}); else sources[index] = {...draft};
    return commit(sources);
  }
  return {
    refresh, save,
    configuration:() => configuration ? structuredClone(configuration) : undefined,
    state:() => ({configuration:configuration ? structuredClone(configuration) : undefined,
      ...(draft ? {draft:{...draft}} : {}), removeId, saving, error}),
    edit(id?: string): void {
      if (!configuration || saving) return;
      draft = id ? structuredClone(configuration.sources.find(source => source.id === id)) :
        {id:ports.id(), name:"", path:"", enabled:true};
      error = ""; removeId = undefined; ports.changed();
    },
    update(values: Partial<Pick<ProjectObservationSource, "name" | "path" | "enabled">>): void {
      if (draft && !saving) draft = {...draft, ...values};
    },
    cancel(): void { if (!saving) { draft = undefined; removeId = undefined; error = ""; ports.changed(); } },
    requestRemove(id: string): void {
      if (configuration?.sources.some(source => source.id === id) && !saving) {
        removeId = id; draft = undefined; error = ""; ports.changed();
      }
    },
    confirmRemove:async(): Promise<boolean> => {
      if (!configuration || !removeId) return false;
      return commit(configuration.sources.filter(source => source.id !== removeId));
    },
    setEnabled:async(id: string, enabled: boolean): Promise<boolean> => {
      if (!configuration) return false;
      const source = configuration.sources.find(source => source.id === id);
      if (!source) return false;
      draft = {...source, enabled};
      return save();
    },
  };
}
export type ObservationSourceEditor = ReturnType<typeof createObservationSourceEditor>;
