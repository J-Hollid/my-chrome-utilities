Feature: Data layer non-applicable property visibility runtime

  Background:
    Given the built extension Live inspector is running with production validation and property-tree rendering
    And a production event has observed properties and schema-expected missing paths

  # Data layer non-applicable property visibility runtime 001
  Scenario: Data layer non-applicable property visibility runtime 001
    Given production validation returns only not-applicable value-rule evaluations for missing /test
    When the production Live inspector renders the event
    Then the actual property tree retains /test as validation evidence
    And the rendered default Properties view omits its synthetic row
    And rendered event validation remains Valid with no error or warning

  # Data layer non-applicable property visibility runtime 002
  Scenario: Data layer non-applicable property visibility runtime 002
    Given the rendered default Properties view hides missing /test
    When the operator activates rendered Show non-applicable properties
    Then production rendering reveals /test with Missing, neutral treatment, and not-applicable rule details
    And the Missing value has no unconditional danger styling
    When rendered Hide non-applicable properties is activated
    Then /test is hidden without changing the production event or validation objects

  # Data layer non-applicable property visibility runtime 003
  Scenario Outline: Data layer non-applicable property visibility runtime 003
    Given production validation receives /test as <property_state> with <rule_state>
    When the production Live inspector renders its default property tree
    Then actual row visibility is <row_visibility>
    And actual treatment is <treatment>

    Examples:
      | property_state       | rule_state                       | row_visibility | treatment                   |
      | missing              | Allowed values not applicable    | hidden         | neutral when revealed       |
      | missing              | Required failed                  | visible        | error                       |
      | present with value   | conditional rule not applicable  | visible        | neutral                     |
      | present with null    | Allowed values failed             | visible        | error                       |

  # Data layer non-applicable property visibility runtime 004
  Scenario: Data layer non-applicable property visibility runtime 004
    Given production nested and wildcard paths contain optional missing targets, observed values, and a Required missing target
    When the production property tree is rendered with non-applicable properties hidden
    Then optional synthetic branches are pruned without removing observed or Required branches
    And ancestor aggregate counts include only error and warning descendants
    When Show non-applicable properties is activated
    Then the pruned paths return at their canonical hierarchy locations without duplicating concrete wildcard rows

  # Data layer non-applicable property visibility runtime 005
  Scenario: Data layer non-applicable property visibility runtime 005
    Given rendered Show non-applicable properties is active with a revealed row focused
    When production schema-publication revalidation rerenders the same event
    Then the rendered visibility state, supported disclosures, scroll, and focus are restored
    And toggling and property search operate on production DOM rows rather than source-text or acceptance-only flags
