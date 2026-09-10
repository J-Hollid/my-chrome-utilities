# User-approved 2026-09-09: tealium-live.
# Tealium Live runtime 001 through 012; metadata follow-up approved 2026-09-10.
Feature: Tealium Live runtime

  Background:
    Given the packaged extension runs Tealium in the installed utility host
    And the website fixtures expose explicit observation and lifecycle acknowledgements

  # Tealium Live runtime 001
  Scenario: Tealium Live runtime 001
    Given Data Layer startup fails while Hotkeys remains available
    When keyboard input selects the new Tealium utility tab
    Then the native side panel displays Tealium Live and usable target setup
    And the tab has selected semantics and its own associated page
    And the existing Data Layer error remains available in its workspace

  # Tealium Live runtime 002
  Scenario Outline: Tealium Live runtime 002
    Given Chrome target access fixture <fixture> is active
    When the operator follows Tealium Live setup
    Then installed controls show <result>
    And browser calls prove that reads use only applicable grants
    And a permission request names only the origin chosen by the user

    Examples:
      | fixture                          | result                       |
      | successful activeTab probe       | Start observation enabled    |
      | failed probe followed by grant   | same-target readiness restored |
      | failed probe followed by decline | Permission required          |

  # Tealium Live runtime 003
  Scenario: Tealium Live runtime 003
    Given the production observer has a pending read in an active session
    When the operator pauses and that read later completes
    Then the paused inventory is unchanged
    When the operator resumes and ends observation through installed controls
    Then a fresh read uses the same pinned target before owned work is removed
    And completion after End cannot change the retained final snapshot
    And at most one observation job is active for the session

  # Tealium Live runtime 004
  Scenario: Tealium Live runtime 004
    Given a selected tag is attached to the current website document
    And a read is pending for that document
    When the actual page reloads at the same URL
    Then the new document identity invalidates the old rows and source selection
    And a late old-document result cannot replace the new inventory
    And the same rejection applies when a child frame is replaced at the same URL

  # Tealium Live runtime 005
  Scenario: Tealium Live runtime 005
    Given Tealium and Data Layer are observing the selected website
    When the operator hides Tealium, the page registers a late tag, and the operator opens Tealium full-width
    Then the production host retains the original Tealium document and session
    And the next completed observation includes the late tag
    And the full-width page reports the same target and no second observation owner
    And Pause from that page reaches the retained owner once
    And Data Layer capture continues without missing or duplicating controlled events

  # Tealium Live runtime 006
  Scenario: Tealium Live runtime 006
    Given a long tag list has active filters, a selected row, and recorded focus and scroll positions
    When a new observation adds a matching tag
    Then existing focused controls and row identities are retained
    And the selected inspector and recorded scroll positions remain stable
    When the operator uses Back to tags and then Clear filters
    Then list selection focus returns correctly and the displayed counts match rendered rows

  # Tealium Live runtime 007
  Scenario Outline: Tealium Live runtime 007
    Given the measured Live content width is <width> CSS pixels
    And long tag metadata and URLs overflow the selected inspector vertically
    When installed geometry and computed visibility are inspected
    Then <layout> is rendered with no horizontal document overflow or outer wrapper scrollbar
    And a visible wide inspector has at least 360 CSS pixels of width
    And removing the selection leaves no empty inspector column

    Examples:
      | width | layout                         |
      | 360   | one inspector pane             |
      | 520   | one inspector pane             |
      | 720   | list and inspector panes       |
      | 900   | list and inspector panes       |

  # Tealium Live runtime 008
  Scenario: Tealium Live runtime 008
    Given a selected tag is attached to the current website document
    When the website changes its URL without replacing that document
    Then Live updates page context while retaining the valid selection
    When the expanded page closes and later the owner host closes
    Then expanded-page closure leaves observation active
    And owner-host closure removes Tealium-owned work without stopping another utility

  # Tealium Live runtime 009
  Scenario Outline: Tealium Live runtime 009
    Given the session is <prior_state> on its pinned website target
    When actual target lifecycle event <event> occurs
    Then Live shows <result> and prevents further unauthorized page reads
    And it does not select another tab or accept a late result
    And access recovery cannot resume a paused or ended session automatically

    Examples:
      | prior_state | event                   | result              |
      | Observing   | website tab closes      | Target closed       |
      | Observing   | required grant revoked  | Permission required |
      | Paused      | navigation loses access | Permission required |

  # Tealium Live runtime 010
  Scenario Outline: Tealium Live runtime 010
    Given the metadata host grant exists and the response is held by a controlled network fixture
    When the operator starts Live in the <surface> surface without requesting tag names
    Then the actual list renders local names and UIDs before the response completes
    And the production extension sends one request for the observed profile version
    And the request omits credentials, page URL, referrer, and data-layer values
    When the fixture releases valid names and a markup-like title
    Then matching rendered rows show the supplied names as literal text
    And the selected row keeps its key, focus, and source action
    And existing name filters use the enriched names without changing UID order

    Examples:
      | surface           |
      | native side panel |
      | full-width        |

  # Tealium Live runtime 011
  Scenario Outline: Tealium Live runtime 011
    Given the installed metadata boundary has condition <condition>
    When the operator starts Live and follows the available metadata recovery action
    Then browser-observed retrieval has result <result>
    And fallback names remain visible until a valid response supplies matching names
    And the observation target and source inspection remain usable

    Examples:
      | condition                  | result                              |
      | missing grant then consent | exact-host grant followed by lookup |
      | missing grant then refusal | no lookup or repeated prompt        |
      | empty successful response  | Names unavailable with optional retry |
      | failed request then retry  | one new request resolves current names |

  # Tealium Live runtime 012
  Scenario: Tealium Live runtime 012
    Given one production metadata request is held for the selected document
    When multiple observations finish and Tealium is hidden and expanded
    Then browser request counts show no duplicate lookup for that profile version
    When the actual document reloads and the old response is released
    Then the old response does not rename replacement-document rows
    And only current document and session results can update the visible inspector
    When observation ends with a current response pending
    Then releasing that response cannot change the retained final snapshot
