export function createSchemaLibraryFakeDocument() {
  let document;
  const element = () => {
    const listeners = new Map();
    return {
      ownerDocument: document,
      children: [],
      isConnected: false,
      textContent: "",
      value: "",
      dataset: {},
      style: { setProperty() {} },
      classList: { add() {}, remove() {}, toggle() {} },
      checked: false,
      open: false,
      disabled: false,
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
      removeEventListener(type, listener) {
        if (listeners.get(type) === listener) listeners.delete(type);
      },
      click() {
        this.clicked = true;
        listeners.get("click")?.({ currentTarget: this, preventDefault() {} });
      },
      dispatch(type) {
        listeners.get(type)?.({ currentTarget: this, target: this, preventDefault() {} });
      },
      append(...children) {
        for (const child of children) if (child && typeof child === "object") { child.isConnected = true; child.parentElement = this; }
        this.children.push(...children);
      },
      replaceChildren(...children) {
        for (const child of children) if (child && typeof child === "object") child.isConnected = true;
        this.children = children;
      },
      querySelector(selector) {
        const matches = selector.startsWith("#")
          ? (child) => child.id === selector.slice(1)
          : (child) => selector === "button" && child.tagName === "button";
        return this.find(matches);
      },
      querySelectorAll(selector) {
        const found = [];
        const visit = (parent) => { for (const child of parent.children ?? []) {
          if (typeof child !== "object") continue;
          if (selector === "button" && child.tagName === "button") found.push(child);
          visit(child);
        } };
        visit(this);
        return found;
      },
      find(predicate) {
        for (const child of this.children) {
          if (typeof child !== "object") continue;
          if (predicate(child)) return child;
          const nested = child.find?.(predicate);
          if (nested) return nested;
        }
      },
      remove() { this.isConnected = false; if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this); },
      setAttribute(name, value) {
        this[name] = value;
      },
      getAttribute(name) {
        return this[name];
      },
      showModal() {
        this.open = true;
      },
      close() {
        this.open = false;
      },
      focus(options) {
        this.focused = true;
        this.focusOptions = options;
      },
      listenerCount() {
        return listeners.size;
      },
    };
  };
  document = { createElement: (tagName) => Object.assign(element(), { tagName }) };
  return { document, element };
}

export function createSchemaLibraryBehaviorPorts(element) {
  const elements = {
    importFile: element(),
    importReview: element(),
    importSummary: element(),
    deleteReview: element(),
    deleteSummary: element(),
    exportButton: element(),
    exportChoices: element(),
    exportReview: element(),
    result: element(),
  };
  let rules = [];
  const calls = {
    persistRules: 0,
    renderAll: 0,
    renderRules: 0,
    downloads: [],
  };
  return {
    elements,
    calls,
    ports: {
      elements,
      rules: () => structuredClone(rules),
      replaceRules: (next) => {
        rules = structuredClone(next);
      },
      persistRules: () => {
        calls.persistRules += 1;
      },
      renderAll: () => {
        calls.renderAll += 1;
      },
      renderRules: () => {
        calls.renderRules += 1;
      },
      download: (value, filename) => calls.downloads.push({ value, filename }),
    },
    rules: () => structuredClone(rules),
  };
}
