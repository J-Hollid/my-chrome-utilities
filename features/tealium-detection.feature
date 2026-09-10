# User-approved 2026-09-09: tealium-live.
# Tealium detection 001 through 009; metadata follow-up approved 2026-09-10.
Feature: Tealium detection

  Background:
    Given Tealium Live has access to the selected website target

  # Tealium detection 001
  Scenario Outline: Tealium detection 001
    Given the page uses Tealium fixture <fixture>
    When a Tealium observation completes
    Then the detection state is Detected
    And the observed tag UID is <uid>
    And the actual runtime resource is <resource>
    And detection does not require a Tealium host name or standard publishing path

    Examples:
      | fixture              | uid | resource                                                       |
      | standard separate    | 21  | https://tags.tiqcdn.com/utag/shop/main/prod/utag.js               |
      | first-party separate | 32  | https://tags.shop.example/custom/utag.js?revision=7              |
      | renamed real bundle  | 115 | https://assets.shop.example/scripts/payload.js?revision=original |

  # Tealium detection 002
  Scenario Outline: Tealium detection 002
    Given the page has runtime evidence <evidence>
    When a Tealium observation completes
    Then the detection state is <state>
    And tag absence is not inferred from a runtime that could not be inspected

    Examples:
      | evidence                         | state               |
      | no Tealium evidence              | Not detected        |
      | unrelated global and named file  | Not detected        |
      | supported early tracking queue   | Initializing        |
      | supported initialized runtime    | Detected            |
      | recognized incompatible runtime  | Unsupported runtime |

  # Tealium detection 003
  Scenario Outline: Tealium detection 003
    Given the tag has evidence <evidence>
    When its inventory row is presented
    Then its code state is <state>
    And that row does not claim a send or successful vendor delivery

    Examples:
      | evidence                                | state           |
      | configuration without a sender          | Configured      |
      | registered sender with loading enabled  | Code registered |
      | registered sender with loading suppressed | Code registered |

  # Tealium detection 004
  Scenario Outline: Tealium detection 004
    Given fixture <fixture> contains duplicate tag UIDs
    When a Tealium observation completes
    Then <rows> distinct tag rows retain their document, frame, runtime, profile, and UID identities
    And repeated references to the same runtime do not create duplicate rows

    Examples:
      | fixture                          | rows |
      | one UID across two profiles      | 2    |
      | one UID across three frames      | 3    |
      | one runtime with two references  | 1    |

  # Tealium detection 005
  Scenario: Tealium detection 005
    Given one child frame is accessible and another child frame needs site access
    When a Tealium observation completes
    Then accessible frames contribute their tag rows
    And Live shows Partial coverage with the inaccessible frame and reason
    And an eligible frame exposes an exact-origin Request access action
    When the user grants that frame origin
    Then the next completed observation includes that frame without changing the target tab
    And no partial result is labelled as all tags on the page

  # Tealium detection 006
  Scenario: Tealium detection 006
    Given the page contains a blocked tag-script request and active tracking functions
    When Tealium observes the page and resolves tag metadata
    Then a script element or resource-timing entry alone does not establish registered code
    And tracking, tag-loading, consent, configuration-write, and send functions are not invoked by observation
    And existing page behavior and other utility work remain unchanged

  # Tealium detection 007
  Scenario Outline: Tealium detection 007
    Given metadata fixture <fixture> is observed
    When the tag inspector is displayed
    Then its visible tag name is <name>
    And absent account, environment, or version metadata is shown as unavailable
    And page-supplied strings are displayed as text

    Examples:
      | fixture                  | name                    |
      | named tag 21             | Analytics               |
      | unnamed tag 32           | Tag 32                  |
      | markup-like tag title    | <img src=x onerror=run> |

  # Tealium detection 008
  Scenario: Tealium detection 008
    Given Tealium Live is observing the current document
    When the page adds a supported tag and removes a previously observed frame
    Then the next completed observation adds the tag and removes current rows from the removed frame
    And unchanged rows retain their identities and order
    And an inaccessible frame is reported as incomplete coverage rather than a successful empty result

  # Tealium detection 009
  Scenario Outline: Tealium detection 009
    Given local runtime identity fixture <fixture> is observed without remote metadata
    When the tag inspector displays its account, profile, and publish identity
    Then those displayed values are <identity>
    And the runtime key and source identity remain unchanged
    And the environment and library version use only evidence from that runtime

    Examples:
      | fixture                         | identity                   |
      | docs runtime on a CNAME path     | tealium/docs/202504230113   |
      | second runtime on a custom path | shop/checkout/202609100600  |
      | conflicting hints with valid utid | shop/main/202609100601    |
      | absent runtime identity         | unavailable                |
