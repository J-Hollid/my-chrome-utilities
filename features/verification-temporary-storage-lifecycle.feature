Feature: Verification temporary storage lifecycle

  Background:
    Given one project-local SwarmForge verification run owns its temporary paths

  # Verification temporary storage lifecycle 001
  Scenario Outline: Verification temporary storage lifecycle 001
    Given the run creates <temporary_data>
    When the data is no longer used by a live process
    And required evidence has reached project-local durable storage
    Then the run removes the temporary data
    And no retained file, link, lease, or directory for that data remains in /tmp

    Examples:
      | temporary_data                         |
      | task system files                      |
      | Chrome profiles and Chrome helper data |
      | package and receipt staging copies     |
      | run locks and atomic-write stages      |

  # Verification temporary storage lifecycle 002
  Scenario Outline: Verification temporary storage lifecycle 002
    Given the run reaches <outcome>
    When its cleanup phase starts
    Then every owned temporary path is removed after its durable disposition is confirmed
    And independent temporary paths are still cleaned when one cleanup action fails
    And any cleanup failure reports the run, owner, path, and reason

    Examples:
      | outcome                              |
      | successful completion                |
      | recorded verification failure        |
      | cancellation with a durable receipt  |

  # Verification temporary storage lifecycle 003
  Scenario Outline: Verification temporary storage lifecycle 003
    Given an owned temporary path has <protection>
    When cleanup evaluates that path
    Then the path is not removed
    And its live owner or incomplete durable disposition is reported

    Examples:
      | protection                              |
      | a live owning process                   |
      | an active verification lease            |
      | evidence not yet copied to durable state |
      | an incident record not yet committed    |

  # Verification temporary storage lifecycle 004
  Scenario Outline: Verification temporary storage lifecycle 004
    Given startup recovery finds an owned temporary path whose owner is dead
    When its durable disposition is <disposition>
    Then recovery produces <result>
    And recovery never removes an unowned /tmp path

    Examples:
      | disposition                           | result                                                        |
      | complete                              | remove the path and its stale ownership record                 |
      | incomplete but safely recoverable     | complete durable recovery and then remove the path             |
      | incomplete and not safely recoverable | retain the path and report one exact recovery blocker          |

  # Verification temporary storage lifecycle 005
  Scenario Outline: Verification temporary storage lifecycle 005
    Given a planned verification operation requires <required_space>
    And temporary storage has <available_space> after its safety reserve
    When capacity preflight runs
    Then it produces <launch_result>
    And no task starts when capacity is insufficient

    Examples:
      | required_space | available_space | launch_result                                      |
      | 2 GiB          | 3 GiB           | permit the planned temporary operation             |
      | 2 GiB          | 600 MiB         | stop before execution with the required byte count |

  # Verification temporary storage lifecycle 006
  Scenario Outline: Verification temporary storage lifecycle 006
    Given a SwarmForge role creates <workspace_kind> for one task
    When the task reaches <task_disposition>
    Then the role removes the inactive temporary workspace and its Git administration record
    And an active workspace or a workspace with an incomplete evidence disposition is preserved
    And role workspaces are created below the project .worktrees directory rather than /tmp

    Examples:
      | workspace_kind             | task_disposition                 |
      | review worktree            | successful feature integration  |
      | exported review repository | accepted or rejected handoff     |
      | diagnostic repository copy | recorded diagnostic completion  |
