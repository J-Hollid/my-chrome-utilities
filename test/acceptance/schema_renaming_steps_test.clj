(ns acceptance.schema-renaming-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-renaming :as schema-renaming]
            [acceptance.steps.schema-revision-lifecycle :as revision-lifecycle]
            [clojure.test :refer [deftest is]]))

(deftest accepts-settled-canonical-rename-evidence
  (let [draft {:proposed "Generic page view"
               :canonicalName "Generic page view"
               :current "Page view"
               :pending ["Rename schema from Page view to Generic page view"]
               :version 3
               :publishBlockedImmediately true
               :publishReady true}
        review {:text (str "Page view working draft will be compared with current revision 3; "
                           "confirmation publishes revision 4. "
                           "Rename schema from Page view to Generic page view. "
                           "Pending changes: policy canonical property.")
                :unchanged true}]
    (is (#'schema-renaming/isolated-rename-draft? draft))
    (is (#'schema-renaming/complete-rename-review? review))
    (is (not (#'schema-renaming/isolated-rename-draft?
              (dissoc draft :canonicalName))))
    (is (not (#'schema-renaming/complete-rename-review?
              (assoc review :text
                     "Rename schema from Page view to Generic page view. Change additional-property policy"))))))

(deftest requires-complete-revision-history-context
  (let [current "Working draft based on revision 4 · 3 pending changes · Product listing · Saved schema working draft · Schema revision 0"]
    (is (#'revision-lifecycle/current-history-status?
         {:history {:status current}}))
    (is (not (#'revision-lifecycle/current-history-status?
              {:history {:status "Working draft based on revision 4 · 3 pending changes"}})))))

(deftest verifies-schema-renaming-features
  (feature-support/verify-feature-suite!
   schema-renaming/feature-files schema-renaming/handlers all/handlers))
