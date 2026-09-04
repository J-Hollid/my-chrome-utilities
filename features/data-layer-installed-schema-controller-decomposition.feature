Feature: Data Layer installed Schema controller decomposition

  Background:
    Given createSchemasInstalledController is the installed Schema public entry
    And the approved pre-decomposition Schema behavior and registered evidence are the conservation baseline

  # Data Layer installed Schema controller decomposition 001
  Scenario: Data Layer installed Schema controller decomposition 001
    Given src/data-layer-installed/schemas/index.ts contains more than one behavior boundary
    When changed-path ownership is planned before the controller is thin
    Then the complete conservative Schemas parent closure is selected
    And the Schema editor reachability slice does not claim the complete file
    And no new narrow slice can reduce its own current-candidate evidence

  # Data Layer installed Schema controller decomposition 002
  Scenario Outline: Data Layer installed Schema controller decomposition 002
    Given Schema controller boundary <boundary> is moved to <module>
    When its module contract is inspected
    Then the module owns <owned_state>
    And it receives cross-boundary behavior through <port_contract>
    And another Schema controller does not import its internal implementation

    Examples:
      | boundary                     | module                                  | owned_state                                      | port_contract                         |
      | lifecycle support             | lifecycle.ts                            | listener registration and idempotent disposal    | narrow event-target ports             |
      | editor route and tree return  | editor-route-controller.ts              | route, invoking reference, focus, and scroll      | schema selection and frame ports      |
      | relationship-tree view        | relationship-tree-controller.ts         | query, filter, expansion, rows, and tree scroll   | library projection and routing ports  |
      | library and draft lifecycle   | library-controller.ts                   | schema library, active draft, revisions, and I/O  | storage and durable-settlement ports  |
      | property authoring            | property-controller.ts                  | property selection, dialogs, copy, remove, Undo   | active-draft command ports            |
      | reusable-rule authoring       | rule-controller.ts                      | rule picker, promotion, sync, and review state    | library transaction ports             |
      | assignment authoring          | assignment-controller.ts                | assignment, condition, conflict, and review state | active-schema command ports           |
      | validation records            | validation-controller.ts                | validation records, recheck, and result state      | capture evaluation ports              |
      | guided validation             | guided-validation-controller.ts         | continuation, declaration, expansion, and guidance | capture and project-routing ports    |
      | compact canonical editing     | canonical-editor-controller.ts          | canonical commands, history, settlement, and UI   | canonical persistence ports           |

  # Data Layer installed Schema controller decomposition 003
  Scenario: Data Layer installed Schema controller decomposition 003
    When extracted Schema controllers exchange state
    Then one controller owns each mutable value
    And other controllers use commands or read-only projections
    And no shared mutable context object contains all controller state
    And asynchronous completion checks the lifecycle that started it

  # Data Layer installed Schema controller decomposition 004
  Scenario Outline: Data Layer installed Schema controller decomposition 004
    Given test/data-layer-installed/schemas-controller-test.mjs contains assertions for <boundary>
    When that boundary moves to a direct contract
    Then each moved assertion remains in exactly one registered contract
    And the existing contract retains composition and public-facade assertions only
    And unrelated Schema contracts remain unchanged

    Examples:
      | boundary                     |
      | editor route and tree return |
      | relationship-tree view       |
      | library and draft lifecycle  |
      | property authoring           |
      | reusable-rule authoring      |
      | assignment authoring         |
      | validation records           |
      | guided validation            |
      | compact canonical editing    |

  # Data Layer installed Schema controller decomposition 005
  Scenario: Data Layer installed Schema controller decomposition 005
    When the final Schema composition root is inspected
    Then index.ts constructs controllers through narrow typed ports
    And index.ts mounts and disposes each controller exactly once
    And index.ts owns no domain rendering, persistence, dialog, or workflow state
    And createSchemasInstalledController and SchemasInstalledPorts remain compatible
    And a change to one extracted module selects only its direct tasks and declared consumers
