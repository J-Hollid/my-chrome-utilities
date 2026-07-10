# mutation-stamp: sha256=5a92476ee5c9c4e3a765316bf299ce4ea64a69613ffad488ddd2dff19e88c7a7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T14:48:27.256659731Z","feature_name":"Side panel inclusive interaction","feature_path":"features/side-panel-inclusive-interaction.feature","background_hash":"3d611b28e4cfd1a84ebb12b1ccd46b5369138fb8a0f0902d0492cf7a9cb44728","implementation_hash":"sha256:operator-interface-semantic-v2","scenarios":[{"index":0,"name":"Side panel inclusive interaction 001","scenario_hash":"c906385f9c64a5cf26dda16dcff2c6f6b19596bffb5c8afd33e9bf279818a35b","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:27.256659731Z"},{"index":1,"name":"Side panel inclusive interaction 002","scenario_hash":"6d74f35b5c1a9664247d88f5238d8b345f2c37dda6f07b92cdb18172868c72f3","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:27.256659731Z"},{"index":2,"name":"Side panel inclusive interaction 003","scenario_hash":"6b4ba836f301c6985347ad4904e6908be0d4711bc119f1d0d97110bb4e0cc2d2","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:27.256659731Z"},{"index":3,"name":"Side panel inclusive interaction 004","scenario_hash":"28b121aa8392aa5f440565f3275a5f8680c680eba2f8aaecb65eb12df9e5580a","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:27.256659731Z"},{"index":4,"name":"Side panel inclusive interaction 005","scenario_hash":"dcf4d0bb601931762faf2be3ab16c230cbe8da34fd539b490ab98b3d7cf12abe","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:27.256659731Z"},{"index":5,"name":"Side panel inclusive interaction 006","scenario_hash":"d4fedca1d5752fa180d3783ff9f48f1d15e002ef955141294fc84b31e870c46f","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:27.256659731Z"}]}
# acceptance-mutation-manifest-end

Feature: Side panel inclusive interaction

  Background:
    Given a repository for project <project_name>
    And the side panel is displayed

  # Side panel inclusive interaction 001
  Scenario Outline: Side panel inclusive interaction 001
    Given interactive element <element_name> has keyboard focus
    When the element is displayed against theme <theme_name>
    Then a visible focus indicator surrounds or underlines <element_name>
    And the focus indicator has at least 3 to 1 contrast against adjacent colors
    And focused content is not hidden beneath a sticky region

    Examples:
      | project_name         | element_name       | theme_name |
      | my-chrome-utilities | Live view tab      | light      |
      | my-chrome-utilities | Save template      | dark       |

  # Side panel inclusive interaction 002
  Scenario Outline: Side panel inclusive interaction 002
    Given control <control_name> is intended for frequent side panel use
    When the interface is operated with touch or pointer input
    Then the control has a target at least <target_size> in both dimensions or equivalent spacing from adjacent targets
    And its accessible name identifies its action and context

    Examples:
      | project_name         | control_name       | target_size |
      | my-chrome-utilities | Back to events     | 44 CSS px   |
      | my-chrome-utilities | Pause capture      | 44 CSS px   |
      | my-chrome-utilities | Clear source filter | 44 CSS px  |

  # Side panel inclusive interaction 003
  Scenario Outline: Side panel inclusive interaction 003
    Given the side panel is displayed at <panel_width> with text zoom <text_zoom>
    When workspace <workspace_name> is inspected from start to end
    Then content reflows without two-dimensional document scrolling
    And text and controls are not clipped
    And every action remains reachable by keyboard

    Examples:
      | project_name         | panel_width | text_zoom | workspace_name |
      | my-chrome-utilities | 320 CSS px  | 200 percent | Data Layer   |
      | my-chrome-utilities | 320 CSS px  | 200 percent | Hotkeys      |

  # Side panel inclusive interaction 004
  Scenario Outline: Side panel inclusive interaction 004
    Given visual theme <theme_name> is active
    When text, controls, dividers, and status indicators are displayed
    Then normal text has at least 4.5 to 1 contrast against its background
    And large text and essential control boundaries have at least 3 to 1 contrast against adjacent colors
    And semantic state <semantic_state> includes text or an icon with an accessible name

    Examples:
      | project_name         | theme_name | semantic_state |
      | my-chrome-utilities | light      | Connected      |
      | my-chrome-utilities | dark       | 2 issues       |
      | my-chrome-utilities | light      | Destructive    |

  # Side panel inclusive interaction 005
  Scenario Outline: Side panel inclusive interaction 005
    Given the user preference for reduced motion is <motion_preference>
    When a tab, inspector, disclosure, menu, or dialog changes visibility
    Then the new content is available without a motion-dependent delay
    And nonessential animation behavior is <animation_behavior>
    And focus moves according to the interaction rather than the animation

    Examples:
      | project_name         | motion_preference | animation_behavior |
      | my-chrome-utilities | reduce            | disabled           |
      | my-chrome-utilities | no preference     | brief               |

  # Side panel inclusive interaction 006
  Scenario Outline: Side panel inclusive interaction 006
    Given component <component_name> changes state to <state_name>
    When assistive technology observes the change
    Then the component exposes state <state_name> through its role, name, value, or selected state
    And transient status is announced once without moving focus
    And a destructive confirmation or invalid editor moves focus to actionable context

    Examples:
      | project_name         | component_name        | state_name |
      | my-chrome-utilities | Live view tab         | selected   |
      | my-chrome-utilities | observation status    | restarted  |
      | my-chrome-utilities | template JSON editor  | invalid    |
