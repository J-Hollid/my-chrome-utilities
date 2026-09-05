Feature: Verification process Schema controller helper ownership

  Background:
    Given QA has the ten installed Schema controller slices and the existing project hydration owner
    And the current installed Schema TypeScript inventory is authoritative

  # Verification process Schema controller helper ownership 001
  Scenario: Verification process Schema controller helper ownership 001
    When the helper ownership inventory is complete
    Then each current installed Schema TypeScript file has exactly one existing slice owner or one explicit parent fallback
    And no current file is unclassified or has more than one result

  # Verification process Schema controller helper ownership 002
  Scenario Outline: Verification process Schema controller helper ownership 002
    Given an installed Schema helper has <boundary_evidence>
    When helper ownership is classified
    Then its ownership result is <ownership_result>
    And its required evidence is <required_evidence>

    Examples:
      | boundary_evidence | ownership_result | required_evidence |
      | one controller family, direct observable tests, and complete exact consumers | that existing controller slice | only that slice tasks and exact consumers |
      | more than one controller family or one shared public boundary | the complete Schemas parent | one specific durable fallback reason |
      | missing, conflicting, historical, or unobservable evidence | the complete Schemas parent | one specific durable fallback reason |

  # Verification process Schema controller helper ownership 003
  Scenario: Verification process Schema controller helper ownership 003
    Given a helper has valid ownership in one existing controller slice
    When exact changed-path planning selects that helper
    Then the plan includes its direct evidence, declared properties, prerequisites, and exact consumers
    And the plan excludes every unrelated Schema controller task
    And the complete Schemas parent task closure remains conserved

  # Verification process Schema controller helper ownership 004
  Scenario: Verification process Schema controller helper ownership 004
    Given a helper has an explicit parent fallback
    When verification applies the safe fallback route
    Then the plan includes the complete Schemas unit, property, and dependant closure
    And the fallback reason identifies the shared or unproved boundary

  # Verification process Schema controller helper ownership 005
  Scenario: Verification process Schema controller helper ownership 005
    Given the candidate changes helper ownership declarations and their durable contracts
    When current and base planning prepare the candidate evidence
    Then the candidate cannot use its new helper mappings to reduce its own evidence
    And the plan uses the existing verification-process ownership and registry slices
    And no new Schema behavior slice or verification-process slice is present
