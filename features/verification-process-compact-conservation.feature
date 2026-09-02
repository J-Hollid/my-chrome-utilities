Feature: Verification process compact conservation

  Background:
    Given verification registry generation must preserve exact task and ownership behavior
    And a process-only candidate changes no product behavior

  # Verification process compact conservation 001
  Scenario: Verification process compact conservation 001
    Given the legacy conservation fixture contains the complete generated registry snapshot
    When compact conservation records are introduced
    Then the legacy and compact forms produce the same normalized packs, slices, tasks, dependencies, consumers, properties, and package obligations
    And the legacy fixture remains until exact parity passes on the same candidate

  # Verification process compact conservation 002
  Scenario: Verification process compact conservation 002
    Given the compact-record format is enabled for generated registry data
    When a canonical registry is generated
    Then each record binds its schema, stable source object, input digests, generator digest, boundary identity, normalized output digest, and item count
    And the records are ordered and deterministic
    And the records do not contain a second complete generated registry snapshot

  # Verification process compact conservation 003
  Scenario: Verification process compact conservation 003
    Given one process slice changes
    When conservation records are refreshed
    Then only the records owned by the changed inputs are replaced
    And unchanged boundary records keep their exact bytes
    And no whole-source conservation fixture is regenerated

  # Verification process compact conservation 004
  Scenario Outline: Verification process compact conservation 004
    Given a compact conservation record is <record_state>
    When preflight validates the candidate
    Then it <validation_result>
    And no expensive verification task starts

    Examples:
      | record_state | validation_result |
      | current and identity-bound | accepts the record |
      | missing | reports the missing boundary and fails |
      | stale for its source inputs | reports the stale boundary and fails |
      | changed without its declared inputs | reports unexplained record drift and fails |
      | inconsistent with generated output | reports the output mismatch and fails |

  # Verification process compact conservation 005
  Scenario: Verification process compact conservation 005
    Given a candidate changes the registry generator and its compact records together
    When conservation validation runs
    Then fixed independent invariants recompute the normalized boundary inventory
    And the candidate cannot accept its own changed output only by changing its expected digest
    And an invariant or historical mismatch fails before focused execution

  # Verification process compact conservation 006
  Scenario: Verification process compact conservation 006
    Given a base-to-candidate change renames, copies, or deletes a governed path
    When the compact validator compares historical ownership
    Then the result preserves the former owner, current owner, and required compatibility closure
    And an unresolved historical owner remains a conservative planning failure

  # Verification process compact conservation 007
  Scenario: Verification process compact conservation 007
    Given exact compact parity has passed and independent review has accepted the migration
    When the legacy whole-registry fixture is retired
    Then the compact records become the only generated conservation data
    And full master-gate task conservation remains equal to the accepted legacy baseline
    And the removed fixture is not recreated by later process work
