(ns acceptance.pack-runtime-test
  (:require [acceptance.pack-runtime :as pack-runtime]
            [clojure.test :refer [deftest is]]))

(deftest resolves-handler-namespaces-from-pack-ownership
  (is (= 'acceptance.steps.schema-verification
         (#'pack-runtime/handler-namespace
          "acceptance/src/acceptance/steps/schema_verification.clj")))
  (is (= ['acceptance.steps.command-registry
          'acceptance.steps.palette]
         (#'pack-runtime/registered-handler-namespaces
          "features/simple-command-palette.feature")))
  (is (= ['acceptance.steps.command-registry
          'acceptance.steps.palette
          'acceptance.steps.hotkey-keymap
          'acceptance.steps.workspace-editor]
         (#'pack-runtime/registered-handler-namespaces
          "features/side-panel-hotkey-keymap.feature")))
  (is (contains?
       (set (#'pack-runtime/registered-handler-namespaces
             "features/data-layer-multiple-observation-sources.feature"))
       'acceptance.steps.observability-library)))

(deftest loads-owned-handlers-and-rejects-unassigned-features
  (is (seq (pack-runtime/handlers-for-feature
            "features/data-layer-schema-verification.feature")))
  (is (thrown-with-msg?
       clojure.lang.ExceptionInfo
       #"Feature is not assigned to a verification pack"
       (pack-runtime/handlers-for-feature "features/unregistered.feature"))))
