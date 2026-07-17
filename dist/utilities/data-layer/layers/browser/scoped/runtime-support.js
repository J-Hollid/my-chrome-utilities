export function showScopedEditor(root, editorSelector, focusSelector) {
    const editor = root.querySelector(editorSelector);
    if (editor)
        editor.hidden = false;
    root.querySelector(focusSelector)?.focus();
}
//# sourceMappingURL=runtime-support.js.map