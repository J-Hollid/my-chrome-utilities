# mutation-stamp: sha256=3857e8bc8c53821ea696c47e3ada68c0a701f1e5b201294fb4052f2099c1edaf
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-16T12:00:57.389872759Z","feature_name":"Data layer schema specification container defaults","feature_path":"features/data-layer-schema-specification-container-defaults.feature","background_hash":"ebe5ef09056b4398ef17551c6cdaf2e6d5355323404eec6640f44317a06ccfe2","implementation_hash":"6157b973c78b7c2290c36634945b5d4b3a262cdb","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer schema specification container defaults

  Background:
    Given Generic pageview declares commerce as Object, products as Array of Object, and products[].attributes as Object
    And each container has selectable descendant properties

  # Data layer schema specification container defaults 001
  Scenario: Data layer schema specification container defaults 001
    When the specification builder opens or resets selection for a schema source
    Then commerce, products, and products[].attributes are selected by default
    And their effective leaf descendants are also selected by default
    And each selected container and leaf appears once as its own preview row
    And local and inherited containers use the same default-selection behavior

  # Data layer schema specification container defaults 002
  Scenario: Data layer schema specification container defaults 002
    Given products and its descendants are selected by default
    When the operator clears products
    Then the products container row is removed from the preview
    And its descendant selections remain unchanged
    When the operator clears or selects an individual descendant
    Then the products container selection remains unchanged
    And no container or descendant selection is implicitly cascaded

  # Data layer schema specification container defaults 003
  Scenario: Data layer schema specification container defaults 003
    Given the operator has changed container and descendant selections
    When property search, row sorting, column reordering, copy mode, or export styling changes
    Then the changed selections remain associated with their canonical property paths
    When the source changes to another published, historical, or working-draft schema surface
    Then every effective container and leaf in the new source is selected by default
    And excluded or absent inherited containers are not selected or previewed

  # Data layer schema specification container defaults 004
  Scenario: Data layer schema specification container defaults 004
    Given all default-selected containers and leaves are displayed
    When the operator activates Clear selection
    Then every container and leaf is cleared
    When the operator activates Select all
    Then every currently available container and leaf is selected
    And default selection does not change the behavior of either bulk action
