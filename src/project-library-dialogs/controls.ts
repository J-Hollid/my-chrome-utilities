export function dialogButton(text: string, label: string, run: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", run);
  return button;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
