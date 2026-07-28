Feature: Data layer project assurance severity

  Background:
    Given Shop has a Saved Draft with one valid canonical schema and one publishable change

  # Data layer project assurance severity 001
  Scenario Outline: Data layer project assurance severity 001
    Given the project has <project_state>
    And the canonical schemas contain no validation issue
    When project preflight runs
    Then <finding> is listed under Warnings
    And the blocking issue count is zero
    And validation, developer export, and publication remain available without acknowledging the warning

    Examples:
      | project_state | finding |
      | no Fixtures | No Fixtures |
      | no Assignments | No Assignments |
      | zero effective Coverage cells | No Coverage |

  # Data layer project assurance severity 002
  Scenario Outline: Data layer project assurance severity 002
    Given the project has <project_state>
    And every canonical schema is valid
    When project preflight runs
    Then it reports warning <warning_code> with the affected entity and repair action
    And no <category> finding enters the blocking issue list
    And any unusable optional record is excluded from evaluation without changing valid schema output
    And publication remains available

    Examples:
      | project_state | warning_code | category |
      | an incomplete Fixture | fixture-incomplete | Fixture |
      | a Fixture whose expected result fails | fixture-failed | Fixture |
      | equal Assignment candidates | assignment-tie | Assignment |
      | an Assignment with an unresolved target | assignment-unresolved | Assignment |
      | one unproven effective requirement | uncovered-requirement | Coverage |
      | stale Coverage after a schema edit | stale-coverage | Coverage |

  # Data layer project assurance severity 003
  Scenario Outline: Data layer project assurance severity 003
    Given legacy publication policy has <legacy_setting> enabled
    And all three optional-assurance collections are empty
    When the release gate evaluates the current Saved Draft
    Then optional assurance findings remain Warnings
    And the legacy setting cannot promote a warning to a blocker
    And publication confirmation remains enabled

    Examples:
      | legacy_setting |
      | fixturesRequired |
      | warningsBlock |

  # Data layer project assurance severity 004
  Scenario Outline: Data layer project assurance severity 004
    Given the project has <project_state>
    When <validation_boundary> runs
    Then a blocking validation issue identifies <repair_target>
    And <blocked_operation> remains unavailable until that validation issue is repaired
    And its blocking total is unchanged by every advisory finding

    Examples:
      | project_state | validation_boundary | repair_target | blocked_operation |
      | incompatible inherited property types | effective-schema compilation | the conflicting property facets | schema export and publication |
      | a malformed canonical validation rule | canonical compilation | the invalid rule field | schema export and publication |
      | a required property missing from submitted data | payload validation | the missing property path | successful validation |
      | an undeclared property while Only defined fields is enabled | payload validation | the undeclared property path | successful validation |

  # Data layer project assurance severity 005
  Scenario: Data layer project assurance severity 005
    Given preflight contains two optional-assurance warnings and one schema validation blocker
    When both assurance surfaces render the same preflight result
    Then Warnings and Blocking issues have separate labelled counts and lists
    And warnings use warning semantics rather than error semantics
    And only the schema validation blocker disables publication confirmation
    When the schema validation blocker is repaired and preflight reruns
    Then publication confirmation becomes enabled while both warnings remain visible
    And the refreshed preflight identity records the warning and blocker sets used by publication

  # Data layer project assurance severity 006
  Scenario: Data layer project assurance severity 006
    Given a schema-bearing contributor is independently addressable while routing and evidence collections are empty
    When the operator validates submitted data and requests developer export from that contributor
    Then both operations use its effective canonical schema
    And no Assignment is synthesized
    And absence of optional assurance produces warnings only
