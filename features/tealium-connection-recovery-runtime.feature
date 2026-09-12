# Tealium connection recovery runtime 001 through 003; user resumed implementation on 2026-09-12.
Feature: Tealium connection recovery runtime

  Background:
    Given the packaged extension runs a local Tealium fixture with DevTools open for its bound website

  # Tealium connection recovery runtime 001
  Scenario Outline: Tealium connection recovery runtime 001
    Given Live has no selected tag and its worker debugger is detached
    When eight real worker shutdowns each complete an accepted quiet reconnection
    And the operator then selects a tag and requests its source from <surface>
    Then the actual Sources editor shows the verified URL and nonempty tag source
    And the retained owner keeps the same website and observation session
    And no keepalive traffic or extension debugger permission is added

    Examples:
      | surface           |
      | native side panel |
      | full-width page   |

  # Tealium connection recovery runtime 002
  Scenario: Tealium connection recovery runtime 002
    Given the production transport has a previously confirmed connection
    When controlled transport failures prevent confirmation on every reconnect
    Then its six retry delays are 500, 1000, 2000, 4000, 8000, and 8000 milliseconds
    And the installed feedback changes from Reconnecting to DevTools... to Cannot connect to DevTools for this website.
    And another automatic attempt is not scheduled after exhaustion

  # Tealium connection recovery runtime 003
  Scenario Outline: Tealium connection recovery runtime 003
    Given an installed <action> request is pending for the selected tag
    When the worker stops and its bridge reconnects
    Then the pending request opens no source
    And a new explicit action revalidates the current tag and opens only its verified destination

    Examples:
      | action         |
      | Go to u.send   |
      | Go to u.extend |
