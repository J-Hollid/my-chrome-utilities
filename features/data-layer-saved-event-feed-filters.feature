Feature: Data layer saved event feed filters

  Background:
    Given a testing session has captured events with different names, paths, payloads, sources, and validation results
    And the Live event-feed query builder is displayed

  # Data layer saved event feed filters 001
  Scenario: Data layer saved event feed filters 001
    Given active conditions are Event name is purchase and Validation state is Issues
    When the operator saves the current filter as Checkout issues
    Then one saved filter with a stable identity is stored under name Checkout issues
    And it retains the ordered fields, operators, values, and all-conditions and any-selected-value semantics
    And Checkout issues becomes the active saved filter
    And captured events and session state are not included in the saved filter

  # Data layer saved event feed filters 002
  Scenario Outline: Data layer saved event feed filters 002
    Given the event feed has <filter_state>
    When its filter identity is displayed
    Then the displayed state is <displayed_state>
    And save behavior is <save_behavior>

    Examples:
      | filter_state                                      | displayed_state              | save_behavior                         |
      | no conditions                                     | All events                   | Save current filter is unavailable    |
      | unsaved conditions                                | Custom · Unsaved             | Save current filter is available      |
      | exact saved definition Checkout issues            | Checkout issues              | no changes need saving                |
      | changed working copy of Checkout issues            | Checkout issues · Modified   | Update and Save as new are available  |

  # Data layer saved event feed filters 003
  Scenario: Data layer saved event feed filters 003
    Given saved filters Checkout issues and Product events have different conditions
    And an unrelated custom condition is active
    When the operator switches to Checkout issues
    Then the current conditions are replaced by Checkout issues
    And the unrelated custom condition is not merged into it
    And the feed immediately displays the Checkout issues matches and count
    When the operator switches to Product events
    Then Product events replaces Checkout issues without altering either saved definition
    When the operator switches to All events
    Then every captured event is visible

  # Data layer saved event feed filters 004
  Scenario Outline: Data layer saved event feed filters 004
    Given Checkout issues is active and its working conditions have been modified
    When the operator attempts to switch to Product events
    And chooses <switch_action>
    Then saved Checkout issues is <saved_outcome>
    And active filter outcome is <active_outcome>

    Examples:
      | switch_action        | saved_outcome                   | active_outcome                    |
      | Save changes         | updated with working conditions | Product events is applied         |
      | Discard and switch   | unchanged                       | Product events is applied         |
      | Cancel               | unchanged                       | modified Checkout issues remains  |

  # Data layer saved event feed filters 005
  Scenario: Data layer saved event feed filters 005
    Given Checkout issues is active and modified
    When the operator activates Revert changes
    Then its exact saved conditions are restored to the working feed
    And its Modified state is removed
    When the operator activates Save as new with name Checkout warnings
    Then Checkout warnings receives a new stable identity
    And Checkout issues remains unchanged

  # Data layer saved event feed filters 006
  Scenario Outline: Data layer saved event feed filters 006
    Given saved filter Checkout issues exists
    When the operator enters candidate name <candidate_name>
    Then name result is <name_result>
    And assistance is <assistance>

    Examples:
      | candidate_name      | name_result | assistance                              |
      | blank               | blocked     | Enter a saved filter name               |
      | spaces              | blocked     | Enter a saved filter name               |
      | checkout issues     | blocked     | A saved filter with this name exists    |
      | Checkout warnings   | accepted    | Ready to save Checkout warnings         |

  # Data layer saved event feed filters 007
  Scenario: Data layer saved event feed filters 007
    Given Checkout issues is active
    When it is renamed to Purchase defects
    Then its stable identity, definition, default state, and active selection are retained
    And the selector displays Purchase defects in name order
    When Purchase defects is deleted
    Then its definition is removed from the saved-filter library
    And the unchanged working conditions become Custom · Unsaved
    And the feed is not unexpectedly cleared

  # Data layer saved event feed filters 008
  Scenario: Data layer saved event feed filters 008
    Given Checkout issues is selected as the default saved filter
    When a new testing session begins
    Then Checkout issues is applied to the empty feed before events arrive
    And later matching and nonmatching events are filtered as captured
    When the default selection is removed
    Then a later new session begins with All events
    And creating a new session never deletes saved filters

  # Data layer saved event feed filters 009
  Scenario: Data layer saved event feed filters 009
    Given Checkout issues is the active saved filter
    When the side panel closes and reopens during the same testing session
    Then Checkout issues and its exact conditions are restored
    And the matching count is recalculated from the current complete feed
    Given Custom · Unsaved is active instead
    When a new testing session begins
    Then the custom conditions are not carried into the new session
    And the configured default or All events is applied

  # Data layer saved event feed filters 010
  Scenario: Data layer saved event feed filters 010
    Given Checkout issues is saved globally
    And the current Live feed has Custom · Unsaved conditions
    When a read-only saved session is opened in the Live feed
    And Checkout issues is applied there
    Then the saved-session feed uses Checkout issues without changing its archived events
    And returning to the current Live feed restores its Custom · Unsaved conditions
    And updating either feed's working copy does not silently change the other feed's working query

  # Data layer saved event feed filters 011
  Scenario: Data layer saved event feed filters 011
    Given saved filter Schema failures references schema Product event, rule Known page types, and payload path commerce.coupon.code
    And the current feed has not observed one or more referenced values
    When Schema failures is applied
    Then every retained condition is evaluated literally against the current events
    And zero matches are allowed without altering the saved filter
    And unavailable values are identified as not observed in this feed
    And the operator can edit, replace, or remove those conditions

  # Data layer saved event feed filters 012
  Scenario: Data layer saved event feed filters 012
    Given a restored saved filter contains an unsupported field or operator
    When its definition is loaded
    Then the unsupported condition is retained and identified as needing repair
    And it is not silently discarded or treated as a successful match
    And the valid remainder is available for review without partially overwriting storage

  # Data layer saved event feed filters 013
  Scenario Outline: Data layer saved event feed filters 013
    Given a saved-filter storage operation will fail during <operation>
    When the operator confirms that operation
    Then saved-filter storage equals its pre-confirmation snapshot
    And the working query remains usable for retry
    And no success feedback is displayed

    Examples:
      | operation       |
      | create          |
      | update          |
      | rename          |
      | delete          |
      | set default     |

  # Data layer saved event feed filters 014
  Scenario: Data layer saved event feed filters 014
    Given multiple saved filters and an active working query exist
    When testing ends, navigation occurs, a schema revision publishes, or a saved session is opened
    Then saved-filter definitions remain unchanged
    And only the active feed's working query is reapplied to its current event and validation data
    And saved filters remain separate from saved sessions, schemas, defects, and event templates

  # Data layer saved event feed filters 015
  Scenario: Data layer saved event feed filters 015
    Given the event feed is displayed at 320 CSS pixels wide
    When the operator opens the saved-filter selector and management actions
    Then the selector occupies a readable full-width row
    And Save, Update, Save as new, Revert, Rename, Delete, Set as default, and Clear are reachable from one bounded action menu
    And the active identity, Modified state, and event count are communicated with text
    And switching restores focus to the selector without horizontal page scrolling

