# mutation-stamp: sha256=d921392e0512639b04c4483403a03d18d296eff373c8889b6e190de4639e17ac
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T11:57:41.539048724Z","feature_name":"Data layer cross-tab reattachment runtime","feature_path":"features/data-layer-cross-tab-reattachment-runtime.feature","background_hash":"2661500b6c42322288e40ee4da81e917da735cf83d8304683b65b5111145cea7","implementation_hash":"sha256:e408a374d5ba11defd0d63b9ca6c122d705add33aeb73bdaa8d0c753a9cef5e9","scenarios":[{"index":0,"name":"Data layer cross-tab reattachment runtime 001","scenario_hash":"62f2a253fae09f2082499fe60af55fc4af1c6a89bfee0bf64d4b88e9d2434c80","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-14T11:57:41.539048724Z"},{"index":1,"name":"Data layer cross-tab reattachment runtime 002","scenario_hash":"bb7affd8dc459011ab848b5304ef71f6a97e04384b05e4830778f5f859b1c0b8","mutation_count":36,"result":{"Total":36,"Killed":36,"Survived":0,"Errors":0},"tested_at":"2026-07-14T11:57:41.539048724Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer cross-tab reattachment runtime

  Background:
    Given the built extension side panel is running without being closed or reopened
    And eligible targets <old_target> in tab <old_tab_id> and <new_target> in tab <new_tab_id> are registered
    And history array path <history_path> is ready in both targets
    And persisted-target recovery and target page reads advance only when explicitly completed
    And testing is attached only to <old_target> in tab <old_tab_id>

  # Data layer cross-tab reattachment runtime 001
  Scenario Outline: Data layer cross-tab reattachment runtime 001
    When <release_action> completes for <old_target>
    And the user selects <new_target>
    And Start testing is activated immediately in the same side panel instance
    Then a new testing session is pinned only to <new_target> in tab <new_tab_id>
    And <new_target> is the selected and attached target
    And <old_target> is neither selected nor attached
    And exactly one observer, page hook, and runtime listener are active for tab <new_tab_id>
    When <old_target> pushes <old_event> and <new_target> pushes <new_event>
    Then <new_event> is captured once with target tab <new_tab_id>
    And <old_event> is not captured by the new session

    Examples:
      | old_target | old_tab_id | new_target        | new_tab_id | history_path  | release_action                 | old_event | new_event |
      | Checkout   | 42         | Order confirmation | 73         | queue.history | End testing                    | old-view  | new-view  |
      | Checkout   | 42         | Order confirmation | 73         | queue.history | confirmed target detachment    | old-view  | new-view  |

  # Data layer cross-tab reattachment runtime 002
  Scenario Outline: Data layer cross-tab reattachment runtime 002
    Given persisted-target recovery for <old_target> is pending
    When <release_action> completes for <old_target>
    And the user selects <new_target>
    And Start testing for <new_target> and stale recovery complete in order <completion_order>
    Then a new testing session is pinned only to <new_target> in tab <new_tab_id>
    And stale recovery cannot replace the selected target, attached target, session target, or observer with <old_target>
    And exactly one observer, page hook, and runtime listener are active for tab <new_tab_id>
    When <old_target> pushes <old_event> and <new_target> pushes <new_event>
    Then <new_event> is captured once with target tab <new_tab_id>
    And <old_event> is not captured by the new session

    Examples:
      | old_target | old_tab_id | new_target         | new_tab_id | history_path  | release_action              | completion_order                         | old_event | new_event |
      | Checkout   | 42         | Order confirmation | 73         | queue.history | End testing                 | stale recovery then Start testing        | old-view  | new-view  |
      | Checkout   | 42         | Order confirmation | 73         | queue.history | End testing                 | Start testing then stale recovery        | old-view  | new-view  |
      | Checkout   | 42         | Order confirmation | 73         | queue.history | confirmed target detachment | stale recovery then Start testing        | old-view  | new-view  |
      | Checkout   | 42         | Order confirmation | 73         | queue.history | confirmed target detachment | Start testing then stale recovery        | old-view  | new-view  |
