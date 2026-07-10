(ns acceptance.operator-interface-steps-test (:require [acceptance.steps.operator-interface :as operator] [clojure.test :refer [deftest is]]))
(deftest operator-shell-has-authored-accessible-styles (is (operator/operator-shell-wired? ".")))
