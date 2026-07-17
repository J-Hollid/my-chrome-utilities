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

(deftest caches-created-runtime-values-only-while-a-pack-cache-is-bound
  (let [created (atom 0)
        create! #(swap! created inc)]
    (is (= [1 2]
           [(pack-runtime/cached-runtime! :browser create!)
            (pack-runtime/cached-runtime! :browser create!)]))
    (is (= 2 @created)))
  (let [cache (atom {:values {}})
        created (atom 0)
        create! #(swap! created inc)]
    (binding [pack-runtime/*runtime-cache* cache]
      (is (= [1 1 2]
             [(pack-runtime/cached-runtime! :browser create!)
              (pack-runtime/cached-runtime! :browser create!)
              (pack-runtime/cached-runtime! :command create!)])))
    (is (= 2 @created))
    (is (= {:browser 1 :command 2} (:values @cache)))))
