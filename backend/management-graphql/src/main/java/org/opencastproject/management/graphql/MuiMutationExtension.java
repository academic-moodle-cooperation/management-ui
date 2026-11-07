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

import org.opencastproject.graphql.directive.RolesAllowed;
import org.opencastproject.graphql.type.input.Mutation;

import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;

@GraphQLTypeExtension(Mutation.class)
public final class MuiMutationExtension {

  private MuiMutationExtension() {
  }

  // Every mutation under `mui` changes data, so all of them require a signed-in
  // user. Gating the entry field covers them at once and matches how the
  // upstream mutation extensions guard their fields.
  @GraphQLField
  @RolesAllowed("ROLE_USER")
  public static MuiMutation mui() {
    return new MuiMutation();
  }

}
