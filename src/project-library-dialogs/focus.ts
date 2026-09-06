/** Complete each modal lifecycle once, including native close and Escape. */
export function showProjectDialog(
  dialog: HTMLDialogElement,
  initialFocus: HTMLElement,
  restoreFocus: () => void,
  dispose: () => void = () => {},
): void {
  let closed = false;
  dialog.addEventListener("close", () => {
    if (closed) return;
    closed = true;
    try { dispose(); }
    finally {
      dialog.remove();
      restoreFocus();
    }
  }, { once: true });
  document.body.append(dialog);
  dialog.showModal();
  initialFocus.focus();
}

export function focusProjectControl(scope: ParentNode | null, text: string, fallback: HTMLElement): void {
  const control = Array.from(scope?.querySelectorAll<HTMLButtonElement>("button") ?? [])
    .find(button => button.textContent === text);
  (control ?? fallback).focus();
}
