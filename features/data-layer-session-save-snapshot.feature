Feature: Data layer session save snapshot

  Background:
    Given the current session contains 18 captured events

  # Data layer session save snapshot 001
  Scenario: Data layer session save snapshot 001
    When the operator activates Save session
    Then a focused save dialog shows session name, page scope, event count, source count, and validation summary
    And no saved session is created before a non-blank name is confirmed
    When the operator confirms name Checkout journey
    Then an immutable snapshot containing the 18 current events is added to Sessions
    And capture state is unchanged

  # Data layer session save snapshot 002
  Scenario: Data layer session save snapshot 002
    Given Checkout journey was saved through the 18 current events while capture remains active
    When 3 more events are captured
    Then Checkout journey remains unchanged with 18 events
    And the current session identifies 3 newer events as unsaved
    And End testing identifies that captured events remain unsaved
