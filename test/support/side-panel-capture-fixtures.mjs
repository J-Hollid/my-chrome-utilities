import { projectFixturePrograms } from "./side-panel-browser-project-fixtures.mjs";

const payloadPathFilterPickerRuntime = `(async () => {
  const queryUi = await import("/data-layer-event-feed-query-ui.js");
  const host = document.createElement("section"); host.id = "payload-path-filter-picker-fixture"; document.body.append(host);
  const baseEvents = [
    { id:"purchase", name:"purchase", sourceId:"history", captureTime:"2026-07-13T10:00:00Z", payload:{ currency:"EUR", commerce:{ total:12, order:{ id:"A-42" } }, ...Object.fromEntries(Array.from({ length:40 }, (_, index) => ["fixture_" + index, index])) } },
    { id:"checkout", name:"checkout", sourceId:"history", captureTime:"2026-07-13T10:01:00Z", payload:{ user:{ status:"member" } } },
  ];
  let events = baseEvents;
  let query = { conditions:[] };
  const render = () => queryUi.renderEventFeedQueryBuilder(host, events, query, (next) => { query = next; render(); });
  const q = (selector) => { const element = host.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const button = (label, root = host) => { const result = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label); if (!result) throw new Error("Missing " + label); return result; };
  render(); button("Add filter").click();
  let field = q("#event-feed-query-field");
  const initialFieldOptions = Array.from(field.options).map(({ textContent }) => textContent);
  field.value = "Payload property"; field.dispatchEvent(new Event("change", { bubbles:true }));
  let stage = q("#event-feed-payload-path-stage");
  let search = q("#event-feed-payload-path-search");
  let results = q("#event-feed-payload-path-results");
  const resultButtons = Array.from(results.querySelectorAll("button"));
  const presentation = {
    visible:stage.getClientRects().length > 0,
    searchAvailable:Boolean(search),
    customAvailable:Boolean(button("Enter custom path", stage)),
    pathCount:resultButtons.length,
    completeAccessibleNames:resultButtons.every((result) => result.getAttribute("aria-label") === result.textContent),
    bounded:results.scrollHeight > results.clientHeight && results.clientHeight > 0,
    overflowY:getComputedStyle(results).overflowY,
    topFieldsAbsent:resultButtons.every((result) => !initialFieldOptions.includes(result.textContent)),
    searchFocused:document.activeElement === search,
  };
  button("Back to fields", stage).click();
  const back = { stageHidden:stage.hidden, fieldFocused:document.activeElement === field, conditionCount:query.conditions.length };
  field.value = "Payload property"; field.dispatchEvent(new Event("change", { bubbles:true }));
  stage = q("#event-feed-payload-path-stage"); search = q("#event-feed-payload-path-search"); results = q("#event-feed-payload-path-results");
  const reopenedSearchFocused = document.activeElement === search;
  search.value = "commerce"; search.dispatchEvent(new Event("input", { bubbles:true }));
  const filteredPaths = Array.from(results.querySelectorAll("button")).map(({ textContent }) => textContent);
  button("commerce.total", results).click();
  const observedSelection = {
    selected:q("#event-feed-query-selected-field").textContent,
    operatorVisible:q("#event-feed-query-operator").getClientRects().length > 0,
    valueVisible:q("#event-feed-query-value").getClientRects().length > 0,
    suggestions:Array.from(q("#event-feed-query-suggestions").children).map(({ value }) => value),
  };
  field = q("#event-feed-query-field"); field.value = "Payload property"; field.dispatchEvent(new Event("change", { bubbles:true }));
  stage = q("#event-feed-payload-path-stage"); button("Enter custom path", stage).click();
  const customPath = q("#event-feed-query-custom-path");
  const addPath = button("Add property path", stage);
  const blankCustomDisabled = addPath.disabled;
  customPath.value = "commerce.coupon.code"; customPath.dispatchEvent(new Event("input", { bubbles:true })); addPath.click();
  const customSelection = { selected:q("#event-feed-query-selected-field").textContent, conditionCount:query.conditions.length };
  const operator = q("#event-feed-query-operator"); operator.value = "is"; operator.dispatchEvent(new Event("change", { bubbles:true }));
  const value = q("#event-feed-query-value"); value.value = "SUMMER"; value.dispatchEvent(new Event("input", { bubbles:true })); button("Apply condition").click();
  const beforeLaterEvent = q("#live-event-query-count").textContent;
  events = [...baseEvents, { id:"promotion", name:"promotion", sourceId:"history", captureTime:"2026-07-13T10:02:00Z", payload:{ commerce:{ coupon:{ code:"SUMMER" } } } }]; render();
  const afterLaterEvent = q("#live-event-query-count").textContent;
  host.remove();
  return { initialFieldOptions, presentation, back, reopenedSearchFocused, filteredPaths, observedSelection, blankCustomDisabled, customSelection, beforeLaterEvent, afterLaterEvent };
})()`;

const singleLiveEventFeedRuntime = `(async () => {
  const observerUi = await import("/data-layer-live-observer-ui.js");
  const inspectorPresentationUi = await import("/data-layer-live-inspector-presentation-ui.js");
  const savedSessions = await import("/data-layer-saved-sessions.js");
  const defectReports = await import("/data-layer-defect-report-browser.js");
  const events = [
    { id:"pageview", name:"pageview", sourceId:"event-history", sourceName:"Event history", captureTime:"2026-07-13T10:00:00Z", pageUrl:"https://shop.example/products", payload:{} },
    { id:"promotion", name:"promotion", sourceId:"event-history", sourceName:"Event history", captureTime:"2026-07-13T10:01:00Z", pageUrl:"https://shop.example/products", payload:{} },
    { id:"purchase", name:"purchase", sourceId:"event-history", sourceName:"Event history", captureTime:"2026-07-13T10:02:00Z", pageUrl:"https://shop.example/checkout", payload:{} },
  ];
  observerUi.renderLiveObserverState(observerUi.findLiveObserverElements(), {
    view:"Live", status:"Live", pageUrl:events.at(-1).pageUrl, sources:[], events, listVisible:true,
  }, () => {});
  const feed = document.querySelector("#live-event-feed");
  const completed = {
    id:"session:current", pageScope:"shop.example", startedAt:"2026-07-13T10:00:00Z", endedAt:"2026-07-13T10:03:00Z",
    events:events.map((event, captureOrder) => ({ ...event, rawInput:event.payload, captureOrder })),
  };
  const archive = savedSessions.saveCompletedSession(savedSessions.createSavedSessionLibrary(), completed, "Checkout journey").sessions[0];
  const defectContext = defectReports.defectReportContext(events, "purchase");
  const inspector = document.createElement("section");
  inspector.style.cssText = "height:40px;overflow:auto";
  const properties = document.createElement("section"); properties.setAttribute("aria-label", "Properties");
  properties.dataset.showNonApplicableProperties = "true";
  const property = document.createElement("details"); property.dataset.propertyPath = "/checkout/id"; property.open = true;
  const rule = document.createElement("div"); rule.className = "live-validation-property"; rule.dataset.propertyPath = "/checkout/id";
  const disclosure = document.createElement("button"); disclosure.id = "capture-inspector-focus";
  disclosure.className = "live-property-status"; disclosure.setAttribute("aria-expanded", "true");
  disclosure.addEventListener("click", () => disclosure.setAttribute("aria-expanded", "true"));
  rule.append(disclosure); property.append(rule, Object.assign(document.createElement("div"), { style:"height:1000px" }));
  properties.append(property); inspector.append(properties); document.body.append(inspector);
  inspector.scrollTop = 37; disclosure.focus({ preventScroll:true });
  const captured = inspectorPresentationUi.captureLiveInspectorPresentation(inspector, disclosure);
  property.open = false; disclosure.setAttribute("aria-expanded", "false"); inspector.scrollTop = 0; document.body.focus();
  inspectorPresentationUi.restoreLiveInspectorPresentation(inspector, captured);
  const restored = { propertyOpen:property.open, ruleExpanded:disclosure.getAttribute("aria-expanded"),
    scrollTop:inspector.scrollTop, focusedId:document.activeElement?.id };
  inspector.remove();
  return {
    liveFeedCount:document.querySelectorAll("#live-event-feed").length,
    liveFeedInsideLivePanel:Boolean(feed?.closest("#data-layer-panel-live")),
    duplicateTimelineCount:document.querySelectorAll("#session-timeline").length,
    secondaryCurrentSessionLists:["library", "sessions", "schemas"].map((view) =>
      document.querySelectorAll("#data-layer-panel-" + view + " #live-event-feed, #data-layer-panel-" + view + " #session-timeline").length
    ),
    journey:{
      visits:Array.from(feed.querySelectorAll(".pathname-visit-heading")).map((heading) => heading.querySelector(".pathname-visit-path").textContent),
      eventCount:feed.querySelectorAll("[data-event-id]").length,
    },
    archiveEventIds:archive.events.map(({ id }) => id),
    defectEventIds:defectContext.timeline.map(({ id }) => id),
    inspectorPresentation:{captured,restored},
  };
})()`;

const savedSessionLiveFeedRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const waitFor = async (predicate, label) => { for (let attempt = 0; attempt < 100; attempt += 1) { if (predicate()) return; await new Promise((resolve) => setTimeout(resolve, 10)); } throw new Error("Timed out waiting for " + label); };
  let pushListener; let channelId;
  const captured = Array.from({ length:14 }, (_, index) => ({ event:index === 13 ? "purchase" : "current", index }));
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"http://127.0.0.1:4173/", title:"Fixture", active:true }] },
    scripting:{ executeScript:async (options) => {
      if (options.args?.[0] === "my-chrome-utilities.data-layer-history-entry") channelId = options.args[1];
      return [{ result:{ queue:{ history:captured } } }];
    } },
    runtime:{ onMessage:{ addListener:(listener) => { pushListener = listener; }, removeListener:(listener) => { if (pushListener === listener) pushListener = undefined; } } },
  };
  q("#choose-observation-target").click(); await new Promise((resolve) => setTimeout(resolve, 0));
  q("#observation-target-list [data-target-id]").click();
  await waitFor(() => !q("#start-data-layer-testing").disabled, "the selected observation target to become startable");
  q("#start-data-layer-testing").click();
  await waitFor(() => pushListener && channelId, "the production live-history callback");
  q("#data-layer-view-sessions").click();
  const row = Array.from(q("#saved-session-list").children).find(({ textContent }) => textContent.includes("Checkout journey"));
  const actions = Array.from(row.querySelectorAll("button")).map(({ textContent }) => textContent);
  click(row, "Open in Live feed");
  for (let index = 0; index < 4; index += 1) pushListener({ type:"my-chrome-utilities.data-layer-history-entry", channelId, rawValue:{ event:"background", index }, timestamp:"2026-07-13T10:2" + index + ":00Z" }, { tab:{ id:23 } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  const productionFeed = JSON.parse(localStorage.getItem("my-chrome-utilities.saved-session-live-feed.v1"));
  const productionBackground = { background:productionFeed.backgroundEventCount, currentCount:productionFeed.currentView.events.length, savedCount:productionFeed.savedView.events.length, returnLabel:q("#return-to-current-live-feed").textContent };
  q("#return-to-current-live-feed").click(); q("#end-data-layer-testing").click(); await new Promise((resolve) => setTimeout(resolve, 0));
  q("#data-layer-view-sessions").click(); click(row, "Open in Live feed");
  const banner = q("#saved-session-live-banner");
  const open = {
    liveSelected:q("#data-layer-view-live").getAttribute("aria-selected") === "true",
    mode:q("#data-layer-panel-live").dataset.feedMode,
    banner:banner.textContent,
    eventCount:q("#live-captured-event-count").textContent,
    observer:q("#live-observer-status").textContent,
    captureDisabled:[q("#pause-capture").disabled, q("#resume-capture").disabled, q("#save-live-session").disabled],
    storedCount:JSON.parse(localStorage.getItem("my-chrome-utilities.saved-session-library.v1")).sessions[0].events.length,
  };
  const eventButton = q('[data-event-id="saved-18"]'); eventButton.click();
  const analysisActions = Array.from(q("#live-event-inspector").querySelectorAll("button")).map(({ textContent }) => textContent);
  const model = await import("/data-layer-saved-session-live-feed.js");
  const sessions = await import("/data-layer-saved-sessions.js");
  const observers = await import("/data-layer-live-observer.js");
  const library = sessions.restoreSavedSessionLibrary(localStorage.getItem(model.SAVED_SESSION_LIBRARY_STORAGE_KEY));
  const saved = library.sessions[0];
  const currentEvents = Array.from({ length:14 }, (_, index) => ({ id:index === 13 ? "purchase" : "current-" + (index + 1), name:index === 13 ? "purchase" : "current", sourceId:"history", sourceName:"Event history", captureTime:"2026-07-13T09:" + String(index).padStart(2, "0") + ":00Z", pageUrl:"https://example.test/current", payload:{ index }, rawInput:["current", index] }));
  const current = { view:"Live", status:"Live", pageUrl:"https://example.test/current", sources:[{ id:"history", name:"Event history", status:"Connected" }], events:currentEvents, query:{ conditions:[{ id:"purchase", field:"Event name", operator:"is", values:["purchase"] }] }, inspectorEventId:"purchase", listVisible:true };
  let persisted = model.openSavedSessionLiveFeed(current, saved, { scrollTop:480 });
  persisted = model.updateSavedSessionLiveFeedView(persisted, { query:{ conditions:[{ id:"saved-purchase", field:"Event name", operator:"is", values:["purchase"] }] }, inspectorEventId:"saved-18", listVisible:true, scrollTop:275 });
  for (let index = 0; index < 4; index += 1) persisted = model.recordBackgroundLiveEvent(persisted, { id:"background-" + (index + 1), name:"background", sourceId:"history", sourceName:"Event history", captureTime:"2026-07-13T10:2" + index + ":00Z", pageUrl:"https://example.test/current", payload:{ index }, rawInput:["background", index] });
  localStorage.setItem(model.SAVED_SESSION_LIVE_FEED_STORAGE_KEY, model.serializeSavedSessionLiveFeed(persisted));
  localStorage.setItem("dataLayerTestingSession", JSON.stringify({ session:{ id:"active-background", status:"active", tabId:99, historyPath:"event.history", startUrl:"https://example.test/current", currentUrl:"https://example.test/current", timeline:[] } }));
  const restored = model.restoreSavedSessionLiveFeed(model.serializeSavedSessionLiveFeed(persisted), library);
  const imported = sessions.importSavedSession(sessions.createSavedSessionLibrary(), sessions.exportSavedSession(saved)).sessions[0];
  const linked = sessions.resumeSavedSession(sessions.openSavedSession(library, saved.id), "https://example.test/confirmation");
  const draft = model.createSessionSaveDraft({ id:"active", pageScope:current.pageUrl, startedAt:currentEvents[0].captureTime, endedAt:currentEvents.at(-1).captureTime, events:currentEvents });
  return {
    actions, open, analysisActions, productionBackground,
    model:{ savedOrder:persisted.savedView.events.map(({ id }) => id), currentCount:persisted.currentView.events.length, savedCount:persisted.session.events.length, background:persisted.backgroundEventCount, currentSelected:persisted.currentView.inspectorEventId, currentFilter:persisted.currentView.query.conditions[0].values[0], currentScroll:persisted.currentScrollTop, savedSelected:restored.savedView.inspectorEventId, savedScroll:restored.savedScrollTop, observerStarts:restored.startLiveObserver },
    imported:{ ids:imported.events.map(({ id }) => id), sources:imported.events.map(({ sourceId }) => sourceId), payload:imported.events[17].payload, rawInput:imported.events[17].rawInput, pageUrl:imported.events[17].pageUrl, provenance:imported.events[17].provenance },
    linked:{ parent:linked.activeSession.parentSavedSessionId, events:linked.activeSession.events.length, savedEvents:saved.events.length },
    saveDraft:{ eventCount:draft.summary.eventCount, sourceCount:draft.summary.sourceCount, validation:draft.summary.validationSummary },
  };
})()`;

const savedSessionLiveFeedReloadRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const restored = { mode:q("#data-layer-panel-live").dataset.feedMode, banner:q("#saved-session-live-summary").textContent, background:q("#saved-session-background-status").textContent, returnLabel:q("#return-to-current-live-feed").textContent, selected:q("#live-event-inspector h4").textContent, scrollTop:q("#live-event-list").scrollTop, observer:q("#live-observer-status").textContent };
  q("#revalidate-saved-session").click();
  const comparison = q("#saved-session-validation-comparison").textContent;
  const original = JSON.parse(localStorage.getItem("my-chrome-utilities.saved-session-library.v1")).sessions[0].events[17];
  q("#return-to-current-live-feed").click();
  const returned = { count:q("#live-captured-event-count").textContent, selected:q("#live-event-inspector h4").textContent, query:q("#live-event-query-count").textContent, hasSavedEvent:Boolean(document.querySelector('[data-event-id="saved-18"]')), message:q("#live-session-message").textContent };
  q("#save-live-session").click();
  const saveDialog = q("#save-live-session-dialog"); const name = q("#save-live-session-name"); const confirm = q("#confirm-save-live-session");
  const save = { open:saveDialog.open, focused:document.activeElement === q("#save-live-session-heading"), summary:q("#save-live-session-summary").textContent, blankDisabled:confirm.disabled };
  name.value = "Checkout journey snapshot"; name.dispatchEvent(new Event("input", { bubbles:true })); save.namedEnabled = !confirm.disabled; confirm.click();
  save.persisted = JSON.parse(localStorage.getItem("my-chrome-utilities.saved-session-library.v1")).sessions.find(({ name }) => name === "Checkout journey snapshot").events.length;
  q("#data-layer-view-sessions").click(); const originalRow = Array.from(q("#saved-session-list").children).find(({ textContent }) => textContent.includes("Checkout journey:") && !textContent.includes("snapshot")); click(originalRow, "Start linked capture");
  const linkedSession = JSON.parse(localStorage.getItem("dataLayerTestingSession")).session;
  const linked = { count:q("#live-captured-event-count").textContent, message:q("#live-session-message").textContent, savedCount:JSON.parse(localStorage.getItem("my-chrome-utilities.saved-session-library.v1")).sessions.find(({ name }) => name === "Checkout journey").events.length, parent:linkedSession.parentSavedSessionId, active:linkedSession.status };
  return { restored, comparison, original:{ validation:original.validation, version:original.validationDetails.schema.version }, returned, save, linked };
})()`;

const freshLiveSessionRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const button = (root, label) => { const element = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!element) throw new Error("Missing " + label); return element; };
  const wait = () => new Promise((resolve) => setTimeout(resolve, 0));
  const waitFor = async (predicate, label) => { for (let attempt = 0; attempt < 100; attempt += 1) { if (predicate()) return; await new Promise((resolve) => setTimeout(resolve, 10)); } throw new Error("Timed out waiting for " + label); };
  const storedSession = () => JSON.parse(localStorage.getItem("dataLayerTestingSession")).session;
  const storedLibrary = () => JSON.parse(localStorage.getItem("my-chrome-utilities.saved-session-library.v1") || '{"sessions":[]}');
  const eventCount = () => Number(q("#live-captured-event-count").textContent);
  const eventNames = () => storedSession().timeline.filter(({ type }) => type === "observed").map(({ name }) => name);
  const history = Array.from({ length:9 }, (_, index) => ({ event:index === 0 ? "page_view" : "add_to_cart", index:index + 1 }));
  let pushListener; let channelId;
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"https://shop.test/checkout", title:"Checkout", active:true }] },
    scripting:{ executeScript:async (options) => {
      if (options.args?.[0] === "my-chrome-utilities.data-layer-history-entry") channelId = options.args[1];
      return [{ result:{ queue:{ history } } }];
    } },
    runtime:{ onMessage:{ addListener:(listener) => { pushListener = listener; }, removeListener:(listener) => { if (pushListener === listener) pushListener = undefined; } } },
  };
  localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([{ id:"checkout-schema", name:"Checkout", version:4, published:true, document:{ type:"object" }, assignments:[] }]));
  const schemaBefore = localStorage.getItem("my-chrome-utilities.schema-library.v1");
  q("#choose-observation-target").click(); await wait();
  q("#observation-target-list [data-target-id]").click();
  await waitFor(() => !q("#start-data-layer-testing").disabled, "the selected observation target to become startable");
  q("#start-data-layer-testing").click();
  await waitFor(() => pushListener && channelId, "the production live-history callback");
  const push = async (rawValue, minute) => { pushListener({ type:"my-chrome-utilities.data-layer-history-entry", channelId, rawValue, timestamp:"2026-07-14T06:" + minute + ":00Z" }, { tab:{ id:23 } }); await wait(); };
  q("#save-live-session").click(); const existingName = q("#save-live-session-name"); existingName.value = "Existing nine"; existingName.dispatchEvent(new Event("input", { bubbles:true })); q("#confirm-save-live-session").click(); await wait();
  await push({ event:"add_to_cart", index:10 }, "17"); await push({ event:"add_to_cart", index:11 }, "18"); await push({ event:"add_to_cart", index:12 }, "19");
  const initialSession = storedSession();
  const sourcesBefore = q("#live-source-statuses").textContent;
  q("#add-event-feed-filter").click();
  const field = q("#event-feed-query-field"); field.value = "Event name"; field.dispatchEvent(new Event("change", { bubbles:true }));
  const operator = q("#event-feed-query-operator"); operator.value = "is"; operator.dispatchEvent(new Event("change", { bubbles:true }));
  const value = q("#event-feed-query-value"); value.value = "add_to_cart"; value.dispatchEvent(new Event("input", { bubbles:true }));
  button(q("#live-event-query"), "Apply condition").click();
  q("#live-event-list").scrollTop = 120;
  q("#live-event-feed [data-event-id]").click();
  const priorFeed = { query:q("#live-event-query-count").textContent, selected:q("#live-event-inspector h4").textContent, scrollTop:q("#live-event-list").scrollTop };
  q("#start-fresh-session").click();
  const confirmation = {
    open:q("#fresh-session-confirmation").open,
    summary:q("#fresh-session-confirmation-summary").textContent,
    actions:Array.from(q("#fresh-session-confirmation").querySelectorAll("button")).map(({ textContent }) => textContent),
    unchanged:{ id:storedSession().id, events:eventCount() },
  };
  q("#cancel-fresh-session").click();
  const cancelled = { id:storedSession().id, events:eventCount(), query:q("#live-event-query-count").textContent, selected:q("#live-event-inspector h4").textContent, scrollTop:q("#live-event-list").scrollTop };
  q("#start-fresh-session").click(); q("#save-and-start-fresh-session").click();
  const saveDialog = {
    open:q("#save-live-session-dialog").open,
    heading:q("#save-live-session-heading").textContent,
    blankDisabled:q("#confirm-save-live-session").disabled,
    eventCount:eventCount(),
    sessionId:storedSession().id,
  };
  const saveName = q("#save-live-session-name"); saveName.value = "Checkout before reset"; saveName.dispatchEvent(new Event("input", { bubbles:true })); q("#confirm-save-live-session").click(); await wait();
  const firstSnapshot = storedLibrary().sessions.find(({ name }) => name === "Checkout before reset");
  const afterSave = {
    id:storedSession().id,
    events:eventCount(),
    snapshot:{ name:firstSnapshot?.name, immutable:firstSnapshot?.immutable, events:firstSnapshot?.events.length },
    retained:{ title:storedSession().targetTitle, path:storedSession().historyPath, sources:q("#live-source-statuses").textContent, schema:localStorage.getItem("my-chrome-utilities.schema-library.v1") === schemaBefore },
    reset:{ query:q("#live-event-query-count").textContent, activeFilters:!q("#active-event-feed-filters").hidden, inspectorHidden:q("#live-event-inspector").hidden, scrollTop:q("#live-event-list").scrollTop },
  };
  const zeroSessionId = storedSession().id; const zeroLibrary = localStorage.getItem("my-chrome-utilities.saved-session-library.v1");
  q("#start-fresh-session").click(); await wait();
  const zeroImmediate = { distinct:storedSession().id !== zeroSessionId, events:eventCount(), confirmationOpen:q("#fresh-session-confirmation").open, libraryUnchanged:localStorage.getItem("my-chrome-utilities.saved-session-library.v1") === zeroLibrary };
  await push({ event:"page_view" }, "20"); await push({ event:"add_to_cart" }, "21");
  q("#save-live-session").click(); const allSavedName = q("#save-live-session-name"); allSavedName.value = "All saved current"; allSavedName.dispatchEvent(new Event("input", { bubbles:true })); q("#confirm-save-live-session").click(); await wait();
  const allSavedSessionId = storedSession().id; const allSavedLibrary = localStorage.getItem("my-chrome-utilities.saved-session-library.v1");
  q("#start-fresh-session").click(); await wait();
  const allSavedImmediate = { distinct:storedSession().id !== allSavedSessionId, events:eventCount(), confirmationOpen:q("#fresh-session-confirmation").open, libraryUnchanged:localStorage.getItem("my-chrome-utilities.saved-session-library.v1") === allSavedLibrary };
  await push({ event:"page_view" }, "22"); await push({ event:"add_to_cart" }, "23");
  q("#start-fresh-session").click();
  const discardBefore = { id:storedSession().id, events:eventCount(), saved:storedLibrary().sessions.length, summary:q("#fresh-session-confirmation-summary").textContent };
  q("#discard-and-start-fresh-session").click(); await wait();
  const discardAfter = { id:storedSession().id, events:eventCount(), saved:storedLibrary().sessions.length, title:storedSession().targetTitle, path:storedSession().historyPath, status:q("#live-observer-status").textContent };
  await push({ event:"purchase", order_id:"A-42" }, "24");
  const purchase = { count:eventCount(), names:eventNames(), timeline:storedSession().timeline.length };
  const currentId = storedSession().id;
  q("#data-layer-view-sessions").click();
  const archiveRow = Array.from(q("#saved-session-list").children).find(({ textContent }) => textContent.includes("Checkout before reset"));
  button(archiveRow, "Open in Live feed").click();
  const archive = { startDisabled:q("#start-fresh-session").disabled, returnAvailable:!q("#return-to-current-live-feed").hidden, returnLabel:q("#return-to-current-live-feed").textContent, currentId:storedSession().id };
  q("#start-fresh-session").click(); archive.unchanged = storedSession().id === currentId && eventCount() === 12;
  q("#return-to-current-live-feed").click();
  return {
    initial:{ id:initialSession.id, events:initialSession.timeline.filter(({ type }) => type === "observed").length, title:initialSession.targetTitle, path:initialSession.historyPath, sources:sourcesBefore },
    priorFeed, confirmation, cancelled, saveDialog, afterSave, zeroImmediate, allSavedImmediate, discardBefore, discardAfter, purchase, archive,
  };
})()`;

const freshLiveSessionReloadRuntime = `(() => {
  const session = JSON.parse(localStorage.getItem("dataLayerTestingSession")).session;
  const names = session.timeline.filter(({ type }) => type === "observed").map(({ name }) => name);
  return {
    id:session.id,
    count:document.querySelector("#live-captured-event-count").textContent,
    names,
    rendered:Array.from(document.querySelectorAll("#live-event-feed [data-event-id]")).map(({ textContent }) => textContent),
    title:session.targetTitle,
    path:session.historyPath,
  };
})()`;

const savedEventFeedFiltersSeedRuntime = `(async () => {
  localStorage.clear();
  const events=[
    {id:"event:purchase",name:"purchase",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-15T00:00:01Z",pageUrl:"http://127.0.0.1:4173/checkout",payload:{currency:"EUR"},rawInput:[],validation:"1 issues",type:"observed"},
    {id:"event:product",name:"product_view",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-15T00:00:02Z",pageUrl:"http://127.0.0.1:4173/products/1",payload:{currency:"EUR"},rawInput:[],validation:"Valid",type:"observed"},
    {id:"event:page",name:"page_view",sourceId:"adobe",sourceName:"Adobe beacons",sourceKind:"Adobe",timestamp:"2026-07-15T00:00:03Z",pageUrl:"http://127.0.0.1:4173/home",payload:{currency:"GBP"},rawInput:[],validation:"Not checked",type:"observed"},
  ];
  localStorage.setItem("dataLayerTestingSession",JSON.stringify({session:{id:"session:saved-filters",status:"active",freshBoundary:true,tabId:1,windowId:1,historyPath:"dataLayer",startUrl:"http://127.0.0.1:4173/",currentUrl:"http://127.0.0.1:4173/",timeline:events}}));
  const sessions=await import("/data-layer-saved-sessions.js");
  const completed={id:"session:archive",pageScope:"http://127.0.0.1:4173/",startedAt:"2026-07-14T23:00:00Z",endedAt:"2026-07-14T23:01:00Z",events:events.map((event,index)=>({id:"saved:"+index,sourceId:event.sourceId,sourceName:event.sourceName,name:event.name,payload:event.payload,rawInput:[],pageUrl:event.pageUrl,captureOrder:index+1,captureTime:event.timestamp,validation:event.validation,provenance:{source:"runtime",capturedAt:event.timestamp}})),provenance:{source:"runtime",capturedAt:"2026-07-14T23:01:00Z"}};
  const library=sessions.saveCompletedSession(sessions.createSavedSessionLibrary(),completed,"Saved checkout feed");
  localStorage.setItem("my-chrome-utilities.saved-session-library.v1",sessions.serializeSavedSessionLibrary(library));
  return true;
})()`;

const savedEventFeedFiltersRuntime = `(async () => {
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(label,root=document)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const change=(selector,value,event="change")=>{const input=q(selector);input.value=value;input.dispatchEvent(new Event(event,{bubbles:true}));return input;};
  const root=q("#live-event-query"); const storageKey="my-chrome-utilities.saved-event-feed-filters.v1";
  const actions=()=>{const value=q("#saved-event-feed-filter-actions");value.open=true;return value;};
  const add=(field,value)=>{click("Add filter",root);change("#event-feed-query-field",field);change("#event-feed-query-operator","is");change("#event-feed-query-value",value,"input");click("Apply condition",root);};
  const name=(action,value)=>{click(action,actions());change("#saved-event-feed-filter-name",value,"input");const assistance=q("#saved-event-feed-filter-name-assistance").textContent;click(action==="Rename"?"Rename":"Save",q("#saved-event-feed-filter-name-dialog"));return assistance;};
  const select=(value)=>change("#saved-event-feed-filter-selector",value);
  const library=()=>JSON.parse(localStorage.getItem(storageKey));
  const count=()=>q("#live-event-query-count").textContent;
  const identity=()=>q("#saved-event-feed-filter-identity").textContent;
  const feedNames=()=>Array.from(q("#live-event-feed").querySelectorAll("button")).map(({textContent})=>textContent).filter(Boolean);
  const initial={identity:identity(),saveAbsent:!Array.from(actions().querySelectorAll("button")).some(({textContent})=>textContent==="Save current filter"),withinWidth:root.scrollWidth<=root.clientWidth};
  add("Event name","purchase");add("Validation state","Issues");name("Save current filter","Checkout issues");
  const checkout=library().filters[0];
  const created={identity:identity(),count:count(),stored:checkout,storageKeys:Object.keys(checkout).sort(),eventKeys:Object.keys(checkout).filter((key)=>/event|session|scroll|capture|inspector/i.test(key))};
  select("");add("Event name","product_view");name("Save current filter","Product events");
  const product=library().filters.find(({name})=>name==="Product events"); const checkoutStored=JSON.stringify(library().filters.find(({name})=>name==="Checkout issues"));
  select(checkout.id);const checkoutApplied={identity:identity(),count:count(),conditions:q("#active-event-feed-filters").textContent,feed:feedNames()};
  add("Pathname","/checkout");select(product.id);const switchOpen=q("#saved-event-feed-filter-switch-dialog").open;click("Cancel",q("#saved-event-feed-filter-switch-dialog"));const cancelled=identity();
  select(product.id);click("Discard and switch",q("#saved-event-feed-filter-switch-dialog"));const switched={identity:identity(),count:count(),checkoutUnchanged:JSON.stringify(library().filters.find(({name})=>name==="Checkout issues"))===checkoutStored};
  select(checkout.id);add("Source","Event history");select(product.id);click("Save changes",q("#saved-event-feed-filter-switch-dialog"));const savedSwitch={identity:identity(),updated:library().filters.find(({id})=>id===checkout.id).conditions.length===3};
  select(checkout.id);add("Pathname","/checkout");click("Revert changes",actions());const reverted={identity:identity(),conditionCount:q("#active-event-feed-filters").querySelectorAll("li").length};
  const failures=[];const failNextWrite=()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key===storageKey){Storage.prototype.setItem=original;throw new Error("forced");}return original.call(this,key,value);};};
  const failureSnapshot=(operation,before)=>failures.push({operation,unchanged:localStorage.getItem(storageKey)===before,feedback:q("#saved-event-feed-filter-feedback").textContent,identity:identity(),conditionCount:q("#active-event-feed-filters").querySelectorAll("li").length});
  add("Source","Event history");let failureBefore=localStorage.getItem(storageKey);failNextWrite();click("Update",actions());failureSnapshot("update",failureBefore);click("Revert changes",actions());
  failureBefore=localStorage.getItem(storageKey);failNextWrite();name("Rename","Failure rename");failureSnapshot("rename",failureBefore);
  failureBefore=localStorage.getItem(storageKey);failNextWrite();click("Set as default",actions());failureSnapshot("default",failureBefore);
  failureBefore=localStorage.getItem(storageKey);failNextWrite();click("Delete",actions());click("Delete",q("#saved-event-feed-filter-delete-dialog"));failureSnapshot("delete",failureBefore);
  select("");add("Source","Event history");failureBefore=localStorage.getItem(storageKey);failNextWrite();name("Save current filter","Failure create");failureSnapshot("create",failureBefore);select(checkout.id);
  add("Pathname","/checkout");name("Save as new","Checkout path");const copyId=library().filters.find(({name})=>name==="Checkout path").id;const originalId=library().filters.find(({name})=>name==="Checkout issues").id;
  name("Rename","Purchase defects");click("Set as default",actions());const renamed={identity:identity(),sameId:library().filters.find(({name})=>name==="Purchase defects").id===copyId,originalUnchanged:originalId===checkout.id,defaultId:library().defaultFilterId};
  click("Delete",actions());const deleteDialog=q("#saved-event-feed-filter-delete-dialog");const scrollBefore=q("#live-event-list").scrollTop=19;click("Delete",deleteDialog);const deleted={identity:identity(),queryRetained:q("#active-event-feed-filters").querySelectorAll("li").length,defaultRemoved:library().defaultFilterId===undefined,scroll:q("#live-event-list").scrollTop,filterRemoved:!library().filters.some(({id})=>id===copyId)};
  const duplicate=name("Save current filter"," checkout ISSUES ");click("Cancel",q("#saved-event-feed-filter-name-dialog"));
  const currentWorking=q("#active-event-feed-filters").textContent;const globalBefore=localStorage.getItem(storageKey);const archiveBefore=localStorage.getItem("my-chrome-utilities.saved-session-library.v1");
  q("#data-layer-view-sessions").click();const archiveRow=Array.from(q("#saved-session-list").children).find(({textContent})=>textContent.includes("Saved checkout feed"));click("Open in Live feed",archiveRow);select(checkout.id);const savedIdentity=identity();const savedCount=count();q("#return-to-current-live-feed").click();
  const isolation={savedIdentity,savedCount,currentIdentity:identity(),currentWorkingRestored:q("#active-event-feed-filters").textContent===currentWorking,globalUnchanged:localStorage.getItem(storageKey)===globalBefore,archiveUnchanged:localStorage.getItem("my-chrome-utilities.saved-session-library.v1")===archiveBefore};
  select(product.id);click("Set as default",actions());click("Start fresh session");click("Discard and start fresh",q("#fresh-session-confirmation"));
  const fresh={identity:identity(),count:count(),defaultId:library().defaultFilterId,filters:library().filters.map(({name})=>name),working:JSON.parse(localStorage.getItem("my-chrome-utilities.saved-event-feed-filter-working.v1"))};
  return {initial,created,checkoutApplied,switchOpen,cancelled,switched,savedSwitch,reverted,failures,renamed,deleted,duplicate,isolation,fresh,selectorWidth:q("#saved-event-feed-filter-selector").getBoundingClientRect().width,rootWidth:root.getBoundingClientRect().width};
})()`;

export const liveTargetPermissionRecoveryWiringRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const waitFor = async (predicate, label) => { for (let attempt = 0; attempt < 100; attempt += 1) { const result = predicate(); if (result) return result; await new Promise((resolve) => setTimeout(resolve, 10)); } throw new Error("Timed out waiting for " + label); };
  const permissionCalls = [];
  const scriptCalls = [];
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:42, windowId:7, url:"https://shop.example.test/checkout", title:"Checkout", active:true }] },
    permissions:{ request:async (...args) => { permissionCalls.push(args); return true; } },
    scripting:{ executeScript:async (...args) => { scriptCalls.push(args); return [{ result:{ event:{ history:[] } } }]; } },
  };
  q("#choose-observation-target").click();
  await waitFor(() => document.querySelector("#observation-target-list [data-target-id]"), "selected target candidate");
  q("#observation-target-list [data-target-id]").click();
  await waitFor(() => scriptCalls.length > 0 && q("#history-path-status").textContent.trim() === "Waiting for observation path", "applied target path");
  const buttons = [...document.querySelectorAll("button")].map(({ textContent }) => textContent.trim());
  const selectedTargetPresented = q("#live-setup-target").textContent.includes("Checkout selected");
  const startTestingRemainsDisabled = q("#start-data-layer-testing").disabled;
  const requestAccessAbsent = !buttons.includes("Request access");
  const inactive = requestAccessAbsent && startTestingRemainsDisabled;
  const targetPathApplyObserved = scriptCalls.length > 0 && q("#history-path-status").textContent.trim() === "Waiting for observation path";
  const appliedPathPreserved = q("#history-path-display").textContent === q("#history-path").value;
  const selectedTargetRetained = selectedTargetPresented && q("#live-setup-target").textContent.includes("Checkout selected");
  const callbackTargetRendered = q("#live-target-page").textContent.includes("Checkout");
  const callbackPageUrlRendered = q("#live-page-url").textContent === "https://shop.example.test/checkout";
  const callbackCopyEnabled = !q("#copy-live-page-url").disabled;
  if (permissionCalls.length || !inactive || !selectedTargetPresented || !targetPathApplyObserved || !appliedPathPreserved || !selectedTargetRetained || !callbackTargetRendered || !callbackPageUrlRendered || !callbackCopyEnabled) throw new Error("Preparation activated permission recovery or missed its installed target-path application");
  return { installedProjection:selectedTargetPresented && startTestingRemainsDisabled, inactive, callbacksSuppressed:permissionCalls.length === 0, requestAccessAbsent, startTestingRemainsDisabled, selectedTargetPresented, targetPathApplyObserved, appliedPathPreserved, selectedTargetRetained, callbackTargetRendered, callbackPageUrlRendered, callbackCopyEnabled };
})()`;

export const fixturePrograms = Object.freeze({ ...projectFixturePrograms, payloadPathFilterPickerRuntime, singleLiveEventFeedRuntime, savedSessionLiveFeedRuntime, savedSessionLiveFeedReloadRuntime, freshLiveSessionRuntime, freshLiveSessionReloadRuntime, savedEventFeedFiltersSeedRuntime, savedEventFeedFiltersRuntime, liveTargetPermissionRecoveryWiringRuntime });
