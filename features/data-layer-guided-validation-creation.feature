# mutation-stamp: sha256=6c95e8a352e3b4ff0d6bff8251bf49f0e409bfb6aa159edeebcb79ad7d4af936
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T22:34:31.547369635Z","feature_name":"Data layer guided validation creation","feature_path":"features/data-layer-guided-validation-creation.feature","background_hash":"24144acb484fa8774907f3c3fbaa96d8e12aa6ecda41b40e57eece58f6be3168","implementation_hash":"sha256:96b20267af33970cdcc9513644316efcec2c811c55527dd0790de4275daa6d9c","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer guided validation creation

  Background:
    Given captured event pageview from http://127.0.0.1:4173/ is selected in Live

  # Data layer guided validation creation 001
  Scenario: Data layer guided validation creation 001
    Given no working-draft continuation context is selected
    When the operator activates Add validation for property page_type
    Then a guided validation draft opens at schema destination with page_type selected
    And the draft retains event pageview, its captured source, payload, domain 127.0.0.1, and pathname /
    And no separate property-selection stage is displayed
    And no schema, rule, or assignment is persisted

  # Data layer guided validation creation 002
  Scenario: Data layer guided validation creation 002
    Given Add validation was started from property page_type
    And the operator chooses a schema destination
    And configures Must be one of these values with product_list and homepage
    And chooses This domain on all paths
    When the review is displayed
    Then it states that pageview on 127.0.0.1 requires page_type to be product_list or homepage
    And it identifies the current event as passing or explains why it fails
    And the operator can return to and correct each completed stage without losing the draft

  # Data layer guided validation creation 003
  Scenario: Data layer guided validation creation 003
    Given a complete guided validation draft has a schema destination and local rule
    When the operator adds the validation to the schema draft
    Then its selected schema destination, local rule, and assignment draft are persisted together as pending changes
    And the pending validation uses the captured source, event pageview, payload target, and reviewed scope
    And the schema's current revision and active assignments remain unchanged
    And the completed pending validation is displayed as one readable requirement

  # Data layer guided validation creation 004
  Scenario: Data layer guided validation creation 004
    Given the validation is ready to publish its rule for reuse
    When publication details appear
    Then Rule Library reuse is stated
    And publishing the schema draft persists one reusable rule attached to the current schema revision

  # Data layer guided validation creation 005
  Scenario: Data layer guided validation creation 005
    When the guided validation draft is displayed
    Then rule name, severity, custom message, source, target, priority, and version policy are absent from the primary flow
    And Edit advanced settings exposes those fields without clearing inferred values
    And rule name, message, source, and target are generated from the selected event
    And severity is Error and version policy is Pinned by default
