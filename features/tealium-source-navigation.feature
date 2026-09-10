# mutation-stamp: sha256=dd763ff1c0d3684af5838ed365169e7974cf29d52fde5795347840a2899c3518
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-10T12:07:42.761066975Z","feature_name":"Tealium source navigation","feature_path":"features/tealium-source-navigation.feature","background_hash":"8446ff30c36838872dc20fc9c6013ee66bdf3bfe01a1060926a5ace4ada4c132","implementation_hash":"15e411390809428880731138c35f849d9b92a9a7","scenarios":[{"index":0,"name":"Tealium source navigation 001","scenario_hash":"44e6f5c868c06b1b48bd66700789095ebf4f52c4294aa53708b1ba626ec83888","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-09-10T12:07:42.761066975Z"},{"index":1,"name":"Tealium source navigation 002","scenario_hash":"991adba36f74927f80a146966c0b447f4972009c98dad389955914c570ba6502","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-09-10T12:07:42.761066975Z"},{"index":2,"name":"Tealium source navigation 003","scenario_hash":"623fc3df3529fb482cbcb55eac174ebcededb06d5dfbb4b4fc64578ca7d61936","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-09-10T12:07:42.761066975Z"},{"index":3,"name":"Tealium source navigation 004","scenario_hash":"51dd89e318c9e25173ca88f167a347fb5696b85af445a4e490ef6d386602e707","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-10T12:07:42.761066975Z"},{"index":4,"name":"Tealium source navigation 005","scenario_hash":"3754c732f57b0321edc063547156f3b61ea37d4faa114bb9bb4dc7ca0cb528af","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-09-10T12:07:42.761066975Z"},{"index":7,"name":"Tealium source navigation 008","scenario_hash":"87a0ebcb0aadc628c6a40112628a328708c18f6faf5654f3b111a05e3f44648a","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-09-10T12:07:42.761066975Z"},{"index":8,"name":"Tealium source navigation 009","scenario_hash":"ea33b386083a5912e4723d06b419ad04fb407dc693aa87582a2b70754233ee25","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-09-10T12:07:42.761066975Z"},{"index":9,"name":"Tealium source navigation 010","scenario_hash":"e4d9f1bc4050166fc4d3c3617efad829acbd226e2f40de367adec16c518b0175","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-10T12:07:42.761066975Z"}]}
# acceptance-mutation-manifest-end

# User-approved 2026-09-09: tealium-live.
# Tealium source navigation 001 through 010; source-target follow-up approved 2026-09-10.
Feature: Tealium source navigation

  Background:
    Given a Tealium Live tag is selected in the current observation session

  # Tealium source navigation 001
  Scenario Outline: Tealium source navigation 001
    Given source fixture <fixture> belongs to the selected tag
    And DevTools is connected to the bound website tab
    When the user chooses Go to u.send
    Then DevTools opens <resource> at <location>
    And the actual host, path, and query string are retained

    Examples:
      | fixture               | resource                                                        | location          |
      | separate tag 21       | https://tags.shop.example/custom/utag.21.js?revision=7            | file start        |
      | custom source tag 52  | https://assets.shop.example/vendor/metrics.js?version=52         | file start        |
      | renamed real bundle   | https://assets.shop.example/scripts/payload.js?revision=original | unique tag code   |

  # Tealium source navigation 002
  Scenario Outline: Tealium source navigation 002
    Given the DevTools connection is <connection>
    When the inspector source action is presented
    Then Go to u.send is <availability>
    And source selection remains intact
    And an unavailable connection explains how to open DevTools for the bound website tab

    Examples:
      | connection            | availability |
      | closed                | unavailable  |
      | another website tab   | unavailable  |
      | matching website tab  | available    |

  # Tealium source navigation 003
  Scenario Outline: Tealium source navigation 003
    Given a pending source action has <mismatch>
    When the bridge validates the action before opening a resource
    Then the mismatched action is rejected with feedback
    And no resource is opened for a different target, document, frame, profile, or tag

    Examples:
      | mismatch                        |
      | an old session identity         |
      | a same-URL replacement document |
      | a replaced frame                |
      | a different target tab          |
      | an unexpected sender            |
      | a removed tag                   |

  # Tealium source navigation 004
  Scenario Outline: Tealium source navigation 004
    Given source resolution yields <evidence>
    When the source action is evaluated
    Then Live applies <outcome>
    And the resolution limit remains visible in the inspector

    Examples:
      | evidence                                    | outcome                                   |
      | one containing file and no unique location   | allow opening that file at its start      |
      | multiple possible containing files          | disable opening and report ambiguity      |
      | no available containing resource            | disable opening and report unresolved     |
      | unique function in a bundled resource       | open that function in its containing file |

  # Tealium source navigation 005
  Scenario Outline: Tealium source navigation 005
    Given source action failure <failure> occurs
    When the action completes
    Then Live reports the failure without clearing the selected inspector or stopping observation
    And another attempt must use current connection and document evidence

    Examples:
      | failure                   |
      | DevTools disconnects      |
      | source loading fails      |
      | resource becomes stale    |

  # Tealium source navigation 006
  Scenario: Tealium source navigation 006
    Given the selected tag has a uniquely resolved actual source URL
    When the user chooses Copy source URL
    Then the clipboard receives that exact URL with visible success or failure feedback
    And copying does not fetch, execute, replace, or load a page script
    And an unresolved source has no enabled copy action

  # Tealium source navigation 007
  Scenario: Tealium source navigation 007
    Given the retained page and full-width page share one observation session
    When either surface requests source inspection
    Then the bridge uses the same pinned website target and validates the requesting session
    And the extension page itself is not selected as the inspected website
    And no debugger permission, automatic DevTools launch, or Tealium account access is required

  # Tealium source navigation 008
  Scenario Outline: Tealium source navigation 008
    Given source identity fixture <fixture> contains repeated send code
    When the resolver uses the observed tag URL and registered extension evidence
    Then source opening has outcome <outcome>
    And repeated code alone does not override a verified containing file
    And no unverified file or arbitrary duplicate is reported as an exact match

    Examples:
      | fixture                                  | outcome                                  |
      | two copies inside one known bundle       | allow file start with uncertain location |
      | known separate script and another copy   | allow the observed tag script            |
      | two files with one matching extend array | allow the matching file                  |
      | two files with shared send and extend    | report ambiguous file and disable opening |
      | unique extension beside two unbound sends | allow file start with uncertain location |

  # Tealium source navigation 009
  Scenario Outline: Tealium source navigation 009
    Given both code destinations are verified for the current registered tag
    When the user chooses Tealium source action <action>
    Then DevTools selects <destination> in the verified containing file
    And the action retains the selected tag and its metadata
    And neither send nor extension functions are executed by inspection

    Examples:
      | action         | destination                       |
      | Go to u.send   | the selected tag's send definition |
      | Go to u.extend | the selected tag's extension-array definition |

  # Tealium source navigation 010
  Scenario Outline: Tealium source navigation 010
    Given the selected tag has extension evidence <evidence>
    When its source actions are displayed
    Then Go to u.extend has outcome <outcome>
    And Go to u.send keeps its independent availability

    Examples:
      | evidence                             | outcome                                  |
      | absent array                         | disabled with u.extend unavailable       |
      | unreadable array                     | disabled with u.extend unavailable       |
      | empty array with known definition    | enabled at the empty array definition    |
      | readable array with only a known file | enabled at file start with uncertain location |
