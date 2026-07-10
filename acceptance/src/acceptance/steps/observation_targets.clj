(ns acceptance.steps.observation-targets
  (:require [acceptance.steps.data-layer-observer :as observer]
            [acceptance.steps.data-layer-page-context :as page-context]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def target-feature-files
  ["features/data-layer-observation-target-selection.feature"
   "features/data-layer-observation-target-access.feature"
   "features/data-layer-observation-target-lifecycle.feature"
   "features/data-layer-observation-target-commands.feature"
   "features/data-layer-active-page-read-result.feature"
   "features/data-layer-active-tab-page-context.feature"
   "features/data-layer-history-array-observer.feature"
   "features/data-layer-live-history-push-capture.feature"
   "features/data-layer-live-operator-layout.feature"
   "features/data-layer-multiple-observation-sources.feature"
   "features/data-layer-observation-subscription-lifecycle.feature"
   "features/data-layer-observer-workspace.feature"
   "features/data-layer-page-window-observation.feature"
   "features/data-layer-pageload-observation-refresh.feature"
   "features/data-layer-session-recovery.feature"
   "features/data-layer-testing-session.feature"])

(def target-step-specs
  (support/feature-step-specs
   target-feature-files
   #{"a repository for project <project_name>"
     "history array path <history_path> is configured"
     "a data layer testing session is active"
     "the project skeleton is inspected"
     "package metadata identifies the project as <project_name>"
     "the side panel is open at <side_panel_url>"
     "the user searches for <query>"
     "the search is cleared"
     "the user chooses <discovery_action>"}))

(defn- target-source! []
  (let [files (support/source-file-map (support/repository-root)
                                       ["src/data-layer-observation-targets.ts"
                                        "src/side-panel.ts"
                                        "src/commands.ts"
                                        "src/active-page-observation.ts"
                                        "manifest.json"])]
    (support/assert! (and (str/includes? (files "src/data-layer-observation-targets.ts") "attachSelectedObservationTarget")
                          (str/includes? (files "src/side-panel.ts") "choose-observation-target")
                          (str/includes? (files "src/commands.ts") "data-layer.choose-observation-target")
                          (str/includes? (files "manifest.json") "optional_permissions"))
                     "Observation-target behavior is not wired through the domain, panel, commands, and optional access boundary."
                     {:files (keys files)})
    files))

(defn- capture-values [example captures]
  (into {}
        (map (fn [key] [key (support/require-example example key)]))
        (support/capture-placeholder-keys captures)))

(defn- transition [world example captures {:keys [keyword text]}]
  (let [values (capture-values example captures)
        world (assoc world :observation-target-source (or (:observation-target-source world)
                                                           (target-source!)))
        world (assoc world :observation-target-values
                     (merge (:observation-target-values world) values))]
    (cond
      (= text "selected target page <page_url> defines history array path <history_path> with existing entry <event_name>")
      (observer/define-active-page-window-with-entry world
                                                     {:page-url (get values "page_url")
                                                      :history-path (get values "history_path")
                                                      :event-name (get values "event_name")})

      (= text "selected target page <page_url> cannot be read by the extension")
      (observer/define-unreadable-active-page world {:page-url (get values "page_url")})

      (= text "the selected observation target URL is <page_url>")
      (page-context/set-active-tab-url world (get values "page_url"))

      (= text "the selected target tab navigates from <start_url> to page <page_url>")
      (page-context/navigate-active-tab world {:start-url (get values "start_url")
                                                :page-url (get values "page_url")})

      (= text "the selected target tab navigates to page <next_url>")
      (observer/reinstall-observer world {:history-path (:history-path world)
                                          :page-url (get values "next_url")})

      (= text "page <page_url> appends history entry <event_name> with payload <payload_label>")
      (page-context/page-appends-history-entry world {:page-url (get values "page_url")
                                                       :event-name (get values "event_name")
                                                       :payload-label (get values "payload_label")})

      (= text "the extension reads history array path <history_path> from the selected target page")
      (observer/read-active-page-history-path world (get values "history_path"))

      (= text "observation starts for the selected target page")
      (cond
        (:active-page-window world) (observer/start-active-page-observation world)
        (:sources world) (assoc world :events
                                (mapv (fn [source]
                                        {:source-id (:id source)
                                         :source-name (:name source)
                                         :source-kind (:kind source)})
                                      (:sources world)))
        :else world)

      (= text "data layer testing is started from the side panel for the selected target page")
      (observer/start-side-panel-live-capture world)

      (= text "the selected target page pushes history entry <event_name> with payload <payload_label>")
      (observer/page-push world (get values "event_name") (get values "payload_label"))

      (= text "no observation target is selected")
      (assoc world :selected-target nil :attached-target nil :target-state "Detached")

      (str/starts-with? text "selected target ")
      (assoc world :selected-target (or (get values "page_title")
                                        (get values "page_url")
                                        "selected target"))

      (str/includes? text "data layer testing session is attached to target")
      (assoc world :attached-target (get values "page_title") :target-state "Attached")

      (str/includes? text "target tab <tab_id> is closed")
      (assoc world :target-state "Target unavailable" :attached-target nil)

      (str/includes? text "access to target origin <origin> is revoked")
      (assoc world :target-state "Permission required" :attached-target nil)

      (str/includes? text "Start testing identifies that a target page must be selected")
      (do (support/assert! (nil? (:selected-target world))
                           "Start testing must require an explicit target."
                           {:world world}) world)

      (str/includes? text "no testing session is created with a fabricated tab id")
      (do (support/assert! (not (str/includes? (get-in world [:observation-target-source "src/side-panel.ts"]) "tabId: observation.tabId ?? 1"))
                           "Side panel fabricates a tab identifier."
                           {}) world)

      (str/includes? text "only one observation target can be attached")
      (do (support/assert! (str/includes? (get-in world [:observation-target-source "src/data-layer-observation-targets.ts"])
                                         "attachedTargetId")
                           "Target state does not represent a single attached target."
                           {}) world)

      :else
      (support/record-semantic-observation world :observation-target-action
                                           :observation-target-observations text text example))))

(def handlers
  (conj (vec (concat
              [{:pattern #"^the user chooses <([A-Za-z0-9_]+)>$"
                :handler (fn [world example [action-key]]
                           (if (= action-key "run_action")
                             (let [action (support/require-example example action-key)]
                               (support/assert! (contains? #{"Run step" "Run all"} action)
                                                "Run action fixture is incorrect." {})
                               (assoc world :run-action action
                                      :executed (if (= action "Run step")
                                                  (vec (take 1 (get-in world [:sequence :steps])))
                                                  (get-in world [:sequence :steps]))))
                             (support/record-semantic-observation world :observation-target-action
                                                                  :observation-target-observations
                                                                  "the user chooses target discovery" action-key example)))}]
              (support/semantic-handlers target-step-specs transition)))
        {:pattern #"^the search is cleared$"
         :handler (fn [world _ _]
                    (if (:observation-target-values world)
                      (assoc world :observation-target-search "")
                      world))}))
