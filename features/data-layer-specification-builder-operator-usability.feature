Feature: Data layer Specification Builder operator usability

  Background:
    Given the operator uses the full-page Specification Builder and side-panel companion

  # Data layer Specification Builder operator usability 001
  Scenario: Data layer Specification Builder operator usability 001
    Given no project exists
    When the start screen opens
    Then Template, Import full project, JSON or JSON Schema, Spreadsheet, Adopt existing schemas, and Blank project paths are visible
    And the primary action and consequences of each starting path are distinguishable

  # Data layer Specification Builder operator usability 002
  Scenario: Data layer Specification Builder operator usability 002
    Given a blank project was created
    When Overview opens
    Then Context, Requirements, Applicability, Flows, Fixtures, Preflight, and Release progress is visible
    And one recommended next action reflects the first incomplete required stage

  # Data layer Specification Builder operator usability 003
  Scenario: Data layer Specification Builder operator usability 003
    Given an entity and field are selected
    When the workspace renders
    Then project, environment, draft or release, selected entity, active flow and step when applicable, and validation state remain visible
    And raw UUIDs appear only behind explicit copy affordances

  # Data layer Specification Builder operator usability 004
  Scenario: Data layer Specification Builder operator usability 004
    Given a Flow editor is replaced by a Page editor
    When the selection changes
    Then the center workspace and inspector contain only Page context and actions
    And prior disclosures, values, status, and scroll position cannot leak into the Page editor

  # Data layer Specification Builder operator usability 005
  Scenario: Data layer Specification Builder operator usability 005
    Given global search finds /ecommerce/value
    When the operator opens one result
    Then the exact requirement field opens with origin, pages, events, flow steps, fixtures, and releases visible
    And Back returns to the same query, result position, and scroll offset

  # Data layer Specification Builder operator usability 006
  Scenario: Data layer Specification Builder operator usability 006
    Given selection, tree expansion, search, active view, editor scroll, and inspector state are set
    When the operator navigates away and reloads
    Then all navigation state is restored when its referenced entities still exist
    And deleted or inaccessible state falls back with a truthful explanation

  # Data layer Specification Builder operator usability 007
  Scenario Outline: Data layer Specification Builder operator usability 007
    Given the Builder viewport is <width>
    When an entity editor opens
    Then the layout uses <mode> with one primary vertical scroll owner
    And selected context and primary actions remain reachable without horizontal page overflow
    Examples:
      | width | mode |
      | 360 CSS px | one active Tree, Editor, or Inspector pane |
      | 520 CSS px | one active Tree, Editor, or Inspector pane |
      | 720 CSS px | one active Tree, Editor, or Inspector pane |
      | full-page desktop | persistent tree, editor, and inspector panes |

  # Data layer Specification Builder operator usability 008
  Scenario: Data layer Specification Builder operator usability 008
    Given focus is in the project navigation
    When ArrowDown, ArrowUp, Home, and End are used
    Then selection and focus follow accessible tree or list semantics
    And Enter opens the selected collection or entity without moving focus to an unrelated pane

  # Data layer Specification Builder operator usability 009
  Scenario: Data layer Specification Builder operator usability 009
    Given a dialog or full-height side-panel sheet is open
    When Escape, Cancel, validation failure, Save, Publish, or Publish and close occurs
    Then focus is trapped while open and restored to the correct invoker or exact failing field
    And one concise status is announced without depending on color

  # Data layer Specification Builder operator usability 010
  Scenario: Data layer Specification Builder operator usability 010
    Given a project has replaced the creation screen
    When rerender, preflight, coverage, a dialog, and reload occur
    Then the hidden creation screen occupies zero computed layout space
    And the workspace never jumps below an empty viewport-sized region

  # Data layer Specification Builder operator usability 011
  Scenario: Data layer Specification Builder operator usability 011
    Given the project has current and historical releases
    When the operator opens Releases from project navigation
    Then a release workspace shows revision, status, diff, evidence, consumers, export, and Restore as draft actions
    And Back returns to the prior authoring selection and scroll position

  # Data layer Specification Builder operator usability 012
  Scenario Outline: Data layer Specification Builder operator usability 012
    Given no project exists
    When the operator completes the <start-path> start path
    Then <durable-outcome> is staged or created and survives reload
    And Back or Cancel returns without an unexplained partial project
    Examples:
      | start-path | durable-outcome |
      | Template | selected template project preview |
      | Import full project | full graph migration review |
      | JSON example | inferred requirement staging grid |
      | JSON Schema | schema requirement staging grid |
      | Spreadsheet | tabular requirement staging grid |
      | Adopt existing schemas | compatibility adoption review |
      | Blank project | empty project Overview |

  # Data layer Specification Builder operator usability 013
  Scenario: Data layer Specification Builder operator usability 013
    Given the project has Production
    When the operator creates Staging, configures its host, and switches environments
    Then project context, applicability preview, compiled schema, and validation state identify Staging
    And reload restores Staging while Production remains independently selectable
