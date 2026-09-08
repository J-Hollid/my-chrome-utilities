import { validateObservationSources } from "./settings.js";
export function createObservationSourceEditor(ports) {
    let configuration;
    let draft, removeId;
    let saving = false, error = "", generation = 0;
    async function refresh() {
        const operation = ++generation;
        if (configuration && ports.projectId && ports.projectId() !== configuration.projectId) {
            configuration = undefined;
            draft = undefined;
            removeId = undefined;
            error = "";
            ports.changed();
        }
        const next = await ports.load();
        if (operation !== generation)
            return;
        if (next?.projectId !== configuration?.projectId) {
            configuration = next;
            draft = undefined;
            removeId = undefined;
            error = "";
        }
        else if (!saving && !error)
            configuration = next;
        ports.changed();
    }
    async function commit(sources) {
        if (!configuration || saving)
            return false;
        const projectId = configuration.projectId;
        saving = true;
        error = "";
        ports.changed();
        try {
            const expected = validateObservationSources(sources);
            await ports.save(projectId, expected);
            const stored = await ports.load();
            if (configuration?.projectId !== projectId)
                return false;
            if (stored?.projectId !== projectId || JSON.stringify(stored.sources) !== JSON.stringify(expected)) {
                throw new Error("Saved observation sources could not be verified. Retry.");
            }
            configuration = stored;
            draft = undefined;
            removeId = undefined;
            return true;
        }
        catch (failure) {
            if (configuration?.projectId === projectId)
                error = failure instanceof Error ? failure.message : String(failure);
            return false;
        }
        finally {
            saving = false;
            ports.changed();
        }
    }
    async function save() {
        if (!configuration || !draft)
            return false;
        const sources = [...configuration.sources], index = sources.findIndex(source => source.id === draft.id);
        if (index === -1)
            sources.push({ ...draft });
        else
            sources[index] = { ...draft };
        return commit(sources);
    }
    return {
        refresh, save,
        configuration: () => configuration ? structuredClone(configuration) : undefined,
        state: () => ({ configuration: configuration ? structuredClone(configuration) : undefined,
            ...(draft ? { draft: { ...draft } } : {}), removeId, saving, error }),
        edit(id) {
            if (!configuration || saving)
                return;
            draft = id ? structuredClone(configuration.sources.find(source => source.id === id)) :
                { id: ports.id(), name: "", path: "", enabled: true };
            error = "";
            removeId = undefined;
            ports.changed();
        },
        update(values) {
            if (draft && !saving)
                draft = { ...draft, ...values };
        },
        cancel() { if (!saving) {
            draft = undefined;
            removeId = undefined;
            error = "";
            ports.changed();
        } },
        requestRemove(id) {
            if (configuration?.sources.some(source => source.id === id) && !saving) {
                removeId = id;
                draft = undefined;
                error = "";
                ports.changed();
            }
        },
        confirmRemove: async () => {
            if (!configuration || !removeId)
                return false;
            return commit(configuration.sources.filter(source => source.id !== removeId));
        },
        setEnabled: async (id, enabled) => {
            if (!configuration)
                return false;
            const source = configuration.sources.find(source => source.id === id);
            if (!source)
                return false;
            draft = { ...source, enabled };
            return save();
        },
    };
}
//# sourceMappingURL=editor-state.js.map