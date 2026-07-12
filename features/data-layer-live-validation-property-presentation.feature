Feature: Data layer Live validation property presentation

  Background:
    Given a captured event with an assigned schema is open in the Live inspector

  # Data layer Live validation property presentation 001
  Scenario: Data layer Live validation property presentation 001
    When event payload details are displayed
    Then a structured Properties view is the primary payload presentation
    And nested objects and arrays can be expanded and collapsed
    And Raw JSON remains available as a separate disclosure
    And changing presentation does not modify the captured event

  # Data layer Live validation property presentation 002
  Scenario Outline: Data layer Live validation property presentation 002
    Given property <property_path> has <attached_rule_count> attached rules, <error_count> errors, and <warning_count> warnings
    When its property row is displayed
    Then property status is <property_status>
    And the row uses <status_symbol> as its status symbol
    And property visual treatment is <visual_treatment>

    Examples:
      | property_path | attached_rule_count | error_count | warning_count | property_status | status_symbol | visual_treatment |
      | page_path     | 0                   | 0           | 0             | No rules        | neutral       | neutral          |
      | currency      | 2                   | 0           | 0             | 2 rules passed  | check         | pass             |
      | page_title    | 2                   | 0           | 1             | 1 warning       | warning       | warning          |
      | page_type     | 3                   | 1           | 1             | 1 error and 1 warning | error    | error            |

  # Data layer Live validation property presentation 003
  Scenario: Data layer Live validation property presentation 003
    Given page_type has one passing rule, one warning, and one error
    When page_type status is summarized
    Then error is the row's highest visual severity
    And 1 error and 1 warning remain separately visible
    And the passing rule remains available in property rule details

  # Data layer Live validation property presentation 004
  Scenario: Data layer Live validation property presentation 004
    Given collapsed object commerce contains one descendant error and two descendant warnings
    When the Properties view is displayed
    Then commerce shows an aggregate badge with 1 error and 2 warnings
    And expanding commerce identifies the affected descendant properties
    And unaffected sibling properties do not inherit the error treatment

  # Data layer Live validation property presentation 005
  Scenario: Data layer Live validation property presentation 005
    Given required property order_id is absent from the captured payload
    When validation issues are presented
    Then a synthetic order_id row appears at its expected property location
    And the row identifies Missing, Required property, and error severity
    And the same issue appears in Event-level issues

  # Data layer Live validation property presentation 006
  Scenario: Data layer Live validation property presentation 006
    Given validation contains root, cross-property, assignment, and missing-property issues
    When Event-level issues is displayed above Properties
    Then every issue shows message, severity, rule, schema origin, expected value, and actual value when available
    And an issue associated with a rendered property links to and focuses that property row
    And issues without a rendered property remain fully available in Event-level issues

  # Data layer Live validation property presentation 007
  Scenario: Data layer Live validation property presentation 007
    Given currency has two attached rules that pass
    When automatic validation completes
    Then each successful evaluation retains property path, rule identity and version, severity, and schema origin
    And currency can be distinguished as ruled and passing rather than unruled
