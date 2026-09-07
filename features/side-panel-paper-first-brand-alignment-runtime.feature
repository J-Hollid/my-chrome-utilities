# mutation-stamp: sha256=b90742184200576c7ceff73f6e584ae137b2693a05998a0594e634c1b8794a4a
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-07T13:11:56.120579342Z","feature_name":"Side panel paper-first brand alignment runtime","feature_path":"features/side-panel-paper-first-brand-alignment-runtime.feature","background_hash":"9481e6d3ec3cf1a00fa888f7656ffa9af14b3827684278f479eca3417db7c4a8","implementation_hash":"unknown","scenarios":[{"index":0,"name":"Side panel paper-first brand alignment runtime 001","scenario_hash":"51cac8903902509ea63d91ccfc5c665d7cec8cc420410e3f4550b92127dc03bd","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:11:56.120579342Z"},{"index":1,"name":"Side panel paper-first brand alignment runtime 002","scenario_hash":"52bcedc6640f665ac14a6c534df51159a0c7f72a77dac58fa044c3756267a16c","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:11:56.120579342Z"},{"index":2,"name":"Side panel paper-first brand alignment runtime 003","scenario_hash":"40f0b4cb6717757a17d6d737dcd47d4fb56c47cd5ac4a5a1872b66287c5ed70d","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:11:56.120579342Z"},{"index":4,"name":"Side panel paper-first brand alignment runtime 005","scenario_hash":"ab675c8c1f85ab6060d74f197247cf613d25b5c041666dc4e5565d46fbbfb968","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:11:56.120579342Z"},{"index":5,"name":"Side panel paper-first brand alignment runtime 006","scenario_hash":"0741633245f404bb52d2958ae0d984c09fc2650f81512719e11e23e51909003e","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:11:56.120579342Z"}]}
# acceptance-mutation-manifest-end

Feature: Side panel paper-first brand alignment runtime

  Background:
    Given the paper-first side-panel redesign is built and packaged
    And the production side-panel document is running in Chrome

  # Side panel paper-first brand alignment runtime 001
  Scenario Outline: Side panel paper-first brand alignment runtime 001
    Given runtime surface <surface_target> is visible
    When its computed presentation is measured
    Then its computed color pair is <background_role> with <foreground_role>

    Examples:
      | surface_target          | background_role        | foreground_role |
      | application header      | strong navy            | raised paper    |
      | side-panel content      | warm paper             | dark ink        |
      | active workspace        | warm paper             | dark ink        |
      | active Data Layer panel | raised paper           | dark ink        |
      | nested record group     | subtle warm-paper tint | dark ink        |
      | ordinary button         | raised paper           | navy ink        |
      | primary button          | strong navy            | raised paper    |
      | selected section tab    | raised paper           | navy ink        |

  # Side panel paper-first brand alignment runtime 002
  Scenario Outline: Side panel paper-first brand alignment runtime 002
    Given shared semantic color role <color_role> is installed
    When side-panel and Specification Studio style consumers are inspected
    Then both consumers resolve <color_role> from the shared brand foundation
    And a component does not replace <color_role> with a hard-coded navy shade

    Examples:
      | color_role       |
      | page surface     |
      | raised surface   |
      | subtle surface   |
      | dark ink         |
      | strong brand     |
      | selection        |
      | destructive      |
      | focus            |

  # Side panel paper-first brand alignment runtime 003
  Scenario Outline: Side panel paper-first brand alignment runtime 003
    Given the former side-panel brand stylesheet owned shell, shared-control, and workflow rules
    When the redesign source stylesheet inventory is inspected
    Then responsibility <stylesheet_responsibility> is owned by a focused stylesheet module
    And no stylesheet module owns shell, shared-control, and workflow responsibilities together

    Examples:
      | stylesheet_responsibility          |
      | shell layout and masthead           |
      | shared surfaces and action roles    |
      | Live and transport workflows        |
      | Projects and repository workflows   |
      | Library and Sessions workflows      |
      | Defects and Schemas workflows       |
      | Hotkeys workflow                    |

  # Side panel paper-first brand alignment runtime 004
  Scenario: Side panel paper-first brand alignment runtime 004
    Given the stylesheet decomposition and paper-first mappings belong to the same redesign candidate
    When the source, built directory, and extension package are inspected
    Then the side-panel document loads every required focused stylesheet in deterministic cascade order
    And every stylesheet is local to the extension
    And the built and packaged stylesheet sets match the source stylesheet set
    And the former monolith is not the owner of workflow presentation

  # Side panel paper-first brand alignment runtime 005
  Scenario Outline: Side panel paper-first brand alignment runtime 005
    Given visual fixture <fixture_name> is displayed at width <panel_width>
    When the current image, approved image, and visual difference are recorded
    Then computed evidence confirms the paper-first role mapping
    And no restricted strong-navy fill appears on the page, workspace, nested group, or ordinary button
    And document overflow, clipped labels, broken focus, or unreadable state text fails the evidence

    Examples:
      | fixture_name   | panel_width |
      | Live ready     | 360 px      |
      | Library empty  | 420 px      |
      | Schemas detail | 512 px      |

  # Side panel paper-first brand alignment runtime 006
  Scenario Outline: Side panel paper-first brand alignment runtime 006
    Given the redesigned side panel is displayed in accessibility mode <accessibility_mode>
    When focus, state, boundary, and text presentation are measured
    Then every control remains operable and visibly identified
    And the paper-first redesign preserves the existing accessibility behavior for <accessibility_mode>

    Examples:
      | accessibility_mode |
      | keyboard focus     |
      | reduced motion     |
      | forced colors      |

  # Side panel paper-first brand alignment runtime 007
  Scenario: Side panel paper-first brand alignment runtime 007
    Given the pre-redesign control and accessible-relationship inventory is recorded
    When the redesigned installed side panel is compared with that inventory
    Then every control retains its stable identity, type, role, state owner, and accessible relationships
    And every navigation, storage, Chrome API, clipboard, import, export, and recovery effect is unchanged
    And presentation modules add no domain state or side effect

  # Side panel paper-first brand alignment runtime 008
  Scenario: Side panel paper-first brand alignment runtime 008
    Given the former side-panel stylesheet has a global declaration in the verification registry
    And the redesign affects only the side-panel document and its scoped presentation
    When feature-integration intent is classified for the redesign candidate
    Then the former stylesheet maps to the side-panel style smoke target and a terminal release obligation
    And each focused stylesheet maps to its exact owner and declared side-panel consumers
    And the feature plan does not select all 21 runnable packs
    And the old global declaration alone does not make the readiness class genuinely-global
