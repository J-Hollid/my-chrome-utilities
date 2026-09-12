# mutation-stamp: sha256=5ea0f33ee8ca8777c9a0924f62f055d4bc7e55fc603841c6c60c0b02a4e3b908
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-12T06:06:05.971992533Z","feature_name":"Tealium connection recovery runtime","feature_path":"features/tealium-connection-recovery-runtime.feature","background_hash":"9b20ae90897521929ab54abf7c655d7824c1a204b1856f632738241044e145f0","implementation_hash":"sha256:a422f9ea9de086dd8a34176f6aa139c85024a68b630a334b9ccf5c3db2a4f5ae","scenarios":[{"index":0,"name":"Tealium connection recovery runtime 001","scenario_hash":"18f7f081c42dd3b33e7f3f91572f002ed0acb753954de8892d8f67c579e7acff","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-09-12T06:03:13.040378200Z"},{"index":2,"name":"Tealium connection recovery runtime 003","scenario_hash":"d37cdfcd687a4a64b3266f126e5201008f9fd4864f22bb524e70117f65193cf6","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-09-12T06:03:13.040378200Z"}]}
# acceptance-mutation-manifest-end

# Tealium connection recovery runtime 001 through 003; user resumed implementation on 2026-09-12.
Feature: Tealium connection recovery runtime

  Background:
    Given the packaged extension runs a local Tealium fixture with DevTools open for its bound website

  # Tealium connection recovery runtime 001
  Scenario Outline: Tealium connection recovery runtime 001
    Given Live has no selected tag and its worker debugger is detached
    When eight real worker shutdowns each complete an accepted quiet reconnection
    And the operator then selects a tag and requests its source from <surface>
    Then the actual Sources editor shows the verified URL and nonempty tag source
    And the retained owner keeps the same website and observation session
    And no keepalive traffic or extension debugger permission is added

    Examples:
      | surface           |
      | native side panel |
      | full-width page   |

  # Tealium connection recovery runtime 002
  Scenario: Tealium connection recovery runtime 002
    Given the production transport has a previously confirmed connection
    When controlled transport failures prevent confirmation on every reconnect
    Then its six retry delays are 500, 1000, 2000, 4000, 8000, and 8000 milliseconds
    And the installed feedback changes from Reconnecting to DevTools... to Cannot connect to DevTools for this website.
    And another automatic attempt is not scheduled after exhaustion

  # Tealium connection recovery runtime 003
  Scenario Outline: Tealium connection recovery runtime 003
    Given an installed <action> request is pending for the selected tag
    When the worker stops and its bridge reconnects
    Then the pending request opens no source
    And a new explicit action revalidates the current tag and opens only its verified destination

    Examples:
      | action         |
      | Go to u.send   |
      | Go to u.extend |
