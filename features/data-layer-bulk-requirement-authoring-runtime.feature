# mutation-stamp: sha256=43c0e98e65002a5ae3e8940b866aab3938436171c1688b1b5501667a351c393d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T01:03:29.277562010Z","feature_name":"Data layer bulk requirement authoring runtime","feature_path":"features/data-layer-bulk-requirement-authoring-runtime.feature","background_hash":"2cd0d35aaf9ae70a68339b792e6d0b3d477d8e75e819d647a75e654b36ca1ebc","implementation_hash":"sha256:f15ff354ee75d4e8d7ae6a500867dcdee0732f1e2d34c9ce3b83a60f7ff514a8","scenarios":[{"index":0,"name":"Data layer bulk requirement authoring runtime 001","scenario_hash":"cb0d819c7504cd0976ed8d6a5f50c3921ee5a775eeb509634c6568cb7fa538b5","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:29.277562010Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer bulk requirement authoring runtime

  Background:
    Given the built extension is running with production project transactions, import adapters, grid, and undo history
    And a greenfield project draft is open without captured traffic

  # Data layer bulk requirement authoring runtime 001
  Scenario Outline: Data layer bulk requirement authoring runtime 001
    When production import staging receives <input_kind>
    Then the actual workspace renders candidate paths, types, provenance, and parse issues
    And production draft storage remains byte-for-byte unchanged before commit

    Examples:
      | input_kind              |
      | pasted JSON             |
      | uploaded JSON Schema    |
      | 103 spreadsheet rows    |

  # Data layer bulk requirement authoring runtime 002
  Scenario: Data layer bulk requirement authoring runtime 002
    Given 100 staged rows are valid and 3 have cell errors
    When the operator corrects the errors and commits through the actual grid
    Then production storage adds 103 properties in one transaction
    And one rendered Undo removes all 103 properties
    And one rendered Redo restores all paths, types, documentation, and provenance

  # Data layer bulk requirement authoring runtime 003
  Scenario: Data layer bulk requirement authoring runtime 003
    Given 40 actual grid rows of mixed property types are selected
    When Required and severity error are applied through rendered bulk controls
    Then production storage changes exactly 40 property requirements
    And validation evaluates Required as presence for every selected type
    And unrelated value-sensitive rules are byte-for-byte unchanged

  # Data layer bulk requirement authoring runtime 004
  Scenario: Data layer bulk requirement authoring runtime 004
    When Commerce is inserted once as a shared reference and once as an independent copy
    Then production storage contains one source reference and distinct copied identities
    And editing the source updates only the shared effective subtree
    And export, reload, Undo, and Redo preserve both reuse modes

  # Data layer bulk requirement authoring runtime 005
  Scenario: Data layer bulk requirement authoring runtime 005
    Given a 500-property production profile is displayed
    When keyboard-only selection, staged review, commit, and Undo are exercised
    Then the actual grid virtualizes off-screen rows and does not render every row control
    And actual focus, scrolling, error announcements, and transaction feedback remain correct
