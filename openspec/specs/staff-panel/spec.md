# Staff Panel Specification

## Purpose

Provides a dedicated workspace with its own navigation and layout for staff and admin users to manage the daycare.

## Requirements

### Requirement: Staff layout renders staff navigation
The system SHALL render a staff-specific sidebar in every staff-panel route, with links to Feed, Niños, Avisos and Mi cuenta.

#### Scenario: Staff views navigation
- **WHEN** a user with role `staff` opens `/panel`
- **THEN** the sidebar shows active item "Feed" and links "Niños", "Avisos", "Mi cuenta"

#### Scenario: Admin views navigation
- **WHEN** a user with role `admin` opens `/panel/kids`
- **THEN** the sidebar shows active item "Niños" and links "Feed", "Avisos", "Mi cuenta"

### Requirement: Staff panel exposes existing management pages
The system SHALL expose the current home feed, children list and child profile pages under `/panel/*`.

#### Scenario: Staff opens feed
- **WHEN** a user with role `staff` opens `/panel`
- **THEN** the feed with posts and the new-post composer is displayed

#### Scenario: Staff opens children list
- **WHEN** a user with role `staff` opens `/panel/kids`
- **THEN** the children list and search controls are displayed

#### Scenario: Staff opens child profile
- **WHEN** a user with role `staff` opens `/panel/kids/<id>`
- **THEN** the child profile details and parent-linking actions are displayed
