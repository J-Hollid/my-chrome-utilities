Feature: Data layer guided validation form assistance

  Background:
    Given the guided validation flow is displayed

  # Data layer guided validation form assistance 001
  Scenario: Data layer guided validation form assistance 001
    When a field requires an unfamiliar value or format
    Then a persistent visible hint explains what is expected
    And the field is programmatically described by that hint
    And placeholder text and tooltips are not the only source of essential instructions

  # Data layer guided validation form assistance 002
  Scenario: Data layer guided validation form assistance 002
    When the operator continues with invalid input in more than one field
    Then an error summary identifies each invalid field and links to its control
    And each invalid field has a specific inline error explaining how to correct it
    And keyboard focus moves to the error summary
    And entered values and completed stages are retained

  # Data layer guided validation form assistance 003
  Scenario: Data layer guided validation form assistance 003
    When the operator moves through property, requirement, scope, and review stages
    Then the current stage and completed stages are exposed visually and programmatically
    And stage headings describe the current task
    And Back returns to the previous stage with its state preserved
    And Continue moves focus to the next stage heading

  # Data layer guided validation form assistance 004
  Scenario: Data layer guided validation form assistance 004
    When inferred values or validation previews change without navigation
    Then a concise status message announces the change without moving keyboard focus
    And the same status remains available as visible text
