(ns acceptance.schema-property-filter-sort-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-property-filter-sort :as property-filter-sort]
            [clojure.test :refer [deftest is]]))

(def valid-observation
  {:initial {:filter "" :sort "Schema order" :status "9 of 9 properties"
             :count 9 :add true :controlsAbove true}
   :empty {:status "0 of 9 properties"
           :message "No properties match missing_property"
           :clearReachable true :restored 9 :focus true}
   :storageUnchanged true
   :refreshed {:filter "product_" :sort "Name A-Z"
               :paths ["/products" "/products/*" "/products/*/product_id" "/products/*/product_name"]
               :contexts ["/products" "/products/*"]
               :selected "true"
               :focus "Add rule for products.*.product_id"
               :settledFocus "Add rule for products.*.product_id"
               :scroll 37
               :documentUnchanged true
               :pending ["Document schema owner" "Attach Required product id to products.*.product_id"]
               :rules [["rule:product-id" "/products/*/product_id"]]}
   :noOverflow true})

(deftest verifies-schema-property-filter-sort-features
  (feature-support/verify-feature-suite!
   property-filter-sort/feature-files property-filter-sort/handlers all/handlers))

(deftest entry-handlers-only-apply-to-filter-sort-features
  (doseq [entry-step property-filter-sort/entry-steps
          :let [handler (first (filter #(re-matches (:pattern %) entry-step)
                                       property-filter-sort/handlers))
                applies? (:applies? handler)]]
    (is (true? (applies? #:acceptance{:feature-name "Data layer schema property filtering and sorting"})))
    (is (false? (applies? #:acceptance{:feature-name "Data layer schema rule property identity"})))))

(deftest refresh-contract-includes-post-settlement-focus
  (is (nil? (#'property-filter-sort/assert-observation! {} valid-observation)))
  (let [error (try
                (#'property-filter-sort/assert-observation!
                 {}
                 (update valid-observation :refreshed dissoc :settledFocus))
                nil
                (catch clojure.lang.ExceptionInfo failure failure))]
    (is (instance? clojure.lang.ExceptionInfo error))
    (is (re-find #"Property-tree refresh did not preserve" (.getMessage error)))))
