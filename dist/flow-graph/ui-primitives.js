import { FLOW_GRAPH_GEOMETRY } from "../data-layer-flow-graph.js";
export const nodeWidth = FLOW_GRAPH_GEOMETRY.eventWidth;
export const nodeHeight = FLOW_GRAPH_GEOMETRY.eventHeight;
export const q = (selector, root = document) => { const element = root.querySelector(selector); if (!element)
    throw new Error(`Missing ${selector}`); return element; };
export const svg = (tag) => document.createElementNS("http://www.w3.org/2000/svg", tag);
export const button = (text, action) => { const control = document.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", action); return control; };
export const entityName = (entities, id, fallback = "Unknown") => entities.find((entity) => entity.id === id)?.name ?? fallback;
export const elementByData = (attribute, id) => Array.from(document.querySelectorAll(`[${attribute}]`)).find((element) => element.getAttribute(attribute) === id);
export const flowPortPoint = (layout, size, port) => port === "left" ? { x: layout.x, y: layout.y + size.height / 2 } : port === "right" ? { x: layout.x + size.width, y: layout.y + size.height / 2 } : port === "top" ? { x: layout.x + size.width / 2, y: layout.y } : { x: layout.x + size.width / 2, y: layout.y + size.height };
export function flowEdgeGeometry(source, target, sourceSize = { width: nodeWidth, height: nodeHeight }, targetSize = sourceSize, sourcePort = "right", targetPort = "left") { const start = flowPortPoint(source, sourceSize, sourcePort), end = flowPortPoint(target, targetSize, targetPort), startX = start.x, startY = start.y, endX = end.x, endY = end.y, dx = endX - startX, dy = endY - startY, length = Math.hypot(dx, dy), unitX = length < 0.001 ? 1 : dx / length, unitY = length < 0.001 ? 0 : dy / length, baseX = endX - unitX * 12, baseY = endY - unitY * 12, normalX = -unitY * 7, normalY = unitX * 7; return { startX, startY, endX, endY, arrow: `${baseX + normalX},${baseY + normalY} ${endX},${endY} ${baseX - normalX},${baseY - normalY}` }; }
export const ownsPointerDrag = (activePointerId, eventPointerId) => activePointerId !== undefined && activePointerId === eventPointerId;
export function restorePointerCancellationFocus(target, scheduleMicrotask = (callback) => queueMicrotask(callback), scheduleSettledTask = (callback) => setTimeout(callback, 0)) { const restore = () => { if (target.isConnected)
    target.focus(); }; restore(); scheduleMicrotask(restore); scheduleSettledTask(restore); }
//# sourceMappingURL=ui-primitives.js.map