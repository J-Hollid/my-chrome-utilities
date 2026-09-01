Feature: Side panel paper-first brand alignment

  Background:
    Given the TWAtility Belt side panel is displayed with its default presentation
    And its existing controls, states, navigation, and effects are available

  # Side panel paper-first brand alignment 001
  Scenario Outline: Side panel paper-first brand alignment 001
    Given side-panel surface <surface_role> is visible
    When the default brand presentation is applied
    Then <surface_role> uses <background_role>
    And its readable foreground uses <foreground_role>

    Examples:
      | surface_role         | background_role        | foreground_role |
      | application masthead | strong navy            | raised paper    |
      | page canvas          | warm paper             | dark ink        |
      | workspace canvas     | warm paper             | dark ink        |
      | main content panel   | raised paper           | dark ink        |
      | nested content group | subtle blue-paper tint | dark ink        |

  # Side panel paper-first brand alignment 002
  Scenario Outline: Side panel paper-first brand alignment 002
    Given <navigation_level> navigation has selected item <selected_item>
    When the navigation is displayed
    Then its navigation surface uses raised paper with navy text
    And selected item <selected_item> uses mustard with navy text
    And an unselected item does not use a strong navy fill
    And keyboard focus remains distinct from selection

    Examples:
      | navigation_level | selected_item |
      | workspace        | Data Layer    |
      | Data Layer       | Live          |

  # Side panel paper-first brand alignment 003
  Scenario Outline: Side panel paper-first brand alignment 003
    Given an action has role <action_role>
    When the action is displayed
    Then its fill and text use <action_treatment>
    And its meaning remains identifiable without color alone

    Examples:
      | action_role | action_treatment                    |
      | secondary   | raised paper with navy text         |
      | primary     | strong navy with raised-paper text  |
      | selected    | mustard with navy text               |
      | destructive | deep red with raised-paper text      |

  # Side panel paper-first brand alignment 004
  Scenario Outline: Side panel paper-first brand alignment 004
    Given content class <content_class> is visible in a main panel
    When its boundary and depth are displayed
    Then <content_class> is separated with <boundary_treatment>
    And its visual depth is <depth_treatment>

    Examples:
      | content_class        | boundary_treatment                 | depth_treatment     |
      | related records      | spacing or a divider               | no elevation        |
      | nested form section  | spacing or a divider               | no elevation        |
      | empty recovery state | an accent rule on a paper surface  | no elevation        |
      | dialog               | a contained ink boundary           | overlay elevation   |
      | menu                 | a contained ink boundary           | overlay elevation   |
      | command palette      | a contained ink boundary           | overlay elevation   |

  # Side panel paper-first brand alignment 005
  Scenario Outline: Side panel paper-first brand alignment 005
    Given no optional side-panel theme is selected
    When the side panel opens under host color preference <host_preference>
    Then the paper-first surface roles remain the default
    And the document root does not force a dark native-control scheme
    And a dark presentation cannot appear without an explicit side-panel theme selection

    Examples:
      | host_preference |
      | light           |
      | dark            |

  # Side panel paper-first brand alignment 006
  Scenario Outline: Side panel paper-first brand alignment 006
    Given view <view_name> is displayed at available width <panel_width>
    When the paper-first presentation is rendered
    Then paper is the dominant workspace surface
    And strong navy remains limited to the masthead and primary emphasis
    And the view has no document-level horizontal scrolling
    And navigation, labels, controls, focus, and status text remain readable

    Examples:
      | view_name | panel_width |
      | Live      | 360 px      |
      | Library   | 420 px      |
      | Schemas   | 512 px      |

  # Side panel paper-first brand alignment 007
  Scenario Outline: Side panel paper-first brand alignment 007
    Given control <control_name> is in state <control_state>
    When the redesigned side panel is displayed
    Then <control_name> retains its existing name, role, state, and action
    And state <control_state> retains a non-color indication
    And focus and text meet the existing accessible contrast requirements

    Examples:
      | control_name     | control_state |
      | Start testing    | primary       |
      | Pause capture    | selected      |
      | Export Library   | disabled      |
      | Clear Library    | destructive   |
      | Connected source | successful    |
