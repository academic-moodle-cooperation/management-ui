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

import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.BundleEvent;
import org.osgi.util.tracker.BundleTracker;

import java.net.URL;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Dictionary;
import java.util.Enumeration;
import java.util.List;

public class PluginBundleTracker extends BundleTracker<List<PluginConfig>> {

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
