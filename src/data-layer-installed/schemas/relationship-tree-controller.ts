import {
  filterSchemaRelationshipTree,
  restoreSchemaRelationshipTreeView,
  saveSchemaRelationshipTreeView,
} from "../../schema-relationship-tree.js";
import type {
  SchemaRelationshipCategory,
  SchemaRelationshipTreeNode,
} from "../../schema-relationship-tree.js";

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
