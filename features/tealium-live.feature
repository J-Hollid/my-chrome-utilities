# User-approved 2026-09-09: tealium-live.
# Tealium Live 001 through 008
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
