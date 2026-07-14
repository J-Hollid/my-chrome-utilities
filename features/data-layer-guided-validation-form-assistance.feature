# mutation-stamp: sha256=72a1d30959dc59d075fc3de96a9bb80319f7fede8bc9d316ed50b89258c2c30b
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-12T21:44:17.414679696Z","feature_name":"Data layer guided validation form assistance","feature_path":"features/data-layer-guided-validation-form-assistance.feature","background_hash":"47ed210de62720a9cfd338ac98931e0c10cb8342ad4591959de1fd279d7eb78a","implementation_hash":"sha256:guided-schema-order-architect-v1","scenarios":[]}
# acceptance-mutation-manifest-end

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
    When the operator moves through schema destination, requirement, scope, and review stages
    Then the current stage and completed stages are exposed visually and programmatically
    And stage headings describe the current task
    And Back returns to the previous stage with its state preserved
    And Continue moves focus to the next stage heading

  # Data layer guided validation form assistance 004
  Scenario: Data layer guided validation form assistance 004
    When inferred values or validation previews change without navigation
    Then a concise status message announces the change without moving keyboard focus
    And the same status remains available as visible text
