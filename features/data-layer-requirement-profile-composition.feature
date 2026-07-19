# mutation-stamp: sha256=16c576b279ae3bef684afcd72fce3486459e5344fae512e9c7da07ef005ca91e
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:33:43.682728657Z","feature_name":"Data layer requirement profile composition","feature_path":"features/data-layer-requirement-profile-composition.feature","background_hash":"c1a8fac40c209ade4c950fcce5b5c78443e37a93a9800957dda0098adb20bae4","implementation_hash":"sha256:6cb2f5baf484e1039446086ff6ed9e8f54ebb3e2ccf718b05283cf24bde36768","scenarios":[{"index":1,"name":"Data layer requirement profile composition 002","scenario_hash":"884cd12beba4fcfa51725d8af2f1ee14b68e6278345383870f88ea63058da456","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:10.147455780Z"},{"index":2,"name":"Data layer requirement profile composition 003","scenario_hash":"0d1109f95af2cab30bc54cf0987bbdd815eedbc12a50cad7f9ada9a0a53cd708","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:10.147455780Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer requirement profile composition

  Background:
    Given Shop data specification contains profiles Sitewide, Commerce, Purchase, Retail confirmation, and Trade account

  # Data layer requirement profile composition 001
  Scenario: Data layer requirement profile composition 001
    Given Retail confirmation context references Sitewide, Commerce, Purchase, and Retail confirmation
    When its effective requirements are resolved
    Then profiles compose in explicit baseline, page group, page, event, flow, flow step, and environment order
    And the resolved contract does not require a combined inheritance child
    And arbitrary multiple inheritance is unavailable

  # Data layer requirement profile composition 002
  Scenario Outline: Data layer requirement profile composition 002
    Given effective property /ecommerce/value has <requirement_state>
    When the operator selects <preview_mode>
    Then the preview displays <preview_content>

    Examples:
      | requirement_state                     | preview_mode     | preview_content                                      |
      | inherited from Commerce                | effective        | final type, rules, documentation, and applicability  |
      | overridden by Retail confirmation      | local only       | the Retail confirmation contribution                 |
      | overridden by Retail confirmation      | show provenance  | every origin, precedence, override, and release       |

  # Data layer requirement profile composition 003
  Scenario Outline: Data layer requirement profile composition 003
    Given ordered profiles produce <composition_case>
    When composition diagnostics run
    Then diagnostic result is <diagnostic_result>
    And no value is selected by silent last-write-wins

    Examples:
      | composition_case                                      | diagnostic_result                                  |
      | string and number types for one path                   | blocking incompatible-type conflict                |
      | Required and forbidden for one path                    | blocking presence conflict                         |
      | allowed values retail, trade and retail, consumer      | effective intersection retail with provenance      |
      | allowed values retail and trade                        | blocking empty-intersection conflict                |
      | compatible severity override                           | effective later severity with both origins          |

  # Data layer requirement profile composition 004
  Scenario: Data layer requirement profile composition 004
    Given Purchase and Retail confirmation are adjacent in composition order
    When the operator proposes reversing them
    Then a before-and-after preview identifies every affected property, rule, page, event, flow step, fixture, and release
    And the order remains unchanged before confirmation
    And confirmation records the explicit precedence change in the project draft

  # Data layer requirement profile composition 005
  Scenario: Data layer requirement profile composition 005
    Given Commerce is used by 12 pages, 4 events, and 8 flow steps
    When the operator edits Commerce
    Then Where used and impact identify all 24 consumers before commit
    And each effective requirement links to its source profile and introducing release
    And canceling leaves all consumers unchanged

  # Data layer requirement profile composition 006
  Scenario: Data layer requirement profile composition 006
    Given legacy schemas form a valid single-parent chain
    When profile migration is reviewed
    Then each inherited layer becomes one ordered profile reference preserving effective behavior
    And local overrides retain their source identity and precedence
    And inheritance cycles or unresolved parents block migration

  # Data layer requirement profile composition 007
  Scenario: Data layer requirement profile composition 007
    Given the composition editor contains inherited, local, disabled, overridden, and conflicting rows
    When the operator reorders profiles and inspects provenance using only the keyboard
    Then tree and list controls expose position, origin, status, and conflict through accessible text
    And focus follows the visible structured order
    And no graphical node canvas is required
