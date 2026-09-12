export function ownLivePropertyDeclarationDialog({ host, dialog, cancel, }) {
    const wasHidden = host.hidden;
    let disposed = false;
    const cancelDialog = (event) => { event.preventDefault(); cancel(); };
    host.hidden = false;
    dialog.addEventListener("cancel", cancelDialog);
    return () => {
        if (disposed)
            return;
        disposed = true;
        dialog.removeEventListener("cancel", cancelDialog);
        if (dialog.open)
            dialog.close();
        host.replaceChildren();
        host.hidden = wasHidden;
    };
}
//# sourceMappingURL=live-property-declaration-dialog-lifecycle.js.map