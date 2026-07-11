Feature: Data layer validation Rule Library

  Background:
    Given the Schema workspace Rule Library subview is displayed

  # Data layer validation Rule Library 001
  Scenario: Data layer validation Rule Library 001
    When the operator activates Create reusable rule
    Then an unpersisted rule editor opens with Name, applicable value types, built-in operator, parameters, severity, message, and examples
    And no reusable rule is created before Save rule succeeds

  # Data layer validation Rule Library 002
  Scenario: Data layer validation Rule Library 002
    Given reusable rule Approved page types uses allowed-values operator with page, product, and checkout
    When the operator saves the rule
    Then Approved page types version 1 receives a stable rule identity
    And its operator, parameters, severity, message, and examples persist after reload
    And the rule becomes available from compatible property rule menus

  # Data layer validation Rule Library 003
  Scenario: Data layer validation Rule Library 003
    Given schemas Page view and Product detail use Approved page types version 1
    When Approved page types is edited to include confirmation
    Then Save revision review identifies parameter and example changes
    And schemas remain pinned to version 1 until explicitly updated
    When rule version 2 is confirmed
    Then version 1 remains available for existing schema revisions and validation records

  # Data layer validation Rule Library 004
  Scenario: Data layer validation Rule Library 004
    Given Page view uses Approved page types version 1
    And Approved page types version 2 is available
    When the operator updates the schema attachment to version 2
    Then the schema becomes dirty and previews validation with rule version 2
    And the version change appears in schema revision review
    And no other schema attachment changes automatically

  # Data layer validation Rule Library 005
  Scenario: Data layer validation Rule Library 005
    Given reusable rule No internal page names has attached schemas and historical validation usage
    When the operator requests Delete rule
    Then a confirmation identifies all rule versions, attached schema revisions, and recorded usage
    And deletion cannot invalidate immutable schema or validation history
    And active schema attachments must be replaced, disabled, or retained as archived rule versions

  # Data layer validation Rule Library 006
  Scenario: Data layer validation Rule Library 006
    Given reusable rules have unequal names, operators, types, and usage
    When Rule Library rows are displayed
    Then each row separately presents name, version, operator, applicable types, severity, and usage count
    And Edit, Duplicate, Export, and Delete occupy a dedicated action group
    And search matches rule name, operator, type, parameter, message, or version
