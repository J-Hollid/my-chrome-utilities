# User-approved 2026-09-10: utility-navigation-icons.
# Utility navigation icons runtime 001 through 003
Feature: Utility navigation icons runtime

  Background:
    Given the production extension is installed with Data Layer, Hotkeys, and Tealium

  # Utility navigation icons runtime 001
  Scenario Outline: Utility navigation icons runtime 001
    Given the host viewport is <width> CSS pixels wide
    When each utility tab is selected in turn
    Then the three top-level controls remain on one row without overlap or horizontal overflow
    And each control measures 44 by 44 CSS pixels with an 8 CSS pixel gap
    And the artwork measures 24 by 24 CSS pixels
    And the actual control exposes the full utility name and its associated panel

    Examples:
      | width |
      | 320   |
      | 800   |

  # Utility navigation icons runtime 002
  Scenario Outline: Utility navigation icons runtime 002
    Given the browser uses <colors>
    When the operator hovers and then uses keyboard focus on each utility tab
    Then the full utility name is visible without clipping
    And the focused control and selected control remain distinguishable
    And ArrowLeft, ArrowRight, Home, and End retain their existing tab behavior

    Examples:
      | colors        |
      | normal colors |
      | forced colors |

  # Utility navigation icons runtime 003
  Scenario: Utility navigation icons runtime 003
    Given Data Layer capture and a Tealium Live session are active for the bound website
    When the operator switches through all utility icons and returns to Tealium
    Then both utility session identities and the bound website remain unchanged
    And Data Layer captures arriving events once and Tealium retains its selection
    When the host is closed and reopened
    Then the selected utility is restored by the existing workspace setting
