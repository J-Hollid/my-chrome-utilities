# User-approved 2026-09-09: tealium-live.
# Tealium source navigation 001 through 007
Feature: Tealium source navigation

  Background:
    Given a Tealium Live tag is selected in the current observation session

  # Tealium source navigation 001
  Scenario Outline: Tealium source navigation 001
    Given source fixture <fixture> belongs to the selected tag
    And DevTools is connected to the bound website tab
    When the user chooses Show in Sources
    Then DevTools opens <resource> at <location>
    And the actual host, path, and query string are retained

    Examples:
      | fixture               | resource                                                        | location          |
      | separate tag 21       | https://tags.shop.example/custom/utag.21.js?revision=7            | file start        |
      | custom source tag 52  | https://assets.shop.example/vendor/metrics.js?version=52         | file start        |
      | renamed real bundle   | https://assets.shop.example/scripts/payload.js?revision=original | unique tag code   |

  # Tealium source navigation 002
  Scenario Outline: Tealium source navigation 002
    Given the DevTools connection is <connection>
    When the inspector source action is presented
    Then Show in Sources is <availability>
    And source selection remains intact
    And an unavailable connection explains how to open DevTools for the bound website tab

    Examples:
      | connection            | availability |
      | closed                | unavailable  |
      | another website tab   | unavailable  |
      | matching website tab  | available    |

  # Tealium source navigation 003
  Scenario Outline: Tealium source navigation 003
    Given a pending source action has <mismatch>
    When the bridge validates the action before opening a resource
    Then the mismatched action is rejected with feedback
    And no resource is opened for a different target, document, frame, profile, or tag

    Examples:
      | mismatch                        |
      | an old session identity         |
      | a same-URL replacement document |
      | a replaced frame                |
      | a different target tab          |
      | an unexpected sender            |
      | a removed tag                   |

  # Tealium source navigation 004
  Scenario Outline: Tealium source navigation 004
    Given source resolution yields <evidence>
    When the source action is evaluated
    Then Live applies <outcome>
    And the resolution limit remains visible in the inspector

    Examples:
      | evidence                                    | outcome                                   |
      | one containing file and no unique location   | allow opening that file at its start      |
      | multiple possible containing files          | disable opening and report ambiguity      |
      | no available containing resource            | disable opening and report unresolved     |
      | unique function in a bundled resource       | open that function in its containing file |

  # Tealium source navigation 005
  Scenario Outline: Tealium source navigation 005
    Given source action failure <failure> occurs
    When the action completes
    Then Live reports the failure without clearing the selected inspector or stopping observation
    And another attempt must use current connection and document evidence

    Examples:
      | failure                   |
      | DevTools disconnects      |
      | source loading fails      |
      | resource becomes stale    |

  # Tealium source navigation 006
  Scenario: Tealium source navigation 006
    Given the selected tag has a uniquely resolved actual source URL
    When the user chooses Copy source URL
    Then the clipboard receives that exact URL with visible success or failure feedback
    And copying does not fetch, execute, replace, or load a page script
    And an unresolved source has no enabled copy action

  # Tealium source navigation 007
  Scenario: Tealium source navigation 007
    Given the retained page and full-width page share one observation session
    When either surface requests source inspection
    Then the bridge uses the same pinned website target and validates the requesting session
    And the extension page itself is not selected as the inspected website
    And no debugger permission, automatic DevTools launch, or Tealium account access is required
