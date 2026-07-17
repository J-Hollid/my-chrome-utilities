import type { UtilityMountHost } from "../../../../../platform/utility-contract.js";

export type ScopedClickBinder = (selector: string, listener: () => void) => void;

export function showScopedEditor(
  root: UtilityMountHost,
  editorSelector: string,
  focusSelector: string,
): void {
  const editor = root.querySelector<HTMLElement>(editorSelector);
  if (editor) editor.hidden = false;
  root.querySelector<HTMLInputElement>(focusSelector)?.focus();
}
