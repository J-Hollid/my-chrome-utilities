# mutation-stamp: sha256=4a23a8155467fc47bfd8e200282bf7595bad15369b2e566bab0e2e1218c0c120
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T01:03:39.460726970Z","feature_name":"Data layer requirement profile composition runtime","feature_path":"features/data-layer-requirement-profile-composition-runtime.feature","background_hash":"75150d491a5876603cd1da3151c60451871c4ecd139d0031b6496fac8c8b3ea0","implementation_hash":"sha256:5e7a4b7ec7279940300a20a9cec9e7cba0ae396d03de42792c1197f44883b510","scenarios":[{"index":1,"name":"Data layer requirement profile composition runtime 002","scenario_hash":"91b5d82eeb87bc6a480e34fe4b42a5b35e9da916870a379c0e793862b7ee72e1","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:39.460726970Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer requirement profile composition runtime

  Background:
    Given the built extension is running with production profile composition, provenance, validation, persistence, and impact systems

  # Data layer requirement profile composition runtime 001
  Scenario: Data layer requirement profile composition runtime 001
    When Sitewide, Commerce, Purchase, and Retail confirmation are linked through actual controls
    Then production resolution composes them in stored deterministic order
    And the rendered effective contract identifies each origin and precedence
    And serialization and reload preserve every stable profile reference

  # Data layer requirement profile composition runtime 002
  Scenario Outline: Data layer requirement profile composition runtime 002
    Given production profiles contain <composition_case>
    When actual validation and composition diagnostics run
    Then the rendered and runtime outcome is <outcome>

    Examples:
      | composition_case                                 | outcome                                      |
      | incompatible types on one path                   | blocking conflict without an effective type  |
      | Required and forbidden on one path               | blocking presence conflict                    |
      | intersecting allowed values                      | typed intersection with complete provenance   |
      | compatible severity override                     | later severity with both origins               |

  # Data layer requirement profile composition runtime 003
  Scenario: Data layer requirement profile composition runtime 003
    Given profile order affects requirements used by pages, events, flows, fixtures, and releases
    When reordering preview, cancel, confirm, Undo, and reload run through production callbacks
    Then actual before-and-after impact lists every changed consumer
    And cancel, confirm, Undo, and reload preserve their respective complete snapshots

  # Data layer requirement profile composition runtime 004
  Scenario: Data layer requirement profile composition runtime 004
    Given production legacy storage contains a valid parent chain and one invalid cycle
    When migration preview runs
    Then the valid chain has behavior-equivalent ordered profile output
    And the cycle blocks commit with source identities and no storage mutation

  # Data layer requirement profile composition runtime 005
  Scenario: Data layer requirement profile composition runtime 005
    When the actual composition list is completed with keyboard only
    Then rendered order, accessible positions, origins, conflicts, focus, and announcements agree
    And no canvas-only control is required to inspect or change composition
