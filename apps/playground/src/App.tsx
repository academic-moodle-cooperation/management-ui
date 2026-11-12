import React from "react";

import { Gallery } from "./gallery/Gallery";

/**
 * The playground currently hosts the component gallery: every base component
 * of `@oc-mui/ui` in its main variants and sizes, switchable across the
 * shipped themes, light/dark and (later) styles. It doubles as the visual
 * regression surface for changes to the base components.
 *
 * Running a single plugin in isolation (ADR-003) is still the long-term plan
 * for this app and is unaffected by the gallery.
 */
const App: React.FC = () => <Gallery />;

export default App;
