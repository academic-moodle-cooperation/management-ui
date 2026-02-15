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

import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Dictionary;

public class PluginBundleTracker extends BundleTracker<PluginConfig> {

  private static final int TRACKING_MASK = Bundle.RESOLVED | Bundle.ACTIVE | Bundle.UNINSTALLED;
  protected static final String MANAGEMENT_PLUGIN = "Management-Plugin";
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
  public PluginConfig addingBundle(Bundle bundle, BundleEvent bundleEvent) {
    if (bundle.getHeaders().get(MANAGEMENT_PLUGIN) != null
        && (bundle.getState() == Bundle.RESOLVED || bundle.getState() == Bundle.ACTIVE)) {
      PluginConfig pluginConfig = extractConfigFromHeaders(bundle.getHeaders());
      pluginConfig.setName(bundle.getSymbolicName());
      return pluginConfig;
    }
    return null;
  }

  @Override
  public void modifiedBundle(Bundle bundle, BundleEvent bundleEvent, PluginConfig o) {

  }

  @Override
  public void removedBundle(Bundle bundle, BundleEvent bundleEvent, PluginConfig o) {

  }

  private PluginConfig extractConfigFromHeaders(Dictionary<String, String> headers) {
    PluginConfig config = new PluginConfig();
    String pluginName = headers.get(MANAGEMENT_PLUGIN);
    config.setScope(MANAGEMENT_PLUGIN_PREFIX
        .concat(pluginName.replaceAll("[^a-zA-Z0-9_ ]", "_"))
    );
    config.setPath(Paths.get(MANAGEMENT_PLUGIN_PATH, pluginName).toString());

    String httpAlias = headers.get(HTTP_ALIAS);
    if (httpAlias != null && !httpAlias.isEmpty()) {
      String scriptFile = pluginName.concat(".mjs");
      config.setScriptUrl(Paths.get(httpAlias, scriptFile).toString());
    }
    return config;
  }

}
