(ns acceptance.steps-support-receipt-test
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [clojure.test :refer [deftest is]]))

(deftest structured-receipts-require-a-passed-exact-task-identity
  (let [command ["node" "test/example-test.mjs"]
        receipt {"version" 2
                 "tasks" {"unit:test/example-test.mjs"
                          {"identity" {"executable" "node" "args" ["test/example-test.mjs"]}
                           "status" "passed" "output" "verified\n"}}}]
    (is (= {:exit 0 :out "verified\n" :err "" :receipt true}
           (support/verification-receipt-result receipt command)))
    (is (= {:exit 0 :out "verified\n" :err "" :receipt true}
           (support/verification-receipt-result receipt "unit:test/example-test.mjs" command)))
    (is (nil? (support/verification-receipt-result receipt "unit:other" command)))
    (is (nil? (support/verification-receipt-result receipt ["node" "test/other-test.mjs"])))
    (is (nil? (support/verification-receipt-result
               (assoc-in receipt ["tasks" "unit:test/example-test.mjs" "status"] "failed")
               command)))))

(deftest batched-browser-receipts-resolve-one-logical-target
  (let [result {"identity" {"executable" "node"
                            "args" ["scripts/run-browser-observation.mjs" "FIRST" "SECOND"]
                            "logicalTargetIds" ["FIRST" "SECOND"]}
                "status" "passed" "output" "{\"first\":true}\n{\"second\":true}\n"}
        receipt {"version" 2 "tasks" {"browser-observation:FIRST+SECOND" result}}
        command ["node" "scripts/run-browser-observation.mjs" "SECOND"]]
    (is (= {:exit 0 :out "{\"first\":true}\n{\"second\":true}\n" :err "" :receipt true}
           (support/verification-receipt-result receipt "browser-observation:SECOND" command)))
    (is (nil? (support/verification-receipt-result
               receipt "browser-observation:MISSING"
               ["node" "scripts/run-browser-observation.mjs" "MISSING"])))
    (is (nil? (support/verification-receipt-result receipt "unit:SECOND" command)))
    (is (thrown-with-msg?
         clojure.lang.ExceptionInfo #"duplicate command identities"
         (support/verification-receipt-result
          (assoc receipt "tasks" {"browser-observation:FIRST+SECOND" result
                                   "browser-observation:SECOND+FIRST" result})
          "browser-observation:SECOND" command)))))

(deftest browser-batch-receipt-resolves-its-adapter-command-alias
  (let [command ["node" "test/browser.mjs"]
        receipt {"version" 2
                 "tasks" {"browser-observation:FIRST+SECOND"
                          {"identity" {"executable" "node"
                                       "args" ["scripts/run-browser-observation.mjs" "FIRST" "SECOND"]
                                       "aliasCommands" [command]}
                           "status" "passed" "output" "{\"browser\":true}\n"}}}]
    (is (= {:exit 0 :out "{\"browser\":true}\n" :err "" :receipt true}
           (support/verification-receipt-result receipt command)))))

(deftest passed-target-ignores-a-prior-document-owned-by-another-target
  (with-redefs [support/verified-task-result
                (fn [& _]
                  {:exit 0
                   :err ""
                   :out (str "{\"schemaWorkspace\":{\"fixture\":\"2:4\"}}\n"
                             "{\"swarmforgeBrowserTargetResult\":{\"id\":\"VALIDATION_PRESENCE_BROWSER_ADAPTER\",\"status\":\"passed\"}}\n"
                             "{\"schemaWorkspace\":{\"fixture\":\"2:4\"},\"validationPresenceSemantics\":{\"operators\":9}}\n")})]
    (is (= {:operators 9}
           (support/load-browser-observation-with-environment!
            {:observation-id "VALIDATION_PRESENCE_BROWSER_ADAPTER"
             :observation-key :validationPresenceSemantics
             :runtime-error "runtime failed"
             :missing-error "missing"})))))

(deftest runner-owned-verification-commands-fail-closed-before-spawning
  (let [command ["node" "test/example-test.mjs"]
        passed-receipt {"version" 2
                        "tasks" {"unit:test/example-test.mjs"
                                 {"identity" {"executable" "node" "args" ["test/example-test.mjs"]}
                                  "status" "passed" "output" "verified\n"}}}
        failed-receipt (assoc-in passed-receipt ["tasks" "unit:test/example-test.mjs" "status"] "failed")
        mismatched-receipt (assoc-in passed-receipt
                                     ["tasks" "unit:test/example-test.mjs" "identity" "args"]
                                     ["test/other-test.mjs"])
        process-calls (atom [])]
    (with-redefs [support/pack-runner-owns-js? (constantly true)
                  support/strict-verification-receipt? (constantly false)
                  process/shell (fn [& args] (swap! process-calls conj args)
                                  {:exit 0 :out "unexpected" :err ""})]
      (doseq [receipt [nil failed-receipt mismatched-receipt]
              invoke [(fn [] (apply support/verified-command-result command))
                      (fn [] (apply support/verified-task-result "unit:test/example-test.mjs" command))]]
        (with-redefs [support/verification-receipt-command
                      (fn
                        ([_] (when receipt (support/verification-receipt-result receipt command)))
                        ([task-key requested-command]
                         (when receipt
                           (support/verification-receipt-result receipt task-key requested-command))))]
          (is (thrown-with-msg? clojure.lang.ExceptionInfo
                                #"was not declared or did not pass" (invoke)))))
      (with-redefs [support/verification-receipt-command
                    (fn
                      ([_] (support/verification-receipt-result passed-receipt command))
                      ([task-key requested-command]
                       (support/verification-receipt-result passed-receipt task-key requested-command)))]
        (is (= {:exit 0 :out "verified\n" :err "" :receipt true}
               (apply support/verified-command-result command)))
        (is (= {:exit 0 :out "verified\n" :err "" :receipt true}
               (apply support/verified-task-result "unit:test/example-test.mjs" command))))
      (is (empty? @process-calls)))))

(deftest prepared-build-verification-prefers-real-build-and-fails-closed
  (let [build-command ["npm" "run" "build"]
        prepared-task-key "checkpoint:shell:prepared-dist-freshness"
        prepared-command ["node" "scripts/verify-dist-artifact.mjs"]
        build-result {:exit 0 :out "built\n" :err "" :receipt true}
        prepared-result {:exit 0 :out "fresh\n" :err "" :receipt true}
        process-calls (atom [])
        prepared-lookups (atom 0)]
    (with-redefs [support/pack-runner-owns-js? (constantly true)
                  support/strict-verification-receipt? (constantly false)
                  support/verification-receipt-command
                  (fn ([command] (when (= build-command command) build-result))
                      ([_ _] (swap! prepared-lookups inc) nil))
                  process/shell (fn [& args] (swap! process-calls conj args)
                                  {:exit 0 :out "unexpected" :err ""})]
      (is (= build-result (support/verified-command-or-prepared-task-result
                           build-command prepared-task-key prepared-command)))
      (is (zero? @prepared-lookups))
      (is (empty? @process-calls)))
    (with-redefs [support/pack-runner-owns-js? (constantly false)
                  support/strict-verification-receipt? (constantly true)
                  support/verification-receipt-command
                  (fn ([_] nil)
                      ([task-key command]
                       (when (and (= prepared-task-key task-key) (= prepared-command command))
                         prepared-result)))
                  process/shell (fn [& args] (swap! process-calls conj args)
                                  {:exit 0 :out "unexpected" :err ""})]
      (is (= prepared-result (support/verified-command-or-prepared-task-result
                              build-command prepared-task-key prepared-command)))
      (is (empty? @process-calls)))
    (with-redefs [support/pack-runner-owns-js? (constantly true)
                  support/strict-verification-receipt? (constantly false)
                  support/verification-receipt-command (fn ([_] nil) ([_ _] nil))
                  process/shell (fn [& args] (swap! process-calls conj args)
                                  {:exit 0 :out "unexpected" :err ""})]
      (is (thrown-with-msg? clojure.lang.ExceptionInfo #"was not declared or did not pass"
                            (support/verified-command-or-prepared-task-result
                             build-command prepared-task-key prepared-command)))
      (is (empty? @process-calls)))
    (with-redefs [support/pack-runner-owns-js? (constantly false)
                  support/strict-verification-receipt? (constantly false)
                  support/verification-receipt-command (fn ([_] nil) ([_ _] nil))
                  process/shell (fn [& args] (swap! process-calls conj args)
                                  {:exit 0 :out "standalone\n" :err ""})]
      (is (= {:exit 0 :out "standalone\n" :err ""}
             (support/verified-command-or-prepared-task-result
              build-command prepared-task-key prepared-command)))
      (is (= [[support/build-shell-options "npm" "run" "build"]] @process-calls)))))
