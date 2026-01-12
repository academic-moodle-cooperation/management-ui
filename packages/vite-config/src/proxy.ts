import type { ProxyOptions } from "vite";

export interface CreateProxyConfigOptions {
  isProduction: boolean;
  target?: string;
  customProxies?: Record<string, string | ProxyOptions>;
}

const defaultBackendTarget = "http://127.0.0.1:8080";

const defaultProxyPaths: Record<string, string | ProxyOptions> = {
  "/j_spring_security_login": "",
  "/j_spring_security_check": "",
  "/j_spring_security_logout": "",
  "/login.html": "", // Proxy login.html to backend for post-login redirect handling
  "/management-tool/ui/config/plugins.json": "",
  "/info/me.json": "",
  "/ui/config/management-ui/config.json": "",
  "/admin-ng": "",
  "/graphql": "",
  "/graphql-ui": "",
  "/static": "", // This might need careful handling if apps have their own /static
  "/play": "",
  "/paella7": "",
  "/editor-ui": "",
  "/editor": "",
  "/studio": "",
  "/ingest": "",
  "/api": "",
};

export function createProxyConfig(
  options?: CreateProxyConfigOptions
): Record<string, string | ProxyOptions> {
  const target = options?.target || defaultBackendTarget;

  const resolvedProxies: Record<string, string | ProxyOptions> = {};

  // Populate default proxies with the target
  for (const path in defaultProxyPaths) {
    const pathConfig = defaultProxyPaths[path];
    if (typeof pathConfig === "string") {
      resolvedProxies[path] = target;
    } else {
      resolvedProxies[path] = { ...pathConfig, target };
    }
  }

  // Add or override with custom proxies
  if (options?.customProxies) {
    for (const path in options.customProxies) {
      const customConfig = options.customProxies[path];
      if (typeof customConfig === "string") {
        resolvedProxies[path] = customConfig;
      } else if (customConfig) {
        resolvedProxies[path] = customConfig.target ? customConfig : { ...customConfig, target };
      } else {
        resolvedProxies[path] = target;
      }
    }
  }

  return resolvedProxies;
}
