interface LivePropertyDeclarationDialogLifecycleInput {
  host:HTMLElement;
  dialog:HTMLDialogElement;
  cancel():void;
}

export function ownLivePropertyDeclarationDialog({
  host,dialog,cancel,
}:LivePropertyDeclarationDialogLifecycleInput):() => void {
  const wasHidden=host.hidden;
  let disposed=false;
  const cancelDialog=(event:Event):void => { event.preventDefault(); cancel(); };
  host.hidden=false;
  dialog.addEventListener("cancel",cancelDialog);
  return () => {
    if (disposed) return;
    disposed=true;
    dialog.removeEventListener("cancel",cancelDialog);
    if (dialog.open) dialog.close();
    host.replaceChildren();
    host.hidden=wasHidden;
  };
}
