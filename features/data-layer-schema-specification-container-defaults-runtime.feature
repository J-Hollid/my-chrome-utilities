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

