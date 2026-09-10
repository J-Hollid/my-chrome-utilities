# User-approved 2026-09-10: utility-navigation-icons.
# Utility navigation icons 001 through 003
Feature: Utility navigation icons

  Background:
    Given the utility host has Data Layer, Hotkeys, and Tealium tabs

  # Utility navigation icons 001
  Scenario Outline: Utility navigation icons 001
    When the top-level navigation is displayed
    Then utility <utility> has compact artwork <artwork>
    And its full accessible name remains <utility>
    And its full name appears on hover and keyboard focus
    And the resting control has no full text label

    Examples:
      | utility    | artwork          |
      | Data Layer | stylized DL      |
      | Hotkeys    | HK key outline   |
      | Tealium    | stylized T mark  |

  # Utility navigation icons 002
  Scenario: Utility navigation icons 002
    When the operator selects a utility through its icon
    Then its associated panel becomes visible and its tab is exposed as selected
    And selection has a visible border or shape in addition to color
    And the existing tab order and keyboard navigation remain available
    And selected-tab restoration and retained utility sessions remain unchanged

  # Utility navigation icons 003
  Scenario: Utility navigation icons 003
    Given an added utility has no custom artwork
    When its tab is displayed
    Then its compact control has a readable short label
    And its full accessible name and hover and focus name remain available
