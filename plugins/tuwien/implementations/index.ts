/**
 * TU Wien Plugin Implementations
 * 
 * All TU Wien-specific plugin implementations organized in one place.
 * Universities can import individual implementations or all at once.
 */

// Implementations organized by app/component area
export { tuwienConfigPlugin } from './config';
export { tuwienFooterImplementation } from './footer';
export { tuwienHeaderImplementation } from './header';
export { tuwienLandingPageImplementation } from './landing-page';
export { tuwienSidebarImplementation, studioNavImplementation } from './sidebar';
export { tuwienTableSidebarImplementation } from './table-sidebar';
export { tuwienUploadAclEditorImplementation } from './upload-acl-editor';

// Episodes implementations  
export { tuwienEpisodesActionsImplementation } from './episodes/custom-actions-plugin';

// Series implementations
export { tuwienSeriesActionsImplementation } from './series/custom-actions-plugin';

// Future TU Wien implementations would go here:
// export { tuwienBrandingImplementation } from './branding';
// export { tuwienAnalyticsImplementation } from './analytics'; 