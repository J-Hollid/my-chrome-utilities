# mutation-stamp: sha256=2c97f15c814590ea50223df6600ec98ce8e68d3079f8ba478154130a0dc8acc4
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T08:10:09.337893719Z","feature_name":"Data layer schema property rule picker","feature_path":"features/data-layer-schema-property-rule-picker.feature","background_hash":"2c762901552499dabf70cd6b69bab7e3efe8a3f1ed55ddb998465ddedf96ad54","implementation_hash":"sha256:d7ea2e827c3bc8082fa1b14169157a5141412997dbd4df94205718d5bdcbd862","scenarios":[{"index":2,"name":"Data layer schema property rule picker 003","scenario_hash":"cfc43afc7c3ce7ff0f1aaf4695f75d6db7481a7f15ea07e286edc3e8421cb74e","mutation_count":36,"result":{"Total":36,"Killed":36,"Survived":0,"Errors":0},"tested_at":"2026-07-14T08:10:09.337893719Z"},{"index":10,"name":"Data layer schema property rule picker 011","scenario_hash":"48282a205bd8aaf34b15abd41d45d291462921426dede47c7d4f6517694f8b2d","mutation_count":32,"result":{"Total":32,"Killed":32,"Survived":0,"Errors":0},"tested_at":"2026-07-14T08:10:09.337893719Z"},{"index":12,"name":"Data layer schema property rule picker 013","scenario_hash":"ff2dcfb1d837713b72938d20233160c0193ae871260b83df58947f608f817785","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-07-14T08:10:09.337893719Z"},{"index":16,"name":"Data layer schema property rule picker 017","scenario_hash":"5b9fd42d4a19b21f33a760180c045ecaef71120d342ec22249d8e5c13aaa70c2","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-14T08:10:09.337893719Z"},{"index":3,"name":"Data layer schema property rule picker 004","scenario_hash":"85628ab8d854fb23301779c278eed41acaee43cbae3f9f517569d04fb968ba4f","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-13T23:09:50.021844019Z"},{"index":9,"name":"Data layer schema property rule picker 010","scenario_hash":"9597eb51d46492ebae36416761489ffbf2479d60da84d5e26dbe5a3cb30ed8af","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-13T23:09:50.021844019Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema property rule picker

  Background:
    Given schema Page view working draft is open at 320 CSS px wide
    And property page_type has type string

  # Data layer schema property rule picker 001
  Scenario: Data layer schema property rule picker 001
    Given the property rule picker is closed
    When the page_type property row is displayed
    Then a compact Add rule button is available
    And the rule picker and Rule Library results are absent from the property row
    And the property row does not expand to display available rules

  # Data layer schema property rule picker 002
  Scenario: Data layer schema property rule picker 002
    When the operator activates Add rule for page_type
    Then a focused rule-picker dialog opens above the schema editor
    And its heading identifies page_type and type string
    And rule search receives keyboard focus
    And matching results scroll within the bounded dialog
    And background schema controls do not receive keyboard focus

  # Data layer schema property rule picker 003
  Scenario Outline: Data layer schema property rule picker 003
    Given property <property_name> has type <property_type>
    When compatible rule types are calculated
    Then rule type <rule_type> has availability <availability>

    Examples:
      | property_name | property_type | rule_type             | availability |
      | page_type     | string        | Required              | available    |
      | page_type     | string        | Exact value           | available    |
      | page_type     | string        | Regular expression    | available    |
      | page_type     | string        | Text length            | available    |
      | page_type     | string        | Digits only            | available    |
      | revenue       | number        | Numeric range         | available    |
      | items         | array         | Item count            | available    |
      | revenue       | number        | Regular expression    | unavailable  |
      | product       | object        | Allowed values        | unavailable  |

  # Data layer schema property rule picker 004
  Scenario Outline: Data layer schema property rule picker 004
    Given compatible reusable string rules have unequal names, operators, parameters, descriptions, types, and versions
    And incompatible number and array rules also exist
    When the operator searches rules for <query>
    Then only compatible reusable rules matching <matched_metadata> are displayed
    And incompatible rules are absent from attachable results

    Examples:
      | query          | matched_metadata |
      | Approved pages | rule name        |
      | allowed values | operator         |
      | checkout       | parameters       |
      | public pages   | description      |
      | string         | applicable type  |
      | version 2      | version          |

  # Data layer schema property rule picker 005
  Scenario: Data layer schema property rule picker 005
    Given compatible built-in and reusable rules are available for page_type
    When rule-picker results are displayed
    Then compatible built-in rules appear under Create a rule
    And compatible reusable rules appear under Attach from Rule Library
    And each result identifies name, operator, parameters, applicable type, and reusable-rule version when present
    And selecting a built-in rule opens local rule configuration
    And selecting a reusable rule attaches that rule to page_type

  # Data layer schema property rule picker 006
  Scenario: Data layer schema property rule picker 006
    Given the Rule Library contains compatible and incompatible reusable rules
    When the page_type rule picker opens
    Then compatible built-in rule creation remains available
    And only compatible reusable rules are attachable
    And Rule Library contents do not replace built-in rule creation

  # Data layer schema property rule picker 007
  Scenario: Data layer schema property rule picker 007
    Given reusable rule Approved page types version 2 is compatible with page_type
    When the operator attaches Approved page types version 2
    Then it is attached once to page_type in the Page view working draft
    And the page_type active-rule count increases by 1
    And the current published Page view revision remains unchanged
    And the rule picker closes
    And keyboard focus returns to Add rule for page_type

  # Data layer schema property rule picker 008
  Scenario: Data layer schema property rule picker 008
    Given Approved page types version 2 is already attached to page_type
    When the page_type rule picker opens
    Then Approved page types version 2 is identified as already attached
    And it cannot be attached to page_type again

  # Data layer schema property rule picker 009
  Scenario: Data layer schema property rule picker 009
    Given no compatible reusable rule matches query missing-rule
    When empty search results are displayed
    Then No compatible rules match this search is displayed
    And Clear search restores compatible built-in and reusable results
    And the Page view working draft remains unchanged

  # Data layer schema property rule picker 010
  Scenario Outline: Data layer schema property rule picker 010
    Given the rule picker is open with matching results and one result selected
    When the operator performs <picker_input>
    Then <selection_outcome>
    And the schema editor layout remains unchanged

    Examples:
      | picker_input                                        | selection_outcome                   |
      | Arrow key navigation followed by Enter             | the selected rule action runs       |
      | Escape                                              | no rule is created or attached      |

  # Data layer schema property rule picker 011
  Scenario Outline: Data layer schema property rule picker 011
    Given property <property_name> has type <property_type>
    When the operator selects built-in rule <rule_type>
    Then configuration controls are <parameter_controls>
    And Severity, optional issue message, Save as reusable rule in Rule Library, Create rule, Back to rule choices, and Cancel are available
    And Save as reusable rule in Rule Library is an unchecked checkbox by default
    And configuration controls remain readable and reachable at 320 CSS px wide

    Examples:
      | property_name | property_type | rule_type          | parameter_controls                  |
      | page_type     | string        | Required           | no parameter controls               |
      | page_type     | string        | Exact value        | one type-aware Exact value field    |
      | page_type     | string        | Allowed values     | repeatable type-aware value fields  |
      | page_type     | string        | Regular expression | Pattern                             |
      | page_type     | string        | Text length        | non-negative Exact length           |
      | page_type     | string        | Digits only        | no parameter controls               |
      | revenue       | number        | Numeric range      | optional Minimum and Maximum        |
      | items         | array         | Item count         | non-negative Minimum item count     |

  # Data layer schema property rule picker 012
  Scenario: Data layer schema property rule picker 012
    Given Allowed values configuration is open for product.sku of type string
    When no allowed value has been entered
    Then Create rule is blocked with reason Add at least one allowed value
    When the operator adds values ABC-1 and XYZ-2
    Then each value can be edited or removed independently
    And Create rule becomes available

  # Data layer schema property rule picker 013
  Scenario Outline: Data layer schema property rule picker 013
    Given built-in rule <rule_type> has configuration <configuration>
    When local rule validation runs
    Then creation result is <creation_result>
    And assistance is <assistance>

    Examples:
      | rule_type          | configuration                 | creation_result | assistance                            |
      | Exact value        | no value                      | blocked         | Enter an exact value                  |
      | Regular expression | malformed pattern [           | blocked         | Correct the regular expression        |
      | Text length        | exact length -1               | blocked         | Enter a non-negative whole number     |
      | Numeric range      | neither boundary              | blocked         | Enter at least one boundary           |
      | Numeric range      | minimum 10 and maximum 5      | blocked         | Make minimum less than maximum        |
      | Item count         | minimum 1.5                   | blocked         | Enter a non-negative whole number     |

  # Data layer schema property rule picker 014
  Scenario: Data layer schema property rule picker 014
    Given Allowed values configuration for product.sku contains ABC-1 and XYZ-2
    And Save as reusable rule in Rule Library is unchecked
    When the operator creates the rule with severity warning and issue message Use an approved SKU
    Then 1 local Allowed values rule is attached to product.sku in the Page view working draft
    And product.sku active-rule count increases by 1
    And no rule is added to the Rule Library
    And the current published Page view revision remains unchanged
    And the dialog closes and focus returns to Add rule for product.sku

  # Data layer schema property rule picker 015
  Scenario: Data layer schema property rule picker 015
    Given Allowed values configuration is open for product.sku
    When the operator checks Save as reusable rule in Rule Library
    Then Rule name is displayed and required
    And optional Description is displayed
    And the form explains that the reusable rule will be available to other schemas
    And Create rule remains blocked until Rule name is non-blank
    When the operator unchecks Save as reusable rule in Rule Library
    Then reusable-rule fields are hidden
    And the configured allowed values, severity, and issue message remain unchanged

  # Data layer schema property rule picker 016
  Scenario: Data layer schema property rule picker 016
    Given Allowed values configuration for product.sku contains ABC-1 and XYZ-2
    And Save as reusable rule in Rule Library is checked with name Approved product SKUs and description SKUs accepted by fulfilment
    When the operator creates the rule with severity warning and issue message Use an approved SKU
    Then Approved product SKUs version 1 is added once to the Rule Library for type string
    And the same reusable rule identity is attached once to product.sku in the Page view working draft
    And no duplicate local rule is created
    And its allowed values, severity, issue message, and description are retained
    And the dialog closes and focus returns to Add rule for product.sku

  # Data layer schema property rule picker 017
  Scenario Outline: Data layer schema property rule picker 017
    Given partially completed Allowed values configuration is open for product.sku
    When the operator activates <navigation_action>
    Then <selection_outcome>
    And no local or reusable rule is created or attached

    Examples:
      | navigation_action   | selection_outcome                                       |
      | Back to rule choices | compatible rule choices return for product.sku          |
      | Cancel               | the dialog closes and focus returns to Add rule for product.sku |
