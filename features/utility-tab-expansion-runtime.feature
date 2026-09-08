# User-approved 2026-09-08: utility-tab-expansion-boundary.
# Utility tab expansion runtime 001 through 012
Feature: Utility tab expansion runtime

  Background:
    Given the installed production host registers a controlled Probe utility contribution
    And Probe owns separate state, styles, and a full-width extension page
    And the selected target is website tab Target A

  # Utility tab expansion runtime 001
  Scenario Outline: Utility tab expansion runtime 001
    Given the side panel is <width> CSS pixels wide
    When keyboard input selects the Probe tab and activates its launcher
    Then the Probe tab exposes its selected state and associated panel
    And the launcher opens the Probe extension page for Target A
    And no horizontal overflow is introduced in the side panel
    And no Data Layer project is required to open Probe

    Examples:
      | width |
      | 360   |
      | 800   |

  # Utility tab expansion runtime 002
  Scenario Outline: Utility tab expansion runtime 002
    Given Data Layer project startup is <startup_state>
    When keyboard input selects the Probe tab and activates its launcher
    Then Probe opens for Target A without waiting for Data Layer startup
    And the existing Data Layer startup status remains available in its workspace

    Examples:
      | startup_state          |
      | waiting for storage    |
      | failed during storage  |

  # Utility tab expansion runtime 003
  Scenario: Utility tab expansion runtime 003
    Given Data Layer is capturing events from Target A
    When the operator selects Probe and then returns to Data Layer
    Then Data Layer capture continues without loss or duplicate events
    And its project and session identities remain unchanged
    And global command access and Hotkeys remain usable

  # Utility tab expansion runtime 004
  Scenario: Utility tab expansion runtime 004
    Given Probe has a saved local draft and Data Layer has saved project data
    When the operator closes and reopens the side panel and Probe page
    Then Probe restores its own draft and the side panel restores its selected workspace
    And Data Layer project bytes remain unchanged
    And only one effective listener remains for each reopened host action

  # Utility tab expansion runtime 005
  Scenario: Utility tab expansion runtime 005
    Given Probe was opened for Target A
    When Target A closes and another website tab becomes active
    Then Probe reports that Target A is unavailable
    And Probe does not silently attach to the other website tab
    And closing Probe removes its own listeners without stopping another utility

  # Utility tab expansion runtime 006
  Scenario: Utility tab expansion runtime 006
    Given Probe is registered but has not been selected in this host session
    When Data Layer opens and its capture starts
    Then Probe page and private implementation have not loaded
    When keyboard input selects the Probe tab and activates its launcher
    Then the host loads Probe through its own HTML entry and entry module
    And Probe does not import Data Layer implementation or require its project

  # Utility tab expansion runtime 007
  Scenario Outline: Utility tab expansion runtime 007
    Given Probe has unsaved draft <draft>, filter <filter>, selected item <item>, and scroll position <scroll>
    And Data Layer is capturing events from Target A
    When the operator switches between Data Layer and Probe <switches> times while target events arrive
    Then Probe retains the same document and utility session identities
    And its unsaved draft <draft>, filter <filter>, selected item <item>, and scroll position <scroll> remain unchanged
    And Data Layer captures each arriving event once without changing its session identity
    And no hidden utility page is automatically unloaded

    Examples:
      | draft        | filter      | item | scroll | switches |
      | draft alpha  | changed     | A    | 240    | 4        |
      | draft beta   | all files   | B    | 480    | 8        |

  # Utility tab expansion runtime 008
  Scenario Outline: Utility tab expansion runtime 008
    Given Probe page contains <local_change>
    When Probe loads through the installed host
    Then the Data Layer and host control styles, identities, and actions remain unchanged
    And global navigation remains usable
    And an active Data Layer capture continues

    Examples:
      | local_change                     |
      | a broad button style             |
      | an element ID also used by Data Layer |
      | an ordinary startup exception    |

  # Utility tab expansion runtime 009
  Scenario: Utility tab expansion runtime 009
    Given Probe has one active controlled job for Target A
    When its embedded page opens its full-width workbench
    And the operator switches between Probe and Data Layer
    Then both Probe surfaces reference the same utility session and job owner
    And each controlled job event is processed once
    And opening the extension workbench does not change the bound website target

  # Utility tab expansion runtime 010
  Scenario: Utility tab expansion runtime 010
    Given Probe has an unsaved draft and an active controlled job
    When the operator requests an explicit Probe reset and cancels the unsaved-edit confirmation
    Then the draft and active job remain unchanged
    When the operator requests reset again and confirms discarding the draft
    Then only Probe owned state and work are reset
    And Data Layer capture and project state remain unchanged

  # Utility tab expansion runtime 011
  Scenario Outline: Utility tab expansion runtime 011
    Given Probe has an active session for Target A
    When the host receives a Probe action message with <mismatch>
    Then the action is rejected without changing either utility state or the bound target

    Examples:
      | mismatch                   |
      | an unexpected sender       |
      | an old utility session     |
      | a different target identity |

  # Utility tab expansion runtime 012
  Scenario: Utility tab expansion runtime 012
    Given Probe is visible with an active controlled job
    When the operator selects Data Layer
    Then Probe presentation becomes hidden while its page and active job remain alive
    When the operator returns to Probe and explicitly stops its job
    Then the job stops once while its working draft remains available
    And Data Layer work remains unchanged
