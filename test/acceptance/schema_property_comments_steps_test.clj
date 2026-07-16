(ns acceptance.schema-property-comments-steps-test (:require [acceptance.feature-support :as feature-support] [acceptance.steps.all :as all] [acceptance.steps.schema-property-comments :as comments] [clojure.test :refer [deftest]]))
(deftest verifies-schema-property-comments-features (feature-support/verify-feature-suite! comments/feature-files comments/handlers all/handlers))
