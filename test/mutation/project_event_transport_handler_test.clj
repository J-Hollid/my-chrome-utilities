(ns mutation.project-event-transport-handler-test
  (:require [acceptance.steps.project-event-transport :as transport]
            [clojure.test :refer [deftest is testing]]))

(def complete-runtime-evidence
  (into {:installedBoundary true}
        (map (fn [index]
               [(keyword (str "transport" (format "%03d" index))) true])
             (range 1 10))))

(deftest model-verification-is-successfully-cached
  (let [verified? (atom false)]
    (with-redefs-fn
      {#'transport/model-verified? verified?}
      (fn []
        (#'transport/verify-model!)
        (#'transport/verify-model!)
        (is @verified?)))))

(deftest browser-observation-is-parsed-and-successfully-cached
  (let [observation (atom nil)
        calls (atom 0)
        output (str "browser log\n"
                    "{\"projectEventTransport\":"
                    "{\"installedBoundary\":true,"
                    "\"transport001\":true,\"transport002\":true,"
                    "\"transport003\":true,\"transport004\":true,"
                    "\"transport005\":true,\"transport006\":true,"
                    "\"transport007\":true,\"transport008\":true,"
                    "\"transport009\":true}}\n")]
    (with-redefs-fn
      {#'transport/browser-observation observation
       #'transport/checked! (fn [& _command]
                              (swap! calls inc)
                              {:out output :err "" :exit 0})}
      (fn []
        (is (= complete-runtime-evidence (#'transport/observe-browser!)))
        (is (= complete-runtime-evidence (#'transport/observe-browser!)))
        (is (= 1 @calls))))))

(deftest runtime-evidence-requires-every-transport-path
  (is (nil? (#'transport/assert-runtime! complete-runtime-evidence)))
  (testing "missing and false evidence are rejected"
    (is (thrown? Exception
                 (#'transport/assert-runtime!
                  (dissoc complete-runtime-evidence :transport009))))
    (is (thrown? Exception
                 (#'transport/assert-runtime!
                  (assoc complete-runtime-evidence :transport009 false))))))

(deftest examples-stay-within-the-approved-transport-domain
  (is (map? (transport/validate-example!
             :runtime
             {"project_identity" "project-retail"
              "observation_path" "queue.history"
              "push_path" "queue"})))
  (is (thrown? Exception
               (transport/validate-example!
                :runtime
                {"project_identity" "project-unknown"}))))
