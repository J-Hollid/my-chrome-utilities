# mutation-stamp: sha256=41d9b8ed219fb05b0fc56fd3d06b1f48e164f2307731c0190223fadee32f7d37
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-12T20:14:53.153723699Z","feature_name":"Data layer guided validation constraint authoring","feature_path":"features/data-layer-guided-validation-constraint-authoring.feature","background_hash":"a022b940bcd8743b60b0ccdb5c83d65fb1871758285efdc7bda6c8d38a1edb9c","implementation_hash":"sha256:guided-validation-architect-v3","scenarios":[{"index":1,"name":"Data layer guided validation constraint authoring 002","scenario_hash":"9d2bdc940b4a86c4db8373834bddfc295342a8cc117aadebca6c0c072a2d9362","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-12T20:07:50.057265649Z"},{"index":4,"name":"Data layer guided validation constraint authoring 005","scenario_hash":"fc566495ad9cf5c677adda14da7f0d0a0e0a70c969a5eabddb9f106012cdb088","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-12T20:07:50.057265649Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer guided validation constraint authoring

  Background:
    Given a guided validation draft is open for captured event pageview
    And property page_type has observed value product_list with detected type string
    And page_type is selected for validation

  # Data layer guided validation constraint authoring 001
  Scenario: Data layer guided validation constraint authoring 001
    When inferred property details appear
    Then Expected data type is String marked as detected from this event
    And one human-readable constraint selector is displayed
    And separate Rule kind, Value type, and Operator controls are not displayed

  # Data layer guided validation constraint authoring 002
  Scenario Outline: Data layer guided validation constraint authoring 002
    Given property configuration expects <expected_type>
    When compatible requirements are displayed
    Then requirement <compatible_requirement> is available
    And requirement <incompatible_requirement> is absent or disabled with an explanation

    Examples:
      | expected_type | compatible_requirement       | incompatible_requirement |
      | String        | Must match a pattern         | Must be within a range   |
      | Number        | Must be within a range       | Must match a pattern     |
      | Array         | Must contain this many items | Must have this length    |
      | Object        | Allow only these properties  | Must be within a range   |
      | Boolean       | Must equal this value        | Must match a pattern     |

  # Data layer guided validation constraint authoring 003
  Scenario: Data layer guided validation constraint authoring 003
    When the operator overrides detected String with Number
    Then Number is retained as an explicit override
    And the original event remains as a failing validation example
    And the preview explains that page_type was observed as String but Number is expected
    And incompatible configured requirements require correction rather than being silently removed

  # Data layer guided validation constraint authoring 004
  Scenario: Data layer guided validation constraint authoring 004
    When the operator selects Must be one of these values
    Then product_list is added as the first allowed value from the current event
    And each allowed value is a separately labelled input with a Remove value action
    And Add another value adds a separately labelled input
    And serialized parameter syntax is not requested from the operator

  # Data layer guided validation constraint authoring 005
  Scenario Outline: Data layer guided validation constraint authoring 005
    Given the allowed value editor contains <configured_values>
    When the operator attempts to continue
    Then continuation result is <continuation_result>
    And input assistance states <input_assistance>

    Examples:
      | configured_values             | continuation_result | input_assistance                         |
      | product_list and homepage      | allowed             | 2 allowed values                         |
      | no values                      | blocked             | Add at least one allowed value           |
      | homepage and homepage          | blocked             | Remove or change the duplicate homepage  |
      | product_list and a blank value | blocked             | Enter a value or remove the blank item   |
