Feature: Data layer validation target path editor

  Background:
    Given Add validation was started from event property /oOrder/aProducts/*/sku
    And the rule builder identifies its observed target context

  # Data layer validation target path editor 001
  Scenario: Data layer validation target path editor 001
    When the operator activates Advanced Edit target path
    Then a typed path segment editor opens with the observed path prefilled
    And its segments identify object property oOrder, object property aProducts, Every array item, and object property sku
    And readable path, expert expression, matched-value count, detected types, and example values are displayed
    And segment controls and the editable expert expression remain synchronized
    And Reset to observed path, Apply target path, and Cancel are available

  # Data layer validation target path editor 002
  Scenario Outline: Data layer validation target path editor 002
    Given expert target expression is <target_expression>
    When the expression is parsed against the event structure
    Then segment interpretation is <segment_interpretation>
    And target identity is <target_identity>

    Examples:
      | target_expression                              | segment_interpretation                         | target_identity                         |
      | $["oOrder"]["aProducts"][*]["details"][1]   | Every product then details array index 1       | second details item in every product    |
      | $["oOrder"]["aProducts"][0]["1"]            | product array index 0 then object property 1   | property named 1 in the first product   |
      | $["oOrder"]["aProducts"][0]["*"]            | product array index 0 then object property *   | property named * in the first product   |
      | $["oOrder"]["aProducts"][0]["a/b"]          | product array index 0 then object property a/b | property named a/b in the first product |

  # Data layer validation target path editor 003
  Scenario Outline: Data layer validation target path editor 003
    Given the segment editor contains <path_segments>
    When target path validation runs
    Then path result is <path_result>
    And assistance is <assistance>

    Examples:
      | path_segments                                  | path_result | assistance                                      |
      | property oOrder, property aProducts, index -1  | blocked     | Enter a non-negative array index                |
      | property oOrder, property aProducts, index 1.5 | blocked     | Enter a non-negative whole-number array index   |
      | property oOrder, property orderId, Every item  | blocked     | orderId is not an array                         |
      | property oOrder, property aProducts, property sku | blocked  | Choose Every item or a specific aProducts index |
      | property oOrder, property aProducts, Every item, property sku | accepted | 6 values match this target        |

  # Data layer validation target path editor 004
  Scenario: Data layer validation target path editor 004
    Given the current target is /oOrder/aProducts/*/sku
    When the operator adds property segment details and array index segment 1 before sku
    Then the preview target becomes $["oOrder"]["aProducts"][*]["details"][1]["sku"]
    And matched values, detected types, and examples refresh without changing the schema draft
    When the operator removes the details and index segments
    Then the preview returns to the original sku matches

  # Data layer validation target path editor 005
  Scenario: Data layer validation target path editor 005
    Given valid target $["oOrder"]["aProducts"][*]["details"][1]["code"] is not present in the captured event or schema draft
    When target path validation completes
    Then the path is identified as structurally valid but currently unobserved
    And the operator must choose the expected target type before applying it
    And review identifies each missing array, item, object, and property model node that will be created
    And no model node is created before validation is added to the working draft

  # Data layer validation target path editor 006
  Scenario Outline: Data layer validation target path editor 006
    Given slash-path shorthand <slash_path> is entered
    When it is normalized against <container_context>
    Then typed interpretation is <typed_interpretation>
    And normalized expert expression is <expert_expression>

    Examples:
      | slash_path                              | container_context                  | typed_interpretation                   | expert_expression                              |
      | /oOrder/aProducts/*/details/1           | details is an array                | wildcard then array index 1            | $["oOrder"]["aProducts"][*]["details"][1]  |
      | /oOrder/aProducts/0/1                   | product index 0 contains object 1  | array index 0 then property named 1    | $["oOrder"]["aProducts"][0]["1"]           |
      | /oOrder/a~1b/~0name                     | oOrder contains object a/b         | properties a/b then ~name              | $["oOrder"]["a/b"]["~name"]                |

  # Data layer validation target path editor 007
  Scenario: Data layer validation target path editor 007
    Given slash-path shorthand uses token * for an array wildcard
    When the intended object property is literally named *
    Then the operator must use quoted property segment ["*"] or the Property segment control
    And the normalized typed path retains a literal property rather than Every item
    And wildcard and literal-star targets cannot resolve to the same identity

  # Data layer validation target path editor 008
  Scenario: Data layer validation target path editor 008
    Given the operator changed the observed sku target to a path with different matches or detected types
    When Apply target path is activated
    Then the rule builder identifies each inferred value that would be replaced
    And incompatible rule configuration is not silently retained
    And the operator can keep compatible entered values or accept refreshed target defaults
    And returning to target editing preserves the typed segments

  # Data layer validation target path editor 009
  Scenario: Data layer validation target path editor 009
    Given the operator has changed the target away from the observed sku path
    When Reset to observed path is activated
    Then the original typed segments for /oOrder/aProducts/*/sku are restored
    And its matched values, detected type, examples, and compatible rule choices are restored
    And no schema draft change is persisted

  # Data layer validation target path editor 010
  Scenario: Data layer validation target path editor 010
    Given target $["oOrder"]["aProducts"][0]["1"] has been reviewed and added to Product detail working draft
    When the schema property tree and validation issues display that target
    Then array index 0 and object property named 1 remain distinct typed segments
    And the technical expression remains available without relying on parent-container inference
    And concrete issues cannot be reassigned to wildcard target $["oOrder"]["aProducts"][*]["1"]
