# mutation-stamp: sha256=0d8913fb631d8d30d79a7d8f466aeef063b794eeca2f8b01eb26237349dc3141
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-07T13:10:30.539264160Z","feature_name":"Side panel paper-first brand alignment","feature_path":"features/side-panel-paper-first-brand-alignment.feature","background_hash":"4b6d0ac4a51b2eece313a333f1db3eb4ee13d32635f31d304cb7f22fb21e0dec","implementation_hash":"unknown","scenarios":[{"index":0,"name":"Side panel paper-first brand alignment 001","scenario_hash":"b4eab71ad9449a9e20b274d3678958cd5a918ed748af679ed59dcbaf6a5e5146","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:10:30.539264160Z"},{"index":1,"name":"Side panel paper-first brand alignment 002","scenario_hash":"f7eda12f54cc865a366741fb87e20da0c27f678621b5695e68239e3367b24f0e","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:10:30.539264160Z"},{"index":2,"name":"Side panel paper-first brand alignment 003","scenario_hash":"9c50006aa198a8a281419d7ecb287822fabe8d719174d7ecc428a9b3b26e74d9","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:10:30.539264160Z"},{"index":3,"name":"Side panel paper-first brand alignment 004","scenario_hash":"084d6c2fedcaba7cc9bc994d401c1a9b45096727f144f6779f4b4887f708b539","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:10:30.539264160Z"},{"index":4,"name":"Side panel paper-first brand alignment 005","scenario_hash":"887b1e19095eaddbccc259321855a3a031b853b87b489c378e8f9d6fcd8e063a","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:10:30.539264160Z"},{"index":5,"name":"Side panel paper-first brand alignment 006","scenario_hash":"6be88c4d12b1c33fd91a4f960a4a1ffe4be3a0259f35e2781e348dc51d780ff7","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:10:30.539264160Z"},{"index":6,"name":"Side panel paper-first brand alignment 007","scenario_hash":"b86d56b3a18444613fa97a5e153714307b08908e1f33849442c06b407c010406","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:10:30.539264160Z"}]}
# acceptance-mutation-manifest-end

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
      | nested content group | subtle warm-paper tint | dark ink        |

  # Side panel paper-first brand alignment 002
  Scenario Outline: Side panel paper-first brand alignment 002
    Given <navigation_level> navigation has selected item <selected_item>
    When the navigation is displayed
    Then its navigation surface uses raised paper with navy text
    And selected item <selected_item> uses <selected_treatment>
    And an unselected item does not use a strong navy fill
    And keyboard focus remains distinct from selection

    Examples:
      | navigation_level | selected_item | selected_treatment         |
      | workspace        | Data Layer    | navy with light text       |
      | Data Layer       | Live          | paper with a gold rule     |

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
