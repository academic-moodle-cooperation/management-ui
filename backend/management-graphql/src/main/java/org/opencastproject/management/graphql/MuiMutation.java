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

import org.opencastproject.graphql.command.DeleteEventCommand;
import org.opencastproject.graphql.command.UpdateSeriesCommand;
import org.opencastproject.graphql.defaultvalue.DefaultTrue;
import org.opencastproject.graphql.event.GqlDeleteEventPayload;
import org.opencastproject.graphql.event.GqlEvent;
import org.opencastproject.graphql.type.input.AccessControlListInput;
import org.opencastproject.graphql.type.input.GqlCommonEventMetadataInput;
import org.opencastproject.graphql.type.input.GqlCommonSeriesMetadataInput;
import org.opencastproject.management.graphql.command.MuiMoveToTrashEventCommand;
import org.opencastproject.management.graphql.command.MuiUpdateEventAclCommand;
import org.opencastproject.management.graphql.command.MuiUpdateEventCommand;

import graphql.annotations.annotationTypes.GraphQLDefaultValue;
import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLNonNull;
import graphql.schema.DataFetchingEnvironment;

@GraphQLName(MuiMutation.TYPE_NAME)
public class MuiMutation {

  public static final String TYPE_NAME = "MuiMutation";

  @GraphQLField
  @GraphQLNonNull
  @GraphQLDescription("Update event metadata")
  public GqlEvent updateEvent(
      @GraphQLName("id") @GraphQLNonNull String id,
      @GraphQLName("metadata") @GraphQLNonNull GqlCommonEventMetadataInput eventMetadataInput,
      @GraphQLName("acl") AccessControlListInput aclInput,
      @GraphQLName("publishChanges") @GraphQLDefaultValue(DefaultTrue.class) Boolean publishChanges,
      final DataFetchingEnvironment environment) {
    String publishWorkflowId = GraphQLProvider.getConfig().republish_workflow_id();
    return MuiUpdateEventCommand
        .create(id, eventMetadataInput)
        .publishWorkflowId(publishWorkflowId)
        .environment(environment)
        .build()
        .execute();
  }

  @GraphQLField
  @GraphQLNonNull
  @GraphQLDescription("Update event acl")
  public static GqlEvent updateEventAcl(
      @GraphQLName("id") @GraphQLNonNull String id,
      @GraphQLName("acl") @GraphQLNonNull AccessControlListInput aclInput,
      @GraphQLName("publishChanges") @GraphQLDefaultValue(DefaultTrue.class) Boolean publishChanges,
      final DataFetchingEnvironment environment) {
    String publishWorkflowId = GraphQLProvider.getConfig().republish_workflow_id();
    return MuiUpdateEventAclCommand
        .create(id)
        .publishWorkflowId(publishWorkflowId)
        .environment(environment)
        .build()
        .execute();
  }

  @GraphQLField
  @GraphQLDescription("Delete event")
  public static GqlDeleteEventPayload deleteEvent(
      @GraphQLName("id") @GraphQLNonNull String id,
      final DataFetchingEnvironment environment) {
    String trashWorkflowId = GraphQLProvider.getConfig().trash_workflow_id();
    if (trashWorkflowId != null) {
      return MuiMoveToTrashEventCommand.create(id, trashWorkflowId)
          .environment(environment)
          .build()
          .execute();
    } else {
      return DeleteEventCommand.create(id)
          .environment(environment)
          .build()
          .execute();
    }
  }

  @GraphQLField
  @GraphQLNonNull
  @GraphQLDescription("Update series metadata")
  public static Boolean updateSeries(
      @GraphQLName("id") @GraphQLNonNull String id,
      @GraphQLName("metadata") @GraphQLNonNull GqlCommonSeriesMetadataInput seriesMetadataInput,
      @GraphQLName("acl") AccessControlListInput aclInput,
      final DataFetchingEnvironment environment) {
    UpdateSeriesCommand.create(id, seriesMetadataInput)
        .environment(environment)
        .build()
        .execute();
    return true;
  }

}
