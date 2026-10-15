export interface StudioNavigationItem {
  kind: string;
  label: string;
  current: boolean;
  open(): void;
}

const mounted = new WeakSet<HTMLElement>();

export function renderStudioNavigation(tree: HTMLElement, items: readonly StudioNavigationItem[]): void {
  const disclosure = tree.closest<HTMLDetailsElement>("#studio-navigation");
  if (disclosure && !mounted.has(disclosure)) {
    mounted.add(disclosure);
    const narrow = matchMedia("(max-width:800px)");
    disclosure.open = !narrow.matches;
    narrow.addEventListener("change", () => { disclosure.open = !narrow.matches; });
  }
  tree.replaceChildren();
  const groups = [
    ["Project", ["overview"]],
    ["Define", ["profiles", "pages", "propertySets", "events", "applicabilitySets"]],
    ["Connect & check", ["flows", "fixtures", "assignments"]],
    ["Deliver", ["documentation", "releases"]],
  ] as const;
  for (const [name, kinds] of groups) {
    const group = document.createElement("li"), heading = document.createElement("h3"), list = document.createElement("ul");
    heading.textContent = name;
    for (const kind of kinds) {
      const entry = items.find((item) => item.kind === kind);
      if (!entry) continue;
      const item = document.createElement("li"), button = document.createElement("button");
      button.type = "button"; button.textContent = entry.label; button.dataset.kind = entry.kind;
      button.setAttribute("aria-current", String(entry.current));
      button.addEventListener("click", entry.open);
      item.append(button); list.append(item);
    }
    group.append(heading, list); tree.append(group);
  }
}
