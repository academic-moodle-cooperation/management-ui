/*
 * Licensed to The Apereo Foundation under one or more contributor license
 * agreements. See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 *
 * The Apereo Foundation licenses this file to you under the Educational
 * Community License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License
 * at:
 *
 *   http://opensource.org/licenses/ecl2.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 */

package org.opencastproject.management.ui.config;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.BundleEvent;
import org.osgi.util.tracker.BundleTracker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStreamReader;
import java.io.Reader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Dictionary;
import java.util.Enumeration;
import java.util.List;

public class PluginBundleTracker extends BundleTracker<List<PluginConfig>> {

  private static final Logger logger = LoggerFactory.getLogger(PluginBundleTracker.class);

  private static final int TRACKING_MASK = Bundle.RESOLVED | Bundle.ACTIVE | Bundle.UNINSTALLED;
  protected static final String MANAGEMENT_PLUGIN = "Management-Plugin";
  protected static final String MANAGEMENT_PLUGIN_CSS = "Management-Plugin-Css";
  protected static final String MANAGEMENT_PLUGIN_I18N = "Management-Plugin-I18n";
  protected static final String MANAGEMENT_PLUGIN_PATH = "/static/plugins";
  protected static final String MANAGEMENT_PLUGIN_PREFIX = "management_ui_plugin_";
  protected static final String HTTP_ALIAS = "Http-Alias";


  public PluginBundleTracker(BundleContext context) {
    super(context, TRACKING_MASK, null);

    Bundle[] bundles = context.getBundles();
    Arrays.stream(bundles)
        .filter(b -> b.getHeaders().get(MANAGEMENT_PLUGIN) != null)
        .forEach(bundle -> this.addingBundle(bundle, new BundleEvent(bundle.getState(), bundle)));
  }

  @Override
  public List<PluginConfig> addingBundle(Bundle bundle, BundleEvent bundleEvent) {
    if (bundle.getHeaders().get(MANAGEMENT_PLUGIN) != null
        && (bundle.getState() == Bundle.RESOLVED || bundle.getState() == Bundle.ACTIVE)) {
      return extractConfigs(bundle);
    }
    return null;
  }

  @Override
  public void modifiedBundle(Bundle bundle, BundleEvent bundleEvent, List<PluginConfig> o) {

  }

  @Override
  public void removedBundle(Bundle bundle, BundleEvent bundleEvent, List<PluginConfig> o) {

  }

  private List<PluginConfig> extractConfigs(Bundle bundle) {
    Dictionary<String, String> headers = bundle.getHeaders();
    String pluginName = headers.get(MANAGEMENT_PLUGIN);
    String scope = MANAGEMENT_PLUGIN_PREFIX
        .concat(pluginName.replaceAll("[^a-zA-Z0-9_ ]", "_"));
    String pluginPath = Paths.get(MANAGEMENT_PLUGIN_PATH, pluginName).toString();
    String httpAlias = headers.get(HTTP_ALIAS);

    List<PluginConfig> manifestConfigs = extractFromManifest(bundle, pluginName, scope, pluginPath, httpAlias);
    if (manifestConfigs != null) {
      return manifestConfigs;
    }

    return extractFromFileConvention(bundle, headers, pluginName, scope, pluginPath, httpAlias);
  }

  /**
   * Try to read plugin.json from the bundle. Returns null if the manifest
   * doesn't exist or can't be parsed, signalling the caller to fall back.
   */
  private List<PluginConfig> extractFromManifest(Bundle bundle, String pluginName,
      String scope, String pluginPath, String httpAlias) {
    String manifestPath = Paths.get(MANAGEMENT_PLUGIN_PATH, pluginName, "plugin.json").toString();
    URL manifestUrl = bundle.getEntry(manifestPath);
    if (manifestUrl == null) {
      return null;
    }

    JsonObject manifest;
    try (Reader reader = new InputStreamReader(manifestUrl.openStream(), StandardCharsets.UTF_8)) {
      manifest = JsonParser.parseReader(reader).getAsJsonObject();
    } catch (Exception e) {
      logger.warn("Failed to parse plugin.json in bundle {}: {}", bundle.getSymbolicName(), e.getMessage());
      return null;
    }

    String manifestId = getStringOrNull(manifest, "id");
    String manifestName = getStringOrNull(manifest, "name");
    String namespace = getStringOrNull(manifest, "namespace");
    String locales = getStringOrNull(manifest, "locales");
    String[] rootI18n = getStringArrayOrNull(manifest, "i18nNamespaces");

    List<PluginConfig> configs = new ArrayList<>();

    if (manifest.has("modules") && manifest.get("modules").isJsonArray()) {
      JsonArray modules = manifest.getAsJsonArray("modules");
      for (JsonElement el : modules) {
        if (!el.isJsonObject()) {
          continue;
        }
        JsonObject mod = el.getAsJsonObject();

        String modId = getStringOrNull(mod, "id");
        String modType = getStringOrNull(mod, "type");
        String modEntry = getStringOrNull(mod, "entry");
        String modCss = getStringOrNull(mod, "css");
        String modLocales = getStringOrNull(mod, "locales");
        String[] modI18n = getStringArrayOrNull(mod, "i18nNamespaces");

        PluginConfig config = new PluginConfig();
        config.setId(manifestId != null && modId != null ? manifestId + "/" + modId : modId);
        config.setName(manifestName != null && modType != null ? manifestName + ":" + modType : manifestName);
        config.setScope(scope);
        config.setPath(pluginPath);
        config.setNamespace(namespace);
        config.setType(modType);

        if (httpAlias != null && modEntry != null) {
          config.setScriptUrl(Paths.get(httpAlias, filename(modEntry)).toString());
        }
        if (httpAlias != null && modCss != null) {
          config.setCssUrl(Paths.get(httpAlias, filename(modCss)).toString());
        }

        String effectiveLocales = modLocales != null ? modLocales : locales;
        String[] effectiveI18n = modI18n != null ? modI18n : rootI18n;

        if (httpAlias != null && effectiveLocales != null) {
          config.setLocalesUrl(Paths.get(httpAlias, effectiveLocales).toString());
        } else if (httpAlias != null && effectiveI18n != null && effectiveI18n.length > 0) {
          config.setLocalesUrl(Paths.get(httpAlias, "locales").toString());
        }
        if (effectiveI18n != null) {
          config.setI18nNamespaces(effectiveI18n);
        }

        configs.add(config);
      }
    } else {
      String type = getStringOrNull(manifest, "type");
      String entry = getStringOrNull(manifest, "entry");
      String css = getStringOrNull(manifest, "css");

      PluginConfig config = new PluginConfig();
      config.setId(manifestId != null ? manifestId : pluginName);
      config.setName(manifestName != null ? manifestName : bundle.getSymbolicName());
      config.setScope(scope);
      config.setPath(pluginPath);
      config.setNamespace(namespace);
      config.setType(type);

      if (httpAlias != null && entry != null) {
        config.setScriptUrl(Paths.get(httpAlias, filename(entry)).toString());
      }
      if (httpAlias != null && css != null) {
        config.setCssUrl(Paths.get(httpAlias, filename(css)).toString());
      }

      if (httpAlias != null && locales != null) {
        config.setLocalesUrl(Paths.get(httpAlias, locales).toString());
      } else if (httpAlias != null && rootI18n != null && rootI18n.length > 0) {
        config.setLocalesUrl(Paths.get(httpAlias, "locales").toString());
      }
      if (rootI18n != null) {
        config.setI18nNamespaces(rootI18n);
      }

      configs.add(config);
    }

    logger.info("Loaded {} plugin config(s) from plugin.json in bundle {}", configs.size(), bundle.getSymbolicName());
    return configs;
  }

  /** Filename-convention fallback (pre-plugin.json behaviour). */
  private List<PluginConfig> extractFromFileConvention(Bundle bundle, Dictionary<String, String> headers,
      String pluginName, String scope, String pluginPath, String httpAlias) {
    String cssHeader = headers.get(MANAGEMENT_PLUGIN_CSS);
    String[] i18nNamespaces = parseI18nNamespaces(headers.get(MANAGEMENT_PLUGIN_I18N));

    List<String> moduleFiles = findBundleFiles(bundle, pluginName, "*.mjs");
    if (moduleFiles.isEmpty()) {
      moduleFiles.add(pluginName.concat(".mjs"));
    }

    List<String> cssFiles = findBundleFiles(bundle, pluginName, "*.css");
    List<PluginConfig> configs = new ArrayList<>();

    for (String moduleFile : moduleFiles) {
      PluginConfig config = new PluginConfig();
      ModuleDescriptor descriptor = describeModule(pluginName, moduleFile, moduleFiles.size());

      config.setId(descriptor.id);
      config.setName(descriptor.displayName(bundle.getSymbolicName()));
      config.setScope(scope);
      config.setPath(pluginPath);
      config.setNamespace(descriptor.namespace);
      config.setType(descriptor.type);

      if (httpAlias != null && !httpAlias.isEmpty()) {
        config.setScriptUrl(Paths.get(httpAlias, moduleFile).toString());

        String cssFile = resolveCssFile(moduleFile, cssHeader, cssFiles);
        if (cssFile != null && !cssFile.isEmpty()) {
          config.setCssUrl(Paths.get(httpAlias, cssFile).toString());
        }

        if (i18nNamespaces.length > 0) {
          config.setLocalesUrl(Paths.get(httpAlias, "locales").toString());
        }
      }

      if (i18nNamespaces.length > 0) {
        config.setI18nNamespaces(i18nNamespaces);
      }

      configs.add(config);
    }

    return configs;
  }

  private static String getStringOrNull(JsonObject obj, String key) {
    JsonElement el = obj.get(key);
    return (el != null && el.isJsonPrimitive()) ? el.getAsString() : null;
  }

  private static String[] getStringArrayOrNull(JsonObject obj, String key) {
    JsonElement el = obj.get(key);
    if (el == null || !el.isJsonArray()) {
      return null;
    }
    JsonArray arr = el.getAsJsonArray();
    String[] result = new String[arr.size()];
    for (int i = 0; i < arr.size(); i++) {
      result[i] = arr.get(i).getAsString();
    }
    return result;
  }

  /** Extract just the filename from a relative path like "dist/foo.mjs". */
  private static String filename(String relativePath) {
    return Paths.get(relativePath).getFileName().toString();
  }

  private List<String> findBundleFiles(Bundle bundle, String pluginName, String pattern) {
    String bundlePath = Paths.get(MANAGEMENT_PLUGIN_PATH, pluginName).toString();
    Enumeration<URL> entries = bundle.findEntries(bundlePath, pattern, false);
    if (entries == null) {
      return new ArrayList<>();
    }

    List<String> files = new ArrayList<>();
    for (URL entry : Collections.list(entries)) {
      String fileName = Paths.get(entry.getPath()).getFileName().toString();
      files.add(fileName);
    }
    Collections.sort(files);
    return files;
  }

  private String[] parseI18nNamespaces(String namespacesHeader) {
    if (namespacesHeader == null) {
      return new String[0];
    }

    return Arrays.stream(namespacesHeader.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .toArray(String[]::new);
  }

  private String resolveCssFile(String moduleFile, String cssHeader, List<String> cssFiles) {
    if (cssHeader != null && !cssHeader.isEmpty()) {
      return cssHeader;
    }

    String matchingCss = moduleFile.replaceAll("\\.mjs$", ".css");
    if (cssFiles.contains(matchingCss)) {
      return matchingCss;
    }

    if (cssFiles.size() == 1) {
      return cssFiles.get(0);
    }

    return null;
  }

  private ModuleDescriptor describeModule(String pluginName, String moduleFile, int totalModules) {
    String stem = moduleFile.replaceAll("\\.mjs$", "");
    String prefixedNamespace = "plugin-" + pluginName;
    String namespace = pluginName;
    String type = null;

    if (stem.startsWith(prefixedNamespace + "-")) {
      type = stem.substring((prefixedNamespace + "-").length());
    } else if (stem.startsWith(pluginName + "-")) {
      type = stem.substring((pluginName + "-").length());
    }

    boolean singleCanonicalEntry = totalModules == 1
        && (stem.equals(pluginName) || stem.equals(prefixedNamespace));
    String id = singleCanonicalEntry ? pluginName : pluginName + "/" + stem;

    return new ModuleDescriptor(id, namespace, type, stem, totalModules > 1);
  }

  private static final class ModuleDescriptor {
    private final String id;
    private final String namespace;
    private final String type;
    private final String stem;
    private final boolean multipleModules;

    private ModuleDescriptor(String id, String namespace, String type, String stem, boolean multipleModules) {
      this.id = id;
      this.namespace = namespace;
      this.type = type;
      this.stem = stem;
      this.multipleModules = multipleModules;
    }

    private String displayName(String bundleSymbolicName) {
      if (type != null && !type.isEmpty()) {
        return bundleSymbolicName + ":" + type;
      }
      if (multipleModules) {
        return bundleSymbolicName + ":" + stem;
      }
      return bundleSymbolicName;
    }
  }

}
