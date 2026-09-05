# Verification architecture module declarations 001
# Verification architecture module declarations 002
# Verification architecture module declarations 003
Feature: Verification architecture module declarations

  Background:
    Given verification compares the exact base and candidate architecture inputs
    And complete architecture validation and the terminal release gate remain required

  # Verification architecture module declarations 001
  Scenario Outline: Verification architecture module declarations 001
    Given a bounded source-module declaration has change <change_kind>
    When canonical ownership and readiness are computed
    Then the plan includes complete architecture validation and affected current and base consumers
    And sharing the declaration file does not alone select every runnable pack
    And the result is not genuinely-global merely because the path is under architecture

    Examples:
      | change_kind             |
      | add a module entry      |
      | edit a module entry     |
      | delete a module entry   |
      | rename a source path    |
      | change a contract edge  |

  # Verification architecture module declarations 002
  Scenario Outline: Verification architecture module declarations 002
    Given the candidate contains <change_class>
    When declaration scope is assessed from repository evidence
    Then the planner applies <required_treatment>
    And no caller label or task-specific exception can reduce that treatment

    Examples:
      | change_class                          | required_treatment                         |
      | shared architecture rule change       | existing global rule coverage              |
      | mixed rule and declaration changes    | coverage including the shared rule change  |
      | ambiguous or unavailable base identity| fail closed or retain conservative scope   |
      | invalid declaration                   | reject passing architecture evidence       |
      | unresolved affected consumer          | fail closed or retain conservative scope   |

  # Verification architecture module declarations 003
  Scenario: Verification architecture module declarations 003
    Given a production module extraction requires a new architecture entry
    When it is planned after the declaration-ownership correction is reviewed and QA-integrated
    Then its real module and contract edges are registered without a decomposition exception
    And the complete checker still rejects invalid layer or import relationships
    And no existing acceptance assertion or terminal obligation is removed
    And the feature candidate does not narrow its own evidence ownership
