# mutation-stamp: sha256=2bb50c337fcfd415691e2f3786b153165b1a16d429bafacd94bb57d70c13bfbc
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:34:03.800978727Z","feature_name":"Data layer Specification Builder operator usability","feature_path":"features/data-layer-specification-builder-operator-usability.feature","background_hash":"a6e5734c518504254c99f62e88909d2292ec9551f4d713d0c9d499e113485997","implementation_hash":"sha256:eed48f80709e6241ffda30318cb834f4bb75eb0349b09d79116a54dd16dc3d5f","scenarios":[{"index":6,"name":"Data layer Specification Builder operator usability 007","scenario_hash":"918ce24fef4f277db702072d1a86dbaeef90302bda8d811b642c481023374f06","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:34:03.800978727Z"},{"index":11,"name":"Data layer Specification Builder operator usability 012","scenario_hash":"a9061f754030241777916185f2e1b6deb16db41168a70e18315b1cee3958f213","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:34:03.800978727Z"}]}
# acceptance-mutation-manifest-end

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
    Then Foundation, Shared entities, Requirements, Specification Flows, Assignments and Event cases, Documentation, and Release progress is visible
    And one recommended next action reflects the first incomplete required stage

  # Data layer Specification Builder operator usability 003
  Scenario: Data layer Specification Builder operator usability 003
    Given an entity and field are selected
    When the workspace renders
    Then project, environment, draft or release, selected entity, selected Flow and Event-occurrence node when applicable, and automatic-validation state remain visible
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
    Then the exact requirement field opens with origin, Pages, Events, Event-occurrence nodes, Event validation cases, Assignments, and releases visible
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
    When rerender, preflight, documentation preview, a dialog, and reload occur
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
    When the operator completes the <start_path> start path
    Then <durable_outcome> is staged or created and survives reload
    And Back or Cancel returns without an unexplained partial project
    Examples:
      | start_path | durable_outcome |
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

  # Data layer Specification Builder operator usability 014
  Scenario Outline: Data layer Specification Builder operator usability 014
    Given the operator opens the <entity> collection without prior product knowledge
    When its purpose guidance is displayed
    Then the guidance includes a plain-language purpose, a Retail or Trade example, prerequisites, and Used by relationships
    And the guidance distinguishes the entity from <confusable_entity>
    Examples:
      | entity | confusable_entity |
      | Profile | Schema |
      | Applicability Set | Assignment |
      | Page | Event-occurrence node |
      | Event validation case | Live observation |
      | Draft | Published release |

  # Data layer Specification Builder operator usability 015
  Scenario: Data layer Specification Builder operator usability 015
    Given a fresh project has no authored entities
    When the operator opens the project overview
    Then task entry points offer Create a shared Purchase Event, Add a Specification Flow, Add Retail and Trade requirements, and Validate checkout confirmation
    And the specification map shows Foundation, Shared entities, Requirements, Specification Flows, Assignments and Event cases, Documentation, and Release with completion and blockers
    And one Continue action identifies what to do next, why, and what it unlocks

  # Data layer Specification Builder operator usability 016
  Scenario Outline: Data layer Specification Builder operator usability 016
    Given the operator is about to <action>
    When the impact preview opens
    Then it names affected entities, draft or published scope, documentation and per-event validation consequences, and evidence that will become stale
    When the operator confirms the action
    Then one completion message states exactly what changed, the resulting revision, stale evidence, and the Undo path
    Examples:
      | action |
      | change Profile composition |
      | change Applicability |
      | change an Assignment |
      | remove an Event-occurrence node |
      | publish a release |

  # Data layer Specification Builder operator usability 017
  Scenario Outline: Data layer Specification Builder operator usability 017
    Given <assurance_view> has <state>
    When the operator opens it
    Then the empty, blocked, or failed reason is explained in human language
    And one repair action opens the exact named entity and field without exposing a raw ID
    Examples:
      | assurance_view | state |
      | Event validation cases | empty required case |
      | Assignment readiness | no covering Assignment |
      | Preflight | compiler failure |
      | Release review | unresolved ambiguity |
      | Live | no permitted target |

  # Data layer Specification Builder operator usability 018
  Scenario: Data layer Specification Builder operator usability 018
    Given any contextual entity editor is open
    When the workspace toolbar and inspector render
    Then toolbar actions are grouped as Validate, Release, and More with one contextual primary action
    And unrelated Add Entity, Event occurrence, Schema draft, Assignment, and Bulk forms are absent from the inspector
    And the preserved desktop three-pane hierarchy and 44 CSS px control targets remain available

  # Data layer Specification Builder operator usability 020
  Scenario: Data layer Specification Builder operator usability 020
    Given the fresh-project empty state offers the Retail and Trade worked example
    When the operator opens it
    Then it demonstrates shared Pages and Events, Sitewide and Retail or Trade Profiles, 2 documentary Flows, Assignments, positive and negative Event validation cases, a manual checklist, documentation export, and Live explanation
    And dismissing the example returns to the unchanged project and the same recommended next action

  # Data layer Specification Builder operator usability 021
  Scenario: Data layer Specification Builder operator usability 021
    Given saved schemas, captured validation, and an active project exist across side panel and standalone Builder
    When either surface presents a relevant next action
    Then the side panel explains its in-page capture, validation, and quick-edit role
    And the standalone Builder explains its project composition, rich specification, assurance, and release role
    And contextual Continue actions connect saved schema to project adoption, captured validation to Event validation case or Profile authoring or manual occurrence attachment, and project schema to the rich table builder
    And each action names the destination, transferred context, draft or release scope, and effect before navigation
    And no workflow requires export/import, clipboard transfer, raw IDs, or recreation merely to move between surfaces
