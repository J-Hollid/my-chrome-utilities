import { createHotkeyEditor } from "../../hotkey-editor.js";
import { advanceHotkeySequence, blankHotkeyKeymap, duplicateSequences, HOTKEY_KEYMAP_STORAGE_KEY, keyTokenFromKeyboardEvent, updateHotkeyKeymap, validateHotkeyKeymap, } from "../../hotkey-keymap.js";
const keymapFilename = "my-chrome-utilities-hotkey-keymap.json";
function focusMessage(message) {
    return typeof message === "object" && message !== null &&
        "type" in message && message.type === "focus-app-hotkeys";
}
export function createInstalledHotkeyController(dependencies) {
    const { commands, storage, elements, documentEvents, pageLifecycle, runtimeMessages } = dependencies;
    let keymap = blankHotkeyKeymap(commands);
    let pending = [];
    let mounted = false;
    const setStatus = (message) => { if (elements.status)
        elements.status.textContent = message; };
    const setWarning = (message) => { if (elements.warning)
        elements.warning.textContent = message; };
    const persist = (next) => {
        storage.setItem(HOTKEY_KEYMAP_STORAGE_KEY, JSON.stringify(next));
    };
    const editor = (dependencies.createEditor ?? createHotkeyEditor)({
        commands,
        container: elements.editorContainer,
        filter: elements.editorFilter,
        getKeymap: () => keymap,
        setKeymap: (next) => { keymap = next; persist(next); },
        setStatus,
        setWarning,
    });
    const focus = () => {
        if (!elements.root)
            return;
        elements.root.focus();
        elements.root.dataset.hotkeyFocus = "active";
    };
    const focusActive = () => elements.root?.dataset.hotkeyFocus === "active";
    const storedKeymap = () => {
        const stored = storage.getItem(HOTKEY_KEYMAP_STORAGE_KEY);
        if (!stored)
            return undefined;
        try {
            const validation = validateHotkeyKeymap(JSON.parse(stored), commands);
            return validation.valid ? validation.keymap : undefined;
        }
        catch {
            return undefined;
        }
    };
    const download = (next) => {
        const release = dependencies.download({
            filename: keymapFilename,
            contents: `${JSON.stringify(next, null, 2)}\n`,
            type: "application/json",
        });
        try {
            // The adapter performs the download before returning its object-URL cleanup.
        }
        finally {
            release();
        }
    };
    const load = (value) => {
        const validation = validateHotkeyKeymap(value, commands);
        const duplicates = validation.keymap
            ? duplicateSequences(validation.keymap)
            : validation.duplicateSequences;
        if (!validation.valid || !validation.keymap) {
            const duplicate = duplicates[0]?.sequence;
            setWarning(duplicate ? `Duplicate key sequence: ${duplicate}`
                : (validation.error ?? "Invalid hotkey keymap."));
            return false;
        }
        keymap = validation.keymap;
        persist(keymap);
        pending = [];
        editor.render();
        setWarning("");
        setStatus("Keymap loaded");
        focus();
        return true;
    };
    const createFile = () => {
        keymap = blankHotkeyKeymap(commands);
        download(keymap);
        editor.render();
        setWarning("");
        setStatus("Blank keymap created");
    };
    const updateFile = () => {
        const summary = updateHotkeyKeymap(keymap, commands);
        keymap = summary.keymap;
        download(keymap);
        editor.render();
        setWarning("");
        setStatus(`Keymap updated: added ${summary.added.length}, removed ${summary.removed.length}`);
    };
    const loadFile = async () => {
        try {
            const file = elements.fileInput?.files?.[0];
            if (!file)
                return;
            try {
                load(JSON.parse(await file.text()));
            }
            catch {
                setWarning("Keymap file must contain valid JSON.");
            }
        }
        finally {
            if (elements.fileInput)
                elements.fileInput.value = "";
        }
    };
    const keydown = (event) => {
        if (dependencies.shellClaimsKey(event) || !focusActive() ||
            dependencies.ignoresTarget(event.target))
            return;
        if (event.key === "Escape" && pending.length > 0) {
            event.preventDefault();
            pending = [];
            return;
        }
        const hadPending = pending.length > 0;
        const advance = advanceHotkeySequence(keymap, pending, keyTokenFromKeyboardEvent(event));
        if (advance.status === "pending") {
            event.preventDefault();
            pending = advance.pending;
            return;
        }
        pending = [];
        if (advance.status === "matched" && advance.commandId) {
            event.preventDefault();
            dependencies.executeCommand(advance.commandId);
            return;
        }
        if (hadPending)
            event.preventDefault();
    };
    const runtimeMessage = (message) => { if (focusMessage(message))
        focus(); };
    const clickLoad = () => { elements.fileInput?.click(); };
    const changeFile = () => loadFile();
    const pageHide = () => { dispose(); };
    const mount = () => {
        if (mounted)
            return;
        keymap = storedKeymap() ?? blankHotkeyKeymap(commands);
        pending = [];
        mounted = true;
        editor.bind();
        elements.createButton?.addEventListener("click", createFile);
        elements.updateButton?.addEventListener("click", updateFile);
        elements.loadButton?.addEventListener("click", clickLoad);
        elements.fileInput?.addEventListener("change", changeFile);
        documentEvents.addEventListener("keydown", keydown, true);
        pageLifecycle.addEventListener("pagehide", pageHide);
        runtimeMessages?.addListener(runtimeMessage);
        editor.render();
    };
    const dispose = () => {
        if (!mounted)
            return;
        mounted = false;
        pending = [];
        editor.unbind();
        elements.createButton?.removeEventListener("click", createFile);
        elements.updateButton?.removeEventListener("click", updateFile);
        elements.loadButton?.removeEventListener("click", clickLoad);
        elements.fileInput?.removeEventListener("change", changeFile);
        documentEvents.removeEventListener("keydown", keydown, true);
        pageLifecycle.removeEventListener("pagehide", pageHide);
        runtimeMessages?.removeListener(runtimeMessage);
    };
    return { mount, render: () => editor.render(), focus, dispose };
}
//# sourceMappingURL=installed-controller.js.map