# mutation-stamp: sha256=56e4d7ebc8986cc23a580c561e7e668550a1e76febf0923d3f6905cf42f5f517
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T07:43:32.793432535Z","feature_name":"Data layer fresh session","feature_path":"features/data-layer-fresh-session.feature","background_hash":"a7031d0a16347204f370875cb325f59827ef75d41f6ef3ea2ba2de2387b749b9","implementation_hash":"sha256:970cc7b2c71733a8b92ce8bca6a0999289f07df23c3651c2a771d93a0cc88007","scenarios":[{"index":0,"name":"Data layer fresh session 001","scenario_hash":"3efa2251faca15b7c236f154159dbcd3212d98ceb9307dbc2cb5e70eac665668","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-14T07:43:32.793432535Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer fresh session

  Background:
    Given the current Live feed is attached to target Checkout
    And Checkout uses history array path queue.history

  # Data layer fresh session 001
  Scenario Outline: Data layer fresh session 001
    Given the current session contains <event_count> captured events with save state <save_state>
    When the operator activates Start fresh session
    Then a distinct active session starts with 0 captured events
    And target Checkout, queue.history, observation sources, and schema configuration are retained
    And feed query, selected event, scroll position, and event-derived builders are reset
    And previously saved sessions remain unchanged

    Examples:
      | event_count | save_state      |
      | 0           | nothing to save |
      | 12          | all saved       |

  # Data layer fresh session 002
  Scenario: Data layer fresh session 002
    Given the current session contains 12 captured events of which 3 are unsaved
    When the operator activates Start fresh session
    Then no session or captured event changes yet
    And a confirmation states that 3 unsaved events would be discarded
    And Save and start fresh, Discard and start fresh, and Cancel are available
    When the operator activates Cancel
    Then the same session remains active with all 12 captured events and its prior feed state

  # Data layer fresh session 003
  Scenario: Data layer fresh session 003
    Given the fresh-session confirmation is open for 12 captured events of which 3 are unsaved
    When the operator activates Save and start fresh
    Then a save dialog requests a non-blank session name before either action occurs
    When the operator confirms session name Checkout before reset
    Then an immutable Checkout before reset snapshot containing all 12 events is added to Sessions
    And a distinct active session starts with 0 captured events

  # Data layer fresh session 004
  Scenario: Data layer fresh session 004
    Given the fresh-session confirmation is open for 12 captured events of which 3 are unsaved
    When the operator activates Discard and start fresh
    Then the prior current session is discarded without creating a saved session
    And a distinct active session starts with 0 captured events
    And target Checkout remains attached and recording

  # Data layer fresh session 005
  Scenario: Data layer fresh session 005
    Given queue.history already contains page_view and add_to_cart from the current session
    And the fresh-session confirmation is open for those unsaved events
    When the operator activates Discard and start fresh
    Then the new capture boundary is after page_view and add_to_cart
    And neither existing event appears in the new Live feed
    When purchase is appended to queue.history after confirmation
    Then purchase is captured exactly once in the new session
    When the side panel reloads
    Then the fresh session still contains only purchase
    And page_view and add_to_cart do not reappear

  # Data layer fresh session 006
  Scenario: Data layer fresh session 006
    Given saved session Checkout archive is open in the read-only Live feed
    When saved-session actions are displayed
    Then Start fresh session cannot reset Checkout archive or the background current session
    And Return to current Live feed remains available
