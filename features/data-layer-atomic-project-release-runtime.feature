# mutation-stamp: sha256=92111e1d981a22cf69ea2153b9c12899c1749c4ed1fd17499a6fd2b85ce210e7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:34:22.552117796Z","feature_name":"Data layer atomic project release runtime","feature_path":"features/data-layer-atomic-project-release-runtime.feature","background_hash":"2d9a6fc10c9d0412671001a1c8fc4f6ea2c1556bf15bc9933727d918572100ed","implementation_hash":"sha256:21ad894152423f20160a1208d0b54293c57a537036f70c2e2625e0629cd961a4","scenarios":[{"index":1,"name":"Data layer atomic project release runtime 002","scenario_hash":"f22de54be15c00b0b3c8294b2a37c4365d4d90e0672e2e24beac4b243f63e88f","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:02:10.190887811Z"},{"index":3,"name":"Data layer atomic project release runtime 004","scenario_hash":"0662cff9e6e90467219727d970249271d44fe0d0c2d6da0b84d0f4de9e48503d","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:02:10.190887811Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer atomic project release runtime

  Background:
    Given the built extension is running with production project draft, preflight, diff, release, persistence, and validation systems
    And Shop data specification has a connected draft

  # Data layer atomic project release runtime 001
  Scenario: Data layer atomic project release runtime 001
    When actual release review opens
    Then the production DOM renders requirement, Applicability, Assignment, Flow graph, node expectation, documented relationship, Event-case, documentation, ambiguity, impact, and breaking-change differences
    And rendered counts and identities equal production diff output
    And published storage remains byte-for-byte unchanged

  # Data layer atomic project release runtime 002
  Scenario Outline: Data layer atomic project release runtime 002
    Given production preflight contains <gate_state>
    When the operator attempts publication through actual controls
    Then the rendered publication outcome is <outcome>

    Examples:
      | gate_state               | outcome                              |
      | unresolved ambiguity     | blocked at its linked matcher         |
      | failing required Event case | blocked at its linked Event case     |
      | compiler failure         | blocked at its linked compiler issue  |
      | completeness warning     | available after acknowledgement       |
      | clean required checks    | available for confirmation            |

  # Data layer atomic project release runtime 003
  Scenario: Data layer atomic project release runtime 003
    When a valid release is confirmed through the actual DOM
    Then production persistence commits one release snapshot containing every project entity class
    And production validation resolves only references from that release
    And reload preserves release identity, revision graph, and cleared draft

  # Data layer atomic project release runtime 004
  Scenario Outline: Data layer atomic project release runtime 004
    Given production publication fails during <failure_point>
    When confirmation runs
    Then current release storage, project entity storage, and draft storage retain their complete pre-confirmation bytes
    And the actual DOM offers retry with the complete draft

    Examples:
      | failure_point        |
      | snapshot preparation |
      | reference validation |
      | atomic commit        |

  # Data layer atomic project release runtime 005
  Scenario: Data layer atomic project release runtime 005
    When Publish, Publish and close, cancel, and Restore as draft are completed using actual keyboard controls
    Then actual workspace visibility, focus containment, focus restoration, announcements, and release history match each action
    And browser reload never exposes a partial release

  # Data layer atomic project release runtime 006
  Scenario Outline: Data layer atomic project release runtime 006
    Given production preflight created compile:7K3M for project revision 24
    When actual review approves compile:7K3M
    And production controls <command>
    Then production reports compile:7K3M as <compile_freshness>
    And required Event-case evidence is <evidence_freshness>
    And actual publication <publication_outcome>

    Examples:
      | command                                      | compile_freshness | evidence_freshness | publication_outcome                                     |
      | make no project command                      | current           | current            | persists compile:7K3M unchanged                         |
      | change a shared Purchase Event requirement   | stale             | stale              | rejects it and focuses new evidence before preflight     |
      | move a node on the exported canvas           | stale             | current            | rejects it and focuses the new preflight action          |
      | align non-semantic reference artwork         | stale             | current            | rejects it and focuses the new preflight action          |
      | record a separate ChecklistRun observation   | current           | current            | persists compile:7K3M unchanged                         |

  # Data layer atomic project release runtime 007
  Scenario: Data layer atomic project release runtime 007
    Given the production project has no release and preflight created compile:7K3M
    When actual first-release review opens
    Then the production diff uses an empty baseline and renders every introduced semantic entity class from compile:7K3M
    And its introduced counts equal canonical project and compilation-result counts rather than zero
    And first publication persists compile:7K3M as its unchanged source identity
