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
    Then interface labels use the side panel text style
    And machine values, paths, command ids, and formatted payloads use a distinct monospace style
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
    Then a state-specific title and explanation are shown in the content region
    And recovery action <recovery_action> is shown when it can resolve the state
    And the navigation and global command controls remain available

    Examples:
      | project_name         | view_name | view_state                  | recovery_action      |
      | my-chrome-utilities | Live      | no captured events          | Start observation    |
      | my-chrome-utilities | Live      | source connection failed    | Restart observation  |
      | my-chrome-utilities | Library   | no matching templates       | Clear filters        |
      | my-chrome-utilities | Sessions  | no saved sessions           | Import session       |
      | my-chrome-utilities | Schemas   | no saved schemas            | Create schema        |
