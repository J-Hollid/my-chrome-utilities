(ns acceptance.steps.schema-workspace-runtime
  (:require [acceptance.steps.schema-workspace-runtime-browser-assertions :as browser-assertions]
            [acceptance.steps.schema-workspace-runtime-editor-transitions :as editor-transitions]
            [acceptance.steps.schema-workspace-runtime-export-transitions :as export-transitions]
            [acceptance.steps.schema-workspace-runtime-support :as runtime]
            [acceptance.steps.schema-workspace-runtime-validation-transitions :as validation-transitions]
            [acceptance.steps.support :as support]))

(def feature-file "features/data-layer-schema-workspace-runtime-completion.feature")
(def visibility-feature-file "features/data-layer-schema-rule-editor-visibility.feature")
(defonce browser-workspace-observations (atom {}))

(defn- assert-export-preflight! [observation]
  (runtime/assert-export-preflight! observation))

(defn- validate-browser-workspace! [observation]
  (support/assert! (true? (:mounted observation)) "Production Schema workspace did not mount." {:observation observation})
  (support/assert! (= "Order complete schema" (get-in observation [:sourceCreation :name]))
                   "Library Create schema did not invoke the production source callback." {:observation observation})
  (support/assert! (= "schema-library-v1.json" (get-in observation [:transfer :downloadName]))
                   "Schema Library export did not produce the versioned download." {:observation observation})
  (assert-export-preflight! observation)
  (support/assert! (= (get-in observation [:transfer :before]) (get-in observation [:transfer :reloaded]))
                   "Schema Library import did not persist every exported identity." {:observation observation})
  (support/assert! (= ["Disable" "Remove"] (get-in observation [:rules :actions]))
                   "Property rule menus did not expose production actions." {:observation observation})
  (support/assert! (every? true? (map #(get-in observation [:rules %]) [:menuOpen :returnFocus :stateReturnFocus]))
                   "Property rule menu disclosure or focus return failed." {:observation observation})
  (support/assert! (= "Re-enable" (get-in observation [:rules :reenable]))
                   "Property rule disable and re-enable did not persist." {:observation observation})
  (support/assert! (= "event-history" (get-in observation [:assignment :sourceId]))
                   "Schema assignment did not retain its production source." {:observation observation})
  (support/assert! (= 120 (get-in observation [:assignment :priority]))
                   "Schema assignment edit did not persist its production priority." {:observation observation})
  (support/assert! (= "active-inherited" (get-in observation [:inheritance :groups 0 :state]))
                   "Inherited rules did not render in their active state group." {:observation observation})
  (support/assert! (some #{"/example · Known page types v1 · inherited from Checkout schema v2"}
                         (get-in observation [:inheritance :preview]))
                   "Effective-rule preview did not identify the inherited rule origin." {:observation observation})
  (support/assert! (re-find #"Not checked|Valid|warnings|issues" (str (get-in observation [:validation :validation])))
                   "Live Validate did not produce a validation state." {:observation observation})
  observation)

(defn- run-browser-workspace! [fixture]
  (let [environment (cond-> {"SCHEMA_WORKSPACE_BROWSER_ADAPTER" "1"}
                      fixture (assoc "SCHEMA_LIBRARY_EXPORT_FIXTURE" fixture))
        observation (support/load-browser-observation-with-environment!
                      {:environment environment
                       :observation-key :schemaWorkspace
                       :runtime-error "Schema workspace browser runtime verification failed."
                       :missing-error "Schema workspace browser observation is missing."})]
    (validate-browser-workspace! observation)
    (swap! browser-workspace-observations assoc fixture observation)
    observation))

(defn- browser-workspace-observation [fixture]
  (or (get @browser-workspace-observations fixture)
      (run-browser-workspace! fixture)))

(defn- browser-workspace! [world example]
  (if (:browser-observation world)
    world
    (assoc world :browser-observation
           (browser-workspace-observation (runtime/export-fixture example)))))

(def runtime-entry-steps
  #{"the rendered Data Layer Schemas workspace is displayed"
    "the current Schema Library contains <schema_count> schemas and <rule_count> reusable rules"
    "shared browser setup observes an export envelope with format version, schema identities, and rule identities"
    "shared schema export verification compares identity collections separately from envelope metadata"
    "the acceptance parser provides example values <schema_count> and <rule_count> using its supported key representation"})

(def runtime-transitions
  (merge editor-transitions/transitions
         validation-transitions/transitions
         export-transitions/transitions))

(defn- begin-runtime-observation [world example text]
  (if (contains? runtime-entry-steps text)
    (assoc (browser-workspace! world example) :schema-workspace-runtime? true)
    world))

(defn- transition [world example _captures {:keys [text]}]
  (let [world (begin-runtime-observation world example text)]
    (runtime/require-world! world :browser-observation
                            "Schema workspace browser adapter was not executed.")
    (browser-assertions/assert-browser-step! text (:browser-observation world))
    (if-let [step-transition (get runtime-transitions text)]
      (step-transition world example)
      (throw (ex-info "Unsupported schema workspace runtime step." {:step text})))))

(def ^:private visibility-entry-steps
  #{"Data Layer view <view_name> is active"
    "the Schema workspace Rule Library subview is displayed"})

(defn- begin-visibility-observation [world example text]
  (if (contains? visibility-entry-steps text)
    (assoc (browser-workspace! world example) :schema-rule-visibility? true)
    world))

(defn- activate-visibility-view [world example _observation]
  (let [view-name (support/example-value example "view_name")]
    (support/assert! (contains? #{"Live" "Library" "Sessions" "Schemas"} view-name)
                     "Unsupported Data Layer view." {:view view-name})
    (assoc world :active-schema-rule-visibility-view view-name)))

(defn- assert-rule-configuration-hidden [world example observation message]
  (let [view-name (support/example-value example "view_name")]
    (support/assert! (true? (get-in observation [:hiddenByView (keyword view-name)]))
                     message
                     {:view view-name :observation observation})
    world))

(defn- assert-rule-configuration-visible [world _example observation]
  (support/assert! (and (true? (:editorVisible observation))
                        (true? (:configurationVisible observation))
                        (true? (:configurationInsideEditor observation)))
                   "Rule configuration is not visible inside the reusable rule editor."
                   {:observation observation})
  world)

(def ^:private visibility-transitions
  {"Data Layer view <view_name> is active" activate-visibility-view
   "no reusable rule editor is open"
   (fn [world example observation]
     (assert-rule-configuration-hidden
      world example observation
      "Rule configuration is visible while the reusable rule editor is closed."))
   "the active view is displayed" (fn [world _example _observation] world)
   "Rule configuration is not visible"
   (fn [world example observation]
     (assert-rule-configuration-hidden
      world example observation
      "Rule configuration is visible outside the reusable rule editor."))
   "the Schema workspace Rule Library subview is displayed" (fn [world _example _observation] world)
   "the operator opens the reusable rule editor" (fn [world _example _observation] world)
   "Rule configuration is visible inside the reusable rule editor" assert-rule-configuration-visible})

(defn- visibility-transition [world example _captures {:keys [text]}]
  (let [world (begin-visibility-observation world example text)
        observation (get-in world [:browser-observation :ruleEditorVisibility])]
    (if-let [transition (get visibility-transitions text)]
      (transition world example observation)
      (throw (ex-info "Unsupported schema rule visibility step." {:step text})))))

(def ^:private runtime-step-aliases
  {"each row offers Add rule and View attached rules for its complete property path"
   "each row offers Add validation rule and View attached rules for its complete property path"})

(defn- runtime-transition [world example captures spec]
  (transition world example captures
              (update spec :text #(get runtime-step-aliases % %))))

(def runtime-handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world]
                       (or (contains? runtime-entry-steps (:text spec))
                           (:schema-workspace-runtime? world)))
           :handler (fn [world example captures] (runtime-transition world example captures spec))})
        (support/feature-step-specs [feature-file] #{})))

(def visibility-handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world]
                       (or (contains? visibility-entry-steps (:text spec))
                           (:schema-rule-visibility? world)))
           :handler (fn [world example captures]
                      (visibility-transition world example captures spec))})
        (support/feature-step-specs [visibility-feature-file] #{"the Data Layer workspace is displayed"})))

(def handlers (vec (concat visibility-handlers runtime-handlers)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T01:09:29.39435896+02:00", :module-hash "839314970", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "549491900"} {:id "def/feature-file", :kind "def", :line 4, :end-line nil, :hash "-1813648721"} {:id "def/visibility-feature-file", :kind "def", :line 5, :end-line nil, :hash "782585494"} {:id "form/3/defonce", :kind "defonce", :line 6, :end-line nil, :hash "2065372164"} {:id "def/canonical-source-names", :kind "def", :line 8, :end-line nil, :hash "1084522028"} {:id "defn-/canonical-source?", :kind "defn-", :line 12, :end-line nil, :hash "1463562921"} {:id "defn-/export-fixture", :kind "defn-", :line 15, :end-line nil, :hash "376473154"} {:id "defn-/assert-export-preflight!", :kind "defn-", :line 20, :end-line nil, :hash "1666428955"} {:id "defn-/validate-browser-workspace!", :kind "defn-", :line 35, :end-line nil, :hash "-1042141668"} {:id "defn-/run-browser-workspace!", :kind "defn-", :line 63, :end-line nil, :hash "1130236019"} {:id "defn-/browser-workspace-observation", :kind "defn-", :line 75, :end-line nil, :hash "-922079562"} {:id "defn-/browser-workspace!", :kind "defn-", :line 79, :end-line nil, :hash "-8880884"} {:id "defn-/require!", :kind "defn-", :line 85, :end-line nil, :hash "-936314498"} {:id "defn-/source-value", :kind "defn-", :line 88, :end-line nil, :hash "1957517251"} {:id "defn-/count-value", :kind "defn-", :line 91, :end-line nil, :hash "-1818484422"} {:id "defn-/assert-export-counts!", :kind "defn-", :line 94, :end-line nil, :hash "-737297105"} {:id "defn-/assert-browser-step!", :kind "defn-", :line 109, :end-line nil, :hash "-1661936637"} {:id "defn-/transition", :kind "defn-", :line 173, :end-line nil, :hash "-267095413"} {:id "def/visibility-entry-steps", :kind "def", :line 395, :end-line nil, :hash "-889792007"} {:id "defn-/begin-visibility-observation", :kind "defn-", :line 399, :end-line nil, :hash "-1955634581"} {:id "defn-/activate-visibility-view", :kind "defn-", :line 404, :end-line nil, :hash "1944164230"} {:id "defn-/assert-rule-configuration-hidden", :kind "defn-", :line 410, :end-line nil, :hash "-967894054"} {:id "defn-/assert-rule-configuration-visible", :kind "defn-", :line 417, :end-line nil, :hash "1957385540"} {:id "def/visibility-transitions", :kind "def", :line 425, :end-line nil, :hash "436198965"} {:id "defn-/visibility-transition", :kind "defn-", :line 442, :end-line nil, :hash "1101527031"} {:id "def/runtime-step-aliases", :kind "def", :line 449, :end-line nil, :hash "817088383"} {:id "defn-/runtime-transition", :kind "defn-", :line 453, :end-line nil, :hash "539643905"} {:id "def/runtime-handlers", :kind "def", :line 457, :end-line nil, :hash "930692809"} {:id "def/visibility-handlers", :kind "def", :line 470, :end-line nil, :hash "-2063408008"} {:id "def/handlers", :kind "def", :line 481, :end-line nil, :hash "348612342"}]}
;; clj-mutate-manifest-end
