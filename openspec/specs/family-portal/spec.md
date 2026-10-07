# Family Portal Specification

## Purpose

Provides a dedicated area with its own navigation and layout for parents to follow their children's activity.

## Requirements

### Requirement: Family layout renders parent navigation
The system SHALL render a parent-specific sidebar in every family-portal route, with links to Feed, Resumen del día and Mi cuenta.

#### Scenario: Parent views navigation
- **WHEN** a user with role `parent` opens `/familia`
- **THEN** the sidebar shows active item "Feed" and links "Resumen del día", "Mi cuenta"

### Requirement: Family portal exposes a working feed page
The system SHALL render a feed page at `/familia` for authenticated parents, with no dead-end redirect.

#### Scenario: Parent opens family feed
- **WHEN** a user with role `parent` opens `/familia`
- **THEN** a page is displayed with the application title "TU FAMILIA" and a feed of posts

### Requirement: Family portal hides staff-only actions
The system SHALL not expose the new-post composer or children-management actions to users in the family portal.

#### Scenario: Parent sees read-only feed
- **WHEN** a user with role `parent` opens `/familia`
- **THEN** no button or control for creating posts or managing children is visible
