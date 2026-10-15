import { keyTokenFromKeyboardEvent } from "../hotkey-keymap.js";
/** Record the same token format used by the existing sequence resolver. */
export function hotkeyRecorder(input, status) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Record keys";
    let recording = false, original = "", tokens = [];
    const stop = () => { recording = false; button.textContent = "Record keys"; button.setAttribute("aria-pressed", "false"); };
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("mousedown", (event) => { if (recording)
        event.preventDefault(); });
    button.addEventListener("click", () => {
        if (recording) {
            stop();
            return;
        }
        original = input.value;
        tokens = [];
        recording = true;
        button.textContent = "Stop recording";
        button.setAttribute("aria-pressed", "true");
        input.focus();
        status("Press the keys in order. Tab stops recording. Escape cancels. Save applies the sequence.");
    });
    input.addEventListener("keydown", (event) => {
        if (!recording)
            return;
        if (event.key === "Tab") {
            stop();
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.key === "Escape") {
            input.value = original;
            stop();
            status("Recording cancelled.");
            return;
        }
        if (event.repeat || ["Control", "Alt", "Shift", "Meta"].includes(event.key))
            return;
        tokens.push(keyTokenFromKeyboardEvent(event));
        input.value = tokens.join(" ");
        status(`Recorded ${input.value}. Tab stops recording; Save applies the sequence.`);
    }, { capture: true });
    input.addEventListener("blur", stop);
    return button;
}
export function reservedHotkey(sequence) {
    return sequence.trim().split(/\s+/u).some((token) => /^(?:C|Meta)-(?:t|w|n|l|r|k)$/u.test(token) || ["M-F4", "F5", "F11", "F12"].includes(token));
}
//# sourceMappingURL=hotkey-recorder.js.map