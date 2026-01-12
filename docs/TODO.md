# TODO & FIXME Priorities

**Last Updated:** 2025-01-12  
**Total Items:** 8

This document tracks all TODO and FIXME comments found in the codebase, categorized by priority.

## Priority Definitions

- **P0 (Critical):** Must be fixed before production release
- **P1 (Important):** Should be fixed soon, impacts functionality or maintainability
- **P2 (Nice to have):** Improvements that would be beneficial
- **P3 (Future enhancement):** Long-term improvements or features

---

## P0: Critical (Must Fix)

_No critical items found_

---

## P1: Important (Should Fix)

1. **`packages/ui/src/components/metadata-fields/MetadataField.tsx:72`**
   - Comment: `//TODO: change that`
   - Context: Needs investigation to understand what needs to be changed
   - Action: Review code context and implement fix

2. **`packages/ui/src/components/metadata-fields/MetadataUpdateField.tsx:267`**
   - Comment: `//TODO: WIP _>`
   - Context: Work in progress - needs completion
   - Action: Complete the implementation

3. **`packages/ui/src/components/metadata-fields/MetadataUpdateField.tsx:365`**
   - Comment: `//TODO: change that`
   - Context: Needs investigation to understand what needs to be changed
   - Action: Review code context and implement fix

4. **`apps/management-ui-series/src/columns.tsx:177`**
   - Comment: `// TODO: set it with backend values`
   - Context: `enableSorting: false` should be set with backend values
   - Action: Implement backend integration for sorting configuration

---

## P2: Nice to Have

1. **`packages/ui/src/components/datatable/data-table-view-options.tsx:52`**
   - Comment: `// TODO: This is a workaround to prevent the dropdown menu from closing when the user clicks on the table`
   - Context: Workaround exists, but could be improved
   - Action: Find a better solution for dropdown menu behavior

2. **`apps/management-ui-upload/src/App.tsx:647`**
   - Comment: `{/* TODO: Make Option for "No Series available" */}`
   - Context: UI improvement - add option for when no series are available
   - Action: Implement "No Series available" option in UI

---

## P3: Future Enhancement

1. **`packages/ui/src/lib/index.ts:8`**
   - Comment: `// TODO: If more utility files are added to src/lib, export them here.`
   - Context: Documentation/reminder for future exports
   - Action: No immediate action needed

2. **`plugins/univie/apps/event-calendar/src/components/api/eventCalendarApi.ts:6`**
   - Comment: `* TODO: Future improvement - make this configurable via environment variables or settings`
   - Context: Event calendar config should be more configurable
   - Note: Already uses `VITE_UNIVIE_API_BASE_URL` env var, but could be extended
   - Action: Enhance configuration system for event calendar

---

## Notes

- This list will be updated as TODOs are found and categorized
- Items should be moved to appropriate priority sections
- When an item is completed, it should be removed from this list
- Consider creating GitHub issues for P0 and P1 items
