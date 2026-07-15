(ns acceptance.steps.saved-event-feed-filters
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-saved-event-feed-filters.feature"
   "features/data-layer-saved-event-feed-filters-runtime.feature"])

(def entry-modes
  {"a testing session has captured events with different names, paths, payloads, sources, and validation results" :model
   "the built extension side panel is running with production Live capture, event-feed queries, saved-session feeds, and local persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified? "Saved event feed filter model verification failed. "
   "node" "test/data-layer-saved-event-feed-filters-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SAVED_EVENT_FEED_FILTERS_BROWSER_ADAPTER"
    :observation-key :savedEventFeedFilters
    :runtime-error "Saved event feed filter browser runtime failed."
    :missing-error "Saved event feed filter browser evidence is missing."}))

(defn- assert-runtime! [{:keys [initial created checkoutApplied switchOpen cancelled switched savedSwitch reverted failures renamed deleted duplicate isolation fresh reloaded selectorWidth rootWidth] :as observed}]
  (support/assert! (and (= "All events" (:identity initial)) (:saveAbsent initial) (:withinWidth initial))
                   "The production feed did not begin with the expected saved-filter identity and constrained layout." initial)
  (support/assert! (and (= "Checkout issues" (:identity created))
                        (= "1 of 3 events" (:count created))
                        (= ["conditions" "id" "match" "name" "valueMatch" "version"] (:storageKeys created))
                        (empty? (:eventKeys created))
                        (= [["Event name" "is" ["purchase"]] ["Validation state" "is" ["Issues"]]]
                           (mapv (juxt :field :operator :values) (get-in created [:stored :conditions]))))
                   "Create did not persist one semantic, capture-free saved filter." created)
  (support/assert! (and (= "Checkout issues" (:identity checkoutApplied))
                        (= "1 of 3 events" (:count checkoutApplied))
                        (str/includes? (:conditions checkoutApplied) "Event name is purchase"))
                   "Applying a saved filter did not replace and recalculate the production query." checkoutApplied)
  (support/assert! (and switchOpen (= "Checkout issues · Modified" cancelled)
                        (= {:identity "Product events" :count "1 of 3 events" :checkoutUnchanged true} switched)
                        (= {:identity "Product events" :updated true} savedSwitch))
                   "Modified-filter switching did not preserve Save/Discard/Cancel semantics."
                   {:open switchOpen :cancelled cancelled :switched switched})
  (support/assert! (= {:identity "Checkout issues" :conditionCount 3} reverted)
                   "Revert did not restore the saved semantic query." reverted)
  (support/assert! (= [["update" true "Updating saved filter failed"]
                       ["rename" true "Renaming saved filter failed"]
                       ["default" true "Setting default failed"]
                       ["delete" true "Deleting saved filter failed"]
                       ["create" true "Saving saved filter failed"]]
                      (mapv (juxt :operation :unchanged :feedback) failures))
                   "A production storage failure partially committed or displayed success feedback." failures)
  (support/assert! (and (= "Purchase defects" (:identity renamed)) (:sameId renamed) (:originalUnchanged renamed) (:defaultId renamed))
                   "Copy, rename, identity, or default behavior was incorrect." renamed)
  (support/assert! (and (= "Custom · Unsaved" (:identity deleted)) (= 4 (:queryRetained deleted))
                        (:defaultRemoved deleted) (:filterRemoved deleted) (= 19 (:scroll deleted)))
                   "Delete did not atomically remove identity/default while retaining the working feed." deleted)
  (support/assert! (str/includes? duplicate "A saved filter with this name exists")
                   "Trimmed case-insensitive duplicate names were not blocked." duplicate)
  (support/assert! (= {:savedIdentity "Checkout issues" :savedCount "1 of 3 events" :currentIdentity "Custom · Unsaved"
                       :currentWorkingRestored true :globalUnchanged true :archiveUnchanged true}
                      isolation)
                   "Saved-session and current-Live working filters were not isolated." isolation)
  (support/assert! (and (= "Product events" (:identity fresh)) (= "0 of 0 events" (:count fresh))
                        (= (:defaultId fresh) (get-in fresh [:working :activeFilterId]))
                        (= {:identity "Product events" :count "0 of 0 events" :activeId (:defaultId fresh) :libraryCount 2} reloaded)
                        (<= selectorWidth rootWidth))
                   "The default was not installed before a fresh session or the selector overflowed." fresh)
  observed)

(def model-example-values
  {"filter_state" #{"no conditions" "unsaved conditions" "exact saved definition Checkout issues" "changed working copy of Checkout issues"}
   "displayed_state" #{"All events" "Custom · Unsaved" "Checkout issues" "Checkout issues · Modified"}
   "save_behavior" #{"Save current filter is unavailable" "Save current filter is available" "no changes need saving" "Update and Save as new are available"}
   "switch_action" #{"Save changes" "Discard and switch" "Cancel"}
   "saved_outcome" #{"updated with working conditions" "unchanged"}
   "active_outcome" #{"Product events is applied" "modified Checkout issues remains"}
   "candidate_name" #{"blank" "spaces" "checkout issues" "Checkout warnings"}
   "name_result" #{"blocked" "accepted"}
   "assistance" #{"Enter a saved filter name" "A saved filter with this name exists" "Ready to save Checkout warnings"}
   "operation" #{"create" "update" "rename" "delete" "set default"}})

(def runtime-example-values
  {"switch_action" #{"Save changes" "Discard and switch" "Cancel"}
   "persisted_outcome" #{"updated" "unchanged"}
   "rendered_outcome" #{"selected replacement filter" "Checkout issues · Modified"}
   "failure_point" #{"create write" "update write" "rename write" "delete write" "default write"}
   "failure_feedback" #{"Saving saved filter failed" "Updating saved filter failed" "Renaming saved filter failed" "Deleting saved filter failed" "Setting default failed"}})

(def model-example-relations
  [{:keys ["filter_state" "displayed_state" "save_behavior"]
    :rows #{["no conditions" "All events" "Save current filter is unavailable"]
            ["unsaved conditions" "Custom · Unsaved" "Save current filter is available"]
            ["exact saved definition Checkout issues" "Checkout issues" "no changes need saving"]
            ["changed working copy of Checkout issues" "Checkout issues · Modified" "Update and Save as new are available"]}}
   {:keys ["switch_action" "saved_outcome" "active_outcome"]
    :rows #{["Save changes" "updated with working conditions" "Product events is applied"]
            ["Discard and switch" "unchanged" "Product events is applied"]
            ["Cancel" "unchanged" "modified Checkout issues remains"]}}
   {:keys ["candidate_name" "name_result" "assistance"]
    :rows #{["blank" "blocked" "Enter a saved filter name"]
            ["spaces" "blocked" "Enter a saved filter name"]
            ["checkout issues" "blocked" "A saved filter with this name exists"]
            ["Checkout warnings" "accepted" "Ready to save Checkout warnings"]}}])

(def runtime-example-relations
  [{:keys ["switch_action" "persisted_outcome" "rendered_outcome"]
    :rows #{["Save changes" "updated" "selected replacement filter"]
            ["Discard and switch" "unchanged" "selected replacement filter"]
            ["Cancel" "unchanged" "Checkout issues · Modified"]}}
   {:keys ["failure_point" "failure_feedback"]
    :rows #{["create write" "Saving saved filter failed"]
            ["update write" "Updating saved filter failed"]
            ["rename write" "Renaming saved filter failed"]
            ["delete write" "Deleting saved filter failed"]
            ["default write" "Setting default failed"]}}])

(defn- validate-relations! [relations example]
  (doseq [{:keys [keys rows]} relations
          :when (every? #(support/example-value example %) keys)]
    (let [row (mapv #(support/example-value example %) keys)]
      (support/assert! (contains? rows row)
                       "Saved event feed filter example row was outside the specified relationship."
                       {:keys keys :row row :allowed rows}))))

(defn- validate-example! [mode example]
  (let [runtime? (= mode :runtime)]
    (support/validate-mode-example-domain!
     mode runtime-example-values model-example-values example
     "Saved event feed filter example value was outside the specified contract.")
    (validate-relations! (if runtime? runtime-example-relations model-example-relations) example)))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :saved-event-feed-filters-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T03:09:54.994040231+02:00", :module-hash "1511428131", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1481223718"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "877782956"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-406137454"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 19, :hash "1215399982"} {:id "defn-/runtime-observation!", :kind "defn-", :line 21, :end-line 27, :hash "-1463587559"} {:id "defn-/assert-runtime!", :kind "defn-", :line 29, :end-line 73, :hash "1811374143"} {:id "def/model-example-values", :kind "def", :line 75, :end-line 85, :hash "783901510"} {:id "def/runtime-example-values", :kind "def", :line 87, :end-line 92, :hash "-21183591"} {:id "def/model-example-relations", :kind "def", :line 94, :end-line 108, :hash "68015362"} {:id "def/runtime-example-relations", :kind "def", :line 110, :end-line 120, :hash "1930260696"} {:id "defn-/validate-relations!", :kind "defn-", :line 122, :end-line 128, :hash "1769494263"} {:id "defn-/validate-example!", :kind "defn-", :line 130, :end-line 135, :hash "-1838979305"} {:id "def/handlers", :kind "def", :line 137, :end-line 140, :hash "-1683576948"}]}
;; clj-mutate-manifest-end
