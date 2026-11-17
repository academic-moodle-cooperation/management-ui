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

import org.opencastproject.graphql.command.AbstractCommand;
import org.opencastproject.graphql.command.DeleteEventCommand;
import org.opencastproject.graphql.event.GqlDeleteEventPayload;
import org.opencastproject.graphql.execution.context.OpencastContext;
import org.opencastproject.graphql.execution.context.OpencastContextManager;
import org.opencastproject.management.graphql.MuiConfig;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Deletes an event: reversibly through the trash workflow when one is configured,
 * permanently through Opencast's own delete otherwise.
 *
 * <p>Both ways only need READ on the event to get going: the trash workflow is
 * applied to the latest snapshot, and the permanent delete starts a retract workflow
 * the same way whenever the event is published. Deleting is a write, so this command
 * checks WRITE once, before choosing either way.
 */
public class MuiDeleteEventCommand extends AbstractCommand<GqlDeleteEventPayload> {

  private static final Logger logger = LoggerFactory.getLogger(MuiDeleteEventCommand.class);

  private final String id;

  private final String trashWorkflowId;

  public MuiDeleteEventCommand(final Builder builder) {
    super(builder);
    this.id = builder.id;
    this.trashWorkflowId = builder.trashWorkflowId;
  }

  public static Builder create(String id) {
    return new Builder(id);
  }

  @Override
  public GqlDeleteEventPayload execute() {
    final OpencastContext context = OpencastContextManager.getCurrentContext();
    EventWriteAccess.requireWrite(context, id);

    // An explicitly configured but blank value is NOT treated as "absent": a
    // blank value is far more likely a mistake than an intent to destroy
    // recordings, so it keeps failing loudly in the trash command.
    if (trashWorkflowId != null) {
      return MuiMoveToTrashEventCommand.create(id, trashWorkflowId)
          .environment(environment)
          .build()
          .execute();
    }

    // Deleting for good is not something an operator should discover from
    // the data being gone — say so where deployments actually look.
    logger.warn(
        "No trash workflow configured ({}.trash.workflow.id is unset), so event {} is being "
            + "deleted permanently and cannot be restored. Set that key to a workflow the server "
            + "has if deletions should be reversible.",
        MuiConfig.CONFIGURATION_PID, id);
    return DeleteEventCommand.create(id)
        .environment(environment)
        .build()
        .execute();
  }

  public static class Builder extends AbstractCommand.Builder<GqlDeleteEventPayload> {

    protected final String id;

    protected String trashWorkflowId;

    Builder(final String id) {
      this.id = id;
    }

    /**
     * The workflow that moves the event to the trash; {@code null} selects permanent deletion.
     */
    public Builder trashWorkflowId(final String trashWorkflowId) {
      this.trashWorkflowId = trashWorkflowId;
      return this;
    }

    @Override
    public void validate() {
      super.validate();

      if (id == null) {
        throw new IllegalArgumentException("Id can not be null.");
      }
    }

    @Override
    public MuiDeleteEventCommand build() {
      validate();

      return new MuiDeleteEventCommand(this);
    }

  }

}
