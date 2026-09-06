import { dialogButton, errorMessage } from "./controls.js";
import { showProjectDialog } from "./focus.js";

type PendingChoice = "merge" | "reject" | "retry";
interface SwitchProjectDialog {
  name: string;
  summary: string;
  pendingLabel?: string;
  blocked(): boolean;
  confirm(): void;
  resolve(choice: PendingChoice): string;
  restoreFocus(): void;
  focusSelection(): void;
}

export function openSwitchProjectDialog(options: SwitchProjectDialog): void {
  const dialog = document.createElement("dialog");
  const heading = document.createElement("h4");
  const summary = document.createElement("p");
  let confirmed = false;
  const confirm = dialogButton(`Switch to ${options.name}`, `Confirm switch to ${options.name}`, () => {
    if (confirmed || confirm.disabled) return;
    try {
      options.confirm();
      confirmed = true;
      dialog.close();
    } catch (error) { summary.textContent = errorMessage(error); }
  });
  const cancel = dialogButton("Cancel switch", `Cancel switch to ${options.name}`, () => dialog.close());
  heading.textContent = `Review switch to ${options.name}`;
  heading.tabIndex = -1;
  summary.textContent = options.summary;
  confirm.disabled = options.blocked() || Boolean(options.pendingLabel);
  dialog.append(heading, summary);
  if (options.pendingLabel) {
    for (const choice of ["merge", "reject", "retry"] as const) {
      dialog.append(dialogButton(`${choice[0]!.toUpperCase()}${choice.slice(1)} ${options.pendingLabel}`,
        `${choice} pending command ${options.pendingLabel}`, () => {
          try {
            summary.textContent = options.resolve(choice);
            confirm.disabled = options.blocked();
            confirm.focus();
          } catch (error) { summary.textContent = errorMessage(error); }
        }));
    }
  }
  dialog.append(confirm, cancel);
  showProjectDialog(dialog, heading, () => {
    if (confirmed) options.focusSelection();
    else options.restoreFocus();
  });
}
