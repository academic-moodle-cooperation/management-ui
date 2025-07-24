import React from 'react';
import { Button } from '@workspace/ui/components'; // Example import from shared UI

const App: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Hello from Management UI Test App!</h1>
      <p>This is a dynamically loaded application.</p>
      <Button onClick={() => alert('Button clicked!')}>Test Button from Shared UI</Button>
    </div>
  );
};

export default App; 