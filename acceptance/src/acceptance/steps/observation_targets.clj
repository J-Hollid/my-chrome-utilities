(ns acceptance.steps.observation-targets
  (:require [acceptance.steps.observation-targets-support :as target-support]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def target-feature-files
  ["features/data-layer-observation-target-selection.feature"
   "features/data-layer-observation-target-access.feature"
   "features/data-layer-observation-target-lifecycle.feature"
   "features/data-layer-observation-target-commands.feature"])

(def target-contract-background-texts
  #{"the Data Layer Live view is displayed"
    "the observation target picker is displayed"
    "a data layer testing session is attached to target <page_title> in tab <tab_id>"
    "observation target controls are available in the Data Layer Live view"})

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
     "the user chooses <discovery_action>"
     "the Data Layer Live view is displayed"
     "the observation target picker is displayed"
     "a data layer testing session is attached to target <page_title> in tab <tab_id>"
     "observation target controls are available in the Data Layer Live view"}))

(defn- capture-values [example captures]
  (into {}
        (map (fn [key] [key (support/require-example example key)]))
        (support/capture-placeholder-keys captures)))

(defn- remember-values [world values]
  (update world :observation-target-values merge values))

(defn- select-target [world values]
  (assoc world
         :selected-target {:title (or (get values "page_title")
                                      (get values "page_url")
                                      "selected target")
                           :tab-id (get values "tab_id")
                           :page-url (get values "page_url")}
         :target-state "Detached"))

(defn- attach-target [world values]
  (let [target (or (:selected-target world)
                   {:title (or (get values "page_title") "selected target")
                    :tab-id (get values "tab_id")})]
    (assoc world
           :selected-target target
           :attached-target target
           :target-state "Attached"
           :session {:target target :events [] :status "active"})))

(defn- transition [world example captures {:keys [keyword text]}]
  (let [capture-keys (support/capture-placeholder-keys captures)
        example-keys (map name (clojure.core/keys example))
        example (target-support/validate-example!
                 example (concat capture-keys example-keys))
        values (capture-values example captures)
        world (-> world
                  (remember-values values)
                  (update :observation-target-history (fnil conj []) text))
        world (if (= keyword "When")
                (assoc world :observation-target-action
                       {:text text :example example})
                world)]
    (cond
      (= text "no observation target is selected")
      (assoc world :selected-target nil :attached-target nil
             :target-state "Detached" :session nil)

      (or (str/starts-with? text "selected target ")
          (str/starts-with? text "eligible page ")
          (str/starts-with? text "candidate page "))
      (select-target world values)

      (str/includes? text "data layer testing session is attached to target")
      (attach-target world values)

      (= text "data layer testing starts")
      (if (:selected-target world)
        (attach-target world values)
        (assoc world :session nil :target-state "Selection required"))

      (str/includes? text "intentionally ends the session")
      (assoc world
             :recent-target (:attached-target world)
             :attached-target nil
             :target-state "Detached"
             :session (assoc (:session world) :status "ended"))

      (= text "the ended session remains ended")
      (do (support/assert! (= "ended" (get-in world [:session :status]))
                           "Ended target session did not remain ended."
                           {:session (:session world)})
          world)

      (str/includes? text "target tab <tab_id> is closed")
      (assoc world :target-state "Target unavailable" :attached-target nil)

      (str/includes? text "access to target origin <origin> is revoked")
      (assoc world :target-state "Permission required" :attached-target nil)

      (str/includes? text "Start testing identifies that a target page must be selected")
      (do (support/assert! (nil? (:selected-target world))
                           "Start testing must require an explicit target."
                           {:world world})
          (assoc world :target-state "Selection required"))

      (str/includes? text "no testing session is created with a fabricated tab id")
      (do (support/assert! (nil? (:session world))
                           "Target failure created a fabricated session."
                           {:world world})
          world)

      (str/includes? text "only one observation target can be attached")
      (do (support/assert! (or (nil? (:attached-target world))
                               (map? (:attached-target world)))
                           "More than one target is attached."
                           {:world world})
          world)

      :else
      (support/record-semantic-observation
       world :observation-target-action :observation-target-observations
       text text example))))

(defn- choose-handler [world example [action-key]]
  (if (= action-key "run_action")
    (let [action (support/require-example example action-key)]
      (support/assert! (contains? #{"Run step" "Run all"} action)
                       "Run action fixture is incorrect." {})
      (assoc world :run-action action
             :executed (if (= action "Run step")
                         (vec (take 1 (get-in world [:sequence :steps])))
                         (get-in world [:sequence :steps]))))
    (support/record-semantic-observation
     world :observation-target-action :observation-target-observations
     "the user chooses target discovery" action-key example)))

(defn- target-contract? [world]
  (true? (:observation-target-contract world)))

(def priority-handlers
  (mapv (fn [text]
          {:pattern (support/template-pattern text)
           :handler (fn [world example _captures]
                      (cond-> world
                        (or (not= text "the Data Layer Live view is displayed")
                            (support/example-value example "history_path"))
                        (assoc :observation-target-contract true)))})
        target-contract-background-texts))

(def handlers
  (conj (vec (concat
              [{:pattern #"^the user chooses <([A-Za-z0-9_]+)>$"
                :applies? target-contract?
                :handler choose-handler}]
              (map #(assoc % :applies? target-contract?)
                   (support/semantic-handlers target-step-specs transition))))
        {:pattern #"^the search is cleared$"
         :applies? target-contract?
         :handler (fn [world _ _]
                    (assoc world :observation-target-search ""))}))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T19:12:23.823418523+02:00", :module-hash "363825768", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1360560598"} {:id "def/target-feature-files", :kind "def", :line 6, :end-line nil, :hash "1542423036"} {:id "def/target-contract-background-texts", :kind "def", :line 12, :end-line nil, :hash "-1025287600"} {:id "def/target-step-specs", :kind "def", :line 18, :end-line nil, :hash "-1027200353"} {:id "defn-/capture-values", :kind "defn-", :line 35, :end-line nil, :hash "1376456184"} {:id "defn-/remember-values", :kind "defn-", :line 40, :end-line nil, :hash "1146870671"} {:id "defn-/select-target", :kind "defn-", :line 43, :end-line nil, :hash "1943371839"} {:id "defn-/attach-target", :kind "defn-", :line 52, :end-line nil, :hash "-1981253617"} {:id "defn-/transition", :kind "defn-", :line 62, :end-line nil, :hash "591216956"} {:id "defn-/choose-handler", :kind "defn-", :line 136, :end-line nil, :hash "1520441741"} {:id "defn-/target-contract?", :kind "defn-", :line 149, :end-line nil, :hash "-701539795"} {:id "def/priority-handlers", :kind "def", :line 152, :end-line nil, :hash "735835913"} {:id "def/handlers", :kind "def", :line 162, :end-line nil, :hash "843790791"}]}
;; clj-mutate-manifest-end
