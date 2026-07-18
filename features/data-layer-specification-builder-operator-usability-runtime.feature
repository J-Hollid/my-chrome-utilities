# mutation-stamp: sha256=7ea1733d734a4aaeeb30c258f1324753e6dc77e9516a47676de14b68be80648c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:35:09.257667136Z","feature_name":"Data layer Specification Builder operator usability runtime","feature_path":"features/data-layer-specification-builder-operator-usability-runtime.feature","background_hash":"e094d728ff710bb33112844fec0c6be4326e1b4cdb2d3999b90224a758d8bdd9","implementation_hash":"sha256:bedb0a50cbb7bc8a473ddb24fbbb4c0200c0eabcb993d8b9c2b40537acf0985d","scenarios":[{"index":6,"name":"Data layer Specification Builder operator usability runtime 007","scenario_hash":"9c0caf1d4f53909e3e0b949e2baf8ee97c355321b0f32fe089f0aef59cca8e16","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:35:09.257667136Z"},{"index":11,"name":"Data layer Specification Builder operator usability runtime 012","scenario_hash":"ded945f15515608560d0b9c44ffc246d3f751215f830e68e3ae4a55e97f91aaf","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:35:09.257667136Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Specification Builder operator usability runtime

  Background:
    Given the built unpacked extension is loaded from its chrome-extension URL
    And operator interactions use real rendered controls and key events

  # Data layer Specification Builder operator usability runtime 001
  Scenario: Data layer Specification Builder operator usability runtime 001
    Given a fresh isolated Chrome profile contains compatible legacy schemas and no project
    When the operator opens Specification Builder
    Then rendered Template, Import, JSON or Schema, Spreadsheet, Adopt, and Blank choices are keyboard reachable
    And each choice exposes its distinct next-step explanation

  # Data layer Specification Builder operator usability runtime 002
  Scenario: Data layer Specification Builder operator usability runtime 002
    When the operator creates a blank project through rendered controls
    Then Overview shows the 7-stage authoring sequence and one current next action
    And completing Context advances the visible progress to Requirements

  # Data layer Specification Builder operator usability runtime 003
  Scenario: Data layer Specification Builder operator usability runtime 003
    Given a Flow step is selected and its fixture result is failing
    When the workspace rerenders
    Then computed visible content retains project, environment, draft, Flow, step, and validation state
    And stable IDs are absent from primary row prose but available through labelled copy controls

  # Data layer Specification Builder operator usability runtime 004
  Scenario: Data layer Specification Builder operator usability runtime 004
    Given the operator expanded the Flow transition editor and scrolled it
    When a Page is selected
    Then the accessibility tree contains no Flow transition controls or stale Flow values
    And the Page editor starts at its own restored position and context

  # Data layer Specification Builder operator usability runtime 005
  Scenario: Data layer Specification Builder operator usability runtime 005
    Given global search visibly returns /ecommerce/value consumers
    When the operator opens the Retail profile result
    Then focus reaches the exact /ecommerce/value grid field with provenance and Where used visible
    When Back is activated
    Then the same search query, result focus, and scroll offset are restored

  # Data layer Specification Builder operator usability runtime 006
  Scenario: Data layer Specification Builder operator usability runtime 006
    Given selection, expansion, search, active view, editor scroll, and inspector state are visible
    When the extension page reloads
    Then each state is restored from browser persistence
    And deleting the selected entity produces an explained fallback rather than stale controls

  # Data layer Specification Builder operator usability runtime 007
  Scenario Outline: Data layer Specification Builder operator usability runtime 007
    Given the actual Builder viewport is <width>
    When the operator opens a long Flow editor and traverses Tree, Editor, and Inspector
    Then computed layout has <pane-count> and one primary vertical scroll owner
    And no horizontal page overflow or detached selected context is present
    Examples:
      | width | pane-count |
      | 360 CSS px | 1 active pane |
      | 520 CSS px | 1 active pane |
      | 720 CSS px | 1 active pane |
      | 1280 CSS px | 3 persistent panes |

  # Data layer Specification Builder operator usability runtime 008
  Scenario: Data layer Specification Builder operator usability runtime 008
    Given focus is on the first project navigation item
    When the operator uses ArrowDown, ArrowUp, End, Home, and Enter
    Then actual focus and aria-current follow the intended sequence
    And the selected collection opens without an unexpected focus jump

  # Data layer Specification Builder operator usability runtime 009
  Scenario: Data layer Specification Builder operator usability runtime 009
    Given release review was opened with the keyboard
    When the operator presses Escape, reopens it, triggers one field failure, and cancels
    Then focus stays contained, reaches the exact failing field, and finally returns to the invoking control
    And live-region output contains one concise actionable status per action

  # Data layer Specification Builder operator usability runtime 010
  Scenario: Data layer Specification Builder operator usability runtime 010
    Given a project has been created
    When the operator adds an entity, runs preflight, opens coverage, opens and closes a dialog, and reloads
    Then computed style keeps the hidden creation screen at zero width, height, and layout contribution
    And the workspace top position does not jump by a viewport

  # Data layer Specification Builder operator usability runtime 011
  Scenario: Data layer Specification Builder operator usability runtime 011
    Given the actual project contains one current and one historical release
    When the operator opens Releases with the keyboard
    Then the rendered release workspace exposes revision, status, structured diff, evidence, consumers, export, and Restore as draft
    And Back restores the exact prior entity focus and scroll position

  # Data layer Specification Builder operator usability runtime 012
  Scenario Outline: Data layer Specification Builder operator usability runtime 012
    Given a fresh isolated Chrome profile has no project
    When the operator completes the rendered <start-path> path
    Then <durable-outcome> is visibly staged or created and survives an actual extension reload
    And cancelling a repeated attempt leaves no partial project
    Examples:
      | start-path | durable-outcome |
      | Template | selected template project preview |
      | Import full project | full graph migration review |
      | JSON example | inferred requirement staging grid |
      | JSON Schema | schema requirement staging grid |
      | Spreadsheet | tabular requirement staging grid |
      | Adopt existing schemas | compatibility adoption review |
      | Blank project | empty project Overview |

  # Data layer Specification Builder operator usability runtime 013
  Scenario: Data layer Specification Builder operator usability runtime 013
    Given Production is visible in project context
    When the operator creates Staging, enters its host, switches to it, and reloads
    Then Staging remains selected in the rendered project, matcher preview, schema preview, and validation context
    When the operator switches back to Production
    Then its independent host and compiled context return without changing Staging
