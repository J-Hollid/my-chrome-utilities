Feature: Data layer saved event feed filters runtime

  Background:
    Given the built extension side panel is running with production Live capture, event-feed queries, saved-session feeds, and local persistence
    And the current production feed contains purchase, product_view, and page_view events with different validation results
    And the actual event-feed query builder is displayed

  # Data layer saved event feed filters runtime 001
  Scenario: Data layer saved event feed filters runtime 001
    Given actual conditions Event name is purchase and Validation state is Issues are active
    When the operator saves the current filter as Checkout issues through production controls
    Then production saved-filter storage contains one versioned entry with a stable identity and two ordered semantic conditions
    And the stored entry contains no events, session identity, inspector selection, scroll position, or capture state
    And the rendered selector identifies Checkout issues as active

  # Data layer saved event feed filters runtime 002
  Scenario: Data layer saved event feed filters runtime 002
    Given production saved filters Checkout issues and Product events exist
    When the actual selector switches from Custom · Unsaved to Checkout issues, Product events, and All events
    Then production Live state respectively contains each selected condition set and no merged predecessor conditions
    And the rendered feed, pathname groups, visible-event count, and no-match presentation refresh after every switch
    And stored definitions remain byte-for-byte unchanged

  # Data layer saved event feed filters runtime 003
  Scenario Outline: Data layer saved event feed filters runtime 003
    Given production Checkout issues is active with a modified working query
    When switching filters invokes <switch_action>
    Then persisted Checkout issues is <persisted_outcome>
    And rendered active state is <rendered_outcome>

    Examples:
      | switch_action        | persisted_outcome | rendered_outcome                   |
      | Save changes         | updated           | selected replacement filter        |
      | Discard and switch   | unchanged         | selected replacement filter        |
      | Cancel               | unchanged         | Checkout issues · Modified          |

  # Data layer saved event feed filters runtime 004
  Scenario: Data layer saved event feed filters runtime 004
    Given production Checkout issues is active and modified
    When actual Revert changes, Save as new, Update, and Rename actions are exercised
    Then Revert restores the original semantic query
    And Save as new creates one distinct stable identity
    And Update replaces only the selected saved definition
    And Rename preserves stable identity, active selection, and default reference
    And trimmed case-insensitive duplicate names are blocked before storage writes

  # Data layer saved event feed filters runtime 005
  Scenario: Data layer saved event feed filters runtime 005
    Given production Checkout issues is active
    When it is deleted through the actual confirmation flow
    Then its saved identity and default reference are removed atomically
    And the current production query remains active as Custom · Unsaved
    And the current feed events, count, scroll position, and selection are retained

  # Data layer saved event feed filters runtime 006
  Scenario: Data layer saved event feed filters runtime 006
    Given Checkout issues is stored as the production default
    When a new Live session starts and events are appended
    Then the default query is installed before the first event and filters every append
    When the side panel runtime is reconstructed during that session
    Then the active saved identity and query are restored from storage
    And removing the default causes the next new session to start with All events

  # Data layer saved event feed filters runtime 007
  Scenario: Data layer saved event feed filters runtime 007
    Given the current production Live feed has a custom working query
    And a read-only saved-session feed is opened
    When Checkout issues is applied to the saved-session feed and the operator returns to current Live
    Then production saved-session view state retains Checkout issues
    And production current-view state restores the original custom query
    And neither view mutates the global Checkout issues definition or the archived session events

  # Data layer saved event feed filters runtime 008
  Scenario: Data layer saved event feed filters runtime 008
    Given production saved filter Legacy failures contains observed, unobserved, and unsupported conditions
    When the actual selector restores it against the current feed
    Then observed conditions run with production query semantics
    And unobserved values can yield 0 matches with not-observed guidance
    And unsupported conditions are rendered as needing repair and never silently removed
    And editing and saving a repair replaces the stored definition only after confirmation

  # Data layer saved event feed filters runtime 009
  Scenario Outline: Data layer saved event feed filters runtime 009
    Given production saved-filter storage will fail at <failure_point>
    When the corresponding actual management action is confirmed
    Then storage equals its pre-confirmation snapshot
    And production working-query state and rendered conditions remain available for retry
    And feedback is <failure_feedback>

    Examples:
      | failure_point          | failure_feedback              |
      | create write           | Saving saved filter failed    |
      | update write           | Updating saved filter failed  |
      | rename write           | Renaming saved filter failed  |
      | delete write           | Deleting saved filter failed  |
      | default write          | Setting default failed        |

  # Data layer saved event feed filters runtime 010
  Scenario: Data layer saved event feed filters runtime 010
    Given production saved filters have been persisted
    When testing ends, the page navigates, validation results refresh, and the side panel reopens
    Then production saved-filter storage is unchanged
    And the active query is recalculated against updated complete-event data
    And condition identities do not depend on transient query-editor identifiers

  # Data layer saved event feed filters runtime 011
  Scenario: Data layer saved event feed filters runtime 011
    Given the production event feed is 320 CSS pixels wide with several saved filters
    When the operator switches, modifies, saves, renames, and deletes filters using keyboard controls
    Then the full-width selector and bounded actions remain operable without horizontal page scrolling
    And focus returns to the selector or invoking action after each dialog
    And active, Modified, default, success, and failure states are announced with text
    And runtime coverage exercises production query state, feed rendering, saved-session view isolation, persistence, reconstruction, default application, and management controls rather than source-string inspection
