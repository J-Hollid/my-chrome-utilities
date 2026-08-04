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

(deftest reports-all-feature-failures-from-one-session
  (let [observed (atom [])
        error (try
                (session/run-session!
                 "schemas" "build-a"
                 [{:generated "first" :ir "first-ir"}
                  {:generated "second" :ir "second-ir"}]
                 (fn [{:keys [generated]}]
                   (swap! observed conj generated)
                   (throw (ex-info (str generated " failed") {}))))
                nil
                (catch clojure.lang.ExceptionInfo failure failure))]
    (is (= ["first" "second"] @observed))
    (is (= 2 (count (:failures (ex-data error)))))
    (is (re-find #"first.*second" (ex-message error)))))

(deftest rejects-incomplete-session-invocations
  (is (thrown-with-msg?
       clojure.lang.ExceptionInfo
       #"Provide a verification pack id"
       (session/-main nil)))
  (is (thrown-with-msg?
       clojure.lang.ExceptionInfo
       #"Provide generated-entrypoint/IR pairs"
       (#'session/entries [])))
  (is (thrown-with-msg?
       clojure.lang.ExceptionInfo
       #"Provide generated-entrypoint/IR pairs"
       (#'session/entries ["generated-only"])))
  (is (= [{:generated "generated-a" :ir "ir-a"}]
         (#'session/entries ["generated-a" "ir-a"]))))
