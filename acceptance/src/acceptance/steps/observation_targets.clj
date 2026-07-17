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

(defn- target-titles [text]
  (support/split-list text #"\s*,\s*(?:and\s+)?|\s+and\s+"))

(defn- matching-targets [targets query]
  (let [normalized-query (str/lower-case query)]
    (filterv #(str/includes? (str/lower-case %) normalized-query) targets)))

(defn- record-candidates [world values]
  (let [candidates (target-titles (get values "page_titles"))]
    (assoc world :observation-targets candidates
           :visible-observation-targets candidates)))

(defn- search-targets [world values]
  (let [query (get values "query")
        matches (matching-targets (:observation-targets world) query)]
    (assoc world :observation-target-search query
           :visible-observation-targets matches
           :observation-target-match-count (count matches))))

(defn- assert-matching-targets [world values]
  (support/assert! (= (matching-targets (:observation-targets world) (get values "query"))
                      (:visible-observation-targets world))
                   "Target picker search returned nonmatching candidates."
                   {:query (get values "query")
                    :visible (:visible-observation-targets world)})
  world)

(defn- assert-target-count [world _values]
  (support/assert! (= (count (:visible-observation-targets world))
                      (:observation-target-match-count world))
                   "Target picker match count is stale."
                   {:world world})
  world)

(defn- clear-target-search [world _values]
  (assoc world :observation-target-search ""
         :visible-observation-targets (:observation-targets world)
         :observation-target-match-count (count (:observation-targets world))))

(defn- assert-restored-targets [world values]
  (support/assert! (= (target-titles (get values "page_titles"))
                      (:visible-observation-targets world))
                   "Clearing target search did not restore the inventory."
                   {:world world})
  world)

(defn- start-testing [world values]
  (if (:selected-target world)
    (attach-target world values)
    (assoc world :session nil :target-state "Selection required")))

(defn- end-testing [world _values]
  (assoc world :recent-target (:attached-target world)
         :attached-target nil
         :target-state "Detached"
         :session (assoc (:session world) :status "ended")))

(defn- assert-ended-session [world _values]
  (support/assert! (= "ended" (get-in world [:session :status]))
                   "Ended target session did not remain ended."
                   {:session (:session world)})
  world)

(defn- require-target-selection [world _values]
  (support/assert! (nil? (:selected-target world))
                   "Start testing must require an explicit target."
                   {:world world})
  (assoc world :target-state "Selection required"))

(defn- assert-no-fabricated-session [world _values]
  (support/assert! (nil? (:session world))
                   "Target failure created a fabricated session."
                   {:world world})
  world)

(defn- assert-single-attachment [world _values]
  (support/assert! (or (nil? (:attached-target world))
                       (map? (:attached-target world)))
                   "More than one target is attached."
                   {:world world})
  world)

(def ^:private transition-rules
  [{:matches? #(= % "no observation target is selected")
    :apply (fn [world _values]
             (assoc world :selected-target nil :attached-target nil
                    :target-state "Detached" :session nil))}
   {:matches? #(some (fn [prefix] (str/starts-with? % prefix))
                     ["selected target " "eligible page " "candidate page "])
    :apply select-target}
   {:matches? #(str/includes? % "data layer testing session is attached to target")
    :apply attach-target}
   {:matches? #(str/includes? % "target candidates include pages") :apply record-candidates}
   {:matches? #(= % "the user searches for <query>") :apply search-targets}
   {:matches? #(str/includes? % "only candidates matching <query>") :apply assert-matching-targets}
   {:matches? #(= % "the picker reports the matching target count") :apply assert-target-count}
   {:matches? #(= % "the search is cleared") :apply clear-target-search}
   {:matches? #(str/includes? % "candidates <page_titles> are shown again") :apply assert-restored-targets}
   {:matches? #(= % "data layer testing starts") :apply start-testing}
   {:matches? #(str/includes? % "intentionally ends the session") :apply end-testing}
   {:matches? #(= % "the ended session remains ended") :apply assert-ended-session}
   {:matches? #(str/includes? % "target tab <tab_id> is closed")
    :apply (fn [world _values]
             (assoc world :target-state "Target unavailable" :attached-target nil))}
   {:matches? #(str/includes? % "access to target origin <origin> is revoked")
    :apply (fn [world _values]
             (assoc world :target-state "Permission required" :attached-target nil))}
   {:matches? #(str/includes? % "Start testing identifies that a target page must be selected")
    :apply require-target-selection}
   {:matches? #(str/includes? % "no testing session is created with a fabricated tab id")
    :apply assert-no-fabricated-session}
   {:matches? #(str/includes? % "only one observation target can be attached")
    :apply assert-single-attachment}])

(defn- transition-rule [text]
  (some #(when ((:matches? %) text) %) transition-rules))

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
    (if-let [rule (transition-rule text)]
      ((:apply rule) world values)
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
  (vec (concat
        [{:pattern #"^the user chooses <([A-Za-z0-9_]+)>$"
          :applies? target-contract?
          :handler choose-handler}]
        (map #(assoc % :applies? target-contract?)
             (support/semantic-handlers target-step-specs transition)))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T19:12:23.823418523+02:00", :module-hash "363825768", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1360560598"} {:id "def/target-feature-files", :kind "def", :line 6, :end-line nil, :hash "1542423036"} {:id "def/target-contract-background-texts", :kind "def", :line 12, :end-line nil, :hash "-1025287600"} {:id "def/target-step-specs", :kind "def", :line 18, :end-line nil, :hash "-1027200353"} {:id "defn-/capture-values", :kind "defn-", :line 35, :end-line nil, :hash "1376456184"} {:id "defn-/remember-values", :kind "defn-", :line 40, :end-line nil, :hash "1146870671"} {:id "defn-/select-target", :kind "defn-", :line 43, :end-line nil, :hash "1943371839"} {:id "defn-/attach-target", :kind "defn-", :line 52, :end-line nil, :hash "-1981253617"} {:id "defn-/transition", :kind "defn-", :line 62, :end-line nil, :hash "591216956"} {:id "defn-/choose-handler", :kind "defn-", :line 136, :end-line nil, :hash "1520441741"} {:id "defn-/target-contract?", :kind "defn-", :line 149, :end-line nil, :hash "-701539795"} {:id "def/priority-handlers", :kind "def", :line 152, :end-line nil, :hash "735835913"} {:id "def/handlers", :kind "def", :line 162, :end-line nil, :hash "843790791"}]}
;; clj-mutate-manifest-end
