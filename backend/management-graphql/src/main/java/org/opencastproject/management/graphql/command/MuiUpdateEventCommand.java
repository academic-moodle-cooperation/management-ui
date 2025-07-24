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

import org.opencastproject.elasticsearch.index.ElasticsearchIndex;
import org.opencastproject.graphql.command.UpdateEventCommand;
import org.opencastproject.graphql.event.GqlEvent;
import org.opencastproject.graphql.exception.GraphQLRuntimeException;
import org.opencastproject.graphql.execution.context.OpencastContext;
import org.opencastproject.graphql.execution.context.OpencastContextManager;
import org.opencastproject.graphql.type.input.GqlCommonEventMetadataInput;
import org.opencastproject.index.service.api.IndexService;
import org.opencastproject.index.service.exception.IndexServiceException;
import org.opencastproject.security.api.UnauthorizedException;
import org.opencastproject.util.NotFoundException;
import org.opencastproject.workflow.api.WorkflowDatabaseException;
import org.opencastproject.workflow.api.WorkflowDefinition;
import org.opencastproject.workflow.api.WorkflowParsingException;
import org.opencastproject.workflow.api.WorkflowService;

public class MuiUpdateEventCommand extends UpdateEventCommand {

  private final String workflowPublishId;

  public MuiUpdateEventCommand(final Builder builder) {
    super(builder);
    this.workflowPublishId = builder.publishWorkflowId;
  }

  @Override
  public GqlEvent execute() {
    OpencastContext context = OpencastContextManager.getCurrentContext();
    final ElasticsearchIndex index = context.getService(ElasticsearchIndex.class);
    final IndexService indexService = context.getService(IndexService.class);

    GqlEvent event = super.execute();

    Boolean publishChanges = environment.getArgument("publishChanges");
    if (publishChanges) {
      WorkflowService ws = context.getService(WorkflowService.class);
      try {
        WorkflowDefinition wd = ws.getWorkflowDefinitionById(workflowPublishId);
        ws.start(wd,indexService.getEventMediapackage(event.getEvent()));
      } catch (WorkflowDatabaseException | NotFoundException | UnauthorizedException | IndexServiceException
               | WorkflowParsingException e) {
        throw new GraphQLRuntimeException(e);
      }
    }

    return event;
  }

  public static Builder create(String eventId, GqlCommonEventMetadataInput eventMetadataInput) {
    return new Builder(eventId, eventMetadataInput);
  }

  public static class Builder extends UpdateEventCommand.Builder {

    private String publishWorkflowId;

    public Builder(String eventId, GqlCommonEventMetadataInput eventMetadataInput) {
      super(eventId, eventMetadataInput);
    }

    public Builder publishWorkflowId(String workflowId) {
      this.publishWorkflowId = workflowId;
      return this;
    }

    @Override
    public void validate() {
      super.validate();
    }

    @Override
    public MuiUpdateEventCommand build() {
      validate();
      return new MuiUpdateEventCommand(this);
    }
  }

}
