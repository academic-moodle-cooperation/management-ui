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

import org.osgi.service.metatype.annotations.ObjectClassDefinition;

@ObjectClassDefinition(name = "MUI - Management UI Configuration",
    description = "This configuration manages MUI functionalities."
)
public @interface MuiConfig {

  String CONFIGURATION_PID = "org.opencastproject.mui";

  String republish_workflow_id() default "republish-metadata";

  /**
   * Deliberately the only option without a default. Its absence is how a
   * deployment selects permanent deletion — the behaviour plain Opencast has,
   * since it ships no trash workflow. Giving it a default would remove that
   * choice and break deletion on every server lacking a workflow by that name.
   * The fallback is logged as a warning in {@code MuiMutation#deleteEvent}.
   */
  String trash_workflow_id();

  String thumbnail_channel_id() default "engage-player";

  String thumbnail_flavor() default "*/search+preview";

  String publication_channel_id() default "engage-player";

  String[] managed_acl_order() default {"public", "authenticated", "private"};

}

