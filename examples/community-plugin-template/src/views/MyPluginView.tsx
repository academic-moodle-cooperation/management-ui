/**
 * My Plugin View
 *
 * This is the main view/page component for your plugin.
 * It will be rendered when users navigate to your plugin's route.
 *
 * You can use components from @workspace/ui for consistent styling.
 */

import React from "react";

// Import UI components from the workspace
// Note: These are provided by the host and not bundled with your plugin
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@workspace/ui/components";

export const MyPluginView: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Plugin</h1>
        <p className="text-muted-foreground">
          This is your community plugin. Customize this view to add your functionality.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Start building your plugin by editing this component.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Edit <code>src/views/MyPluginView.tsx</code> to change this view</li>
              <li>Edit <code>src/index.ts</code> to modify plugin registration</li>
              <li>Add more components in <code>src/components/</code></li>
              <li>Run <code>npm run build</code> to build your plugin</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardDescription>
              Helpful links for plugin development.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://github.com/opencast/management-ui"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Management UI Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://ui.shadcn.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  shadcn/ui Components
                </a>
              </li>
              <li>
                <a
                  href="https://lucide.dev/icons"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Lucide Icons
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Example: Using Hooks */}
      <Card>
        <CardHeader>
          <CardTitle>Data Fetching Example</CardTitle>
          <CardDescription>
            Use hooks from @workspace/query to fetch data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
            {`// Import hooks from @workspace/query
import { useGetMyEventsQuery } from "@workspace/query";

// Use in your component
const { data, isLoading, error } = useGetMyEventsQuery({
  limit: 20,
});

// Handle loading/error states
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

// Render your data
return <EventList events={data?.currentUser?.myEvents?.nodes} />;`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyPluginView;
