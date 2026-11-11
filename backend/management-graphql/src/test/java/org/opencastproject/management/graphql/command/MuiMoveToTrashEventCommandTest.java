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

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.opencastproject.assetmanager.api.AssetManager;
import org.opencastproject.elasticsearch.index.ElasticsearchIndex;
import org.opencastproject.elasticsearch.index.objects.event.Event;
import org.opencastproject.graphql.command.AbstractCommand;
import org.opencastproject.graphql.event.GqlDeleteEventPayload;
import org.opencastproject.graphql.exception.GraphQLNotFoundException;
import org.opencastproject.graphql.exception.GraphQLUnauthorizedException;
import org.opencastproject.index.service.api.IndexService;
import org.opencastproject.workflow.api.WorkflowService;

import org.easymock.EasyMock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

class MuiMoveToTrashEventCommandTest extends AbstractCommandTest {

  private static final String EVENT_ID = "event-1";
  private static final String TRASH_WORKFLOW_ID = "trash";

  private ElasticsearchIndex index;
  private IndexService indexService;
  private WorkflowService workflowService;
  private AssetManager assetManager;

  @BeforeEach
  void setUp() {
    index = EasyMock.createMock(ElasticsearchIndex.class);
    indexService = EasyMock.createMock(IndexService.class);
    // No calls are expected on these: the write check has to fail before the workflow is looked up.
    workflowService = EasyMock.createStrictMock(WorkflowService.class);
    assetManager = EasyMock.createStrictMock(AssetManager.class);
    mockService(ElasticsearchIndex.class, index);
    mockService(IndexService.class, indexService);
    mockService(WorkflowService.class, workflowService);
    mockService(AssetManager.class, assetManager);
  }

  @Test
  void rejectsEventTheUserMayOnlyReadBeforeTouchingTheWorkflow() throws Exception {
    expectNoWritableEvent(index);
    EasyMock.expect(indexService.getEvent(EVENT_ID, index))
        .andReturn(Optional.of(new Event(EVENT_ID, "mh_default_org")));
    EasyMock.replay(bundleContext, index, indexService, workflowService, assetManager);

    assertThrows(GraphQLUnauthorizedException.class, () -> build().execute());

    EasyMock.verify(index, indexService, workflowService, assetManager);
  }

  @Test
  void throwsNotFoundBeforeTouchingTheWorkflowWhenEventDoesNotExist() throws Exception {
    expectNoWritableEvent(index);
    EasyMock.expect(indexService.getEvent(EVENT_ID, index)).andReturn(Optional.empty());
    EasyMock.replay(bundleContext, index, indexService, workflowService, assetManager);

    assertThrows(GraphQLNotFoundException.class, () -> build().execute());

    EasyMock.verify(index, indexService, workflowService, assetManager);
  }

  @Test
  void buildFailsWhenTrashWorkflowIdIsNull() {
    assertThrows(IllegalArgumentException.class, () -> MuiMoveToTrashEventCommand.create(EVENT_ID, null)
        .environment(environment)
        .build());
  }

  private AbstractCommand<GqlDeleteEventPayload> build() {
    return MuiMoveToTrashEventCommand.create(EVENT_ID, TRASH_WORKFLOW_ID).environment(environment).build();
  }

}
