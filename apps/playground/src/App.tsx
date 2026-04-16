import React from "react";

import { Button } from "@workspace/ui/components";

/**
 * Minimal standalone harness. In the long run this will render a single
 * selected plugin in isolation against a mocked shell (see ADR-003).
 * For now it is intentionally blank so plugin authors have a clean
 * starting point.
 */
const App: React.FC = () => {
  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <h1>Plugin Playground</h1>
      <p>
        Isolated development sandbox. Load a single plugin here without the rest of the shell. Not
        shipped to production.
      </p>
      <Button onClick={() => alert("Harness is alive")}>Ping</Button>
    </div>
  );
};

export default App;
