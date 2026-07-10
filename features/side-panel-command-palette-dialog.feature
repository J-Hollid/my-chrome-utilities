# mutation-stamp: sha256=33079643dae32b5287edee2eaec55513977947947a294208c5183ea234ede5af
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T19:27:09.732723305Z","feature_name":"Side panel command palette dialog","feature_path":"features/side-panel-command-palette-dialog.feature","background_hash":"58f5ca2e659834cf5ceeeff5c23f58ddd57c1cad685e99603ccb14acbe8dc2c1","implementation_hash":"sha256:side-panel-information-architecture-v2","scenarios":[{"index":1,"name":"Side panel command palette dialog 002","scenario_hash":"8399d2f5b586ce902ea7c0374df202c16f6dd6374b066f0a2796289677c0a088","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T19:27:09.732723305Z"}]}
# acceptance-mutation-manifest-end

Feature: Side panel command palette dialog

  Background:
    Given the side panel is displayed at 320 CSS px wide

  # Side panel command palette dialog 001
  Scenario: Side panel command palette dialog 001
    Given the command palette is closed
    When the closed layout is inspected
    Then the command palette is not visibly rendered and is absent from normal document flow
    And the command palette does not obscure or displace the header, navigation, or active view content
    And no registered command is rendered as a permanent global command button
    When the user opens the command palette with its launcher or hotkey
    Then a focused command-palette dialog is displayed above the current side panel UI
    And the dialog contains a command search field and matching registered command results
    And background side panel content does not receive keyboard focus while the dialog is open

  # Side panel command palette dialog 002
  Scenario Outline: Side panel command palette dialog 002
    Given the command palette is open above Data Layer Live with matching commands and one selected result
    When the user performs <close_input>
    Then <execution_outcome>
    And the command palette closes
    And the underlying side panel layout is unchanged

    Examples:
      | close_input                                               | execution_outcome              |
      | keyboard navigation to another result followed by Enter  | the selected command executes  |
      | Escape                                                    | no command executes            |
