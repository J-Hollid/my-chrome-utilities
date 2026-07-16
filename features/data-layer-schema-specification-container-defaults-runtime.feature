# mutation-stamp: sha256=c530966c9b7b89aa1fff941cfb33f607a4681a2668f88900e40dd61e9285d3f7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-16T12:00:57.404307828Z","feature_name":"Data layer schema specification container defaults runtime","feature_path":"features/data-layer-schema-specification-container-defaults-runtime.feature","background_hash":"b67de80e5ed158820564a57974cf3108451ced0e496b6d85259c749dd22c6a46","implementation_hash":"6157b973c78b7c2290c36634945b5d4b3a262cdb","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer schema specification container defaults runtime

  Background:
    Given the built extension side panel is running with the production specification builder
    And production Generic pageview contains local and inherited Object and Array containers with descendants

  # Data layer schema specification container defaults runtime 001
  Scenario: Data layer schema specification container defaults runtime 001
    When the production property selector first renders
    Then every effective leaf, Object container, and Array container checkbox is selected
    And the production preview contains one row for each selected canonical path
    And no filtered array-item placeholder is presented as an extra container row

  # Data layer schema specification container defaults runtime 002
  Scenario: Data layer schema specification container defaults runtime 002
    Given production products and its descendants are selected
    When the rendered products checkbox is cleared
    Then only the products row leaves the preview and descendant checkboxes retain their states
    When a rendered descendant checkbox changes
    Then the products checkbox retains its state
    And rerendering produces no duplicate or cascaded selection event

  # Data layer schema specification container defaults runtime 003
  Scenario: Data layer schema specification container defaults runtime 003
    Given production container and descendant selections have been changed independently
    When search, sort, column, example, and export controls rerender the builder
    Then production retains each changed selection by canonical path
    When the production source revision changes
    Then selection resets to every effective container and leaf from that source
    And Clear selection and Select all continue to clear and select every available row
