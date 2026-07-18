# mutation-stamp: sha256=54df895597b232aaf54118e3ec676c74ccbd3a31cbc2ede9b5ab2353dc98a113
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T01:03:32.816995417Z","feature_name":"Data layer durable authoring drafts runtime","feature_path":"features/data-layer-durable-authoring-drafts-runtime.feature","background_hash":"acde5ea7a338571a667b2d3262d4a4404aa005dc89c8d91570a152d0ae834e62","implementation_hash":"sha256:b8694e9b2809ec563b5557176f50f7eef106d0e58c8f7670521d86dc957ef0d3","scenarios":[{"index":4,"name":"Data layer durable authoring drafts runtime 005","scenario_hash":"3e81e92e98c407ef4e5a699bddd1e7e95d5fc73b6162fc80cc48697e385158a7","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:32.816995417Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer durable authoring drafts runtime

  Background:
    Given the built extension is running with production schema editor, draft persistence, and publication systems
    And Sitewide page context revision 1 is open in the actual side-panel DOM

  # Data layer durable authoring drafts runtime 001
  Scenario: Data layer durable authoring drafts runtime 001
    When the operator enters a description and adds /page/type through rendered controls
    And the schema editor rerenders and the extension reloads
    Then production persistence restores both edits in one working draft
    And the rendered description equals the operator-entered text
    And production storage still contains immutable revision 1

  # Data layer durable authoring drafts runtime 002
  Scenario: Data layer durable authoring drafts runtime 002
    Given the draft contains name, description, documentation, property, and rule edits
    When the isolated browser is terminated and reopened with the same recovery profile
    Then the actual extension recovers every edit from production persistence
    And the editor restores the selected property, expanded nodes, and scroll position
    And no direct test fixture writes the recovered draft after restart

  # Data layer durable authoring drafts runtime 003
  Scenario: Data layer durable authoring drafts runtime 003
    When the operator publishes through the actual DOM
    Then production storage creates revision 2 and zero new assignments
    And the editor remains rendered with focus on the release result
    When the operator later uses Publish and close
    Then the editor closes and focus returns to the invoking schema-row control

  # Data layer durable authoring drafts runtime 004
  Scenario: Data layer durable authoring drafts runtime 004
    Given the production draft-save callback returns a recoverable failure
    When the operator changes a field and retries after persistence recovers
    Then the actual DOM retains the value and announces Save failed followed by Saved
    And production storage contains one copy of the retried transaction

  # Data layer durable authoring drafts runtime 005
  Scenario Outline: Data layer durable authoring drafts runtime 005
    Given the actual side panel has width <width>
    When keyboard-only authoring opens and closes a property sheet and rule sheet
    Then computed layout has one vertical scroll owner and no horizontal page overflow
    And focus containment, focus restoration, sticky context, and 44 CSS px touch targets are observed

    Examples:
      | width |
      | 360   |
      | 520   |
      | 720   |

  # Data layer durable authoring drafts runtime 006
  Scenario: Data layer durable authoring drafts runtime 006
    Given an actual property draft has a persisted type and description
    When both fields are edited through rendered controls, undone once, and redone once
    Then production draft bytes and rendered values return to the prior state after Undo
    And production draft bytes and rendered values return to the complete edited state after Redo
    And production release storage remains byte-for-byte unchanged
