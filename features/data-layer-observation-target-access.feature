Feature: Data layer observation target access

  Background:
    Given a repository for project <project_name>
    And the observation target picker is displayed

  # Data layer observation target access 001
  Scenario Outline: Data layer observation target access 001
    Given the extension was invoked by the user on active page <page_url>
    When that invocation registers its tab as an observation target
    Then the target records the invoking tab id, window id, title, <page_url>, origin, and temporary access state
    And the target can be checked and attached while its active-tab access remains valid
    And no permission prompt is shown solely to use the valid active-tab grant

    Examples:
      | project_name         | page_url                           |
      | my-chrome-utilities | https://shop.example.test/checkout |

  # Data layer observation target access 002
  Scenario Outline: Data layer observation target access 002
    Given permission to browse open-tab metadata is <permission_state>
    When the user chooses <discovery_action>
    Then the optional tab-metadata permission is requested from that user action when needed
    And result <discovery_result> is explained in the picker
    And declining the permission does not remove registered or recent targets

    Examples:
      | project_name         | permission_state | discovery_action | discovery_result                         |
      | my-chrome-utilities | not granted      | Browse all tabs  | All open tabs become available on grant  |
      | my-chrome-utilities | denied           | Browse all tabs  | Registered targets remain available      |

  # Data layer observation target access 003
  Scenario Outline: Data layer observation target access 003
    Given optional tab-metadata permission is granted
    When open target candidates are discovered
    Then titles and URLs are read only to present the target picker
    And restricted and unsupported schemes are identified before attachment is attempted
    And the complete open-tab inventory is not persisted as observation history
    And refreshing discovery removes tabs that have closed

    Examples:
      | project_name         |
      | my-chrome-utilities |

  # Data layer observation target access 004
  Scenario Outline: Data layer observation target access 004
    Given selected target <page_title> at origin <origin> requires site access
    When the user chooses Request access for <page_title>
    Then access is requested only for origin <origin> from that user action
    And the page is not probed before access is granted
    When access is granted
    Then target <page_title> is checked against the configured history path
    And another origin is not granted implicitly

    Examples:
      | project_name         | page_title | origin                    |
      | my-chrome-utilities | Checkout   | https://shop.example.test |

  # Data layer observation target access 005
  Scenario Outline: Data layer observation target access 005
    Given selected target <page_title> requires site access
    When the user declines the access request
    Then target <page_title> remains selected with state <access_state>
    And observation does not start on <page_title> or another tab
    And the extension does not repeat the permission prompt without another explicit user action

    Examples:
      | project_name         | page_title | access_state        |
      | my-chrome-utilities | Checkout   | Permission required |

  # Data layer observation target access 006
  Scenario Outline: Data layer observation target access 006
    Given candidate page <page_title> uses URL scheme <url_scheme>
    When target eligibility is evaluated
    Then the page has target state <target_state>
    And explanation <explanation> is shown
    And no script injection is attempted

    Examples:
      | project_name         | page_title       | url_scheme        | target_state | explanation                        |
      | my-chrome-utilities | Extensions       | chrome            | Restricted   | Chrome pages cannot be observed    |
      | my-chrome-utilities | Extension panel  | chrome-extension  | Restricted   | Extension pages cannot be observed |
      | my-chrome-utilities | New tab          | chrome             | Restricted   | Chrome pages cannot be observed    |

  # Data layer observation target access 007
  Scenario Outline: Data layer observation target access 007
    Given target resolution fails with condition <failure_condition>
    When data layer testing is requested
    Then no testing session is created with a fabricated tab id
    And no session or timeline URL uses the extension side-panel URL
    And target state <target_state> and recovery action <recovery_action> are shown

    Examples:
      | project_name         | failure_condition        | target_state       | recovery_action  |
      | my-chrome-utilities | tab metadata unavailable | Selection required | Choose target    |
      | my-chrome-utilities | script injection denied  | Permission required | Request access  |
      | my-chrome-utilities | tab closed                | Closed             | Choose target    |

  # Data layer observation target access 008
  Scenario Outline: Data layer observation target access 008
    Given persistent site access for origin <origin> was granted through observation target selection
    When the user removes access for <origin> from target settings
    Then the permission is revoked for <origin>
    And another granted origin remains unchanged
    And an attached observer on <origin> is detached before further page content is read

    Examples:
      | project_name         | origin                    |
      | my-chrome-utilities | https://shop.example.test |
