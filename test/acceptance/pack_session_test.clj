(ns acceptance.pack-session-test
  (:require [acceptance.pack-runtime :as packs]
            [acceptance.pack-session :as session]
            [clojure.test :refer [deftest is]]))

(deftest shares-one-runtime-cache-across-ordered-pack-features
  (let [created (atom 0)
        observed (atom [])
        entries [{:generated "second" :ir "second-ir"}
                 {:generated "first" :ir "first-ir"}]]
    (session/run-session!
     "schemas" "build-a" entries
     (fn [{:keys [generated]}]
       (swap! observed conj
              [generated
               (packs/cached-runtime! [:browser :shared]
                                      #(swap! created inc))])))
    (is (= [["second" 1] ["first" 1]] @observed))
    (is (= 1 @created))))

(deftest a-new-build-or-pack-session-receives-a-new-runtime-cache
  (let [created (atom 0)
        observe! (fn [_]
                   (packs/cached-runtime! [:browser :shared]
                                          #(swap! created inc)))]
    (session/run-session! "schemas" "build-a" [{:generated "one" :ir "one"}] observe!)
    (session/run-session! "schemas" "build-b" [{:generated "two" :ir "two"}] observe!)
    (session/run-session! "defects" "build-b" [{:generated "three" :ir "three"}] observe!)
    (is (= 3 @created))))
