(ns acceptance.specification-project-program-steps-test
  (:require [acceptance.steps.specification-project-program]
            [clojure.test :refer [deftest is]]))

(defn- runtime-assertion []
  (deref (ns-resolve 'acceptance.steps.specification-project-program
                     'assert-runtime!)))

(deftest validates-specification-project-runtime-observation
  (let [observed {:created {:empty true
                            :workspace true
                            :status "Saved"
                            :context "Shop data specification · Production · Draft"
                            :tree (vec (range 8))}
                  :search {:rows ["Purchase"] :query "Purchase"}
                  :bulk {:rowCount 100 :undoEnabled true}
                  :afterUndo 0
                  :preflight "Ready to publish"
                  :release {:open true :confirmDisabled false}
                  :stored {:releases 1 :draft false}
                  :reloadPreserved true
                  :layout {:renderedRows 20 :workspaceOverflow "auto"}}]
    (is (= observed ((runtime-assertion) observed)))))
