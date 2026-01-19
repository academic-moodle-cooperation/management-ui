import React, { useState } from "react";

import type { PluginManager } from "@workspace/plugin-system";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
  Badge,
} from "@workspace/ui/components";

import { RemoteLoader } from "../services/remote-loader";

/**
 * Available plugin registry
 * In a real implementation, this would be fetched from a remote registry API
 */
const AVAILABLE_PLUGINS = [
  {
    id: "example-plugin-1",
    name: "Example Analytics Plugin",
    description: "Adds analytics dashboard and reporting features",
    version: "1.0.0",
    author: "Example Team",
    url: "https://example.com/plugins/analytics.js",
    category: "Analytics",
  },
  {
    id: "example-plugin-2",
    name: "Custom Theme Plugin",
    description: "Provides additional theme customization options",
    version: "1.2.0",
    author: "Theme Team",
    url: "https://example.com/plugins/theme.js",
    category: "Theming",
  },
  {
    id: "example-plugin-3",
    name: "Export Tools Plugin",
    description: "Advanced export functionality for episodes and series",
    version: "2.0.0",
    author: "Tools Team",
    url: "https://example.com/plugins/export-tools.js",
    category: "Utilities",
  },
];

export interface MarketplaceDashboardProps {
  manager: PluginManager;
}

/**
 * MarketplaceDashboard Component
 *
 * Provides a UI for browsing and installing remote plugins dynamically.
 * Features:
 * - Grid display of available plugins
 * - "Try" button to load without saving
 * - "Install" button to load and persist to localStorage
 * - Developer Mode for loading custom plugin URLs
 */
export const MarketplaceDashboard: React.FC<MarketplaceDashboardProps> = ({
  manager,
}) => {
  const [customUrl, setCustomUrl] = useState("");
  const [installedPlugins, setInstalledPlugins] = useState<string[]>(
    RemoteLoader.getInstalledUrls()
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTryPlugin = async (url: string) => {
    setLoading(url);
    setError(null);
    try {
      await RemoteLoader.loadAndRegister(url, manager);
      console.log(`Successfully loaded plugin from ${url}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load plugin: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const handleInstallPlugin = async (url: string) => {
    setLoading(url);
    setError(null);
    try {
      await RemoteLoader.loadAndRegister(url, manager);
      RemoteLoader.persist(url);
      setInstalledPlugins(RemoteLoader.getInstalledUrls());
      console.log(`Successfully installed plugin from ${url}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to install plugin: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const handleUninstallPlugin = (url: string) => {
    RemoteLoader.remove(url);
    setInstalledPlugins(RemoteLoader.getInstalledUrls());
    console.log(`Uninstalled plugin from ${url}`);
  };

  const handleLoadCustomUrl = async () => {
    if (!customUrl.trim()) {
      setError("Please enter a valid URL");
      return;
    }
    await handleTryPlugin(customUrl.trim());
  };

  const handleInstallCustomUrl = async () => {
    if (!customUrl.trim()) {
      setError("Please enter a valid URL");
      return;
    }
    await handleInstallPlugin(customUrl.trim());
  };

  const isInstalled = (url: string) => installedPlugins.includes(url);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Marketplace</h1>
        <p className="text-muted-foreground">
          Browse and install remote plugins dynamically at runtime using the
          Parallel Engine approach.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Developer Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Developer Mode</CardTitle>
          <CardDescription>
            Load a plugin from a custom URL (e.g., localhost during development)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-url">Plugin URL</Label>
            <Input
              id="custom-url"
              type="url"
              placeholder="http://localhost:3001/plugin.js"
              value={customUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomUrl(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={handleLoadCustomUrl}
            disabled={loading !== null}
            variant="outline"
          >
            Try
          </Button>
          <Button
            onClick={handleInstallCustomUrl}
            disabled={loading !== null}
          >
            Install
          </Button>
        </CardFooter>
      </Card>

      {/* Available Plugins Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Plugins</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_PLUGINS.map((plugin) => (
            <Card key={plugin.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{plugin.name}</CardTitle>
                    <CardDescription className="text-xs">
                      by {plugin.author} • v{plugin.version}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{plugin.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {plugin.description}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2">
                {isInstalled(plugin.url) ? (
                  <>
                    <Badge variant="default">Installed</Badge>
                    <Button
                      onClick={() => handleUninstallPlugin(plugin.url)}
                      variant="outline"
                      size="sm"
                      disabled={loading !== null}
                    >
                      Uninstall
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleTryPlugin(plugin.url)}
                      variant="outline"
                      size="sm"
                      disabled={loading !== null}
                    >
                      {loading === plugin.url ? "Loading..." : "Try"}
                    </Button>
                    <Button
                      onClick={() => handleInstallPlugin(plugin.url)}
                      size="sm"
                      disabled={loading !== null}
                    >
                      {loading === plugin.url ? "Installing..." : "Install"}
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Installed Plugins Info */}
      {installedPlugins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Installed Plugins</CardTitle>
            <CardDescription>
              These plugins will be automatically loaded on next page load
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {installedPlugins.map((url) => (
                <li key={url} className="flex items-center justify-between">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {url}
                  </code>
                  <Button
                    onClick={() => handleUninstallPlugin(url)}
                    variant="ghost"
                    size="sm"
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
