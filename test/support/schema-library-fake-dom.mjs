export function createSchemaLibraryFakeDocument() {
  let document;
  const element = () => {
    const listeners = new Map();
    return {
      ownerDocument: document,
      children: [],
      textContent: "",
      value: "",
      dataset: {},
      style: { setProperty() {} },
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
        this.children.push(...children);
      },
      replaceChildren(...children) {
        this.children = children;
      },
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
  document = { createElement: () => element() };
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
