# mutation-stamp: sha256=80ecdacd172c28638afb687cb7d0b96ed943f96ee73c55ce748c1eb382f03af2
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T02:01:13.297413041Z","feature_name":"Data layer required-property defect schema choices runtime","feature_path":"features/data-layer-required-property-defect-schema-choices-runtime.feature","background_hash":"8fb444f03c1ec3461cbade15bfaac0f5aa405eff2d9b65802a31dbac7e344925","implementation_hash":"sha256:05dcb6b031d3430fbeb75b8ea757de0b054789af8c3112106919de30b93fe2fc","scenarios":[{"index":2,"name":"Data layer required-property defect schema choices runtime 003","scenario_hash":"f185abe9198c5814b9d6dc800216223d726b710b594c59b6a0d5d06b605feb8f","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-15T02:01:13.297413041Z"},{"index":3,"name":"Data layer required-property defect schema choices runtime 004","scenario_hash":"8bd35ee5b2accab9ea7d9bfd484097852588109821dc89f762c9867203a8f4ca","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-15T02:01:13.297413041Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer required-property defect schema choices runtime

  Background:
    Given the built extension side panel is running with production Live validation, schema resolution, defect reporting, Jira export, and Defect Library persistence
    And production Generic pageview revision 7 requires /page_type and allows product_detail and product_listing
    And a production Live pageview assigned to that revision has no /page_type property

  # Data layer required-property defect schema choices runtime 001
  Scenario: Data layer required-property defect schema choices runtime 001
    Given production validation emits Required value for /page_type
    And the production allowed-values evaluation for /page_type is not applicable because the property is absent
    When the operator activates the actual Create defect report action
    Then rendered expected-result controls offer product_detail and product_listing from Generic pageview revision 7
    And the controls retain Required value as the selected issue
    And runtime choice derivation succeeds without adding an allowed-values failure to the event

  # Data layer required-property defect schema choices runtime 002
  Scenario: Data layer required-property defect schema choices runtime 002
    Given the actual defect builder is open for missing required /page_type
    When the operator selects schema value product_detail through its rendered control
    Then production Expected result JSON contains {"page_type":"product_detail"}
    And the internal correction adds /page_type once with schema-provided provenance
    And rendered Actual result still identifies /page_type as missing
    And the production Live event payload remains unchanged

  # Data layer required-property defect schema choices runtime 003
  Scenario Outline: Data layer required-property defect schema choices runtime 003
    Given the background schema and event are replaced by production missing required <pointer>
    And its effective value rule provides typed values <configured_values>
    And production validation reports only Required value at <pointer>
    When the rendered schema choice <selected_value> is activated
    Then production Expected result stores <stored_value> at <pointer>
    And the stored JSON type is <json_type>

    Examples:
      | pointer         | configured_values  | selected_value | stored_value | json_type |
      | /page_type      | product and content | content        | content      | string    |
      | /market_id      | 1 and 2             | 2              | 2            | number    |
      | /logged_in      | true and false       | false          | false        | boolean   |

  # Data layer required-property defect schema choices runtime 004
  Scenario Outline: Data layer required-property defect schema choices runtime 004
    Given the background schema and event are replaced by production missing required <pointer>
    And its assigned schema has an allowed-values rule at <rule_pointer>
    And production validation reports only Required value at <pointer>
    When the actual defect builder resolves that Required value issue
    Then <expected_value> is available for the exact missing property
    And selecting it adds one value at <pointer> without flattening or renaming the payload path

    Examples:
      | pointer            | rule_pointer       | expected_value |
      | /commerce/currency | /commerce/currency | EUR            |
      | /products/0/name   | /products/*/name   | robot          |
      | /a~1b              | /a~1b              | enabled        |
      | /tilde~0name       | /tilde~0name       | retained       |

  # Data layer required-property defect schema choices runtime 005
  Scenario: Data layer required-property defect schema choices runtime 005
    Given production Generic pageview revision 7 inherits allowed page types product_detail and product_listing
    And its local exact-value rule permits only product_detail
    And a disabled inherited rule, working draft, later revision, and unrelated schema contain other values
    When the actual builder resolves schema choices for missing /page_type
    Then one product_detail choice is rendered
    And product_listing and every out-of-scope value are absent
    And the choice records the exact assigned revision and effective rule provenance

  # Data layer required-property defect schema choices runtime 006
  Scenario: Data layer required-property defect schema choices runtime 006
    Given production conditional allowed values for /page_type apply when captured /market equals retail
    When actual builders are opened for otherwise identical retail and trade events missing /page_type
    Then the retail builder renders the conditional schema values
    And the trade builder does not render them
    And neither builder evaluates the condition against a synthesized /page_type value

  # Data layer required-property defect schema choices runtime 007
  Scenario: Data layer required-property defect schema choices runtime 007
    Given the background value constraints are replaced by production enabled rules with an empty intersection for missing /page_type
    When the actual defect builder renders expected-result assistance
    Then no schema-provided value control is rendered
    And rendered conflict assistance identifies the effective rules
    And the operator can explicitly choose Custom value or response

  # Data layer required-property defect schema choices runtime 008
  Scenario: Data layer required-property defect schema choices runtime 008
    Given a replacement production fixture defines only missing required /transaction_id
    And the fixture has no concrete value constraint at /transaction_id
    And the fixture produces one Required value issue and no other validation issue
    When the actual defect builder renders expected-result assistance
    Then only Use generic constraint and Custom value or response methods are available
    And no value is borrowed from schema prose, property type, another path, draft, or revision

  # Data layer required-property defect schema choices runtime 009
  Scenario: Data layer required-property defect schema choices runtime 009
    Given product_detail is selected for production missing /page_type
    When the operator deselects the issue, reselects it, and selects product_listing through actual controls
    Then production Expected result respectively removes, restores, and updates /page_type once
    And response controls, add corrections, and payload properties are not duplicated after rerenders
    And focus and scroll return to the operated control

  # Data layer required-property defect schema choices runtime 010
  Scenario: Data layer required-property defect schema choices runtime 010
    Given the production report adds schema-provided /page_type product_detail
    When preview, Copy for Jira Cloud, Save as reported defect, reopen, and recopy are exercised through actual controls
    Then every representation contains the same typed Expected result and missing Actual result
    And each retains Required value evidence, effective value-rule provenance, add operation, and assigned revision
    And the stored event, validation result, schema library, assignment, and rules are unchanged
    And runtime coverage enters through production validation and the Live Create defect report action rather than source-string inspection or a preconstructed report issue
