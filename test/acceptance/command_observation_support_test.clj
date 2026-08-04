(ns acceptance.command-observation-support-test
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [clojure.test :refer [deftest is]]))

(deftest command-observations-parse-cache-and-reject-invalid-results
  (with-redefs [support/pack-runner-owns-js? (constantly false)
                support/strict-verification-receipt? (constantly false)]
    (let [calls (atom 0)
          cache (atom nil)
          options {:command ["node" "adapter.mjs"]
                   :observation-key :choice
                   :runtime-error "runtime failed"
                   :missing-error "missing"}]
      (with-redefs [process/shell
                    (fn [& _]
                      (swap! calls inc)
                      {:exit 0
                       :out "noise\n{\"choice\":{\"ready\":true}}\n"
                       :err ""})]
        (is (= {:ready true}
               (support/cached-command-observation! cache options)))
        (is (= {:ready true}
               (support/cached-command-observation! cache options)))
        (is (= 1 @calls)))
      (reset! cache nil)
      (with-redefs [process/shell (fn [& _] {:exit 1 :out "" :err "broken"})]
        (is (thrown-with-msg?
             clojure.lang.ExceptionInfo
             #"runtime failed"
             (support/cached-command-observation! cache options))))
      (with-redefs [process/shell (fn [& _] {:exit 0 :out "{}\n" :err ""})]
        (is (thrown-with-msg?
             clojure.lang.ExceptionInfo
             #"missing"
             (support/cached-command-observation! cache options)))))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-29T18:25:35.890003425+02:00", :module-hash "1694614037", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "974883643"} {:id "form/1/deftest", :kind "deftest", :line 6, :end-line 34, :hash "-1551728967"}]}
;; clj-mutate-manifest-end
