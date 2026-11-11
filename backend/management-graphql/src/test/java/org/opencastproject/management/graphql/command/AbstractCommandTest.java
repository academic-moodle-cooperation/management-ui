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
import org.opencastproject.elasticsearch.api.SearchResultItem;
import org.opencastproject.elasticsearch.index.ElasticsearchIndex;
import org.opencastproject.elasticsearch.index.objects.event.Event;
import org.opencastproject.elasticsearch.index.objects.event.EventSearchQuery;
import org.opencastproject.graphql.execution.context.OpencastContext;
import org.opencastproject.graphql.execution.context.OpencastContextManager;
import org.opencastproject.security.api.JaxbOrganization;
import org.opencastproject.security.api.JaxbRole;
import org.opencastproject.security.api.JaxbUser;

import org.easymock.EasyMock;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;

import java.util.Set;

import graphql.schema.DataFetchingEnvironment;

/**
 * Shared setup for command tests: an {@link OpencastContext} backed by a mocked {@link BundleContext}, so that
 * services can be registered per test via {@link #mockService(Class, Object)}.
 */
abstract class AbstractCommandTest {

  protected static final JaxbOrganization DEFAULT_ORGANIZATION = new JaxbOrganization("mh_default_org");
  protected static final JaxbUser DEFAULT_USER = new JaxbUser("user", null, DEFAULT_ORGANIZATION,
      Set.of(new JaxbRole("ROLE_USER", DEFAULT_ORGANIZATION)));

  protected BundleContext bundleContext;
  protected DataFetchingEnvironment environment;
  protected OpencastContext context;

  @BeforeEach
  void setUpContext() {
    bundleContext = EasyMock.createMock(BundleContext.class);
    environment = EasyMock.createMock(DataFetchingEnvironment.class);
    context = OpencastContextManager.initiateContext(bundleContext);
    context.setOrganization(DEFAULT_ORGANIZATION);
    context.setUser(DEFAULT_USER);
  }

  @AfterEach
  void tearDownContext() {
    OpencastContextManager.clearContext();
  }

  @SuppressWarnings("unchecked")
  protected <T> void mockService(Class<T> type, T service) {
    ServiceReference<T> reference = EasyMock.createMock(ServiceReference.class);
    EasyMock.expect(bundleContext.getServiceReference(type)).andReturn(reference).anyTimes();
    EasyMock.expect(bundleContext.getService(reference)).andReturn(service).anyTimes();
  }

  /** Let the write access lookup in the index find the event. */
  protected static void expectWritableEvent(ElasticsearchIndex index, Event event) throws SearchIndexException {
    EasyMock.expect(index.getByQuery(EasyMock.anyObject(EventSearchQuery.class))).andReturn(searchResult(event));
  }

  /** Let the write access lookup in the index find nothing. */
  protected static void expectNoWritableEvent(ElasticsearchIndex index) throws SearchIndexException {
    EasyMock.expect(index.getByQuery(EasyMock.anyObject(EventSearchQuery.class))).andReturn(searchResult());
  }

  @SuppressWarnings("unchecked")
  protected static SearchResult<Event> searchResult(Event... events) {
    SearchResultItem<Event>[] items = new SearchResultItem[events.length];
    for (int i = 0; i < events.length; i++) {
      items[i] = EasyMock.createNiceMock(SearchResultItem.class);
      EasyMock.expect(items[i].getSource()).andReturn(events[i]).anyTimes();
      EasyMock.replay(items[i]);
    }
    SearchResult<Event> result = EasyMock.createNiceMock(SearchResult.class);
    EasyMock.expect(result.getPageSize()).andReturn((long) events.length).anyTimes();
    EasyMock.expect(result.getItems()).andReturn(items).anyTimes();
    EasyMock.replay(result);
    return result;
  }

}
