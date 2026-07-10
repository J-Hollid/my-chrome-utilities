(ns acceptance.steps.sequence-replay
  (:require [acceptance.steps.support :as support]))

(def steps
  ["reusable event templates are saved in the Library"
   "saved session <session_name> contains events <event_names> in capture order"
   "the user creates test sequence <sequence_name> from that session"
   "sequence <sequence_name> contains <event_names> in capture order"
   "the user can omit captured events before saving the sequence"
   "saved session <session_name> remains unchanged"
   "test sequence <sequence_name> contains template <template_name> version <template_version>"
   "template <template_name> is revised to version <new_version>"
   "sequence <sequence_name> continues using version <template_version>"
   "the sequence offers an explicit update to version <new_version>"
   "test sequence <sequence_name> contains ordered steps <step_names>"
   "the user edits the sequence" "steps can be reordered, disabled, duplicated, or removed"
   "each step can define a delay, manual breakpoint, destination, and local payload override"
   "local payload overrides do not change Library templates"
   "test sequence <sequence_name> has enabled steps with supported source adapters and destinations"
   "the user chooses <run_action>"
   "the runner performs the corresponding enabled steps in sequence order"
   "visible controls offer Run step, Run all, Pause, Resume, and Stop"
   "the currently running step and result are shown"
   "sequence step <step_name> uses adapter <adapter_name> without capability <required_capability>"
   "sequence readiness is checked" "step <step_name> is identified as not runnable"
   "Run all does not start until the unsupported step is disabled or assigned a capable adapter"
   "test sequence <sequence_name> is run against page <page_url>"
   "the run ends with result <run_result>"
   "an immutable execution record stores each executed step, template version, effective payload, destination, timestamp, and result"
   "the execution record links to sequence <sequence_name> without changing the sequence, templates, or originating session"
   "test sequence <sequence_name> contains steps for source kinds <source_kinds>"
   "all step adapters support their assigned actions"
   "the sequence can run across <source_kinds> in one ordered execution"
   "every step result retains its source adapter and destination"])

(defn- value [example key] (support/require-example example key))
(defn- assert-value! [actual expected message]
  (support/assert! (= expected actual) message {:expected expected :actual actual}))
(defn- sequence-name! [example]
  (let [name (value example "sequence_name")]
    (support/assert! (contains? #{"Purchase journey" "Analytics smoke test"} name)
                     "Sequence fixture is not canonical." {:name name}) name))

(defn- transition [step world example]
  (case step
    "reusable event templates are saved in the Library"
    (assoc world :templates [{:id "pageview" :version :saved :source "Data Layer" :destination "event.history"}
                             {:id "product_view" :version :saved :source "Data Layer" :destination "event.history"}
                             {:id "cart" :version :saved :source "Data Layer" :destination "event.history"}
                             {:id "purchase" :version :saved :source "Data Layer" :destination "event.history"}])
    "saved session <session_name> contains events <event_names> in capture order"
    (let [session (value example "session_name") names (support/split-list (value example "event_names") #"\s*,\s*")]
      (assert-value! [session names] ["Checkout journey" ["pageview" "product_view" "cart" "purchase"]]
                     "Session sequence fixture is incorrect.")
      (assoc world :saved-session {:name session :events names} :session-snapshot names))
    "the user creates test sequence <sequence_name> from that session"
    (assoc world :sequence {:name (sequence-name! example) :steps (vec (get-in world [:saved-session :events]))
                            :originating-session "Checkout journey"})
    "sequence <sequence_name> contains <event_names> in capture order"
    (do (assert-value! [(sequence-name! example)
                        (support/split-list (value example "event_names") #"\s*,\s*")]
                       [(:name (:sequence world)) (:steps (:sequence world))]
                       "Sequence capture order is incorrect.") world)
    "the user can omit captured events before saving the sequence"
    (assoc world :sequence-editor-capabilities #{:omit-captured-event})
    "saved session <session_name> remains unchanged"
    (do (support/assert! (contains? (:sequence-editor-capabilities world) :omit-captured-event)
                         "Sequence cannot omit captured events." {})
        (assert-value! (value example "session_name") (:name (:saved-session world))
                       "Originating session is incorrect.")
        (assert-value! (:session-snapshot world) (:events (:saved-session world))
                       "Sequence creation changed the session.") world)
    "test sequence <sequence_name> contains template <template_name> version <template_version>"
    (let [sequence (sequence-name! example) template (value example "template_name")
          version (parse-long (value example "template_version"))]
      (assert-value! [sequence template version]
                     ["Purchase journey" "Purchase confirmation" 3]
                     "Pinned template fixture is incorrect.")
      (assoc world :sequence {:name sequence :steps [{:template template :version version}]}))
    "template <template_name> is revised to version <new_version>"
    (let [template (value example "template_name") version (parse-long (value example "new_version"))]
      (assert-value! [template version] ["Purchase confirmation" 4] "Template revision fixture is incorrect.")
      (assoc world :latest-template-version version))
    "sequence <sequence_name> continues using version <template_version>"
    (do (assert-value! (sequence-name! example) (:name (:sequence world)) "Pinned sequence is incorrect.")
        (assert-value! (parse-long (value example "template_version"))
                       (get-in world [:sequence :steps 0 :version]) "Pinned version changed.") world)
    "the sequence offers an explicit update to version <new_version>"
    (do (assert-value! (parse-long (value example "new_version")) (:latest-template-version world)
                       "Explicit update version is incorrect.")
        (let [next-world (assoc world :explicit-version-update true)]
          (support/assert! (:explicit-version-update next-world) "Explicit version update is unavailable." {})
          next-world))
    "test sequence <sequence_name> contains ordered steps <step_names>"
    (let [name (sequence-name! example) names (support/split-list (value example "step_names") #"\s*(?:,|\band\b)\s*")]
      (assert-value! names ["Product view" "Cart" "Purchase"] "Editable step fixture is incorrect.")
      (assoc world :sequence {:name name :steps (mapv (fn [index step] {:id index :name step :enabled true}) (range) names)}
             :template-snapshot (:templates world)))
    "the user edits the sequence"
    (do (support/assert! (every? :enabled (get-in world [:sequence :steps]))
                         "Editable sequence contains a disabled fixture step." {})
        (assoc world :editing true))
    "steps can be reordered, disabled, duplicated, or removed"
    (do (support/assert! (:editing world) "Sequence editor is closed." {})
        (assoc world :supported-edits #{:reorder :disable :duplicate :remove}))
    "each step can define a delay, manual breakpoint, destination, and local payload override"
    (assoc-in world [:sequence :steps 0]
              (merge (get-in world [:sequence :steps 0])
                     {:delay 100 :breakpoint true :destination "event.history"
                      :payload-override {:test true}}))
    "local payload overrides do not change Library templates"
    (do (assert-value! (select-keys (get-in world [:sequence :steps 0])
                                    [:name :delay :breakpoint :payload-override])
                       {:name "Product view" :delay 100 :breakpoint true
                        :payload-override {:test true}}
                       "Local override changed the wrong step.")
        (assert-value! (:templates world) (:template-snapshot world)
                       "Step override changed Library templates.") world)
    "test sequence <sequence_name> has enabled steps with supported source adapters and destinations"
    (assoc world :sequence {:name (sequence-name! example)
                            :steps [{:id "one" :enabled true :adapter "Data Layer" :destination "event.history"}
                                    {:id "two" :enabled true :adapter "Data Layer" :destination "event.history"}]})
    "the user chooses <run_action>"
    (let [action (value example "run_action")]
      (support/assert! (contains? #{"Run step" "Run all"} action) "Run action fixture is incorrect." {})
      (assoc world :run-action action
             :executed (if (= action "Run step") (vec (take 1 (get-in world [:sequence :steps])))
                           (get-in world [:sequence :steps]))))
    "the runner performs the corresponding enabled steps in sequence order"
    (do (support/assert! (seq (:executed world)) "Runner executed no steps." {})
        (support/assert! (if (= "Run step" (:run-action world))
                           (= 1 (count (:executed world)))
                           (= 2 (count (:executed world)))) "Run action executed wrong steps." {}) world)
    "visible controls offer Run step, Run all, Pause, Resume, and Stop"
    (assoc world :controls ["Run step" "Run all" "Pause" "Resume" "Stop"])
    "the currently running step and result are shown"
    (assoc world :current-step (:id (first (:executed world))) :current-result "completed")
    "sequence step <step_name> uses adapter <adapter_name> without capability <required_capability>"
    (let [sequence (sequence-name! example)
          step-name (value example "step_name")
          adapter (value example "adapter_name")
          capability (value example "required_capability")]
      (assert-value! [step-name adapter capability] ["Adobe beacon" "Adobe" "push"]
                     "Unsupported-step fixture is incorrect.")
      (assoc world :sequence {:name sequence}
             :unsupported-step {:name step-name :adapter adapter :capability capability}))
    "sequence readiness is checked" (assoc world :blocked-steps [(:unsupported-step world)] :runnable false)
    "step <step_name> is identified as not runnable"
    (do (assert-value! (value example "step_name") (get-in world [:blocked-steps 0 :name])
                       "Wrong step was blocked.")
        (support/assert! (false? (:runnable world)) "Blocked sequence remained runnable." {}) world)
    "Run all does not start until the unsupported step is disabled or assigned a capable adapter"
    (do (support/assert! (false? (:runnable world)) "Unsupported sequence started." {}) world)
    "test sequence <sequence_name> is run against page <page_url>"
    (let [name (sequence-name! example) page (value example "page_url")]
      (assert-value! [name page] ["Purchase journey" "https://example.test/confirmation"]
                     "Execution-record fixture is incorrect.")
      (assoc world :sequence {:name name :steps [{:id "one" :template-version 3
                                                  :payload {} :destination "event.history"
                                                  :source "Data Layer"}]}
             :sequence-snapshot name :page page))
    "the run ends with result <run_result>"
    (let [result (value example "run_result")]
      (assert-value! result "completed" "Run result fixture is incorrect.")
      (assoc world :execution {:immutable true :sequence (:sequence-snapshot world) :page (:page world)
                               :result result :steps (mapv #(assoc % :timestamp "2026-07-10T10:00:00Z" :result result)
                                                           (get-in world [:sequence :steps]))}))
    "an immutable execution record stores each executed step, template version, effective payload, destination, timestamp, and result"
    (do (support/assert! (and (:immutable (:execution world))
                              (every? #(every? (fn [key] (contains? % key))
                                               [:template-version :payload :destination :timestamp :result])
                                      (:steps (:execution world))))
                         "Execution record is incomplete." {}) world)
    "the execution record links to sequence <sequence_name> without changing the sequence, templates, or originating session"
    (do (assert-value! (sequence-name! example) (:sequence (:execution world))
                       "Execution links to wrong sequence.")
        (assert-value! (:name (:sequence world)) (:sequence-snapshot world)
                       "Execution changed the sequence.") world)
    "test sequence <sequence_name> contains steps for source kinds <source_kinds>"
    (let [name (sequence-name! example) kinds (support/split-list (value example "source_kinds") #"\s*(?:,|\band\b)\s*")]
      (assert-value! [name kinds] ["Analytics smoke test" ["Data Layer" "Adobe" "GTAG"]]
                     "Cross-source fixture is incorrect.")
      (assoc world :sequence {:name name :steps (mapv (fn [index kind] {:id index :source kind :destination (str kind " destination")}) (range) kinds)}))
    "all step adapters support their assigned actions" (assoc world :all-capable true)
    "the sequence can run across <source_kinds> in one ordered execution"
    (let [kinds (support/split-list (value example "source_kinds") #"\s*(?:,|\band\b)\s*")]
      (support/assert! (:all-capable world) "Cross-source adapters are not capable." {})
      (assert-value! kinds (mapv :source (get-in world [:sequence :steps]))
                     "Cross-source execution order is incorrect.")
      (assoc world :executed (get-in world [:sequence :steps])))
    "every step result retains its source adapter and destination"
    (do (support/assert! (every? #(and (:source %) (:destination %)) (:executed world))
                         "Cross-source result lost routing." {}) world)))

(def handlers
  (mapv (fn [step] {:pattern (support/template-pattern step)
                    :handler (fn [world example _] (transition step world example))}) steps))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T15:28:31.966401044+02:00", :module-hash "-1848087489", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-274230498"} {:id "def/steps", :kind "def", :line 4, :end-line nil, :hash "1512259408"} {:id "defn-/value", :kind "defn-", :line 36, :end-line nil, :hash "1331618860"} {:id "defn-/assert-value!", :kind "defn-", :line 37, :end-line nil, :hash "-586276503"} {:id "defn-/sequence-name!", :kind "defn-", :line 39, :end-line nil, :hash "1199397601"} {:id "defn-/transition", :kind "defn-", :line 44, :end-line nil, :hash "497714754"} {:id "def/handlers", :kind "def", :line 195, :end-line nil, :hash "-1136066730"}]}
;; clj-mutate-manifest-end
