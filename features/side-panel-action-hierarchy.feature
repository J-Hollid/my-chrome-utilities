Feature: Side panel action hierarchy

  Background:
    Given a repository for project my-chrome-utilities
    And the side panel is displayed

  # Side panel action hierarchy 001
  Scenario Outline: Side panel action hierarchy 001
    Given <view_name> is in state <view_state>
    When contextual action buttons are displayed
    Then <primary_count> action buttons use primary treatment
    And the primary action is <primary_action>
    And every other action uses secondary, quiet, or destructive treatment according to its meaning

    Examples:
      | view_name | view_state                         | primary_count | primary_action |
      | Live      | ready target selected               | 1             | Start testing  |
      | Library   | valid draft has unsaved changes     | 1             | Save revision  |
      | Library   | push review is ready to confirm     | 1             | Push purchase to Signal Shop |
      | Sessions  | browsing saved sessions             | 0             | none           |
      | Schemas   | browsing saved schemas              | 0             | none           |
      | Hotkeys   | browsing command bindings           | 0             | none           |

  # Side panel action hierarchy 002
  Scenario Outline: Side panel action hierarchy 002
    Given action <action_name> has meaning <action_meaning> in <view_name>
    When contextual action buttons are displayed
    Then <action_name> uses <action_variant> treatment
    And the treatment communicates meaning <action_meaning> consistently across views

    Examples:
      | view_name | action_name     | action_meaning | action_variant |
      | Live      | Copy payload    | supporting     | quiet          |
      | Live      | Browse all tabs | supporting     | secondary      |
      | Library   | Duplicate       | supporting     | secondary      |
      | Sessions  | Import session  | supporting     | secondary      |
      | Schemas   | Export          | supporting     | secondary      |
      | Hotkeys   | Load keymap     | supporting     | secondary      |
      | Live      | End testing     | consequential  | destructive    |
      | Library   | Discard draft   | consequential  | destructive    |

  # Side panel action hierarchy 003
  Scenario Outline: Side panel action hierarchy 003
    Given <view_name> has an action cluster containing <primary_action> and <destructive_action>
    When contextual action buttons are displayed
    Then <destructive_action> is separated from <primary_action> by spacing or a distinct action group
    And destructive treatment is identifiable without color alone

    Examples:
      | view_name | primary_action | destructive_action |
      | Live      | Pause capture  | End testing        |
      | Library   | Save revision  | Discard draft      |

  # Side panel action hierarchy 004
  Scenario Outline: Side panel action hierarchy 004
    Given action <action_name> is unavailable because <disabled_reason>
    When contextual action buttons are displayed
    Then <action_name> remains readable and is exposed as disabled
    And accessible text associated with <action_name> states <disabled_reason>
    And disabled styling preserves the action's primary, secondary, quiet, or destructive meaning

    Examples:
      | view_name | action_name   | disabled_reason                        |
      | Live      | Start testing | a ready target must be selected        |
      | Library   | Save revision | the draft has no unsaved changes       |
      | Library   | Push draft    | the JSON draft must be valid           |
