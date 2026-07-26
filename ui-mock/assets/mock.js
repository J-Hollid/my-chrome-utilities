(() => {
  "use strict";

  const root = document;

  function ensureToast() {
    let toast = root.querySelector("#mock-toast");
    if (toast) return toast;
    toast = root.createElement("div");
    toast.id = "mock-toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.hidden = true;
    root.body.append(toast);
    return toast;
  }

  let toastTimer;
  function announce(message) {
    if (!message) return;
    const toast = ensureToast();
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  }

  function escapeAttribute(value) {
    if (globalThis.CSS?.escape) return globalThis.CSS.escape(value);
    return String(value).replaceAll('"', '\\"');
  }

  function scopeFor(trigger, scopeAttribute) {
    return trigger.closest(`[${scopeAttribute}]`) || root;
  }

  function interactionGroup(trigger, triggerAttribute) {
    const explicit = trigger.getAttribute("data-tab-group");
    if (explicit) return explicit;
    if (triggerAttribute !== "data-view-target") return "";
    const target = trigger.getAttribute(triggerAttribute) || "";
    if (/^inspector-/.test(target)) return "inspector-views";
    if (/^(schema-|property-)/.test(target)) return "schema-views";
    if (/^page-/.test(target)) return "page-views";
    if (/^fixture-/.test(target)) return "fixture-views";
    return "";
  }

  function activateTarget(trigger, {
    triggerAttribute,
    panelAttribute,
    scopeAttribute,
    hideClass = "",
    current = false,
  }) {
    const target = trigger.getAttribute(triggerAttribute);
    if (!target) return;
    const scope = scopeFor(trigger, scopeAttribute);
    const group = interactionGroup(trigger, triggerAttribute);
    const allTriggers = [...scope.querySelectorAll(`[${triggerAttribute}]`)];
    const triggers = group
      ? allTriggers.filter((candidate) => interactionGroup(candidate, triggerAttribute) === group)
      : allTriggers;
    const controlledTargets = new Set(
      triggers.map((candidate) => candidate.getAttribute(triggerAttribute)).filter(Boolean)
    );
    const currentTrigger = current && !trigger.closest(".studio-tree")
      ? scope.querySelector(`.studio-tree [${triggerAttribute}="${escapeAttribute(target)}"]`) || trigger
      : trigger;
    let panels = [...scope.querySelectorAll(`[${panelAttribute}]`)].filter((panel) => {
      const panelTarget = panel.getAttribute(panelAttribute) || panel.id;
      return !controlledTargets.size || controlledTargets.has(panelTarget);
    });
    if (!panels.length && scope !== root) {
      panels = [...root.querySelectorAll(`[${panelAttribute}]`)].filter((panel) => {
        const panelTarget = panel.getAttribute(panelAttribute) || panel.id;
        return !controlledTargets.size || controlledTargets.has(panelTarget);
      });
    }

    for (const candidate of triggers) {
      const selected = current
        ? candidate === currentTrigger
        : candidate.getAttribute(triggerAttribute) === target;
      if (candidate.getAttribute("role") === "tab") {
        candidate.setAttribute("aria-selected", String(selected));
        candidate.tabIndex = selected ? 0 : -1;
      } else {
        candidate.removeAttribute("aria-selected");
      }
      candidate.toggleAttribute("data-active", selected);
      if (current) {
        if (selected) candidate.setAttribute("aria-current", "page");
        else candidate.removeAttribute("aria-current");
      }
    }

    for (const panel of panels) {
      const selected = panel.getAttribute(panelAttribute) === target || panel.id === target;
      panel.hidden = !selected;
      if (hideClass) panel.classList.toggle(hideClass, !selected);
    }

    const activePanel = panels.find((panel) =>
      panel.getAttribute(panelAttribute) === target || panel.id === target
    );
    activePanel?.querySelector("[data-auto-focus]")?.focus({ preventScroll: true });
  }

  function finishInteraction(trigger) {
    if (trigger.hasAttribute("data-dialog-close")) closeDialog(trigger);
    if (trigger.hasAttribute("data-toast")) announce(trigger.getAttribute("data-toast"));
  }

  function showDialog(id) {
    const dialog = root.getElementById(id);
    if (!dialog) {
      announce("That review lives in the state gallery. Very organised of it.");
      return;
    }
    dialog.hidden = false;
    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    else dialog.setAttribute("open", "");
    dialog.querySelector("[data-auto-focus], button, input, select, textarea")?.focus({
      preventScroll: true,
    });
  }

  function closeDialog(trigger) {
    const dialog = trigger.closest("dialog");
    if (!dialog) return;
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    if (dialog.hasAttribute("data-hide-on-close")) dialog.hidden = true;
  }

  function toggleTarget(trigger, id) {
    const target = root.getElementById(id) ||
      root.querySelector(`[data-toggle-panel="${escapeAttribute(id)}"]`);
    if (!target) return;
    const willShow = target.hidden;
    target.hidden = !willShow;
    trigger.setAttribute("aria-expanded", String(willShow));
    if (willShow) target.querySelector("[data-auto-focus]")?.focus({ preventScroll: true });
  }

  function filterDemo(input) {
    const scope = input.closest("[data-filter-scope]") || root;
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const item of scope.querySelectorAll("[data-filter-item]")) {
      const match = !query || item.textContent.toLocaleLowerCase().includes(query);
      item.hidden = !match;
      if (match) visible += 1;
    }
    const output = scope.querySelector("[data-filter-count]");
    if (output) output.textContent = `${visible} matching ${visible === 1 ? "item" : "items"}`;
  }

  const compactInspectorQuery = globalThis.matchMedia?.("(max-width: 1599px)");

  function setInspectorOpen(open, { announceChange = false } = {}) {
    const workspace = root.querySelector(".workspace-shell");
    const inspector = root.getElementById("studio-inspector");
    if (!workspace || !inspector) return;

    workspace.classList.toggle("inspector-is-hidden", !open);
    inspector.setAttribute("aria-hidden", String(!open));

    for (const button of root.querySelectorAll("[data-inspector-toggle]")) {
      button.setAttribute("aria-expanded", String(open));
      if (button.classList.contains("button-quiet")) {
        button.textContent = open ? "Hide inspector" : "Show inspector";
      }
    }

    if (announceChange) {
      announce(open ? "Inspector opened." : "Inspector tucked away. Nothing personal.");
    }
  }

  function syncResponsiveInspector() {
    const workspace = root.querySelector(".workspace-shell");
    if (!workspace || workspace.hasAttribute("data-inspector-user-choice")) return;
    setInspectorOpen(!compactInspectorQuery?.matches);
  }

  root.addEventListener("click", (event) => {
    const trigger = event.target.closest(
      "[data-tab-target], [data-route-target], [data-view-target], [data-panel-target], " +
      "[data-dialog-open], [data-dialog-close], [data-toggle-target], [data-toast], " +
      "[data-cycle-state], [data-action-menu], [data-dismiss-target], [data-inspector-toggle]"
    );
    if (!trigger) return;

    if (trigger.hasAttribute("data-inspector-toggle")) {
      event.preventDefault();
      const workspace = root.querySelector(".workspace-shell");
      if (!workspace) return;
      const willOpen = workspace.classList.contains("inspector-is-hidden");
      workspace.setAttribute("data-inspector-user-choice", "");
      setInspectorOpen(willOpen, { announceChange: true });
      if (willOpen && globalThis.matchMedia?.("(max-width: 1100px)").matches) {
        const inspector = root.getElementById("studio-inspector");
        globalThis.requestAnimationFrame(() => {
          inspector?.scrollIntoView({ block: "start", behavior: "auto" });
          inspector?.querySelector("[aria-label='Close inspector']")?.focus({
            preventScroll: true,
          });
        });
      } else if (!willOpen) {
        root.querySelector(".studio-tools [data-inspector-toggle]")?.focus({
          preventScroll: true,
        });
      }
      return;
    }

    if (trigger.hasAttribute("data-tab-target")) {
      event.preventDefault();
      activateTarget(trigger, {
        triggerAttribute: "data-tab-target",
        panelAttribute: "data-tab-panel",
        scopeAttribute: "data-tab-scope",
      });
      finishInteraction(trigger);
      return;
    }

    if (trigger.hasAttribute("data-route-target")) {
      event.preventDefault();
      activateTarget(trigger, {
        triggerAttribute: "data-route-target",
        panelAttribute: "data-route",
        scopeAttribute: "data-route-scope",
        current: true,
      });
      const route = trigger.getAttribute("data-route-target");
      if (route) history.replaceState(null, "", `#${route}`);
      root.querySelector(".studio-main")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      finishInteraction(trigger);
      return;
    }

    if (trigger.hasAttribute("data-view-target")) {
      event.preventDefault();
      activateTarget(trigger, {
        triggerAttribute: "data-view-target",
        panelAttribute: "data-view",
        scopeAttribute: "data-view-scope",
      });
      finishInteraction(trigger);
      return;
    }

    if (trigger.hasAttribute("data-panel-target")) {
      event.preventDefault();
      activateTarget(trigger, {
        triggerAttribute: "data-panel-target",
        panelAttribute: "data-panel",
        scopeAttribute: "data-panel-scope",
      });
      finishInteraction(trigger);
      return;
    }

    if (trigger.hasAttribute("data-dialog-open")) {
      event.preventDefault();
      if (trigger.hasAttribute("data-dialog-close")) closeDialog(trigger);
      showDialog(trigger.getAttribute("data-dialog-open"));
      if (trigger.hasAttribute("data-toast")) announce(trigger.getAttribute("data-toast"));
      return;
    }

    if (trigger.hasAttribute("data-dialog-close")) {
      event.preventDefault();
      finishInteraction(trigger);
      return;
    }

    const toggleId = trigger.getAttribute("data-toggle-target") ||
      trigger.getAttribute("data-action-menu");
    if (toggleId) {
      event.preventDefault();
      toggleTarget(trigger, toggleId);
      if (trigger.hasAttribute("data-toast")) announce(trigger.getAttribute("data-toast"));
      return;
    }

    if (trigger.hasAttribute("data-dismiss-target")) {
      event.preventDefault();
      const target = root.getElementById(trigger.getAttribute("data-dismiss-target"));
      if (target) target.hidden = true;
      if (trigger.hasAttribute("data-toast")) announce(trigger.getAttribute("data-toast"));
      return;
    }

    if (trigger.hasAttribute("data-cycle-state")) {
      event.preventDefault();
      const states = trigger.getAttribute("data-cycle-state").split("|").filter(Boolean);
      if (!states.length) return;
      const next = (Number(trigger.dataset.stateIndex || -1) + 1) % states.length;
      trigger.dataset.stateIndex = String(next);
      const outputId = trigger.getAttribute("aria-controls");
      const output = outputId ? root.getElementById(outputId) : null;
      if (output) output.textContent = states[next];
      announce(`Mock state: ${states[next]}`);
      return;
    }

    if (trigger.hasAttribute("data-toast")) {
      event.preventDefault();
      announce(trigger.getAttribute("data-toast"));
    }
  });

  root.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target;
    announce(
      form.getAttribute("data-submit-message") ||
      "Mock reviewed. Nothing was saved, exported, imported, attached, published or accidentally launched."
    );
    const dialog = form.closest("dialog");
    if (dialog?.hasAttribute("data-close-on-submit")) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  });

  root.addEventListener("input", (event) => {
    const input = event.target.closest("[data-filter-input]");
    if (input) filterDemo(input);
  });

  root.addEventListener("keydown", (event) => {
    if (!event.target.matches('[role="tab"]')) return;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const list = event.target.closest('[role="tablist"]');
    const tabs = [...list.querySelectorAll('[role="tab"]:not([disabled])')];
    const current = tabs.indexOf(event.target);
    let next = current;
    if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    event.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  });

  for (const dialog of root.querySelectorAll("dialog")) {
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right &&
        event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      if (!inside && typeof dialog.close === "function") dialog.close();
    });
  }

  function activateHashTarget() {
    const hash = location.hash.slice(1);
    if (!hash) return;
    const hashElement = root.getElementById(hash);
    if (hashElement?.tagName === "DIALOG") {
      showDialog(hash);
      return;
    }
    const exactTrigger = root.querySelector(
      `[data-route-target="${escapeAttribute(hash)}"], ` +
      `[data-tab-target="${escapeAttribute(hash)}"], ` +
      `[data-view-target="${escapeAttribute(hash)}"], ` +
      `[data-panel-target="${escapeAttribute(hash)}"]`
    );
    const containingTriggers = [];
    const panelPairs = [
      ["data-route", "data-route-target"],
      ["data-tab-panel", "data-tab-target"],
      ["data-view", "data-view-target"],
      ["data-panel", "data-panel-target"],
    ];
    for (let element = hashElement; element; element = element.parentElement) {
      for (const [panelAttribute, triggerAttribute] of panelPairs) {
        const target = element.getAttribute?.(panelAttribute);
        if (!target) continue;
        const trigger = root.querySelector(
          `[${triggerAttribute}="${escapeAttribute(target)}"]`
        );
        if (trigger) containingTriggers.push(trigger);
      }
    }

    const activated = new Set();
    for (const trigger of containingTriggers.reverse()) {
      if (activated.has(trigger)) continue;
      activated.add(trigger);
      trigger.click();
    }
    if (exactTrigger && !activated.has(exactTrigger)) exactTrigger.click();
    if (!activated.size && !exactTrigger) return;

    hashElement?.scrollIntoView({ block: "start", inline: "nearest" });
    for (const dialog of root.querySelectorAll("dialog[open]")) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }

  globalThis.addEventListener("hashchange", activateHashTarget);
  compactInspectorQuery?.addEventListener("change", syncResponsiveInspector);
  syncResponsiveInspector();
  activateHashTarget();

  root.documentElement.dataset.mockReady = "true";
})();
