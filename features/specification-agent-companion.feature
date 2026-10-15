Feature: Review specification drafts from a Codex companion
  The analyst controls which definitions are valid and which changes are saved.
  Agent output is a proposal. It is not published or counted as runtime proof.

  Scenario: Connect to the local or remote companion
    Given the companion uses the installed Codex login in WSL
    When the analyst supplies a localhost HTTP or Tailscale HTTPS endpoint and token
    Then Studio requests access to that host and shows the account state
    And requests without the token are rejected
    And the companion permits only its specification read tools

  Scenario: Draft a Page, Event, or Property Set
    Given a project with Shared Profiles and selected valid properties
    When the analyst describes a new definition
    Then the agent proposes reuse or explicit changes with reasons
    And Studio rejects references to excluded definitions or properties
    And unanswered item questions prevent an accepted change from being applied

  Scenario: Draft events from a mock flow
    Given a Flow with Page frames, event occurrences, and screenshots
    When the analyst selects the Flow as context
    Then the companion receives its graph and referenced screenshot bodies
    And proposed occurrences refer to valid Pages and Events
    And screenshot evidence does not count as proof of a runtime trigger

  Scenario: Import an existing Excel specification
    Given an Excel workbook and a stable import source key
    When the companion reads the workbook through MCP
    Then it must read all populated source rows before it completes the proposal
    And the proposal reports mapped, excluded, or unresolved source ranges
    And matching includes prior imports, equal records, names, and similar names
    And duplicate creation is blocked within the proposal and across imports
    And conflicting project and source edits require resolution

  Scenario: Revise a proposal
    Given accepted, rejected, and pending review items
    When the analyst sends feedback
    Then accepted, rejected, and applied items keep their saved content
    And changed pending items require a new review
    And a changed project requires a refreshed proposal context
    And task and review state survive a browser reload

  Scenario: Save accepted changes
    Given an unchanged project and an accepted dependency set
    When the analyst applies the accepted changes
    Then Studio saves them as one draft transaction
    And the save is confirmed in durable history
    And other proposal items remain unapplied

  Scenario: Convert an Excel specification to an export template
    When the analyst requests template conversion
    Then the companion produces a validated guided Excel template
    And supported cell styles, repeat areas, and bindings are retained
    And layout limits are shown for review
    And the analyst can preview with project data and download the workbook
    And an accepted template and its body are saved in the project template library

  Scenario: Recover a stopped companion
    Given a saved task interrupted by a service restart
    When the companion starts again
    Then the task reports the interruption and retains its review context
    And a revision can resume work without applying duplicate changes
