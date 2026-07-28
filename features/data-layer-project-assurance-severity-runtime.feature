Feature: Data layer project assurance severity runtime

  Background:
    Given the built extension is running with production project storage, schema validation, preflight, release review, and publication
    And production Shop has one valid canonical schema and one publishable Saved Draft change

  # Data layer project assurance severity runtime 001
  Scenario Outline: Data layer project assurance severity runtime 001
    Given production project state has <project_state>
    When actual preflight and release-review controls run
    Then the rendered Warnings list contains <finding>
    And the rendered Blocking issues count is zero
    And validation, developer export, and publication controls remain enabled without warning acknowledgement

    Examples:
      | project_state | finding |
      | no Fixtures | No Fixtures |
      | no Assignments | No Assignments |
      | zero effective Coverage cells | No Coverage |

  # Data layer project assurance severity runtime 002
  Scenario Outline: Data layer project assurance severity runtime 002
    Given production project state has <project_state>
    And canonical schema compilation succeeds
    When production preflight runs
    Then warning bytes contain <warning_code>, the affected entity, and its repair route
    And blocker bytes contain no finding classified as <category>
    And production evaluation excludes any unusable optional record while retaining valid schema output
    And the installed publication controls remain enabled

    Examples:
      | project_state | warning_code | category |
      | an incomplete Fixture | fixture-incomplete | Fixture |
      | a Fixture whose expected result fails | fixture-failed | Fixture |
      | equal Assignment candidates | assignment-tie | Assignment |
      | an Assignment with an unresolved target | assignment-unresolved | Assignment |
      | one unproven effective requirement | uncovered-requirement | Coverage |
      | stale Coverage after a schema edit | stale-coverage | Coverage |

  # Data layer project assurance severity runtime 003
  Scenario Outline: Data layer project assurance severity runtime 003
    Given imported project bytes enable <legacy_setting>
    And Fixtures, Assignments, and Coverage are empty
    When actual preflight and release-review controls run
    Then every optional-assurance DOM item is in the Warnings region
    And production blocker count remains zero
    And both publication confirmation controls are enabled

    Examples:
      | legacy_setting |
      | fixturesRequired |
      | warningsBlock |

  # Data layer project assurance severity runtime 004
  Scenario Outline: Data layer project assurance severity runtime 004
    Given production project state has <project_state>
    When the installed <validation_boundary> runs
    Then each validation error exposes repair route <repair_target>
    And <blocked_operation> is disabled until the production validator reports the issue repaired
    And DOM and preflight bytes exclude Fixture, Assignment, and Coverage warnings from the blocker count

    Examples:
      | project_state | validation_boundary | repair_target | blocked_operation |
      | incompatible inherited property types | effective-schema compiler | the conflicting property controls | schema export and publication |
      | a malformed canonical validation rule | canonical compiler | the invalid rule control | schema export and publication |
      | a required property missing from submitted data | payload validator | the missing property path | successful validation |
      | an undeclared property while Only defined fields is enabled | payload validator | the undeclared property path | successful validation |

  # Data layer project assurance severity runtime 005
  Scenario: Data layer project assurance severity runtime 005
    Given production preflight has two optional-assurance warnings and one schema validation blocker
    When actual preflight and release-review controls run
    Then separate Warnings and Blocking issues regions show counts two and one
    And computed accessibility semantics classify only the schema issue as an error
    And publication confirmation is disabled
    When actual repair controls clear the schema issue and preflight reruns
    Then both warnings remain rendered and publication confirmation becomes enabled
    And publication consumes the refreshed preflight identity with its exact warning and blocker bytes

  # Data layer project assurance severity runtime 006
  Scenario: Data layer project assurance severity runtime 006
    Given an installed schema-bearing contributor has no Assignment, Fixture, or Coverage row
    When actual controls validate submitted data and request developer export
    Then production validator and exporter consume that contributor's effective canonical schema
    And repository inspection finds no synthesized Assignment
    And the only assurance diagnostics are rendered warnings
