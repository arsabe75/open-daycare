# Role-Based Navigation Specification

## Purpose

Ensures that authenticated users land on the correct side of the application based on their role and cannot navigate to routes intended for a different role.

## Requirements

### Requirement: Root path redirects by role
The system SHALL redirect an authenticated user who requests `/` to the entry point that matches their role, and an unauthenticated user to `/login`.

#### Scenario: Staff user lands on root
- **WHEN** a user with role `staff` requests `/`
- **THEN** the response is a redirect to `/panel`

#### Scenario: Admin user lands on root
- **WHEN** a user with role `admin` requests `/`
- **THEN** the response is a redirect to `/panel`

#### Scenario: Parent user lands on root
- **WHEN** a user with role `parent` requests `/`
- **THEN** the response is a redirect to `/familia`

#### Scenario: Guest lands on root
- **WHEN** a user without a session requests `/`
- **THEN** the response is a redirect to `/login`

### Requirement: Staff routes reject non-staff users
The system SHALL prevent users whose role is `parent` from accessing any route under `/panel/*` and redirect them to `/familia`.

#### Scenario: Parent requests staff kids page
- **WHEN** a user with role `parent` requests `/panel/kids`
- **THEN** the response is a redirect to `/familia`

### Requirement: Family routes reject non-parent users
The system SHALL prevent users whose role is `staff` or `admin` from accessing any route under `/familia/*` and redirect them to `/panel`.

#### Scenario: Staff requests family feed
- **WHEN** a user with role `staff` requests `/familia`
- **THEN** the response is a redirect to `/panel`
