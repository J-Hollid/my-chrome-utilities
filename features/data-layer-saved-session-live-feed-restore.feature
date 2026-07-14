# mutation-stamp: sha256=41ea144ed26e30462afab46ce5a5b4529f405c381b465622d50f278aaea3a663
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T00:16:29.635595782Z","feature_name":"Data layer saved session Live feed restore","feature_path":"features/data-layer-saved-session-live-feed-restore.feature","background_hash":"26e13ced0962db1e3ec2ea8afdec65a7ae937029a0c34905da53da782e19f6be","implementation_hash":"sha256:1c2c2c23fda67593ac7f4094f418a2c04b92b3264eccf0083d7b3bf77c358683","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer saved session Live feed restore

  Background:
    Given saved session Checkout journey contains 18 captured events in original capture order
    And the saved session is listed in Sessions

  # Data layer saved session Live feed restore 001
  Scenario: Data layer saved session Live feed restore 001
    When the operator activates Open in Live feed for Checkout journey
    Then the Live view opens in Saved session mode
    And the Live feed contains the 18 saved events in original capture order
    And no observer is started or attached
    And no saved event is copied into the current session

  # Data layer saved session Live feed restore 002
  Scenario: Data layer saved session Live feed restore 002
    Given Checkout journey is open in the Live feed
    When the saved-session banner is displayed
    Then it identifies Checkout journey, Read-only archive, 18 events, and capture date
    And Return to current Live feed is available
    And live capture controls cannot append events to Checkout journey

  # Data layer saved session Live feed restore 003
  Scenario: Data layer saved session Live feed restore 003
    Given Checkout journey is open in the Live feed
    When the operator filters events, opens an event, builds a defect report, or uses the timeline builder
    Then the same analysis behavior available for current-session events is available
    And captured payloads, raw inputs, event identities, provenance, and capture order remain unchanged
    And analysis actions do not mutate Checkout journey

  # Data layer saved session Live feed restore 004
  Scenario: Data layer saved session Live feed restore 004
    Given current-session feed state contains events, filters, selected event purchase, and a saved scroll position
    And Checkout journey is open in the Live feed
    When the operator activates Return to current Live feed
    Then the prior current-session events and filters are restored
    And event purchase and the saved scroll position are restored
    And no Checkout journey event is merged into the current session

  # Data layer saved session Live feed restore 005
  Scenario: Data layer saved session Live feed restore 005
    Given live capture remains active while Checkout journey is open in the Live feed
    When 4 new live events are captured
    Then Checkout journey remains displayed and unchanged
    And the banner states that live capture continues in the background
    And Return to current Live feed identifies 4 new events

  # Data layer saved session Live feed restore 006
  Scenario: Data layer saved session Live feed restore 006
    Given Checkout journey records original validation against schema revision 3
    And schema revision 4 is current
    When the operator activates Revalidate with current schemas
    Then a separate comparison records revision 3 and revision 4 results
    And the original validation result remains unchanged
    And the saved event and Checkout journey remain immutable

  # Data layer saved session Live feed restore 007
  Scenario: Data layer saved session Live feed restore 007
    Given Checkout journey is open in the Live feed
    When the side panel reloads
    Then Checkout journey remains the selected read-only feed source
    And its event filters, selected event, and scroll position are restored
    And no observer starts automatically

  # Data layer saved session Live feed restore 008
  Scenario: Data layer saved session Live feed restore 008
    When the operator activates Start linked capture for Checkout journey on https://example.test/confirmation
    Then a new active session is created with 0 events and a link to Checkout journey
    And Checkout journey remains unchanged with 18 events
    And the new session receives only subsequently captured events
    And this action does not load saved events as newly captured events

  # Data layer saved session Live feed restore 009
  Scenario: Data layer saved session Live feed restore 009
    Given Checkout journey was imported from a valid saved-session file
    When the operator activates Open in Live feed
    Then the imported events are restored to the read-only Live feed
    And event ids, sources, capture order, payloads, raw inputs, page URLs, and provenance are preserved
