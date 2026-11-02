# UNIT Extraterrestrial Incident Report

An interactive incident reporting interface inspired by UNIT from *Doctor Who*.

This project recreates a fictional global system for reporting extraterrestrial activity, temporal disturbances, unidentified technology and other unexplained phenomena.

## Live Demo

The public version is a static frontend demonstration hosted with GitHub Pages.

**Live site:** [LINK](https://maria-d-soares-dev.github.io/unit-incident-report-demo/).

> The public demonstration does not transmit or permanently store completed reports. All transmission behavior is simulated in the browser.


## Preview

### Incident Report Form: Dark Theme

assets/dark-theme.png

### Incident Report Form: Light Theme

assets/light-theme.png

### Responsive Mobile View

assets/mobile-view.png

### Automated Threat Assessment

assets/threat-assessment.png

### Report Review

assets/report-review.png

### Simulated Report Reference

assets/report-reference-code.png

### Full-Stack Incident Dashboard

assets/incident-dashboard.png

> The incident dashboard belongs to the private local full-stack version,
> which uses PHP and PostgreSQL. The public GitHub Pages deployment contains
> only the interactive frontend demonstration.

## Frontend Features

- Responsive five-step incident report form
- Dark and light themes
- Theme preference saved in the browser
- Conditional questions based on incident type
- Missing-person incident fields
- Temporal-disturbance fields
- Possible Doctor involvement section
- Conditional evidence details
- International telephone-number validation
- Date limits and form validation
- Character counters for longer responses
- Chronological incident timeline editor
- Automated threat assessment
- Selected and suggested threat-level comparison
- Local automatic drafts
- Manual draft saving and deletion
- Draft restoration after reopening the page
- Complete report preview
- Bootstrap review modal
- Simulated report transmission
- Fictional UNIT reference generation
- Accessible labels, status messages and keyboard navigation
- Responsive layouts for desktop, tablet and mobile devices
- Reduced-motion support

## Technologies

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Web Storage API
- GitHub Pages


## How the Public Demo Works

Unfinished reports can be stored locally in the visitor's browser using the Web Storage API.

When a visitor confirms transmission:

1. The browser validates the form.
2. JavaScript creates the complete fictional report object.
3. The interface simulates a short transmission delay.
4. No network request is made.
5. No completed report is sent to a server.
6. No completed report is stored in a database.
7. A fictional UNIT report reference is displayed.

Example reference:

```text
UNIT-20261102-HIGH-A1B2C3
```

## Threat Assessment

The demonstration calculates a suggested threat level from three categories:

- Incident type
- Possible Doctor involvement
- Available evidence

The current scoring thresholds are:

| Score | Suggested threat |
|---:|---|
| 0 to 2 | Low |
| 3 to 5 | Moderate |
| 6 to 8 | High |
| 9 or more | Global |

The selected threat level and calculated suggestion are shown separately so the reporter's assessment can be compared with the automated result.

## Local Draft Storage

Draft information remains only in the browser where it was created. Deleting browser data may remove the saved draft.

## Full-Stack Local Version

A separate private local version of this project includes a working backend and database implementation.

The full-stack version includes:

- PHP 8
- PostgreSQL
- PDO database connections
- Server-side JSON validation
- Prepared SQL statements
- Restricted PostgreSQL application credentials
- Complete report storage using relational columns and JSONB
- Five accepted reports per IP address within a rolling 24-hour period
- PostgreSQL advisory locking to prevent simultaneous requests from bypassing the limit
- HTTP error handling
- Request-size restrictions
- Unique report references
- Read-only local administration dashboard
- Database statistics
- Search by reference, location or witness name
- Filters for incident type, threat level and report status
- Localhost-only dashboard access

The backend source code, database credentials and stored report data are intentionally excluded from this public repository.


### Main Files

- `index.html`: form structure, conditional sections and Bootstrap modals
- `styles/style.css`: themes, responsive layouts, form styling and accessibility states
- `scripts/main.js`: validation, navigation, draft storage, timeline behavior, threat scoring, report review and simulated transmission
- `README.md`: project documentation


## Privacy and Safety

This repository is a portfolio demonstration.

- Do not enter real personal information.
- Do not enter real emergency information.
- Do not enter classified or confidential information.
- Completed reports are not transmitted.
- Completed reports are not permanently stored.
- Unfinished drafts may be stored locally in the browser.
- The public demonstration does not contact UNIT, emergency services or any real organisation.

## Accessibility

The interface includes:

- Associated labels for form controls
- Keyboard-accessible buttons
- Visible focus indicators
- ARIA labels for grouped controls
- Live status messages
- Error messages linked to validation behavior
- Progress information for the five-step form
- Reduced-motion support
- Responsive layouts
- Theme-aware form controls and Bootstrap modals


## Important Notice

This is an unofficial fan project created for educational and portfolio purposes.

*Doctor Who*, UNIT and related concepts belong to their respective rights holders. This project is not affiliated with or endorsed by the BBC.

All names, reports, references and incidents entered into the demonstration should be fictional.
