(ns acceptance.source-inspection.capture
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def capture-owner "src/data-layer-installed/capture/index.ts")
(def runtime-owner "src/data-layer-installed/runtime.ts")
(def legacy-owner "src/side-panel.ts")

(defn files [root extra-paths]
  (support/source-file-map root (vec (distinct (concat [legacy-owner capture-owner runtime-owner "src/data-layer-installed/capture/observation-sources/runtime.ts" "src/data-layer-installed/capture/observation-sources/subscription.ts" "src/data-layer-installed/capture/observation-sources/page-hook.ts"]
                                                       extra-paths)))))

(defn installed-source [root]
  (str/join "\n" [(support/source-file root legacy-owner)
                   (support/source-file root capture-owner)]))

(defn active-page-window-observation-wired? [sources page-access-unavailable]
  (let [side-panel-source (get sources legacy-owner "")
        capture-source (get sources capture-owner side-panel-source)
        runtime-source (get sources runtime-owner "")
        wiring-source (str capture-source "\n" runtime-source)
        active-page-source (get sources "src/active-page-observation.ts" "")
        manifest-source (get sources "manifest.json" "")]
    (and (str/includes? manifest-source "\"scripting\"")
         (str/includes? wiring-source "currentTargetObservation")
         (str/includes? wiring-source "tabPageObservation")
         (str/includes? active-page-source "activeTabPageObject")
         (str/includes? active-page-source "chrome.scripting.executeScript")
         (str/includes? active-page-source "world: \"MAIN\"")
         (str/includes? active-page-source "pageObject")
         (str/includes? active-page-source "pageAccessStatus")
         (str/includes? active-page-source page-access-unavailable))))

(defn live-history-push-capture-wired? [sources]
  (let [side-panel-source (get sources legacy-owner "")
        capture-source (get sources capture-owner side-panel-source)
        runtime-source (get sources runtime-owner "")
        wiring-source (str capture-source "\n" runtime-source)
        observer-source (get sources "src/data-layer-observer.ts" "")
        live-observation-source (get sources "src/data-layer-live-observation.ts" "")]
    (and (str/includes? wiring-source "currentTargetObservation")
         (str/includes? wiring-source "tabPageObservation")
         (str/includes? wiring-source "attachHistoryArrayObserver")
         (str/includes? (get sources "src/data-layer-installed/capture/observation-sources/subscription.ts" "") "startObservationSourceSubscription")
         (str/includes? (get sources "src/data-layer-installed/capture/observation-sources/runtime.ts" "") "appendObservedHistoryEntry")
         (str/includes? observer-source "appendObservedHistoryEntry")
         (str/includes? observer-source "captureExistingHistoryEntries")
         (str/includes? live-observation-source "chrome.scripting.executeScript")
         (str/includes? live-observation-source "chrome.runtime.onMessage.addListener")
         (str/includes? live-observation-source "CustomEvent")
         (str/includes? live-observation-source ".push"))))

(defn pageload-observation-refresh-wired? [sources]
  (let [side-panel-source (get sources legacy-owner "")
        capture-source (get sources capture-owner side-panel-source)
        runtime-source (get sources runtime-owner "")
        wiring-source (str capture-source "\n" runtime-source)
        active-page-source (get sources "src/active-page-observation.ts" "")
        refresh-source (get sources "src/data-layer-observation-refresh.ts" "")
        live-observation-source (get sources "src/data-layer-live-observation.ts" "")]
    (and (or (str/includes? wiring-source "chrome.tabs.onUpdated.addListener")
             (str/includes? wiring-source "subscribeTabUpdated"))
         (str/includes? wiring-source "scheduleObservationRefresh")
         (str/includes? wiring-source "refreshObservationAfterPageLoad")
         (str/includes? wiring-source "beginObservedPageLoad")
         (str/includes? wiring-source "observationRefreshRequestForPageLoad")
         (str/includes? wiring-source "restartObservation")
         (str/includes? wiring-source "startLiveHistoryCapture")
         (str/includes? wiring-source "navigateSession")
         (str/includes? active-page-source "tabPageObservation")
         (str/includes? refresh-source "ObservationRefreshState")
         (str/includes? refresh-source "OBSERVATION_REFRESH_MAX_ATTEMPTS")
         (str/includes? refresh-source "shouldRetryObservationRefresh")
         (str/includes? live-observation-source "startLiveHistoryPushCapture"))))

(defn side-panel-uses-active-tab-page-context? [sources]
  (let [side-panel-source (get sources legacy-owner "")
        capture-source (get sources capture-owner side-panel-source)
        active-page-source (get sources "src/active-page-observation.ts" "")]
    (and (str/includes? capture-source "currentTargetObservation")
         (str/includes? capture-source "selectedObservationTarget")
         (str/includes? active-page-source "tabPageObservation")
         (str/includes? active-page-source "pageUrl")
         (not (str/includes? capture-source "url: globalThis.location.href")))))

(defn tuple-event-display-wired? [sources]
  (let [observer-source (get sources "src/data-layer-observer.ts" "")
        presentation-source (get sources "src/data-layer-event-presentation.ts" "")
        live-observer-source (get sources "src/data-layer-live-observer-ui.ts" "")
        side-panel-source (get sources legacy-owner "")
        capture-source (get sources capture-owner side-panel-source)]
    (and (str/includes? observer-source "canonicalCapturedEvent")
         (str/includes? observer-source "captureSourceEvent")
         (str/includes? presentation-source "inputPayload")
         (str/includes? presentation-source "Array.isArray(raw)")
         (str/includes? live-observer-source "renderLiveObserverState")
         (str/includes? live-observer-source "renderLiveInspector")
         (str/includes? live-observer-source "Raw JSON")
         (str/includes? capture-source "recordLiveEvent")
         (str/includes? capture-source "renderLiveObserverState"))))
