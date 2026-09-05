# Project Library dialog decomposition 001
# Project Library dialog decomposition 002
# Project Library dialog decomposition 003
Feature: Project Library dialog decomposition

  Background:
    Given reviewed architecture declaration ownership is integrated into QA
    And the production Project Library coordinator uses registered dialog modules

  # Project Library dialog decomposition 001
  Scenario Outline: Project Library dialog decomposition 001
    Given the existing workflow is <workflow>
    When its dialog is opened through the production coordinator
    Then one focused module owns that dialog and uses explicit callbacks
    And the coordinator owns no dialog construction for that workflow
    And inputs, validation, stable identities, and save effects remain unchanged

    Examples:
      | workflow      |
      | edit project  |
      | switch review |
      | create project|
      | import review |

  # Project Library dialog decomposition 002
  Scenario Outline: Project Library dialog decomposition 002
    Given an existing project dialog ends through <completion>
    When its production lifecycle settles
    Then the original action and persistence result are preserved
    And focus returns to a reachable appropriate control
    And cancellation and resource release follow their existing contracts
    And no duplicate callback, save, or Undo action occurs

    Examples:
      | completion   |
      | confirmation |
      | cancellation |
      | Escape       |
      | native close |

  # Project Library dialog decomposition 003
  Scenario: Project Library dialog decomposition 003
    When the settled extraction is inspected and exercised
    Then the pure project presentation module remains separate
    And dialog modules, metadata helpers, and focus helpers have coherent responsibilities
    And all extracted modules and actual dependencies pass complete architecture validation
    And project state, subscriptions, transport, revision, save, and Undo behaviour are preserved
    And the prerequisite contains no unfinished companion branding changes
