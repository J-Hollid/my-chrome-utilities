(ns mutation.schema-relationship-tree-handler-test
  (:require [acceptance.steps.schema-relationship-tree :as tree]
            [clojure.test :refer [deftest is testing]]))

(def complete-runtime-evidence
  (into {:installedBoundary true
         :viewPersisted true}
        (map (fn [index]
               [(keyword (str "tree" (format "%03d" index))) true])
             (range 1 10))))

(deftest model-verification-cache-starts-empty-and-settles
  (is (false? @(deref #'tree/model-verified?)))
  (let [verified? (atom false)]
    (with-redefs-fn
      {#'tree/model-verified? verified?}
      (fn []
        (#'tree/verify-model!)
        (#'tree/verify-model!)
        (is @verified?)))))

(deftest examples-must-be-authoritative-contract-rows
  (is (nil? (#'tree/validate-example! :model {})))
  (is (nil? (#'tree/validate-example!
             :runtime
             {"panel_width" "360"})))
  (is (thrown? Exception
               (#'tree/validate-example!
                :runtime
                {"panel_width" "361"}))))

(deftest browser-evidence-is-parsed-and-cached
  (let [observation (atom nil)
        calls (atom 0)
        output (str "browser log\n"
                    "{\"schemaRelationshipTree\":"
                    "{\"installedBoundary\":true,"
                    "\"viewPersisted\":true,"
                    "\"tree001\":true,\"tree002\":true,\"tree003\":true,"
                    "\"tree004\":true,\"tree005\":true,\"tree006\":true,"
                    "\"tree007\":true,\"tree008\":true,\"tree009\":true}}\n")]
    (with-redefs-fn
      {#'tree/browser-observation observation
       #'tree/checked! (fn [& _command]
                         (swap! calls inc)
                         {:out output :err "" :exit 0})}
      (fn []
        (is (= complete-runtime-evidence (#'tree/observe-browser!)))
        (is (= complete-runtime-evidence (#'tree/observe-browser!)))
        (is (= 1 @calls))))))

(deftest runtime-evidence-requires-the-exact-successful-tree-paths
  (is (nil? (#'tree/assert-runtime! complete-runtime-evidence)))
  (testing "missing and false evidence are rejected"
    (is (thrown? Exception
                 (#'tree/assert-runtime!
                  (dissoc complete-runtime-evidence :tree009))))
    (is (thrown? Exception
                 (#'tree/assert-runtime!
                  (assoc complete-runtime-evidence :tree009 false))))
    (is (thrown? Exception
                 (#'tree/assert-runtime!
                  (dissoc complete-runtime-evidence :viewPersisted))))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-30T20:41:54.349290673+02:00", :module-hash "1252103475", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-643602987"} {:id "def/complete-runtime-evidence", :kind "def", :line 5, :end-line 10, :hash "1716939227"} {:id "form/2/deftest", :kind "deftest", :line 12, :end-line 20, :hash "1545080360"} {:id "form/3/deftest", :kind "deftest", :line 22, :end-line 30, :hash "-1018225133"} {:id "form/4/deftest", :kind "deftest", :line 32, :end-line 50, :hash "673142123"} {:id "form/5/deftest", :kind "deftest", :line 52, :end-line 63, :hash "232346415"}]}
;; clj-mutate-manifest-end
