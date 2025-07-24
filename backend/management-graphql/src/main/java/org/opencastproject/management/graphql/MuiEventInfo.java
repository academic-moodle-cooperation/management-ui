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

package org.opencastproject.management.graphql;

import org.opencastproject.authorization.xacml.manager.api.AclService;
import org.opencastproject.authorization.xacml.manager.api.AclServiceFactory;
import org.opencastproject.graphql.event.GqlEvent;
import org.opencastproject.graphql.exception.GraphQLRuntimeException;
import org.opencastproject.graphql.execution.context.OpencastContext;
import org.opencastproject.graphql.execution.context.OpencastContextManager;
import org.opencastproject.mediapackage.MediaPackageElementFlavor;
import org.opencastproject.security.api.AccessControlEntry;
import org.opencastproject.security.api.AccessControlList;
import org.opencastproject.security.api.AccessControlParser;
import org.opencastproject.security.api.Permissions;
import org.opencastproject.security.api.SecurityService;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Objects;

import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.schema.DataFetchingEnvironment;

@GraphQLName(MuiEventInfo.TYPE_NAME)
public class MuiEventInfo {

  public static final String TYPE_NAME = "MuiEventInfo";

  private final GqlEvent event;

  public MuiEventInfo(GqlEvent event) {
    this.event = event;
  }

  @GraphQLField
  public String thumbnailUrl() {
    String channelId = GraphQLProvider.getConfig().thumbnail_channel_id();
    MediaPackageElementFlavor flavor = MediaPackageElementFlavor
        .parseFlavor(GraphQLProvider.getConfig().thumbnail_flavor());
    return event.getEvent().getPublications().stream()
        .filter(e -> Objects.equals(e.getChannel(), channelId))
        .flatMap(e -> Arrays.stream(e.getAttachments()))
        .filter(a -> a.getFlavor().matches(flavor))
        .map(a -> a.getURI().toString())
        .findFirst().orElse(null);
  }

  @GraphQLField
  public String publishUrl() {
    String channelId = GraphQLProvider.getConfig().publication_channel_id();

    return event.getEvent().getPublications().stream()
        .filter(e -> Objects.equals(e.getChannel(), channelId))
        .map(a -> a.getURI().toString())
        .findFirst().orElse(null);

  }

  @GraphQLField
  public boolean isPublic() {
    String accessPolicy = event.getEvent().getAccessPolicy();
    if (accessPolicy == null) {
      return false;
    }

    try {
      AccessControlList acl = AccessControlParser.parseAcl(accessPolicy);
      return acl.getEntries().stream().anyMatch(e -> e.isAllow()
          && Permissions.Action.READ.getValue().equals(e.getAction())
          && "ROLE_ANONYMOUS".equals(e.getRole())
      );
    } catch (Exception e) {
      return false;
    }
  }

  @GraphQLField
  public Long managedAclId(final DataFetchingEnvironment environment) {
    String[] order = GraphQLProvider.getConfig().managed_acl_order();
    OpencastContext context = OpencastContextManager.getCurrentContext();
    AclService aclService = context.getService(AclServiceFactory.class)
        .serviceFor(context.getService(SecurityService.class).getOrganization());
    var managedAcls = aclService.getAcls();
    String accessPolicy = event.getEvent().getAccessPolicy();
    if (accessPolicy == null) {
      return null;
    }
    try {
      AccessControlList eventAcl = AccessControlParser.parseAcl(accessPolicy);
      HashSet<AccessControlEntry> eventAclEntries = new HashSet<>(eventAcl.getEntries());
      for (String name: order) {
        for (var acl : managedAcls) {
          if (acl.getName().equals(name)) {
            if (eventAclEntries.containsAll(acl.getAcl().getEntries())) {
              return acl.getId();
            }
            break;
          }
        }
      }
    } catch (Exception e) {
      throw new GraphQLRuntimeException(e);
    }
    return null;
  }

}
