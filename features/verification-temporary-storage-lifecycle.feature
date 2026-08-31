# mutation-stamp: sha256=b35e1634553db17b2a65926e3baf424e390a3e5b3f1c717390feda76d1f03ac0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-31T13:01:30.981589966Z","feature_name":"Verification temporary storage lifecycle","feature_path":"features/verification-temporary-storage-lifecycle.feature","background_hash":"b1708c27c086f8759ae3f14e9c8e4661529bd557da14715accd82df09138f3cb","implementation_hash":"sha256:45efc7aad2b2f3fc81b9d54b39ae9d8466a0e9a23488120eba48a739b0d9325f","scenarios":[{"index":0,"name":"Verification temporary storage lifecycle 001","scenario_hash":"f546d01e3446c20bb5f760ffc8290b2330f9e7b2f4c557969e0284d8d9327861","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-31T13:01:30.981589966Z"},{"index":1,"name":"Verification temporary storage lifecycle 002","scenario_hash":"1fe908bc14b630d38eefc645179875fed9bded9e99798298973c29fb6c9de3eb","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-08-31T13:01:30.981589966Z"},{"index":2,"name":"Verification temporary storage lifecycle 003","scenario_hash":"73d8f2762464cd05f9e4ee919ed2f7fff2b0c365ba02dba27208da5382b894fd","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-31T13:01:30.981589966Z"},{"index":3,"name":"Verification temporary storage lifecycle 004","scenario_hash":"fa15cb963859b74445f643e8dc3442c136bc5ee2b29f46cf71d4ccba16bd7041","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-08-31T13:01:30.981589966Z"},{"index":4,"name":"Verification temporary storage lifecycle 005","scenario_hash":"16aa48a659a413951e1a61932ecefbfe42871fca4022288a1669a7391795f973","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-08-31T13:01:30.981589966Z"},{"index":5,"name":"Verification temporary storage lifecycle 006","scenario_hash":"58031c62f72675f8ea92b43b06990f3cd778bc09bc77ebc81dab611c92f3dad6","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-08-31T13:01:30.981589966Z"}]}
# acceptance-mutation-manifest-end

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
