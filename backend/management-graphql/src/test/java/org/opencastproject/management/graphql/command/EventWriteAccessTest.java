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

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.opencastproject.elasticsearch.api.SearchIndexException;
import org.opencastproject.elasticsearch.index.ElasticsearchIndex;
import org.opencastproject.elasticsearch.index.objects.event.Event;
import org.opencastproject.elasticsearch.index.objects.event.EventSearchQuery;
import org.opencastproject.graphql.exception.GraphQLNotFoundException;
import org.opencastproject.graphql.exception.GraphQLRuntimeException;
import org.opencastproject.graphql.exception.GraphQLUnauthorizedException;
import org.opencastproject.index.service.api.IndexService;
import org.opencastproject.security.api.Permissions;

import org.easymock.Capture;
import org.easymock.EasyMock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Optional;

class EventWriteAccessTest extends AbstractCommandTest {

  private static final String EVENT_ID = "event-1";

  private ElasticsearchIndex index;
  private IndexService indexService;

  @BeforeEach
  void setUp() {
    index = EasyMock.createMock(ElasticsearchIndex.class);
    indexService = EasyMock.createMock(IndexService.class);
    mockService(ElasticsearchIndex.class, index);
    mockService(IndexService.class, indexService);
  }

  @Test
  void acceptsEventTheUserMayWrite() throws Exception {
    Event event = new Event(EVENT_ID, "mh_default_org");
    Capture<EventSearchQuery> query = Capture.newInstance();
    EasyMock.expect(index.getByQuery(EasyMock.capture(query))).andReturn(searchResult(event));
    EasyMock.replay(bundleContext, index, indexService);

    EventWriteAccess.requireWrite(context, EVENT_ID);

    assertArrayEquals(new String[] { EVENT_ID }, query.getValue().getIdentifier());
    assertTrue(Arrays.asList(query.getValue().getActions()).contains(Permissions.Action.WRITE.toString()));
    EasyMock.verify(index, indexService);
  }

  @Test
  void rejectsEventTheUserMayOnlyRead() throws Exception {
    expectNoWritableEvent(index);
    EasyMock.expect(indexService.getEvent(EVENT_ID, index))
        .andReturn(Optional.of(new Event(EVENT_ID, "mh_default_org")));
    EasyMock.replay(bundleContext, index, indexService);

    assertThrows(GraphQLUnauthorizedException.class, () -> EventWriteAccess.requireWrite(context, EVENT_ID));
    EasyMock.verify(index, indexService);
  }

  @Test
  void reportsMissingEventAsNotFound() throws Exception {
    expectNoWritableEvent(index);
    EasyMock.expect(indexService.getEvent(EVENT_ID, index)).andReturn(Optional.empty());
    EasyMock.replay(bundleContext, index, indexService);

    assertThrows(GraphQLNotFoundException.class, () -> EventWriteAccess.requireWrite(context, EVENT_ID));
    EasyMock.verify(index, indexService);
  }

  @Test
  void wrapsSearchIndexException() throws Exception {
    EasyMock.expect(index.getByQuery(EasyMock.anyObject(EventSearchQuery.class)))
        .andThrow(new SearchIndexException("boom"));
    EasyMock.replay(bundleContext, index, indexService);

    assertThrows(GraphQLRuntimeException.class, () -> EventWriteAccess.requireWrite(context, EVENT_ID));
  }

}
