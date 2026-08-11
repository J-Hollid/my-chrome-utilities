Feature: Modular Chrome utility architecture

  Background:
    Given the extension contains independently useful Chrome workflow utilities

  # Modular Chrome utility architecture 001
  Scenario: Modular Chrome utility architecture 001
    When the extension shell is composed
    Then each utility is registered through one public module entry point
    And the module entry point declares its identity, commands, panels, lifecycle, and storage ownership
    And the shell depends on utility entry points rather than utility implementation modules
    And adding an unrelated utility does not require editing another utility's implementation

  # Modular Chrome utility architecture 002
  Scenario Outline: Modular Chrome utility architecture 002
    Given utility module <utility_module> owns <owned_capability>
    When module boundaries are inspected
    Then <owned_capability> is reachable through <utility_module>'s public entry point
    And unrelated utility modules do not import its internal files

    Examples:
      | utility_module  | owned_capability                          |
      | command palette | command discovery and execution          |
      | hotkeys         | key bindings and hotkey editing          |
      | data layer      | capture and data-layer workflow entry    |

  # Modular Chrome utility architecture 003
  Scenario Outline: Modular Chrome utility architecture 003
    Given data-layer module <data_layer_module> owns <owned_capability>
    When data-layer boundaries are inspected
    Then <owned_capability> is exposed through that module's public interface
    And its core behavior is testable without constructing the complete side panel

    Examples:
      | data_layer_module | owned_capability                    |
      | capture           | source observation and sessions     |
      | live inspection   | event feed and event inspection     |
      | event library     | templates and template revisions    |
      | schemas           | authoring, assignment, and validation |
      | defect reporting  | report composition and defect storage |
      | replay            | sequence definition and execution   |

  # Modular Chrome utility architecture 004
  Scenario Outline: Modular Chrome utility architecture 004
    Given code belongs to architectural layer <layer>
    When its imports are inspected
    Then allowed dependencies are <allowed_dependencies>
    And forbidden dependencies are <forbidden_dependencies>

    Examples:
      | layer               | allowed_dependencies                         | forbidden_dependencies                         |
      | core                | same-module core                             | DOM, Chrome APIs, storage, and browser adapters |
      | application         | same-module core and declared contracts      | concrete DOM, Chrome, and storage implementations |
      | browser adapter     | same-module application, core, and platform contracts | another utility's internal modules       |
      | shell composition   | public utility entry points and platform adapters | utility implementation modules              |

  # Modular Chrome utility architecture 005
  Scenario: Modular Chrome utility architecture 005
    Given each utility owns persistent state
    When storage boundaries are inspected
    Then each utility has an explicit storage namespace
    And storage serialization is hidden behind that utility's public contract
    And one utility cannot read or mutate another utility's storage representation directly
    And shared browser storage access is supplied through a platform adapter

  # Modular Chrome utility architecture 006
  Scenario: Modular Chrome utility architecture 006
    When an import crosses a forbidden module or layer boundary
    Then architecture verification fails with the importing file and forbidden dependency
    And no allow-list entry is added without declaring the required module contract

  # Modular Chrome utility architecture 007
  Scenario: Modular Chrome utility architecture 007
    Given the current extension behavior is captured by unit, acceptance, and browser tests
    When utilities are moved behind modular entry points
    Then commands, hotkeys, panels, storage, schema workflows, event workflows, defect workflows, and replay remain available
    And the packaged extension retains the same manifest capabilities and browser entry points
    And restructuring does not alter stored user data or published schema semantics

  # Modular Chrome utility architecture 008
  Scenario: Modular Chrome utility architecture 008
    Given the full side panel supplies registered commands, owned hotkey storage, command execution, shell key arbitration, document and file adapters, and runtime message subscription
    When the installed hotkey controller is mounted through the hotkeys public entry point
    Then it loads the valid stored keymap or creates the canonical blank keymap
    And it binds the editor, keymap file controls, captured document keydown, and focus-app-hotkeys subscription exactly once
    And it renders the current assignments and exposes explicit render, focus, and dispose operations
    And its Hotkeys integration in src/side-panel.ts retains only dependency construction, shell key arbitration, controller mounting, late initial focus, and disposal
    And src/side-panel.ts owns no Hotkeys keymap state, serialization, file operation, editor binding, sequence transition, or runtime-message listener

  # Modular Chrome utility architecture 009
  Scenario Outline: Modular Chrome utility architecture 009
    Given an installed Hotkeys lifecycle begins in state <initial_state>
    When lifecycle operation <operation> occurs
    Then its lifecycle result is <result>
    And one user input can cause at most one controller action

    Examples:
      | initial_state | operation                 | result                                                                      |
      | new           | mount                     | one listener set and one initial render are active                          |
      | mounted       | mount again               | no listener, subscription, or render ownership is duplicated                |
      | mounted       | dispose                   | every owned listener and subscription is removed and pending input is cleared |
      | disposed      | dispose again             | disposal is an idempotent no-op                                             |
      | disposed      | mount again               | one fresh listener set and the persisted keymap are active                   |
      | mounted       | pagehide                  | disposal completes before the page lifecycle ends                            |

  # Modular Chrome utility architecture 010
  Scenario Outline: Modular Chrome utility architecture 010
    Given app-level hotkey focus is active with sequence state <sequence_state>
    When keyboard input <input> occurs at <input_scope>
    Then the installed hotkey controller produces <controller_result>
    And default handling is <default_handling>

    Examples:
      | sequence_state | input                    | input_scope                       | controller_result                                  | default_handling          |
      | empty          | a shell-claimed key      | shell-owned modal or inspector    | no keymap state or command changes                 | owned by the shell guard  |
      | empty          | a bound sequence         | input, textarea, select, or content-editable element | no keymap state or command changes               | preserved                 |
      | empty          | a valid prefix           | side-panel application            | the normalized prefix becomes pending              | prevented                 |
      | pending        | Escape                   | side-panel application            | the pending sequence is cleared                    | prevented                 |
      | pending        | its matching completion  | side-panel application            | one injected command executes and pending clears   | prevented                 |
      | pending        | a nonmatching completion | side-panel application            | no command executes and pending clears             | prevented                 |
      | empty          | an unmatched key         | side-panel application            | no command executes and sequence state stays empty | preserved                 |

  # Modular Chrome utility architecture 011
  Scenario Outline: Modular Chrome utility architecture 011
    Given the installed hotkey controller performs keymap operation <operation>
    When the operation reaches result <result>
    Then active and persisted keymap state, status, warning, focus, and download are <expected_state>
    And an attempted load clears its file input while a created download always revokes its object URL

    Examples:
      | operation | result                    | expected_state                                                                                                                           |
      | create    | blank keymap downloaded   | active schema version 1 has every registered command blank, persisted bytes stay unchanged, Blank keymap created is visible, and focus stays unchanged |
      | update    | updated keymap downloaded | active bindings are conserved and reconciled, persisted bytes stay unchanged, added and removed counts are visible, and focus stays unchanged          |
      | load      | valid unique keymap       | active and canonical persisted keymaps equal the loaded keymap, Keymap loaded is visible without a warning, and app-level hotkey focus is active       |
      | load      | invalid JSON or schema    | prior active and persisted keymaps and focus stay unchanged and the existing validation warning is visible                                           |
      | load      | duplicate sequence        | prior active and persisted keymaps and focus stay unchanged and the warning names the conflicting sequence                                           |

  # Modular Chrome utility architecture 012
  Scenario: Modular Chrome utility architecture 012
    Given the installed hotkey controller is implemented under src/utilities/hotkeys
    When module and changed-path ownership are inspected
    Then the controller is exported through src/utilities/hotkeys/index.ts and src/side-panel.ts imports only that public entry point
    And command execution, storage, DOM, runtime messaging, downloads, and shell key arbitration enter through explicit controller dependencies
    And the controller imports no command-palette implementation, data-layer implementation, or shell composition state
    And a later controller-only change selects exactly hotkeys and shell under the existing dependency graph
    And direct changes to src/side-panel.ts, shared platform adapters, or utility registry semantics retain their current broad impact

  # Modular Chrome utility architecture 013
  Scenario: Modular Chrome utility architecture 013
    Given the Hotkeys pack has no unit file, two property files, three feature files, two handlers, and one shared browser adapter before VTD-008
    When the installed hotkey controller is extracted from src/side-panel.ts
    Then one focused controller unit file proves dependency use, lifecycle idempotence, keyboard arbitration, file cleanup, and disposal
    And the two property files, three feature files, two handlers, shared browser adapter, and every existing assertion leaf remain unchanged
    And every other runnable pack's evidence remains unchanged
    And no command id, key sequence, keymap byte, storage key or namespace, filename, status, warning, focus result, manifest capability, visible behavior, or accessibility result changes
    And the one-time delivery checkpoint runs all 20 runnable packs in canonical order followed by node scripts/package.mjs

  # Modular Chrome utility architecture 014
  Scenario: Modular Chrome utility architecture 014
    Given the full side panel supplies registered commands, command execution, and the owned Command Palette DOM elements
    When the installed Command Palette controller is mounted through the command-palette public entry point
    Then it owns the launcher click, side-panel Ctrl+K, filter input and keydown, result click, and dialog Tab listeners exactly once
    And it exposes explicit mount, render, show, hide, and dispose operations
    And its integration in src/side-panel.ts retains only dependency construction, command execution routing, controller mounting, and page-lifecycle disposal
    And src/side-panel.ts owns no Command Palette visibility, filtering, selection, rendering, focus, or event-binding state

  # Modular Chrome utility architecture 015
  Scenario Outline: Modular Chrome utility architecture 015
    Given an installed Command Palette lifecycle begins in state <initial_state>
    When Command Palette lifecycle operation <operation> occurs
    Then the Command Palette lifecycle result is <result>
    And one palette input can cause at most one controller action

    Examples:
      | initial_state | operation                   | result                                                                                                      |
      | new           | mount                       | one listener set is active and initial dialog visibility is unchanged                                       |
      | mounted       | mount again                 | no listener or render ownership is duplicated                                                               |
      | mounted       | dispose while closed        | every owned listener is removed and transient selection and focus state are cleared                          |
      | mounted       | dispose while open          | listeners are removed, the dialog closes, background inertness is removed, and captured focus is restored   |
      | disposed      | dispose again               | disposal is an idempotent no-op                                                                              |
      | disposed      | mount again                 | one fresh listener set is active with canonical initial selection state                                      |
      | mounted       | pagehide through the shell  | disposal completes before the page lifecycle ends                                                            |

  # Modular Chrome utility architecture 016
  Scenario Outline: Modular Chrome utility architecture 016
    Given the mounted Command Palette is <palette_state>
    When palette input <input> occurs
    Then the palette result is <palette_result>
    And the command result is <command_result>
    And the focus and background result is <focus_result>

    Examples:
      | palette_state | input                  | palette_result                                      | command_result                     | focus_result                                                    |
      | closed        | launcher click         | open with current matching commands and first selection | no command executes              | prior focus is captured, background is inert, and filter focuses |
      | closed        | Ctrl+K                 | open with current matching commands and first selection | no command executes              | prior focus is captured, background is inert, and filter focuses |
      | open          | filter query           | only matching commands render with valid selection  | no command executes                | filter remains focused and background remains inert             |
      | open          | Arrow, Home, or End    | the requested valid result becomes selected         | no command executes                | filter remains focused and background remains inert             |
      | open          | Enter                  | the palette closes                                   | the selected command executes once | background inertness clears and prior focus is restored          |
      | open          | selected-result click | the palette closes                                   | the clicked command executes once  | background inertness clears and prior focus is restored          |
      | open          | Escape                 | the palette closes                                   | no command executes                | background inertness clears and prior focus is restored          |
      | open          | Tab                    | the palette remains open                             | no command executes                | focus stays in the filter and background remains inert           |

  # Modular Chrome utility architecture 017
  Scenario: Modular Chrome utility architecture 017
    Given the installed Command Palette controller is exported through src/utilities/command-palette/index.ts
    When Command Palette module and changed-path ownership are inspected
    Then command execution, registered commands, DOM ownership, and focus behavior enter through explicit controller dependencies
    And the controller imports no Hotkeys implementation, Data Layer implementation, or shell composition state
    And command-registry semantic changes retain their declared dependant propagation
    And a later controller-only change selects exactly command-palette and shell while excluding Hotkeys and unrelated product packs
    And the controller boundary does not narrow direct changes to src/side-panel.ts, shared platform adapters, or utility registry semantics

  # Modular Chrome utility architecture 018
  Scenario: Modular Chrome utility architecture 018
    Given the Command Palette pack has two unit files, one property file, four feature files, two handlers, and one shared browser adapter before this VTD-008 slice
    When the installed Command Palette controller lifecycle is completed
    Then one focused controller unit file proves dependency use, lifecycle idempotence, listener cleanup, open-dialog settlement, focus restoration, and command cardinality
    And the two existing unit files, property file, four feature files, two handlers, shared browser adapter, and every existing assertion leaf remain registered
    And every unrelated runnable pack's evidence remains unchanged
    And no command id, ordering, message, storage value, browser entry point, manifest capability, visible behavior, layout, or accessibility result changes
    And the one-time delivery checkpoint runs all 20 runnable packs in canonical order with properties followed by node scripts/package.mjs

  # Modular Chrome utility architecture 019
  Scenario: Modular Chrome utility architecture 019
    Given the full side panel supplies shell-owned storage, the workspace tab list, the workspace DOM query boundary, and page lifecycle
    When the installed workspace-tabs controller is mounted
    Then it restores the valid persisted workspace or selects and persists the canonical Data Layer fallback
    And it owns the tab-list click, tab-list keydown, and page-lifecycle listeners exactly once
    And it performs one initial render and exposes explicit mount, render, show, and dispose operations
    And its integration in src/side-panel.ts retains only dependency construction, workspace-navigation command routing, and controller mounting
    And controller disposal is driven by the injected page lifecycle
    And src/side-panel.ts owns no workspace selection state, storage read or write, tab or panel rendering, workspace event binding, or workspace disposal closure

  # Modular Chrome utility architecture 020
  Scenario Outline: Modular Chrome utility architecture 020
    Given an installed workspace-tabs lifecycle begins in state <initial_state>
    When workspace-tabs lifecycle operation <operation> occurs
    Then the workspace-tabs lifecycle result is <result>
    And one workspace input can cause at most one controller transition

    Examples:
      | initial_state | operation                  | result                                                                                         |
      | new           | mount                      | one listener set and one render of the persisted or canonical workspace are active             |
      | mounted       | mount again                | no listener, storage transition, or initial render is duplicated                               |
      | mounted       | dispose                    | every owned listener is removed while persisted and rendered selection remain unchanged         |
      | disposed      | dispose again              | disposal is an idempotent no-op                                                                 |
      | disposed      | mount again                | one fresh listener set and one render of the persisted workspace are active                     |
      | mounted       | pagehide through lifecycle | disposal completes before the page lifecycle ends                                               |

  # Modular Chrome utility architecture 021
  Scenario Outline: Modular Chrome utility architecture 021
    Given mounted workspace tab <initial_tab> is active
    When workspace input <input> occurs
    Then the active workspace result is <workspace_result>
    And the focus and default-handling result is <interaction_result>

    Examples:
      | initial_tab | input                         | workspace_result                                             | interaction_result                                  |
      | Data Layer  | click the Hotkeys tab         | Hotkeys is persisted, selected, and solely visible           | Hotkeys receives focus and click handling is preserved |
      | Data Layer  | ArrowRight                    | Hotkeys is persisted, selected, and solely visible           | Hotkeys receives focus and the key is prevented     |
      | Hotkeys     | ArrowRight                    | Data Layer is persisted, selected, and solely visible        | Data Layer receives focus and the key is prevented  |
      | Hotkeys     | Home                          | Data Layer is persisted, selected, and solely visible        | Data Layer receives focus and the key is prevented  |
      | Data Layer  | End                           | Hotkeys is persisted, selected, and solely visible           | Hotkeys receives focus and the key is prevented     |
      | Data Layer  | Escape                        | Data Layer remains persisted, selected, and solely visible   | focus and default handling are preserved            |
      | Data Layer  | click a non-workspace control | Data Layer remains persisted, selected, and solely visible  | focus and default handling are preserved            |

  # Modular Chrome utility architecture 022
  Scenario: Modular Chrome utility architecture 022
    Given the workspace-tabs presentation controller is registered as shell-local presentation
    When workspace-tabs module and changed-path ownership are inspected
    Then storage, DOM, focus, and page lifecycle enter through explicit controller dependencies
    And the controller imports no Command Palette, Hotkeys, Data Layer, utility-registry, or shell-composition state
    And a later controller-only change selects exactly shell without dependant propagation
    And a semantic workspace-navigation model change retains command-palette, hotkeys, and shell consumers
    And those local classifications leave the existing global-impact closure unchanged for src/side-panel.ts, shared platform adapters, and utility-registry semantics

  # Modular Chrome utility architecture 023
  Scenario: Modular Chrome utility architecture 023
    Given the canonical registry defines the complete pre-slice shell evidence inventory
    When the installed workspace-tabs controller lifecycle is completed
    Then one focused controller unit leaf proves dependency use, persisted restoration, lifecycle idempotence, listener cleanup, navigation, focus, and transition cardinality
    And every registered pre-slice unit, property, feature, handler, browser adapter, observation, and assertion leaf remains unchanged
    And verification accounting derives the expected inventory from the canonical registry plus exactly that approved unit addition
    And no workspace id, order, storage key, namespace, visible state, focus result, navigation command, browser entry point, manifest capability, layout, or accessibility result changes
    And one-time delivery runs the 20 runnable packs in canonical order with properties before node scripts/package.mjs
