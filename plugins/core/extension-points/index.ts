// Export extension point definitions - these define WHAT CAN be extended
export { sidebarExtensionPoints } from "./sidebar.js";
export { appLayoutExtensionPoints } from "./layout.js";
export { tableSidebarExtensionPoints } from "./table-sidebar.js";
export { uploadExtensionPoints } from "./upload.js";
export {
  seriesExtensionPoints,
  CREATE_SERIES_VARIANTS,
  type CreateSeriesVariant,
  type CreateSeriesVariantProps,
} from "./series.js";
export {
  episodesExtensionPoints,
  EPISODE_STATUS_INDICATORS,
  type EpisodeStatusIndicator,
  type EpisodeStatusTone,
} from "./episodes.js";
