/** Complete each modal lifecycle once, including native close and Escape. */
export function showProjectDialog(dialog, initialFocus, restoreFocus, dispose = () => { }) {
    let closed = false;
    dialog.addEventListener("close", () => {
        if (closed)
            return;
        closed = true;
        try {
            dispose();
        }
        finally {
            dialog.remove();
            restoreFocus();
        }
    }, { once: true });
    document.body.append(dialog);
    dialog.showModal();
    initialFocus.focus();
}
export function focusProjectControl(scope, text, fallback) {
    const control = Array.from(scope?.querySelectorAll("button") ?? [])
        .find(button => button.textContent === text);
    (control ?? fallback).focus();
}
//# sourceMappingURL=focus.js.map