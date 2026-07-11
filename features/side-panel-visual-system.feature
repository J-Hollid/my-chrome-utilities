# mutation-stamp: sha256=bb64e697f0ea0504b5b22fb8216c6875424c73ccf2db9a8beb0f9cdacdf56958
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T14:48:30.377782477Z","feature_name":"Side panel visual system","feature_path":"features/side-panel-visual-system.feature","background_hash":"fc62c8bb452ac40b8501731c715eebb0368f0fb524c4d8191152968a1449c63a","implementation_hash":"sha256:operator-interface-semantic-v2","scenarios":[{"index":1,"name":"Side panel visual system 002","scenario_hash":"98681dcfacdc98a6e96566bbdc8196c251948ffa853d137625cdd3cdbd0185cf","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:30.377782477Z"},{"index":2,"name":"Side panel visual system 003","scenario_hash":"81325050728f81176c833f6ba1d1ca5c8a073100573a191148b735f655b29f97","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:30.377782477Z"},{"index":3,"name":"Side panel visual system 004","scenario_hash":"e9d4c9a6abf4d43ea6c4a3c04d223c6eed95916efe9c62d620c02f93ac78c58d","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:30.377782477Z"},{"index":4,"name":"Side panel visual system 005","scenario_hash":"6342dd03bb88f602c3e7e66b0b5a2f110cb6b4240b81833f92e11c18c0f560a6","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:30.377782477Z"},{"index":0,"name":"Side panel visual system 001","scenario_hash":"cc696d87c80576d1303106e87990f267cb62236f25abda9a8bfeb8144f853723","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:45:33.530134114Z"}]}
# acceptance-mutation-manifest-end

Feature: Side panel visual system

  Background:
    Given a repository for project <project_name>
    And the packaged side panel is displayed

  # Side panel visual system 001
  Scenario Outline: Side panel visual system 001
    When the production extension package is inspected
    Then the side panel loads its authored styles from a packaged local stylesheet
    And the side panel does not require a remote stylesheet, font, or image to render its interface
    And the stylesheet is present beside the packaged side panel document

    Examples:
      | project_name         |
      | my-chrome-utilities |

  # Side panel visual system 002
  Scenario Outline: Side panel visual system 002
    Given workspace <workspace_name> contains headings, controls, metadata, and data records
    When the workspace is displayed
    Then page, view, section, record, and metadata text have visibly distinct hierarchy
    And related records are separated by spacing or dividers rather than each being presented as an elevated card
    And elevation is reserved for overlays, menus, and dialogs

    Examples:
      | project_name         | workspace_name |
      | my-chrome-utilities | Data Layer     |
      | my-chrome-utilities | Hotkeys        |

  # Side panel visual system 003
  Scenario Outline: Side panel visual system 003
    Given control <control_name> is displayed
    When the control enters state <control_state>
    Then state <control_state> is visually distinguishable from its default state
    And its label remains readable
    And state <control_state> is not communicated by color alone

    Examples:
      | project_name         | control_name       | control_state |
      | my-chrome-utilities | Pause capture      | selected      |
      | my-chrome-utilities | Push template      | disabled      |
      | my-chrome-utilities | Delete session     | destructive   |
      | my-chrome-utilities | Connected source   | successful    |

  # Side panel visual system 004
  Scenario Outline: Side panel visual system 004
    Given record <record_name> contains operator metadata and a structured payload
    When the record is displayed
    Then labels, human-readable values, and helper or feedback text use distinct type styles
    And each type style is consistent wherever that content role appears
    And machine values, paths, command ids, and formatted payloads use the code style with a distinct monospace face
    And long machine values wrap or truncate with a way to reveal the complete value
    And metadata alignment does not obscure the record's primary name

    Examples:
      | project_name         | record_name           |
      | my-chrome-utilities | purchase event        |
      | my-chrome-utilities | data-layer.show-live  |

  # Side panel visual system 005
  Scenario Outline: Side panel visual system 005
    Given view <view_name> has state <view_state>
    When the view is displayed
    Then state-specific plain-language content <empty_message> is shown in the content region
    And recovery action <recovery_action> is shown when it can resolve the state
    And the navigation and global command controls remain available

    Examples:
      | project_name         | view_name         | view_state               | empty_message                    | recovery_action     |
      | my-chrome-utilities | Live              | no captured events       | No events captured yet           | Start testing       |
      | my-chrome-utilities | Live              | source connection failed | Source connection failed         | Restart observation |
      | my-chrome-utilities | Library templates | no saved templates       | No templates saved yet           | Open Live           |
      | my-chrome-utilities | Library templates | no matching templates    | No templates match these filters | Clear filters       |
      | my-chrome-utilities | Sessions          | no saved sessions        | No sessions saved yet            | Import session      |
      | my-chrome-utilities | Schemas           | no saved schemas         | No schemas saved yet             | Create schema       |
      | my-chrome-utilities | Library sequences | no saved sequences       | No sequences saved yet           | Create sequence     |

  # Side panel visual system 006
  Scenario Outline: Side panel visual system 006
    Given workspace <workspace_name> contains repeated headers, fields, and sections
    When vertical spacing is displayed
    Then the same content relationships use this shared spacing scale
      | relationship       | spacing step |
      | header to content  | compact      |
      | field to field     | standard     |
      | section to section | spacious     |
    And compact, standard, and spacious gaps increase in that order
    And dividers reinforce section boundaries without replacing the section-to-section gap

    Examples:
      | project_name         | workspace_name |
      | my-chrome-utilities | Data Layer     |
      | my-chrome-utilities | Hotkeys        |

  # Side panel visual system 007
  Scenario Outline: Side panel visual system 007
    Given <navigation_level> navigation has selected tab <selected_tab>
    When the tab list is displayed
    Then <selected_tab> uses the shared selected-tab border and font weight
    And keyboard focus uses the shared focus treatment without replacing selected state
    And unselected tabs do not receive selected-tab treatment

    Examples:
      | project_name         | navigation_level | selected_tab |
      | my-chrome-utilities | workspace        | Data Layer   |
      | my-chrome-utilities | Data Layer       | Live         |

  # Side panel visual system 008
  Scenario Outline: Side panel visual system 008
    Given the side panel expands to <panel_width> CSS px in <view_name>
    When the responsive layout is displayed
    Then the added width provides <width_use>
    And readable text lines remain bounded rather than stretching across unused space
    And no unexplained blank grid column separates related content

    Examples:
      | project_name         | panel_width | view_name | width_use                       |
      | my-chrome-utilities | 520         | Live      | longer readable content lines   |
      | my-chrome-utilities | 720         | Library   | purposeful list and detail panes |
