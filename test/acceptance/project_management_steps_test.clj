(ns acceptance.project-management-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.project-management :as project-management]
            [clojure.test :refer [deftest is]]))

(deftest project-management-namespace-owns-every-active-step
  (is (empty? (feature-support/unhandled-step-texts
               project-management/feature-files
               project-management/handlers))))

(def complete-evidence
  (into {:installedBoundary true}
        (concat
         (map (fn [index] [(keyword (format "context%03d" index)) true])
              (range 1 23))
         (map (fn [index] [(keyword (format "portability%03d" index)) true])
              (range 1 6)))))

(deftest browser-evidence-requires-the-exact-non-vacuous-contract
  (is (false? (project-management/complete-browser-evidence? nil)))
  (is (false? (project-management/complete-browser-evidence? {})))
  (is (false? (project-management/complete-browser-evidence?
               (dissoc complete-evidence :context016))))
  (is (false? (project-management/complete-browser-evidence?
               (assoc complete-evidence :unexpected true))))
  (is (false? (project-management/complete-browser-evidence?
               (assoc complete-evidence :portability005 false))))
  (is (true? (project-management/complete-browser-evidence? complete-evidence))))

(deftest project-management-examples-require-specified-values
  (let [example {"overview" "Flows"
                 "entity" "Checkout journey"
                 "add action" "Add Flow"
                 "creation page" "Create Flow"
                 "singular" "Flow"}]
    (is (= example (project-management/validate-example! :model example)))
    (is (thrown? Exception
                 (project-management/validate-example!
                  :runtime
                  (assoc example "add action" "AdD Flow")))))
  (is (= {"ordered Pages" "Alpha, Landing"
          "removed Page" "Landing"
          "focus target" "Alpha"}
         (project-management/validate-example!
          :model
          {"ordered Pages" "Alpha, Landing"
           "removed Page" "Landing"
           "focus target" "Alpha"})))
  (doseq [[url result]
          [["https://shop.example/checkout/cart?x=1#y"
            "matches exact pathname /checkout/cart"]
           ["https://other.example/checkout/cart"
            "matches exact pathname /checkout/cart"]
           ["https://shop.example/checkout/cart/"
            "does not match /checkout/cart"]
           ["checkout/cart" "Enter a full URL"]]]
    (is (= {"url" url "result" result}
           (project-management/validate-example!
            :model {"url" url "result" result})))
    (is (= {"url" url "result" result}
           (project-management/validate-example!
            :runtime {"url" url "result" result}))))
  (is (thrown? Exception
               (project-management/validate-example!
                :model
                {"url" "https://shop.example/checkout/cart/"
                 "result" "matches exact pathname /checkout/cart"})))
  (is (thrown? Exception
               (project-management/validate-example!
                :runtime
                {"url" "checkout/cart"
                 "result" "does not match /checkout/cart"})))
  (is (= {} (project-management/validate-example! :runtime {}))))
