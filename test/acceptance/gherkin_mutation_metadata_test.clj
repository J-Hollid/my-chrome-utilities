(ns acceptance.gherkin-mutation-metadata-test
  (:require [aps.mutation.metadata :as metadata]
            [babashka.fs :as fs]
            [clojure.string :as str]
            [clojure.test :refer [deftest is]]))

(def feature
  {:name "Metadata regression"
   :background []
   :scenarios [{:name "Scenario"
                :steps []
                :examples [{"value" "one"}]}]})

(def mutations [{:scenario 0}])

(defn- report [status]
  {:summary {:Total 1
             :Killed (if (= status "killed") 1 0)
             :Survived (if (= status "survived") 1 0)
             :Errors 0}
   :results [{:Mutation {:Path "$.scenarios[0].examples[0].value"}
              :Status status}]})

(deftest executed-dirty-scenario-is-not-restored-from-previous-manifest
  (fs/create-dirs "tmp")
  (let [path (fs/create-temp-file {:dir "tmp"
                                   :prefix "mutation-metadata-"
                                   :suffix ".feature"})]
    (try
      (spit (str path) "Feature: Metadata regression\n")
      (metadata/write-mutation-metadata! (str path)
                                         feature
                                         (report "killed")
                                         "implementation"
                                         "full"
                                         false
                                         mutations)
      (is (str/includes? (slurp (str path)) "\"index\":0"))
      (metadata/write-mutation-metadata! (str path)
                                         feature
                                         (report "survived")
                                         "implementation"
                                         "full"
                                         false
                                         mutations)
      (is (str/includes? (slurp (str path)) "\"scenarios\":[]"))
      (finally
        (fs/delete-if-exists path)))))
