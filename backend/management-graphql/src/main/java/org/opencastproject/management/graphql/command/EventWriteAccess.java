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
import org.opencastproject.elasticsearch.api.SearchResult;
import org.opencastproject.elasticsearch.index.ElasticsearchIndex;
import org.opencastproject.elasticsearch.index.objects.event.Event;
import org.opencastproject.elasticsearch.index.objects.event.EventSearchQuery;
import org.opencastproject.graphql.exception.GraphQLNotFoundException;
import org.opencastproject.graphql.exception.GraphQLRuntimeException;
import org.opencastproject.graphql.exception.GraphQLUnauthorizedException;
import org.opencastproject.graphql.execution.context.OpencastContext;
import org.opencastproject.index.service.api.IndexService;
import org.opencastproject.security.api.Permissions;

/**
 * Authorization helper for the commands that change an event as a whole.
 *
 * <p>Starting a workflow on an event only requires READ on it, and so does looking the
 * event up in the index. Deleting or retracting a recording is a write, so these commands
 * must verify WRITE themselves before anything runs. This is the same lookup Opencast's own
 * event commands use: the index is queried with the WRITE action, so it applies the ACL and
 * the administrator short-circuit for the current user.
 */
final class EventWriteAccess {

  private EventWriteAccess() {
  }

  /**
   * Ensures the current user may modify the event. Call this before changing an event.
   *
   * @param context the current request context
   * @param eventId the event to check
   * @throws GraphQLNotFoundException if the event does not exist or the user may not read it
   * @throws GraphQLUnauthorizedException if the user may read but not write the event
   */
  static void requireWrite(final OpencastContext context, final String eventId) {
    final ElasticsearchIndex index = context.getService(ElasticsearchIndex.class);
    try {
      final SearchResult<Event> result = index.getByQuery(
          new EventSearchQuery(context.getOrganization().getId(), context.getUser())
              .withIdentifier(eventId)
              .withAction(Permissions.Action.WRITE));
      if (result.getPageSize() > 0) {
        return;
      }
      // Nothing writable: tell "may read but not write" apart from "unknown or unreadable".
      if (context.getService(IndexService.class).getEvent(eventId, index).isPresent()) {
        throw new GraphQLUnauthorizedException(
            "The current user is not authorized to modify event with id " + eventId + ".");
      }
      throw new GraphQLNotFoundException("Event with id " + eventId + " not found.");
    } catch (SearchIndexException e) {
      throw new GraphQLRuntimeException(e);
    }
  }

}
