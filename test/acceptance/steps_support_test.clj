(ns acceptance.steps-support-test
  (:require [acceptance.pack-runtime :as packs]
            [acceptance.steps.support :as support]
            [babashka.process :as process]
            [clojure.test :refer [deftest is]]))

(deftest build-command-captures-failed-process-output
  (is (= {:out :string
          :err :string
          :continue true}
         support/build-shell-options)))

(deftest json-reading-rejects-missing-files-before-parsing
  (is (sequential? (support/read-json "verification/packs.json")))
  (is (thrown? clojure.lang.ExceptionInfo
               (support/read-json "tmp/does-not-exist.json"))))

(deftest checks-source-text-against-required-signals
  (is (support/includes-all? "alpha beta gamma" ["alpha" "gamma"]))
  (is (not (support/includes-all? "alpha beta" ["alpha" "gamma"])))
  (is (support/matches-all? "const answer = 42;" [#"answer" #"\d+"]))
  (is (not (support/matches-all? "const answer = value;" [#"answer" #"\d+"]))))

(deftest navigation-order-and-placeholder-captures-use-strict-boundaries
  (is (true? (#'support/strictly-increasing? [0 1 2 3])))
  (is (false? (#'support/strictly-increasing? [0 1 1 3])))
  (is (= ["page_title" "tab_id"]
         (support/capture-placeholder-keys
          ["<page_title>" nil 42 "not-a-placeholder" "<tab_id>"]))))

(deftest browser-observations-parse-keywordized-json
  (with-redefs [process/shell (fn [& _]
                                {:exit 0
                                 :out "noise\n{\"observation\":{\"ready\":true}}\n"
                                 :err ""})]
    (is (= {:ready true}
           (support/load-browser-observation-with-environment!
            {:environment {}
             :observation-key :observation
             :runtime-error "runtime failed"
             :missing-error "missing"})))))

(deftest browser-and-command-verification-respect-local-and-pack-caches
  (let [browser-calls (atom 0)
        command-calls (atom 0)]
    (with-redefs [support/load-browser-observation!
                  (fn [_] {:call (swap! browser-calls inc)})
                  process/shell
                  (fn [& _]
                    (swap! command-calls inc)
                    {:exit 0 :out "" :err ""})]
      (let [cache (atom nil)]
        (is (= {:call 1} (support/cached-browser-observation! cache {:adapter-env "A"})))
        (is (= {:call 1} (support/cached-browser-observation! cache {:adapter-env "A"})))
        (is (= 1 @browser-calls)))
      (let [cache (atom false)]
        (is (true? (support/cached-command-verification! cache "failed" "verify")))
        (support/cached-command-verification! cache "failed" "verify")
        (is (true? @cache))
        (is (= 1 @command-calls)))
      (reset! browser-calls 0)
      (reset! command-calls 0)
      (binding [packs/*runtime-cache* (atom {:values {}})]
        (let [browser-cache (atom nil)
              command-cache (atom false)]
          (is (= {:call 1}
                 (support/cached-browser-observation! browser-cache
                                                      {:adapter-env "A"
                                                       :observation-key :view})))
          (is (= {:call 1}
                 (support/cached-browser-observation! browser-cache
                                                      {:adapter-env "A"
                                                       :observation-key :view})))
          (is (nil? @browser-cache))
          (is (true? (support/cached-command-verification!
                      command-cache "failed" "verify")))
          (is (true? (support/cached-command-verification!
                      command-cache "failed" "verify")))
          (is (false? @command-cache))))
      (is (= 1 @browser-calls))
      (is (= 1 @command-calls)))))

(deftest stateful-observation-loads-on-entry-and-reuses-later-state
  (let [calls (atom 0)
        observe! #(do (swap! calls inc) {:ready true})
        [entered observed] (support/stateful-observation
                            {} "entry" #{"entry"} :observed observe! "missing")
        [continued reused] (support/stateful-observation
                            entered "later" #{"entry"} :observed observe! "missing")]
    (is (= {:ready true} observed))
    (is (= {:ready true} reused))
    (is (= entered continued))
    (is (= 1 @calls))))

(deftest runtime-mode-invokes-the-boundary-and-model-mode-does-not
  (let [verified (atom 0)
        validated (atom [])
        boundaries (atom 0)
        transition (fn [world text]
                     (support/mode-transition
                      world {:value text} text
                      {"runtime entry" :runtime "model entry" :model}
                      :mode
                      #(swap! verified inc)
                      #(swap! validated conj [%1 %2])
                      #(swap! boundaries inc)))
        runtime-world (transition {} "runtime entry")
        runtime-boundary-count @boundaries
        model-world (transition {} "model entry")]
    (is (= :runtime (:mode runtime-world)))
    (is (= :model (:mode model-world)))
    (is (= 2 @verified))
    (is (= [[:runtime {:value "runtime entry"}]
            [:model {:value "model entry"}]]
           @validated))
    (is (= 1 runtime-boundary-count))
    (is (= 1 @boundaries))))

(deftest observation-example-validation-runs-every-present-validator
  (let [calls (atom [])
        observation {:ready true}
        result (support/validate-observation-example!
                {"first" "a" "second" "b"}
                observation
                [["first" :first-check] ["missing" :missing-check]
                 ["second" :second-check]]
                (fn [_example _observation validation]
                  (swap! calls conj validation)))]
    (is (= observation result))
    (is (= [:first-check :second-check] @calls))))

(deftest selects-example-domains-by-execution-mode
  (let [runtime-values {"value" #{"runtime"}}
        model-values {"value" #{"model"}}]
    (is (= {"value" "runtime"}
           (support/validate-mode-example-domain!
            :runtime runtime-values model-values {"value" "runtime"} "invalid runtime value")))
    (is (= {"value" "model"}
           (support/validate-mode-example-domain!
            :model runtime-values model-values {"value" "model"} "invalid model value")))
    (is (= :rejected
           (try
             (support/validate-mode-example-domain!
              :runtime runtime-values model-values {"value" "model"} "invalid runtime value")
             :accepted
             (catch Exception _ :rejected))))))

(deftest validates-example-relations-when-all-keys-are-present
  (let [relations [{:keys ["left" "right"]
                    :rows #{["a" "b"]}}]]
    (is (= {"left" "a" "right" "b"}
           (support/validate-example-relations!
            relations {"left" "a" "right" "b"} "invalid relation")))
    (is (= {"left" "a"}
           (support/validate-example-relations!
            relations {"left" "a"} "invalid relation")))
    (is (= :rejected
           (try
             (support/validate-example-relations!
              relations {"left" "a" "right" "c"} "invalid relation")
             :accepted
             (catch Exception _ :rejected))))))

(deftest feature-mode-entry-handlers-are-scoped-to-their-own-feature
  (let [entry "the specification builder is open for Generic pageview revision 4"
        handlers (support/feature-mode-handlers
                  ["features/data-layer-schema-specification-example-selection.feature"]
                  {entry :model}
                  :example-mode
                  (fn [world _ _ _] world))
        handler (some #(when (re-matches (:pattern %) entry) %) handlers)]
    (is handler)
    (is ((:applies? handler) {:acceptance/feature-name "Data layer schema specification example selection"}))
    (is (not ((:applies? handler) {:acceptance/feature-name "Data layer schema specification builder customization"})))))

(deftest stateful-handlers-are-scoped-to-their-own-feature
  (let [feature-file "features/data-layer-schema-specification-example-selection.feature"
        feature-name "Data layer schema specification example selection"
        entry "the specification builder is open for Generic pageview revision 4"
        handlers (support/feature-scoped-stateful-handlers
                  [feature-file] #{entry} :example-state
                  (fn [world _ _ _] world))
        entry-handler (some #(when (re-matches (:pattern %) entry) %) handlers)
        later-handler (first (remove #{entry-handler} handlers))]
    (is ((:applies? entry-handler) {:acceptance/feature-name feature-name}))
    (is (not ((:applies? entry-handler)
              {:acceptance/feature-name "Data layer schema specification builder customization"})))
    (is (not ((:applies? later-handler) {:acceptance/feature-name feature-name})))
    (is ((:applies? later-handler)
         {:acceptance/feature-name feature-name :example-state true}))))

(deftest validates-mode-specific-example-domains-and-relations-together
  (let [runtime-values {"left" #{"runtime"} "right" #{"value"}}
        model-values {"left" #{"model"} "right" #{"value"}}
        runtime-relations [{:keys ["left" "right"] :rows #{["runtime" "value"]}}]
        model-relations [{:keys ["left" "right"] :rows #{["model" "value"]}}]]
    (is (= {"left" "runtime" "right" "value"}
           (support/validate-mode-example!
            :runtime runtime-values model-values runtime-relations model-relations
            {"left" "runtime" "right" "value"} "invalid domain" "invalid relation")))
    (is (thrown? Exception
                 (support/validate-mode-example!
                  :runtime runtime-values model-values runtime-relations model-relations
                  {"left" "model" "right" "value"} "invalid domain" "invalid relation")))))
