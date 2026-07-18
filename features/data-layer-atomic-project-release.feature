# mutation-stamp: sha256=729734a70d2bcb2529db0686efb6591fd5e5de24bf095786956fb5a59596f7f6
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:33:42.881855239Z","feature_name":"Data layer atomic project release","feature_path":"features/data-layer-atomic-project-release.feature","background_hash":"fd25aafe737cc543d90c71baf498f56c7f89ec9825736b61541b5516427d81be","implementation_hash":"sha256:2690cb139a01c5292c7b5f0c40e63cabb25dcb9891c06bd5daca33df1db04e89","scenarios":[{"index":1,"name":"Data layer atomic project release 002","scenario_hash":"325ea850d0cb68830d0b14e63a27702ba442e2866dae8f8645f5b897bcdcd9f3","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:01:54.584745365Z"},{"index":3,"name":"Data layer atomic project release 004","scenario_hash":"a6a1e849b765a2ac6c2d459f7b4a28eba8631678fba7334e7ef67fefd708adc8","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:01:54.584745365Z"},{"index":4,"name":"Data layer atomic project release 005","scenario_hash":"03828ba18d8fe98f6cc12486f7043b0f8b9779ea8fb071b93877982fa89e3b7a","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:01:54.584745365Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer atomic project release

  Background:
    Given Shop data specification has a durable working draft
    And project preflight has completed

  # Data layer atomic project release 001
  Scenario: Data layer atomic project release 001
    When the operator requests Publish release 4
    Then structured review identifies added, removed, renamed, and changed requirements
    And it identifies Profile order, Applicability, Assignment priority, Page, Event, Flow graph, node obligation and multiplicity, documented relationship, Event case, and policy changes
    And it shows required Event-case results, Assignment readiness and ambiguity, documentation delta, affected consumers, and breaking-change classification
    And no published project state changes before confirmation

  # Data layer atomic project release 002
  Scenario Outline: Data layer atomic project release 002
    Given release review contains <review_state>
    When release availability is calculated
    Then confirmation is <confirmation_state>
    And review guidance is <guidance>

    Examples:
      | review_state                         | confirmation_state | guidance                                      |
      | unresolved matcher tie               | blocked            | Resolve applicability ambiguity               |
      | required node without a resolved Page | blocked            | Repair the named Event occurrence              |
      | failing required Event case          | blocked            | Correct specification or case assertions       |
      | effective-schema compiler failure    | blocked            | Repair the named compiler issue                 |
      | unresolved stable reference          | blocked            | Repair the missing reference                  |
      | completeness warnings only           | available          | Acknowledge warnings or change project policy |
      | clean required checks                | available          | Review and publish release 4                  |

  # Data layer atomic project release 003
  Scenario: Data layer atomic project release 003
    Given release review is publishable
    When the operator confirms Publish release 4
    Then one immutable release snapshot atomically contains Profiles, Pages, Events, Applicability, Flow nodes and relationships, Assignments, Event cases, checklist templates, policies, documentation, validation plan, and stable references
    And all linked current revisions advance together
    And the working draft is cleared only after the complete snapshot succeeds
    And no individual schema publication can expose a mixed project release

  # Data layer atomic project release 004
  Scenario Outline: Data layer atomic project release 004
    Given release persistence fails at <failure_point>
    When the operator confirms publication
    Then published release 3 remains current
    And every project entity equals its pre-confirmation published snapshot
    And the complete working draft remains recoverable
    And the failure identifies <recovery_guidance>

    Examples:
      | failure_point          | recovery_guidance                    |
      | snapshot preparation   | Review storage and retry              |
      | reference validation   | Repair the identified reference       |
      | atomic commit          | Retry the unchanged release draft     |

  # Data layer atomic project release 005
  Scenario Outline: Data layer atomic project release 005
    Given release 4 confirmation is available after a publishable review
    When the operator completes <publication_action>
    Then release 4 is current
    And the workspace is <workspace_state>
    And focus is <focus_destination>

    Examples:
      | publication_action | workspace_state                | focus_destination          |
      | Publish            | open on the release summary    | release summary heading    |
      | Publish and close  | closed                         | invoking project action    |

  # Data layer atomic project release 006
  Scenario: Data layer atomic project release 006
    Given release 2 is selected from immutable release history
    And release 3 is current
    When the operator requests Restore as draft
    Then review identifies differences from current release 3
    And confirmation creates a new draft based on release 2
    And release 3 remains current until a later publication
    And restoring never reactivates or mutates release 2

  # Data layer atomic project release 007
  Scenario: Data layer atomic project release 007
    Given release review contains breaking changes and affected consumers
    When the operator completes review using only the keyboard
    Then each diff section, blocker, warning, acknowledgement, and consumer link is reachable in visible order
    And focus is trapped in confirmation and restored after cancel or publication
    And status and severity do not depend on color alone

  # Data layer atomic project release 008
  Scenario Outline: Data layer atomic project release 008
    Given preflight produced compile:7K3M for project revision 24
    When review approves compile:7K3M
    And <command> follows review
    Then compile:7K3M is <compile_freshness>
    And required Event-case evidence is <evidence_freshness>
    And Publish release 4 <publication_outcome>

    Examples:
      | command                                      | compile_freshness | evidence_freshness | publication_outcome                                  |
      | no project command                           | current           | current            | consumes compile:7K3M unchanged                      |
      | change shared Purchase Event requirement     | stale             | stale              | requires a new preflight and new required evidence   |
      | move a node on the exported canvas           | stale             | current            | requires a new preflight                             |
      | align non-semantic reference artwork         | stale             | current            | requires a new preflight                             |
      | record a separate ChecklistRun observation   | current           | current            | consumes compile:7K3M unchanged                      |

  # Data layer atomic project release 009
  Scenario: Data layer atomic project release 009
    Given Shop has no published release and first preflight produced compile:7K3M
    When the operator reviews the first release
    Then its structured diff uses an empty baseline
    And identifies every introduced Profile, Page, Event, Flow node, node obligation and multiplicity, documented relationship, requirement, Applicability Set, Assignment, Event case, checklist template, documentation record, and validation-plan record
    And publication consumes compile:7K3M rather than reporting zero semantic changes
