import React from "react";

import { AdaptiveAppWrapper } from "@workspace/app-runtime";
import { Button, Container } from "@workspace/ui/components";

/**
 * Example TU Wien custom app component
 * This component can run both in the core shell and as a standalone app
 */
export const TuWienCustomApp: React.FC = () => {
  return (
    <AdaptiveAppWrapper>
      <Container className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">TU Wien Custom Application</h1>
          <p className="text-lg mb-6">
            This is a custom application specifically created for TU Wien through the plugin system.
            It demonstrates how universities can add their own applications via the /plugins folder.
            This app can run both within the core shell and as a standalone application.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-3">Custom Features</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>University-specific workflows</li>
                <li>Custom data views</li>
                <li>Integration with TU Wien systems</li>
                <li>Branded user interface</li>
                <li>Standalone execution capability</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-3">Actions</h2>
              <div className="space-y-3">
                <Button
                  onClick={() => alert("TU Wien specific action executed!")}
                  className="w-full"
                >
                  Execute TU Wien Action
                </Button>
                <Button
                  variant="outline"
                  onClick={() => alert("Another custom feature!")}
                  className="w-full"
                >
                  Custom Feature
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Development Note</h3>
            <p className="text-sm text-gray-700">
              This app is registered through the plugin system and can be developed independently
              from the core application. It can access all the same providers (auth, query, theme)
              and UI components as core apps. It can run standalone on port 3005 or within the core
              shell.
            </p>
          </div>
        </div>
      </Container>
    </AdaptiveAppWrapper>
  );
};
