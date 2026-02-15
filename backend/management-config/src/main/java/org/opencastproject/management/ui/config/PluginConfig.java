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

public class PluginConfig {

  private String name;

  private String path;

  private String scope;

  private String scriptUrl;

  private String localesUrl;

  private String[] i18nNamespaces;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getPath() {
    return path;
  }

  public void setPath(String path) {
    this.path = path;
  }

  public String getScope() {
    return scope;
  }

  public void setScope(String scope) {
    this.scope = scope;
  }

  public String getScriptUrl() {
    return scriptUrl;
  }

  public void setScriptUrl(String scriptUrl) {
    this.scriptUrl = scriptUrl;
  }

  public String getLocalesUrl() {
    return localesUrl;
  }

  public void setLocalesUrl(String localesUrl) {
    this.localesUrl = localesUrl;
  }

  public String[] getI18nNamespaces() {
    return i18nNamespaces;
  }

  public void setI18nNamespaces(String[] i18nNamespaces) {
    this.i18nNamespaces = i18nNamespaces;
  }
}
