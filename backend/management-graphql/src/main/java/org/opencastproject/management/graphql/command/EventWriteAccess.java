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
package org.opencastproject.management.graphql.command;

import org.opencastproject.elasticsearch.api.SearchIndexException;
import org.opencastproject.elasticsearch.index.ElasticsearchIndex;
import org.opencastproject.elasticsearch.index.objects.event.Event;
import org.opencastproject.graphql.exception.GraphQLNotFoundException;
import org.opencastproject.graphql.exception.GraphQLRuntimeException;
import org.opencastproject.graphql.exception.GraphQLUnauthorizedException;
import org.opencastproject.graphql.execution.context.OpencastContext;
import org.opencastproject.index.service.api.IndexService;
import org.opencastproject.security.api.AccessControlList;
import org.opencastproject.security.api.AccessControlParser;
import org.opencastproject.security.api.AccessControlUtil;
import org.opencastproject.security.api.Permissions;
import org.opencastproject.security.api.SecurityService;

/**
 * Authorization helper for mutations that change an event as a whole.
 *
 * <p>Starting a workflow on an event only requires READ on it, and so does looking the
 * event up in the index. Deleting or retracting a recording is a write, so the
 * mutations that do it must verify WRITE themselves before anything runs. This helper
 * does that against the ACL recorded in the index, the same source the UI shows.
 */
public final class EventWriteAccess {

  private EventWriteAccess() {
  }

  /**
   * Ensures the current user holds WRITE on the given event.
   *
   * <p>Administrators pass regardless of the ACL. An event the user cannot read is
   * reported as not found, exactly like every other event mutation does. An event
   * without a stored ACL is only writable by administrators.
   *
   * @param context the current request context
   * @param eventId the event to check
   * @throws GraphQLNotFoundException if the event is unknown or not readable
   * @throws GraphQLUnauthorizedException if the user may read but not write the event
   */
  public static void requireWrite(final OpencastContext context, final String eventId) {
    final ElasticsearchIndex index = context.getService(ElasticsearchIndex.class);
    final IndexService indexService = context.getService(IndexService.class);
    final SecurityService securityService = context.getService(SecurityService.class);

    final Event event;
    try {
      event = indexService.getEvent(eventId, index)
          .orElseThrow(() -> new GraphQLNotFoundException("Event with id " + eventId + " not found."));
    } catch (SearchIndexException e) {
      throw new GraphQLRuntimeException(e);
    }

    // parseAclSilent rethrows on null or malformed input rather than returning null,
    // so treat a missing policy as an empty ACL explicitly. An empty ACL grants nothing,
    // which leaves the admin short-circuit in isAuthorized as the only way through.
    final String policy = event.getAccessPolicy();
    final AccessControlList acl = (policy == null || policy.isBlank())
        ? new AccessControlList()
        : AccessControlParser.parseAclSilent(policy);

    final boolean authorized = AccessControlUtil.isAuthorized(
        acl,
        securityService.getUser(),
        securityService.getOrganization(),
        Permissions.Action.WRITE.toString()
    );
    if (!authorized) {
      throw new GraphQLUnauthorizedException(
          "The current user is not authorized to modify event with id " + eventId + ".");
    }
  }

}
