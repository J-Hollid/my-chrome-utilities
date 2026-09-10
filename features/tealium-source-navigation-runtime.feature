# User-approved 2026-09-09: tealium-live.
# Tealium source navigation runtime 001 through 009; source-target follow-up approved 2026-09-10.
Feature: Tealium source navigation runtime

  Background:
    Given the packaged extension has its Tealium DevTools bridge installed

  # Tealium source navigation runtime 001
  Scenario Outline: Tealium source navigation runtime 001
    Given executable source fixture <fixture> has been observed through Tealium Live
    When the operator opens DevTools and uses Go to u.send
    Then the actual Sources editor displays non-empty text from <resource>
    And a bundled selection points to its registered tag code after Chrome formatting
    And an API callback alone is not accepted as source-opening proof

    Examples:
      | fixture             | resource                                       |
      | separate tag 21     | /custom/utag.21.js?revision=7                   |
      | custom tag 52       | /vendor/metrics.js?version=52                   |
      | pinned real bundle  | /scripts/payload.js?revision=original            |

  # Tealium source navigation runtime 002
  Scenario: Tealium source navigation runtime 002
    Given Tealium observes Target A while only Target B has DevTools open
    When the operator selects a tag and then opens DevTools for Target A
    Then the inspector retains its selection while the matching bridge connects
    And Go to u.send opens Target A's resource without changing Target B's editor
    When Target A's DevTools closes
    Then the source action becomes unavailable without ending observation

  # Tealium source navigation runtime 003
  Scenario Outline: Tealium source navigation runtime 003
    Given the bridge has a pending request for the selected tag
    When actual lifecycle event <event> happens before resource opening
    Then the old request is rejected and no replacement-document resource is opened
    And a newly selected current tag can be inspected normally

    Examples:
      | event                           |
      | same-URL page reload             |
      | same-URL child-frame replacement |
      | old session ends and a new one starts |

  # Tealium source navigation runtime 004
  Scenario Outline: Tealium source navigation runtime 004
    Given executable source fixture <fixture> has been observed through Tealium Live
    When the production resolver inspects available resources
    Then installed controls show <result>
    And any opened file is checked in the actual Sources editor

    Examples:
      | fixture                                | result                                    |
      | identical function in two possible files | ambiguous resource with opening disabled |
      | known bundle with wrapped sender       | containing-file action with location unavailable |
      | no loaded source for configured tag    | unresolved resource with opening disabled |

  # Tealium source navigation runtime 005
  Scenario: Tealium source navigation runtime 005
    Given the selected tag has an observed custom-origin source URL with a query string
    When the installed Copy source URL button is activated
    Then the browser clipboard contains the exact observed URL
    And a controlled clipboard failure is reported without clearing the inspector
    And fixture request and execution counters show no action-induced script load or execution

  # Tealium source navigation runtime 006
  Scenario: Tealium source navigation runtime 006
    Given the retained owner and full-width page share a selected tag
    When each surface sends a source action through the actual extension message route
    Then the website Sources editor receives the action for the correct tab and session
    And mismatched sender, profile, frame, or session messages do not open another resource
    And the packaged manifest retains the existing permission model without debugger permission

  # Tealium source navigation runtime 007
  Scenario Outline: Tealium source navigation runtime 007
    Given executable source fixture <fixture> has been observed through Tealium Live
    When the operator chooses Go to u.send
    Then the actual Sources editor opens <destination> with nonempty content
    And the inspector states when the exact location is unavailable
    And custom hosts, paths, and query strings are preserved

    Examples:
      | fixture                                    | destination                         |
      | duplicate sends in one bundle              | the verified bundle at file start   |
      | observed separate tag with another copy    | the observed tag script             |
      | duplicate sends with unique tag extensions | the file identified by extension evidence |

  # Tealium source navigation runtime 008
  Scenario Outline: Tealium source navigation runtime 008
    Given a controlled bundle contains the selected tag and misleading uses of u.extend
    And its registered send and extension-array definitions have independent fixture locations
    When the operator uses <action> from the installed inspector
    Then the actual Sources editor selects <destination> after formatting
    And both actions remain visible in native side-panel and full-width layouts
    And fixture request and execution counters show no action-induced script load or execution

    Examples:
      | action         | destination                   |
      | Go to u.send   | the selected send definition  |
      | Go to u.extend | the selected array definition |

  # Tealium source navigation runtime 009
  Scenario Outline: Tealium source navigation runtime 009
    Given a production <action> request is pending for the selected tag
    When <change> invalidates its evidence before source opening
    Then the pending action opens no old or replacement destination
    And recovery never repeats the old open action
    And a new explicit action uses the current destination and session

    Examples:
      | action         | change                            |
      | Go to u.send   | the document reloads              |
      | Go to u.extend | the registered extensions change  |
      | Go to u.send   | the connection is lost            |
      | Go to u.extend | the observation session ends      |
