# AMET Alumni Network - CHANGELOG

## [Unreleased]

### Fixed
- Alumni Directory UI and data binding:
  - Fixed Profile Card formatting issues in both grid and list views
  - Implemented proper job title/company format ("Title at Company") with privacy checks
  - Fixed industry/department text display with privacy checks
  - Fixed location formatting to show "City, Country" when available
  - Improved education display by merging degree & department from most recent education record
  - Added proper overflow indicators for skills (showing "+N more" when needed)
  - Applied consistent privacy checks across all profile card fields

- Event Management UI and data binding:
  - Fixed detailed description and organizer information binding in Edit Event form
  - Improved venue/location display in Events List for different event types (in-person, virtual, hybrid)
  - Fixed Calendar view navigation and view switching issues:
    - Added error handling for date navigation (prev/next/today)
    - Fixed view switching between month/week/day views
    - Improved date validation with fallback for invalid dates
    - Enhanced location display consistency with list and grid views
  - Fixed event creation error by adding missing event_groups table
