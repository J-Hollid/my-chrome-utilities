# User-approved 2026-09-08: project-multiple-observation-sources.
# Data layer project observation sources runtime 001 through 012
Feature: Data layer project observation sources runtime

  Background:
    Given the built extension runs with its production repository, source settings, Capture controller, and page observer
    And the installed project has enabled sources Marketing at dataLayer and Application at event.history
    And the selected test page and capture scheduler expose controlled snapshot, subscription, save, and callback boundaries

  # Data layer project observation sources runtime 001
  Scenario Outline: Data layer project observation sources runtime 001
    Given the side panel viewport width is <width> CSS pixels
    When keyboard input opens source settings, adds <name> at <path>, and saves
    Then the installed source controls expose names, paths, enabled states, and individual statuses without horizontal overflow
    And durable project read-back contains the new source
    When the extension reloads and opens the project
    Then the same source identity and settings appear in the actual controls
    And source errors are associated with the affected input

    Examples:
      | width | name     | path          |
      | 360   | Checkout | checkoutQueue |
      | 800   | Consent  | consent.log   |

  # Data layer project observation sources runtime 002
  Scenario Outline: Data layer project observation sources runtime 002
    Given dataLayer contains <marketing_before> and event.history contains <application_before>
    When actual controls start testing and both initial snapshot phases finish
    And the page pushes <handoff> before extension subscriptions finish activation
    And activation completes and the page pushes <live> with tied capture timestamps
    Then the installed feed contains both snapshots in saved source order followed by <handoff> and <live> in receipt order
    And each source entry appears once with distinct stable source and event identities
    And original page push calls receive their original receiver and arguments once and return their original results
    And each source has exactly one effective subscription

    Examples:
      | marketing_before | application_before | handoff                         | live                            |
      | M0               | A0                 | Marketing:M1, Application:A1     | Application:A2, Marketing:M2     |
      | M3               | A3                 | Application:A4, Marketing:M4     | Marketing:M5, Application:A5     |

  # Data layer project observation sources runtime 003
  Scenario Outline: Data layer project observation sources runtime 003
    Given event.history is <unavailable> and dataLayer is an array
    When actual controls start testing and the page pushes Marketing event M1
    Then the installed feed contains M1 and Application shows <status>
    When the page creates event.history with A1 and the controlled retry completes
    Then the installed feed adds A1 once and both source rows show Ready
    And the Marketing subscription and M1 identity remain unchanged

    Examples:
      | unavailable | status           |
      | absent      | Waiting for path |
      | a scalar    | Not an array     |

  # Data layer project observation sources runtime 004
  Scenario Outline: Data layer project observation sources runtime 004
    Given the installed feed has received identical <payload> entries from both sources
    When actual source-filter controls select <source>
    Then exactly the event from <source> is rendered and the visible count is one
    And its inspector, saved-session round trip, and generated defect evidence retain its source identity
    And an Assignment bound to the other source is not used for its validation
    When the actual source filter is cleared
    Then both original event identities are rendered without new capture records

    Examples:
      | payload                              | source      |
      | {"event":"purchase","value":10}    | Marketing   |
      | {"event":"pageview","page":"/"}  | Application |

  # Data layer project observation sources runtime 005
  Scenario Outline: Data layer project observation sources runtime 005
    Given both sources have captured entries on the current page
    When actual controls perform <action> on Marketing
    And the old Marketing callback completes after that change
    And the page pushes A2 to event.history
    Then the stale Marketing callback adds no entry
    And A2 appears once without replacing the Application subscription
    And earlier Marketing evidence retains its captured identity and labels

    Examples:
      | action                             |
      | disable                            |
      | confirmed removal                  |
      | change path to analyticsQueue      |

  # Data layer project observation sources runtime 006
  Scenario Outline: Data layer project observation sources runtime 006
    Given both sources are attached on the selected target
    When <transition> occurs and old callbacks finish after replacement attachment
    Then no old callback enters the new observation generation
    And each newly attached array contributes its initial and pushed entries once
    And any unaffected source continues without repeating earlier entries
    And earlier events retain their original page-load identity
    And no unrelated tab receives an observer

    Examples:
      | transition                                     |
      | selected target reload at the same URL         |
      | selected target navigation to another page     |
      | replacement of the dataLayer array on the page |

  # Data layer project observation sources runtime 007
  Scenario Outline: Data layer project observation sources runtime 007
    Given two configured paths resolve to <array_relation>
    When both subscriptions activate and the page pushes the same payload once to each distinct array
    And one source is disabled and enabled on the same page
    Then each configured source has one captured entry
    And each source has exactly one effective subscription
    And page-owned push runs once per page call with unchanged result and receiver
    And disabling one source leaves the other subscription working

    Examples:
      | array_relation       |
      | two distinct arrays  |
      | the same array       |

  # Data layer project observation sources runtime 008
  Scenario Outline: Data layer project observation sources runtime 008
    Given the active project default push path is commandQueue
    And a saved Library event has explicit Destination analyticsQueue
    When actual controls filter to <source>, push a new event, and push the saved Library event
    Then page instrumentation records one direct push at commandQueue and one Library push at analyticsQueue
    And neither observation array receives a fallback push
    When actual controls save a captured <source> event as a Library draft
    Then its rendered Destination is commandQueue

    Examples:
      | source      |
      | Marketing   |
      | Application |

  # Data layer project observation sources runtime 009
  Scenario Outline: Data layer project observation sources runtime 009
    Given both source subscriptions are active
    When <action> occurs and all pending source callbacks finish
    Then no disposed subscription adds an event
    And captured and saved source evidence remains unchanged
    And cleanup preserves any newer page-owned push replacement

    Examples:
      | action                             |
      | Stop testing                       |
      | selected target closure            |
      | selected-origin permission removal |
      | switch to another project          |

  # Data layer project observation sources runtime 010
  Scenario Outline: Data layer project observation sources runtime 010
    Given durable storage contains an older project with only observationHistoryPath <path> and defaultPushPath <push_path>
    When actual project controls load it twice and add a second source
    Then durable read-back shows one stable migrated source and one added source with default push path <push_path>
    And old source references still resolve without a new production revision
    When actual controls export, import, and activate the imported project
    Then installed capture uses both imported paths with distinct source identities within that project
    And the original project and global Library bytes remain unchanged

    Examples:
      | path          | push_path |
      | queue.history | queue     |
      | dataLayer     | dataLayer |

  # Data layer project observation sources runtime 011
  Scenario: Data layer project observation sources runtime 011
    Given Marketing has captured M1 from the current dataLayer array
    When actual controls disable Marketing and the page pushes M2 and M3
    Then the installed feed still has only M1 from Marketing
    When actual controls enable Marketing twice on that same array
    Then the installed feed has M1, M2, and M3 once each from Marketing
    And one effective Marketing subscription remains
    When actual controls remove both sources with confirmation and reload
    Then durable source settings remain empty and Start testing is unavailable

  # Data layer project observation sources runtime 012
  Scenario: Data layer project observation sources runtime 012
    Given the installed source editor has an unsaved path change
    When the controlled durable write fails after Save
    Then actual controls retain the edit and show an error with Retry
    And only the previous committed path remains observed
    When Retry completes with successful durable read-back
    Then the new path attaches once and the old path detaches
    And reopening the project shows the saved edit
