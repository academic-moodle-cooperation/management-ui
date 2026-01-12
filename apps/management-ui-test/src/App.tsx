import React from "react";
import { Button } from "@workspace/ui/components";
import { AdaptiveAppWrapper } from "@workspace/app-runtime";

const TestAppContent: React.FC = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Hello from Management UI Test App!</h1>
      <p>
        This is a dynamically loaded application that can run standalone or within the core shell.
      </p>
      <Button onClick={() => alert("Button clicked!")}>Test Button from Shared UI</Button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AdaptiveAppWrapper>
      <TestAppContent />
    </AdaptiveAppWrapper>
  );
};

export default App;
