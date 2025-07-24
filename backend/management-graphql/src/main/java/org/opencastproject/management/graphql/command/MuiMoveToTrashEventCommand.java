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

import org.opencastproject.assetmanager.api.AssetManager;
import org.opencastproject.assetmanager.util.Workflows;
import org.opencastproject.graphql.command.AbstractCommand;
import org.opencastproject.graphql.event.GqlDeleteEventPayload;
import org.opencastproject.graphql.exception.GraphQLRuntimeException;
import org.opencastproject.graphql.exception.OpencastErrorType;
import org.opencastproject.graphql.execution.context.OpencastContext;
import org.opencastproject.graphql.execution.context.OpencastContextManager;
import org.opencastproject.util.NotFoundException;
import org.opencastproject.workflow.api.ConfiguredWorkflow;
import org.opencastproject.workflow.api.WorkflowDatabaseException;
import org.opencastproject.workflow.api.WorkflowDefinition;
import org.opencastproject.workflow.api.WorkflowService;

import java.util.Collections;

public class MuiMoveToTrashEventCommand extends AbstractCommand<GqlDeleteEventPayload> {

  private final String id;

  private final String trashWorkflowId;

  public MuiMoveToTrashEventCommand(final Builder builder) {
    super(builder);
    this.id = builder.id;
    this.trashWorkflowId = builder.trashWorkflowId;
  }

  public static Builder create(String id, String trashWorkflowId) {
    return new Builder(id, trashWorkflowId);
  }

  @Override
  public GqlDeleteEventPayload execute() {
    OpencastContext context = OpencastContextManager.getCurrentContext();
    final WorkflowService workflowService = context.getService(WorkflowService.class);
    final AssetManager assetManager = context.getService(AssetManager.class);

    WorkflowDefinition workflowDefinition = null;
    try {
      workflowDefinition = workflowService.getWorkflowDefinitionById(trashWorkflowId);
    } catch (WorkflowDatabaseException | NotFoundException e) {
      throw new GraphQLRuntimeException(e);
    }

    Workflows workflows = new Workflows(assetManager, workflowService);
    ConfiguredWorkflow configuredWorkflow = new ConfiguredWorkflow(workflowDefinition, Collections.emptyMap());
    var partialResult = workflows.applyWorkflowToLatestVersion(Collections.singleton(id), configuredWorkflow).toList();
    if (partialResult.size() != 1) {
      throw new GraphQLRuntimeException(
          "Expected 1 result, got " + partialResult.size(),
          OpencastErrorType.InternalError
      );
    }
    return new GqlDeleteEventPayload(id);
  }

  public static class Builder extends AbstractCommand.Builder<GqlDeleteEventPayload>  {

    protected final String id;

    protected final String trashWorkflowId;

    Builder(final String id, final String trashWorkflowId) {
      this.id = id;
      this.trashWorkflowId = trashWorkflowId;
    }

    @Override
    public void validate() {
      super.validate();

      if (id == null) {
        throw new IllegalArgumentException("Id can not be null.");
      }

      if (trashWorkflowId == null) {
        throw new IllegalArgumentException("Trash workflow id can not be null.");
      }

    }

    public MuiMoveToTrashEventCommand build() {
      validate();

      return new MuiMoveToTrashEventCommand(this);
    }

  }


}

