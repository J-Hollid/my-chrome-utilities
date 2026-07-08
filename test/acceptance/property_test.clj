(ns acceptance.property-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.side-panel :as side-panel]
            [clojure.test :refer [deftest is]]
            [clojure.test.check :as tc]
            [clojure.test.check.generators :as gen]
            [clojure.test.check.properties :as prop]))

(def step-gen
  (gen/fmap (fn [text]
              {:keyword "Then"
               :text text})
            (gen/not-empty gen/string-alphanumeric)))

(def example-gen
  (gen/map gen/string-alphanumeric gen/string-alphanumeric
           {:max-elements 4}))

(def scenario-gen
  (gen/let [name (gen/not-empty gen/string-alphanumeric)
            steps (gen/vector step-gen 0 5)
            examples (gen/vector example-gen 0 4)]
    {:name name
     :steps steps
     :examples examples}))

(def feature-gen
  (gen/let [background (gen/vector step-gen 0 3)
            scenarios (gen/vector scenario-gen 0 6)]
    {:name "Generated"
     :background background
     :scenarios scenarios}))

(defn- check [property]
  (tc/quick-check 100 property))

(defn- expected-execution-count [scenarios]
  (reduce + (map #(max 1 (count (:examples %))) scenarios)))

(defn- execution-shape-valid? [background scenarios execution]
  (let [scenario (nth scenarios (:scenario-index execution))
        examples (:examples scenario)
        expected-example (if (seq examples)
                           (nth examples (:example-index execution))
                           {})]
    (and (= scenario (:scenario execution))
         (= expected-example (:example execution))
         (= (vec (concat background (:steps scenario))) (:steps execution))
         (= (format "%s/example_%d"
                    (:name scenario)
                    (inc (:example-index execution)))
            (:name execution)))))

(deftest expand-executions-preserves-scenario-example-shape
  (let [result (check
                (prop/for-all [{:keys [background scenarios] :as feature} feature-gen]
                  (let [executions (runtime/expand-executions feature)]
                    (and (= (expected-execution-count scenarios)
                            (count executions))
                         (every? #(execution-shape-valid? background scenarios %)
                                 executions)))))]
    (is (:pass? result) (pr-str result))))

(deftest manifest-contract-normalizes-side-panel-shape
  (let [result (check
                (prop/for-all [manifest-version gen/pos-int
                               extension-name gen/string-alphanumeric
                               default-path gen/string-alphanumeric
                               permissions (gen/vector gen/string-alphanumeric 0 8)
                               content-scripts? gen/boolean]
                  (let [manifest (cond-> {:manifest_version manifest-version
                                           :name extension-name
                                           :side_panel {:default_path default-path}
                                           :permissions permissions}
                                   content-scripts? (assoc :content_scripts []))
                        contract (side-panel/manifest-contract manifest)]
                    (and (= manifest-version (:manifest-version contract))
                         (= extension-name (:extension-name contract))
                         (= default-path (:default-path contract))
                         (= (set permissions) (:permissions contract))
                         (= content-scripts? (:content-scripts? contract))))))]
    (is (:pass? result) (pr-str result))))
