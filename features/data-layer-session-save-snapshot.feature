# mutation-stamp: sha256=5680177e0d627c1b2a115bee519c9403bea1f09077f95a97e784e04b63d95394
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T00:16:33.913255868Z","feature_name":"Data layer session save snapshot","feature_path":"features/data-layer-session-save-snapshot.feature","background_hash":"e13f3bacd55f82d91f97dbfb1cc346c35bbf238a0b927c03e40ace487867d090","implementation_hash":"sha256:58bb1cee1c3f9575a2179c0d6ed418a0d284557727f7037c91fb3792197b3443","scenarios":[]}
# acceptance-mutation-manifest-end

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
