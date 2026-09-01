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
      | nested record group     | subtle blue-paper tint | dark ink        |
      | ordinary button         | raised paper           | navy ink        |
      | primary button          | strong navy            | raised paper    |
      | selected tab            | mustard                | navy ink        |

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
