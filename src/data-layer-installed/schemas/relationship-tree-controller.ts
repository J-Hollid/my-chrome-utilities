import {
  filterSchemaRelationshipTree,
  restoreSchemaRelationshipTreeView,
  saveSchemaRelationshipTreeView,
} from "../../schema-relationship-tree.js";
import type {
  SchemaRelationshipCategory,
  SchemaRelationshipTreeNode,
} from "../../schema-relationship-tree.js";
import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";

interface RelationshipViewStorage {
  getItem?(key:string):string|null;
  setItem?(key:string,value:string):void;
  get?(key:string):string|undefined;
  set?(key:string,value:string):unknown;
}

export interface SchemaRelationshipTreePorts {
  query: HTMLInputElement | null;
  category: HTMLSelectElement | null;
  scrollOwner: HTMLElement | null;
  panel: HTMLElement | null;
  list: HTMLElement | null;
  emptyState: HTMLElement | null;
  count: HTMLElement | null;
  storage: RelationshipViewStorage;
  scheduleFrame(callback: () => void): void;
}

export function createSchemaRelationshipTreeController(ports: SchemaRelationshipTreePorts) {
  let projectId: string | undefined;
  let expandedKeys = new Set<string>();
  let restoringScroll = false;
  let pendingScroll: number | undefined;
  let rowDisposers: Array<() => void> = [];

  const allNodes = (nodes: readonly SchemaRelationshipTreeNode[]): SchemaRelationshipTreeNode[] =>
    nodes.flatMap((node) => [node, ...allNodes(node.children)]);
  const persist = (): void => {
    if (!projectId) return;
    saveSchemaRelationshipTreeView(ports.storage, projectId, {
      query:ports.query?.value ?? "",
      category:(ports.category?.value ?? "All") as SchemaRelationshipCategory,
      expandedKeys:[...expandedKeys],
      scrollTop:ports.scrollOwner?.scrollTop ?? 0,
    });
  };

  const controller = {
    project(nextProjectId:string, nodes:readonly SchemaRelationshipTreeNode[]):SchemaRelationshipTreeNode[] {
      const validNodes = allNodes(nodes);
      const validKeys = new Set(validNodes.map(({ key }) => key));
      if (projectId !== nextProjectId) {
        projectId = nextProjectId;
        const restored = restoreSchemaRelationshipTreeView(ports.storage, nextProjectId, validKeys);
        expandedKeys = new Set(restored.expandedKeys.length ? restored.expandedKeys
          : validNodes.filter(({ children }) => children.length).map(({ key }) => key));
        if (ports.query) ports.query.value = restored.query;
        if (ports.category) ports.category.value = restored.category;
        pendingScroll = restored.scrollTop;
        if (!ports.panel?.hidden) controller.restoreScroll();
      } else {
        expandedKeys = new Set([...expandedKeys].filter((key) => validKeys.has(key)));
      }
      return filterSchemaRelationshipTree(nodes, {
        query:ports.query?.value ?? "",
        category:(ports.category?.value ?? "All") as SchemaRelationshipCategory,
      });
    },
    invalidateProject():void { projectId = undefined; },
    isExpanded(key:string):boolean { return expandedKeys.has(key); },
    toggle(key:string):void {
      if (expandedKeys.has(key)) expandedKeys.delete(key); else expandedKeys.add(key);
      persist();
    },
    update():void { persist(); },
    persistScroll():void {
      if (projectId && !restoringScroll && pendingScroll === undefined && !ports.panel?.hidden) persist();
    },
    restoreScroll():void {
      if (pendingScroll === undefined || !ports.scrollOwner) return;
      const scrollTop = pendingScroll;
      restoringScroll = true;
      queueMicrotask(() => {
        if (ports.scrollOwner) ports.scrollOwner.scrollTop = scrollTop;
        pendingScroll = undefined;
        ports.scheduleFrame(() => { restoringScroll = false; });
      });
    },
    listen<EventType extends Event>(target:EventTarget, type:string, listener:(event:EventType)=>void):void {
      const eventListener = listener as EventListener;
      target.addEventListener(type, eventListener);
      rowDisposers.push(() => target.removeEventListener(type, eventListener));
    },
    render(options:{
      projectId:string;
      nodes:readonly SchemaRelationshipTreeNode[];
      schemas:readonly SchemaDefinition[];
      activeSchemaId?:string;
      invokingReference?:string;
      historyCount(schema:SchemaDefinition):number;
      editSaved(schema:SchemaDefinition, trigger:HTMLButtonElement, referenceKey:string):void;
      duplicateSaved(schema:SchemaDefinition):void;
      adoptSaved(schema:SchemaDefinition, trigger:HTMLButtonElement):void;
      buildSpecification(schema:SchemaDefinition, trigger:HTMLButtonElement):void;
      exportSaved(schema:SchemaDefinition, trigger:HTMLButtonElement):void;
      reportMissing(schema:SchemaDefinition):void;
      deleteSaved(schema:SchemaDefinition):void;
      openContributor(key:string, trigger:HTMLButtonElement, referenceKey:string):void;
      openContributorInStudio(key:string):void;
      openProject(create:boolean):void;
      rerender():void;
    }):void {
      controller.clearRows();
      const filtered = controller.project(options.projectId, options.nodes), rows:HTMLElement[] = [], document = ports.list?.ownerDocument;
      const savedRow = (node:SchemaRelationshipTreeNode, level:number):HTMLLIElement | undefined => {
        const schema = options.schemas.find(({ id }) => `saved:${id}` === node.targetKey); if (!schema || !document) return;
        const item = document.createElement("li"), revise = document.createElement("button"), duplicate = document.createElement("button"),
          adopt = document.createElement("button"), build = document.createElement("button"), exportCurrent = document.createElement("button"),
          reportMissing = document.createElement("button"), remove = document.createElement("button");
        const pending = schema.workingDraft?.pendingChanges.length ?? 0, history = options.historyCount(schema);
        item.dataset.schemaEntryKey = node.targetKey; item.dataset.schemaReferenceKey = node.key; item.dataset.schemaRole = node.role;
        item.setAttribute("role", "treeitem"); item.setAttribute("aria-level", String(level)); item.setAttribute("aria-selected", String(options.activeSchemaId === schema.id));
        item.textContent = schema.published === false
          ? `${schema.name} · role Saved schema · path ${node.relationshipPath} · revision ${schema.version} · Draft · ${pending} pending changes. `
          : `${schema.name} · current revision ${schema.version} · role Saved schema · path ${node.relationshipPath} · saved · ${pending} pending draft changes · ${history} historical revisions · ${schema.assignments.map((assignment) => `${assignment.sourceId}/${assignment.eventName}/${assignment.target}`).join(", ") || "unassigned"}. `;
        revise.type = duplicate.type = adopt.type = build.type = exportCurrent.type = reportMissing.type = remove.type = "button";
        revise.textContent = "Edit working draft"; duplicate.textContent = "Duplicate"; adopt.textContent = "Add saved schema to project";
        build.textContent = "Build documentation table"; exportCurrent.textContent = "Export"; reportMissing.textContent = "Report missing event"; remove.textContent = "Delete";
        controller.listen(revise, "click", () => options.editSaved(schema, revise, node.key));
        controller.listen(duplicate, "click", () => options.duplicateSaved(schema));
        controller.listen(adopt, "click", () => options.adoptSaved(schema, adopt));
        controller.listen(build, "click", () => options.buildSpecification(schema, build));
        controller.listen(exportCurrent, "click", () => options.exportSaved(schema, exportCurrent));
        controller.listen(reportMissing, "click", () => options.reportMissing(schema));
        controller.listen(remove, "click", () => options.deleteSaved(schema));
        item.append(revise, duplicate, adopt, build, exportCurrent, reportMissing, remove); return item;
      };
      const visit = (node:SchemaRelationshipTreeNode, level:number):void => {
        if (node.targetKey?.startsWith("saved:")) { const item = savedRow(node, level); if (item) rows.push(item); return; }
        if (!document) return;
        const item = document.createElement("li"); item.dataset.schemaReferenceKey = node.key; item.setAttribute("role", "treeitem");
        item.setAttribute("aria-level", String(level)); item.setAttribute("aria-selected", "false"); item.style.setProperty("--schema-tree-level", String(level));
        if (node.targetKey) {
          const open = document.createElement("button"), studio = document.createElement("button"); item.dataset.schemaEntryKey = node.targetKey; item.dataset.schemaRole = node.role;
          item.textContent = `${node.name} · role ${node.role} · path ${node.relationshipPath}. `; item.setAttribute("aria-selected", String(options.invokingReference === node.key));
          open.type = studio.type = "button"; open.textContent = "Open schema"; studio.textContent = "Open schema in Specification Studio";
          open.setAttribute("aria-label", `Open ${node.name}; ${node.relationshipPath}`); studio.setAttribute("aria-label", `Open ${node.name} in Specification Studio; ${node.relationshipPath}`);
          controller.listen(open, "click", () => options.openContributor(node.targetKey!, open, node.key));
          controller.listen(studio, "click", () => options.openContributorInStudio(node.targetKey!)); item.append(open, studio);
        } else {
          const toggle = document.createElement("button"), expanded = node.expanded || controller.isExpanded(node.key);
          item.dataset.schemaGroup = node.name; item.setAttribute("aria-expanded", String(expanded)); toggle.type = "button"; toggle.textContent = node.name;
          controller.listen(toggle, "click", () => { controller.toggle(node.key); options.rerender(); }); item.append(toggle);
        }
        rows.push(item); const expanded = node.expanded || controller.isExpanded(node.key);
        if (node.children.length && (node.targetKey || expanded)) for (const child of node.children) visit(child, level + 1);
      };
      for (const root of filtered) visit(root, 1);
      if (options.projectId === "no-project" && document) {
        const item = document.createElement("li"), open = document.createElement("button"), create = document.createElement("button");
        item.setAttribute("role", "status"); item.textContent = "No active project. Open a project to see relationship-derived contributors. ";
        open.type = create.type = "button"; open.textContent = "Open project"; create.textContent = "Create project";
        controller.listen(open, "click", () => options.openProject(false)); controller.listen(create, "click", () => options.openProject(true)); item.append(open, create); rows.push(item);
      }
      const resultCount = rows.filter(({ dataset }) => Boolean(dataset.schemaEntryKey)).length;
      if (ports.emptyState) ports.emptyState.hidden = resultCount > 0;
      if (ports.count) { ports.count.textContent = `${resultCount} relationship-tree results`; ports.count.setAttribute("aria-label", `${resultCount} schema relationship-tree results`); }
      ports.list?.replaceChildren(...rows);
    },
    clearRows():void { for (const dispose of rowDisposers.splice(0)) dispose(); },
    dispose():void {
      controller.clearRows();
      projectId = undefined;
      expandedKeys.clear();
      pendingScroll = undefined;
      restoringScroll = false;
    },
  };
  return controller;
}
