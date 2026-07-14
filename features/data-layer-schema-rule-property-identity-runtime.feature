Feature: Data layer schema rule property identity runtime

  Background:
    Given the built extension side panel is running with production schema editing and rule persistence
    And persisted Page view working draft contains path-keyed property /page_type of type string
    And the actual schema editor displays page_type once

  # Data layer schema rule property identity runtime 001
  Scenario: Data layer schema rule property identity runtime 001
    Given the production draft document JSON and ordered property-row canonical identities are recorded
    When the actual Add rule control creates a local Required rule for page_type
    Then production attached-rule state contains one local Required rule at /page_type
    And the persisted draft document JSON is unchanged
    And the DOM contains one row with canonical identity /page_type
    And the ordered property-row canonical identities are unchanged
    And that row displays 1 active rule

  # Data layer schema rule property identity runtime 002
  Scenario: Data layer schema rule property identity runtime 002
    Given production Rule Library contains compatible Approved page types version 2
    And the production draft document JSON is recorded
    When the actual page_type rule picker attaches Approved page types version 2
    Then the reusable rule identity and version are attached once at /page_type
    And the persisted draft document JSON is unchanged
    And the DOM contains one page_type property row displaying 1 active rule

  # Data layer schema rule property identity runtime 003
  Scenario: Data layer schema rule property identity runtime 003
    Given the actual page_type row has one attached Required rule
    And the production draft document JSON is recorded
    When the actual rule picker creates an Allowed values rule for page_type
    Then production attached-rule state contains 2 distinct rules at /page_type
    And the persisted draft document JSON is unchanged
    And the DOM still contains one page_type property row displaying 2 active rules

  # Data layer schema rule property identity runtime 004
  Scenario Outline: Data layer schema rule property identity runtime 004
    Given the production draft also contains <property_representation>
    And its document JSON and property-row state are recorded
    When the actual property rule picker attaches a compatible reusable rule to <displayed_path>
    Then the persisted attachment uses canonical path <canonical_path>
    And production document JSON for that property is unchanged
    And the DOM contains exactly one row for <canonical_path>
    And the row retains its type, origin, documentation, position, and surrounding hierarchy

    Examples:
      | property_representation                               | displayed_path      | canonical_path       |
      | path-keyed array /page_levels with item /page_levels/0 | page_levels.0       | /page_levels/0       |
      | nested array item products every item name             | products.*.name     | /products/*/name     |
      | inherited path-keyed property /customer/id             | customer.id         | /customer/id         |

  # Data layer schema rule property identity runtime 005
  Scenario: Data layer schema rule property identity runtime 005
    Given Approved page types version 2 has been attached through the actual page_type rule picker
    When the operator closes and reopens the production schema editor
    And the operator reopens the picker and attempts to attach Approved page types version 2 again
    Then the reusable rule is identified as already attached and remains attached once
    And persisted Page view still contains one canonical page_type property definition
    And the DOM contains one page_type row displaying 1 active rule

  # Data layer schema rule property identity runtime 006
  Scenario: Data layer schema rule property identity runtime 006
    Given focus, selection, expansion state, and scroll position are recorded around the page_type row
    When the actual picker attaches a rule and production schema rendering completes
    Then focus returns to Add rule for the same canonical page_type row
    And selection, expansion state, and scroll position are restored
    And no window error, unhandled rejection, or console error is observed
    And runtime coverage exercises production rendering, rule attachment, draft persistence, and editor reopening rather than source-string inspection
