# User-approved 2026-09-09: tealium-live.
# Tealium Live 001 through 014; metadata follow-up approved 2026-09-10.
Feature: Tealium Live

  Background:
    Given the Tealium utility is installed in the retained utility host

  # Tealium Live 001
  Scenario: Tealium Live 001
    When the user selects Tealium beside Data Layer and Hotkeys
    Then its Live view opens without a Data Layer project or successful Data Layer startup
    And target context appears once above the session controls and tag list
    And existing utility navigation, keyboard access, and command access remain available

  # Tealium Live 002
  Scenario Outline: Tealium Live 002
    Given target access fixture <fixture> is selected
    When Live checks target readiness
    Then setup shows <result>
    And probing and permission requests follow the fixture's actual access state
    And the selected target is retained without automatic replacement

    Examples:
      | fixture                    | result                         |
      | valid activeTab grant      | Start observation available    |
      | exact-origin grant missing | Request access available       |
      | exact-origin grant declined | Permission required           |
      | restricted browser page    | Unsupported page explained     |

  # Tealium Live 003
  Scenario: Tealium Live 003
    Given the selected target is accessible before Tealium appears
    When the user starts observation
    Then one session observes that target and waits for detection
    When the user pauses observation
    Then results remain visible without subsequent inventory updates
    When the user resumes observation and later ends observation
    Then current state is reconciled before owned work ends
    And a read-only final snapshot remains until a new Start or explicit reset
    And the next Start creates a new session without replaying missed sends

  # Tealium Live 004
  Scenario Outline: Tealium Live 004
    Given an observation and source selection belong to the current document
    When lifecycle event <event> occurs
    Then Live applies <outcome>
    And late results from an invalid document or session are discarded

    Examples:
      | event                       | outcome                                      |
      | reload at the same URL      | invalidate affected rows and source actions   |
      | replacement of a child frame | invalidate that frame's rows and actions     |
      | same-document URL change    | refresh context and retain document identity |
      | navigation loses site access | suspend reads and expose target recovery    |

  # Tealium Live 005
  Scenario: Tealium Live 005
    Given Tealium is observing with a filter, selection, and scrolled list
    When the user switches utilities and opens the Tealium full-width page
    Then the retained page and utility session remain unchanged
    And both surfaces use one observation owner and the same website target
    And filters and selection are shared while each surface retains its scroll position
    And actions from either surface update the same session once

  # Tealium Live 006
  Scenario: Tealium Live 006
    Given the current inventory contains tags from multiple frames and profiles
    When the user searches by name or UID and applies code-state or frame/profile filters
    Then the visible count identifies matching rows out of the current inventory
    And Clear filters restores the current inventory
    And rows are ordered by frame and profile then numeric UID
    And new observations do not steal focus, replace selection, or jump the list

  # Tealium Live 007
  Scenario Outline: Tealium Live 007
    Given Live content is <width> CSS pixels wide with a tag selected
    When the working region is displayed
    Then it shows <panes>
    And it has <scrolls> working-region vertical scroll containers and no wrapper scrollbar
    And URLs wrap without horizontal document overflow

    Examples:
      | width | panes                       | scrolls |
      | 360   | inspector with Back to tags | 1       |
      | 520   | inspector with Back to tags | 1       |
      | 720   | list and inspector          | 2       |
      | 900   | list and inspector          | 2       |

  # Tealium Live 008
  Scenario Outline: Tealium Live 008
    Given Tealium has one observation owner and an expanded surface
    When <closed_item> closes
    Then <outcome>
    And no other website target is attached automatically
    And other utility work is unchanged

    Examples:
      | closed_item       | outcome                                          |
      | expanded surface  | observation continues in the retained owner      |
      | owner host        | owned work ends and surviving surfaces show Ended |
      | website target    | owned work ends and Live shows Target closed     |

  # Tealium Live 009
  Scenario Outline: Tealium Live 009
    Given an active session observes UID <uid> with a valid profile version and metadata access
    When the automatic metadata response is pending
    Then the tag list immediately shows its local name or Tag <uid> fallback
    And the lookup starts without a Load tag names action
    When the exact profile response supplies the title <title>
    Then UID <uid> displays that title with its UID and metadata source retained
    And selection, focus, runtime evidence, and source actions remain valid
    And the published version title is separate from the library version

    Examples:
      | uid | title                                |
      | 115 | Tealium AudienceStream Integration    |
      | 21  | Checkout analytics                   |

  # Tealium Live 010
  Scenario Outline: Tealium Live 010
    Given metadata lookup fixture <fixture> has a local fallback name <fallback>
    When the automatic lookup settles
    Then the visible tag name remains <fallback>
    And Live observation and source actions remain usable
    And later observation polls do not repeat the failed lookup

    Examples:
      | fixture                 | fallback       |
      | host access unavailable | Tag 32         |
      | network failure         | Local analytics |
      | empty HTTP 200          | Tag 52         |
      | malformed callback      | Tag 21         |
      | timeout                 | Tag 61         |
      | response over size limit | Tag 71        |
      | matching title empty    | Local consent  |

  # Tealium Live 011
  Scenario Outline: Tealium Live 011
    Given two observed rows share UID 21 but differ by <boundary>
    And their exact profile responses contain distinct titles
    When automatic metadata retrieval completes
    Then each row receives only its own profile version's title
    And metadata for unobserved UIDs creates no inventory rows

    Examples:
      | boundary        |
      | account         |
      | profile         |
      | publish version |

  # Tealium Live 012
  Scenario Outline: Tealium Live 012
    Given a metadata response is pending for the selected row
    When <event> occurs before that response arrives
    Then the late response cannot change the protected inventory
    And it cannot change source-opening authorization

    Examples:
      | event                   |
      | observation ends        |
      | the session is replaced |
      | the document reloads    |
      | the frame is replaced   |
      | observation pauses      |

  # Tealium Live 013
  Scenario: Tealium Live 013
    Given an automatic metadata lookup has failed in the current session
    When repeated observations and a utility surface switch occur
    Then no additional automatic request is sent for the same profile version
    When the user retries and a valid response arrives
    Then the current matching rows receive names from one new request
    And later tags in that profile use the current view's metadata without another request
    When a new observation session starts
    Then it makes a fresh automatic attempt without loading a persisted API response

  # Tealium Live 014
  Scenario Outline: Tealium Live 014
    Given metadata host access is absent and local tag rows are visible
    When the user requests metadata access and chooses <decision>
    Then the permission request names only https://my.tealiumiq.com/*
    And metadata retrieval <outcome>
    And website access and the current observation session remain unchanged

    Examples:
      | decision | outcome                                    |
      | grant    | retries automatically for the current identity |
      | decline  | retains fallback names without another prompt |
