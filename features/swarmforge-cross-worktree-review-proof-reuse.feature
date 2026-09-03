Feature: SwarmForge cross-worktree review-proof reuse

  Background:
    Given a SwarmForge reviewer is evaluating an official Git handoff
    And reliability handoff validation has access to current durable state

  # SwarmForge cross-worktree review-proof reuse 001
  Scenario Outline: SwarmForge cross-worktree review-proof reuse 001
    Given an exact candidate has valid bound review-ready evidence
    And an unchanged reviewer is sending an authorized review handoff
    And <incident_state>
    And the reviewer worktree has <local_artifact_state>
    When reliability handoff validation evaluates the unchanged candidate
    Then the official handoff passes from the durable review and incident proof
    And validation does not read, copy, build, or regenerate local evidence artifacts
    And validation does not write an incident transition

    Examples:
      | incident_state | local_artifact_state |
      | no applicable unresolved incident | no local receipt or package |
      | every applicable incident has a permitted durable terminal deferral | stale local receipt and package |

  # SwarmForge cross-worktree review-proof reuse 002
  Scenario Outline: SwarmForge cross-worktree review-proof reuse 002
    Given an exact candidate has valid bound review-ready evidence
    And an applicable incident needs its first terminal deferral
    And the reviewer worktree has <local_artifact_state>
    When reliability handoff validation evaluates the candidate
    Then the reuse path declines
    And the existing reliability command <result>
    And no evidence requirement is removed

    Examples:
      | local_artifact_state | result |
      | exact fresh receipt and package | validates and records only the eligible deferral |
      | a missing receipt | rejects the handoff before output |
      | a stale package | rejects the handoff before output |

  # SwarmForge cross-worktree review-proof reuse 003
  Scenario Outline: SwarmForge cross-worktree review-proof reuse 003
    Given the candidate has <unsafe_state>
    When reliability handoff validation evaluates reuse
    Then validation rejects the handoff before output
    And it does not copy evidence or run verification
    And it does not weaken or replace the existing blocking reason

    Examples:
      | unsafe_state |
      | an invalid durable incident record |
      | a forbidden candidate relationship |
      | a changed or invalid review-ready Git note |
