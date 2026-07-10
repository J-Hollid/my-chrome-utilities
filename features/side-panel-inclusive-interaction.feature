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
