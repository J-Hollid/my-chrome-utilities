# mutation-stamp: sha256=e0eae43be90c117022686acbc144a107072529b8b2f0c6d068dcc44d02502353
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-12T21:31:43.246043944Z","feature_name":"Data layer Live add all schema runtime","feature_path":"features/data-layer-live-add-all-schema-runtime.feature","background_hash":"1c3f1bc9f7ab07d22e6c386702dfb71f699c2af9bed246f094ae1cef7cd9ebce","implementation_hash":"unknown","scenarios":[{"index":0,"name":"Data layer Live add all schema runtime 001","scenario_hash":"20cce56b32cb591d84f4916a56dd6c1bde310c503baaa331ac693ccc37a2889a","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-09-12T21:31:43.246043944Z"},{"index":1,"name":"Data layer Live add all schema runtime 002","scenario_hash":"8078da9217f1cb5cf923ad1e996fe687c36cfa3cdb6f02ab76a2d49799183d27","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-09-12T21:31:43.246043944Z"}]}
# acceptance-mutation-manifest-end

# Data layer Live add all schema runtime 001 through 003
Feature: Data layer Live add all schema runtime

  Background:
    Given the built extension side panel is running with the production Live inspector and durable schema repository
    And the selected captured event contains nested properties and two array items with different child keys

  # Data layer Live add all schema runtime 001
  Scenario Outline: Data layer Live add all schema runtime 001
    When the operator uses pointer input to activate Add all to schema
    And selects <destination>
    Then the production review and its controls have visible bounds and accept pointer and keyboard input
    And the review includes properties from both array items
    When the operator closes the review with <close_action>
    Then modal input blocking ends and focus returns to the originating Live control
    And the durable repository is unchanged
    And reopening produces one usable review

    Examples:
      | destination        | close_action |
      | a named new schema | Cancel       |
      | an existing schema | Escape       |

  # Data layer Live add all schema runtime 002
  Scenario Outline: Data layer Live add all schema runtime 002
    Given <destination> is selected in the production review
    When the operator confirms using keyboard input
    Then the production durable repository commits the reviewed additions as one operation
    And existing local and inherited properties retain their types, examples, rules, and documentation
    And the Live inspector remains usable on the originating event
    When the side panel reloads
    Then the Schema editor shows the added nested paths with their inferred types and typed examples
    And no new publication or automatic validation assignment exists

    Examples:
      | destination        |
      | a named new schema |
      | an existing schema |

  # Data layer Live add all schema runtime 003
  Scenario: Data layer Live add all schema runtime 003
    Given the durable repository rejects the reviewed addition
    When the operator confirms Add all to schema
    Then no partial schema or property batch is committed
    And the review does not report success
    And the existing durable failure recovery retains the exact unsaved additions
    And disposing the review leaves no invisible modal that blocks the side panel
