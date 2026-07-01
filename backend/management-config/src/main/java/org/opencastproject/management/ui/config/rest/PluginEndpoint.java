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

package org.opencastproject.management.ui.config.rest;

import org.opencastproject.management.ui.config.PluginManager;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/management-tool/ui/config")
@Component(immediate = true, service = PluginEndpoint.class,
        property = {
            "service.description=Management-UI Plugin Endpoint",
            "opencast.service.type=org.opencastproject.management.ui.PluginEndpoint",
            "opencast.service.path=/management-tool/ui/config",
            })
@Produces(MediaType.APPLICATION_JSON)
@JaxrsResource
public class PluginEndpoint {

  @Reference
  private PluginManager pluginManager;

  private final Gson gson = new GsonBuilder().serializeNulls().create();

  @Activate
  public void activate() {
    Object is = null;
  }

  @GET
  @Path("plugins.json")
  public Response getPlugins() {
    return Response.ok(gson.toJson(new PluginsDto(pluginManager.getPluginConfigs()))).build();
  }

}
