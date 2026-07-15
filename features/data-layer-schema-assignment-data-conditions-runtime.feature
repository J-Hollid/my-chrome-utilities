# mutation-stamp: sha256=0ff244d76c906901eaf913cdc163c74c05a5de43b80c3f3e65ad929046eb6568
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T10:54:27.527341743Z","feature_name":"Data layer schema assignment data conditions runtime","feature_path":"features/data-layer-schema-assignment-data-conditions-runtime.feature","background_hash":"9b7be49ca19946c3250d48c64fc30e68bb9cc0b56f7b3c77d5c5bbd2093352ee","implementation_hash":"d7379854c194fe12500194b627adba06aa84f489d85b2466d461f71da67ecfe5","scenarios":[{"index":1,"name":"Data layer schema assignment data conditions runtime 002","scenario_hash":"1db9237ab28a05d0be9745cc7da9773c86bcd1ee954778b3911ecb13b10c16fd","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-15T10:54:27.527341743Z"},{"index":2,"name":"Data layer schema assignment data conditions runtime 003","scenario_hash":"faf36b56810cf032d8244b311c753291d72e4eae4bb4641d300eceac8bc9a4bb","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-07-15T10:54:27.527341743Z"},{"index":3,"name":"Data layer schema assignment data conditions runtime 004","scenario_hash":"45c0df2dcf0c9a3386b379258014731e99180849c1a90a5cfcc7b83bf7e11e56","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-15T10:54:27.527341743Z"},{"index":4,"name":"Data layer schema assignment data conditions runtime 005","scenario_hash":"045a458f2e00c037fbc99fa05a51051f1d693992d0c35d82c51d3ffbf7792331","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-15T10:54:27.527341743Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema assignment data conditions runtime

  Background:
    Given the built extension side panel is running with production assignment editing, conditional predicates, schema resolution, validation, persistence, import, and export
    And production Legacy generic event and Current generic event assignments share source event-history and event name generic_event

  # Data layer schema assignment data conditions runtime 001
  Scenario: Data layer schema assignment data conditions runtime 001
    When the actual assignment editor adds Data layer conditions
    Then rendered controls provide payload or raw-input target, All or Any group, repeatable property predicates, type-compatible operators, and typed comparison values
    And an absent group remains unrestricted while a rendered empty group blocks save
    And keyboard focus and assignment-editor scroll survive predicate rerenders

  # Data layer schema assignment data conditions runtime 002
  Scenario Outline: Data layer schema assignment data conditions runtime 002
    Given production Legacy assignment has Any Exists /errorType, /siteStructure, and /siteArea
    And production Current assignment has Any Exists /error_type, /page_levels, and /site_section
    When actual generic_event payload contains <property_family>
    Then production selected schema is <selected_schema>
    And the validation record identifies the matching assignment and predicate evidence

    Examples:
      | property_family                    | selected_schema        |
      | errorType                          | Legacy generic event   |
      | siteStructure and siteArea         | Legacy generic event   |
      | error_type                         | Current generic event  |
      | page_levels and site_section       | Current generic event  |

  # Data layer schema assignment data conditions runtime 003
  Scenario Outline: Data layer schema assignment data conditions runtime 003
    Given a production predicate uses <operator> and <configured_value>
    When production observed state is <observed_state>
    Then actual predicate result is <predicate_result>

    Examples:
      | operator        | configured_value       | observed_state      | predicate_result |
      | Exists          | none                   | missing             | no match         |
      | Does not exist  | none                   | null present        | no match         |
      | Equals          | number 1               | string 1            | no match         |
      | Is one of       | strings legacy,current | string current      | match            |
      | Matches pattern | ^legacy-               | string legacy-page  | match            |
      | Is at least     | number 10              | number 12           | match            |

  # Data layer schema assignment data conditions runtime 004
  Scenario Outline: Data layer schema assignment data conditions runtime 004
    Given production predicate targets <property_path>
    When it evaluates <captured_shape>
    Then actual resolution is <resolution>

    Examples:
      | property_path      | captured_shape                              | resolution                         |
      | /context/siteArea  | nested legacy value                         | matching concrete value            |
      | /products/*/type   | current and legacy product values           | match from legacy concrete value   |
      | /products/*/type   | empty products array with Does not exist    | match from no concrete value       |
      | /a~1b              | escaped property a/b                        | matching property                  |
      | /tilde~0name       | escaped property tilde~name                 | matching property                  |

  # Data layer schema assignment data conditions runtime 005
  Scenario Outline: Data layer schema assignment data conditions runtime 005
    Given production candidates both match legacy and current property families
    When configured priorities are <priority_case>
    Then production assignment outcome is <assignment_outcome>
    And rendered diagnostics contain <diagnostic>

    Examples:
      | priority_case          | assignment_outcome           | diagnostic                           |
      | Legacy 20 and Current 10 | Legacy selected            | both matches and priority 20 wins    |
      | Legacy 10 and Current 20 | Current selected           | both matches and priority 20 wins    |
      | Legacy 20 and Current 20 | Assignment error           | both matching predicate summaries    |

  # Data layer schema assignment data conditions runtime 006
  Scenario: Data layer schema assignment data conditions runtime 006
    Given production payload /variant is current and raw-input /variant is legacy
    When otherwise identical assignments evaluate /variant Equals legacy against their configured condition targets
    Then the payload-target assignment does not match
    And the raw-input-target assignment matches
    And validation still uses each selected assignment's independent validation target

  # Data layer schema assignment data conditions runtime 007
  Scenario: Data layer schema assignment data conditions runtime 007
    Given the actual assignment editor is opened from a captured legacy event
    When the operator adds /errorType Exists, reviews suggestions, and saves
    Then production storage retains canonical path, detected type, operator, target, group operator, assignment identity, and priority
    And the new condition participates in production resolution only after save
    And blank paths, missing values, incompatible operators, and invalid patterns prevent persistence with rendered assistance

  # Data layer schema assignment data conditions runtime 008
  Scenario: Data layer schema assignment data conditions runtime 008
    Given a production assignment with typed data predicates is duplicated and exported
    When the Schema Library is reloaded and the export is imported
    Then duplicate, restored, and imported assignments retain equivalent independent condition groups
    And disable, enable, pinned, and follow-latest behaviors remain intact
    And a legacy stored assignment without data conditions remains an unrestricted assignment

  # Data layer schema assignment data conditions runtime 009
  Scenario: Data layer schema assignment data conditions runtime 009
    Given a saved-session generic_event contains legacy archived payload, raw input, and URL
    And the active tab contains current data at another URL
    When production saved-session and explicit revalidation run
    Then both select Legacy generic event from archived evidence
    And rendered assignment diagnostics ignore active-tab data
    And no live event, saved session, schema, assignment, or predicate evidence is mutated

  # Data layer schema assignment data conditions runtime 010
  Scenario: Data layer schema assignment data conditions runtime 010
    Given the actual assignment editor is 320 CSS pixels wide with several predicates and a resolution conflict
    When the operator adds, edits, reorders, removes, saves, diagnoses, duplicates, and reopens conditions using keyboard controls
    Then predicate controls, group summary, assignment priority, conflict diagnostics, and validation result remain readable and reachable without horizontal page scrolling
    And runtime coverage exercises production assignment persistence and resolver input with full payload, raw input, URL, typed predicates, priority ties, archived data, and validation records rather than source-string inspection or conditional-rule evaluation alone
