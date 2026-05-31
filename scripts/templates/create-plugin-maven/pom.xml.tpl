<?xml version="1.0" encoding="UTF-8"?>
<!--
  Management UI plugin POM template.

  Produces a deployable OSGi JAR that Opencast loads via the
  PluginBundleTracker. The build:

  1. Runs `pnpm install && pnpm build` in the plugin root (one level up)
     to produce dist/<plugin-name>.mjs (+ optional .css and assets/).
     Skip with -Dskip.frontend.build=true if you already built the
     frontend yourself.
  2. Copies dist/, plugin.json, and locales/ into target/classes/static/
     plugins/<pluginId>/.
  3. Packages everything as an OSGi bundle with the Management-Plugin
     header so Opencast's backend tracker discovers it.

  Deployment:

      mvn package
      cp target/__PLUGIN_NAME__-1.0.0-SNAPSHOT.jar $OPENCAST_HOME/deploy/

  Or, to copy automatically on `mvn install`:

      mvn install -DdeployTo=/path/to/opencast/home

  See docs/plugins/distribution.md (Path 3 — JAR) for the full story.
-->
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <!--
    Inherit from Opencast's base parent for OSGi packaging defaults,
    maven-bundle-plugin extension wiring, and Karaf/Opencast version
    coordination. External plugin authors need org.opencastproject's
    Maven repo reachable from their build environment.
  -->
  <parent>
    <groupId>org.opencastproject</groupId>
    <artifactId>base</artifactId>
    <version>19-SNAPSHOT</version>
  </parent>

  <!--
    TODO: pick a groupId that identifies your org. The artifactId
    matches the plugin id; the version is the plugin's own version
    and should track plugin.json's `version` field.
  -->
  <groupId>org.opencast.mui-plugin</groupId>
  <artifactId>__PLUGIN_NAME__</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <packaging>bundle</packaging>

  <name>Management UI Plugin :: __PLUGIN_PASCAL_NAME__</name>
  <description>TODO: one or two sentences describing what this plugin does.</description>

  <properties>
    <pluginId>__PLUGIN_NAME__</pluginId>

    <!--
      Skip checkstyle: external plugin repos don't ship the suppression
      file the Opencast parent expects. The Management UI repo itself
      has its own copy under docs/checkstyle/.
    -->
    <checkstyle.skip>true</checkstyle.skip>

    <!--
      Set to true to skip the frontend build during `mvn package`.
      Useful when you've already run `pnpm build` (e.g. in a CI step
      that builds the frontend separately, or when iterating locally).
    -->
    <skip.frontend.build>false</skip.frontend.build>

    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <node.version>v24.12.0</node.version>
    <pnpm.version>v10.28.0</pnpm.version>

    <!--
      Opencast deployment is the canonical Java target — match what
      Opencast itself uses.
    -->
    <maven.compiler.source>21</maven.compiler.source>
    <maven.compiler.target>21</maven.compiler.target>
  </properties>

  <build>
    <plugins>
      <!--
        1) Install Node + pnpm and run the plugin's `pnpm build`.

        Runs `pnpm install` (with a frozen lockfile) then `pnpm run build` from the
        plugin root (one level up from this POM). The build is expected
        to produce dist/<pluginId>.mjs (and optionally dist/<pluginId>.css,
        dist/assets/**).

        The Node installation lives under ${project.basedir}/../node so it
        doesn't pollute the Maven build directory and is reusable across
        `mvn clean` runs.
      -->
      <plugin>
        <groupId>com.github.eirslett</groupId>
        <artifactId>frontend-maven-plugin</artifactId>
        <version>1.15.0</version>
        <configuration>
          <skip>${skip.frontend.build}</skip>
          <nodeVersion>${node.version}</nodeVersion>
          <pnpmVersion>${pnpm.version}</pnpmVersion>
          <installDirectory>${project.basedir}/..</installDirectory>
          <workingDirectory>${project.basedir}/..</workingDirectory>
        </configuration>
        <executions>
          <execution>
            <id>install-node-and-pnpm</id>
            <phase>generate-resources</phase>
            <goals><goal>install-node-and-pnpm</goal></goals>
          </execution>
          <execution>
            <id>pnpm install</id>
            <phase>generate-resources</phase>
            <goals><goal>pnpm</goal></goals>
            <configuration>
              <skip>${skip.frontend.build}</skip>
              <arguments>install --frozen-lockfile</arguments>
            </configuration>
          </execution>
          <execution>
            <id>pnpm build</id>
            <phase>generate-resources</phase>
            <goals><goal>pnpm</goal></goals>
            <configuration>
              <skip>${skip.frontend.build}</skip>
              <arguments>run build</arguments>
            </configuration>
          </execution>
        </executions>
      </plugin>

      <!--
        2) Copy the built frontend + manifest + locales into the bundle
        at static/plugins/<pluginId>/. The Opencast PluginBundleTracker
        looks for plugin.json under this exact path; missing it falls
        back to filename-convention discovery (*.mjs).
      -->
      <plugin>
        <artifactId>maven-resources-plugin</artifactId>
        <executions>
          <execution>
            <id>copy-frontend</id>
            <phase>process-resources</phase>
            <goals><goal>copy-resources</goal></goals>
            <configuration>
              <outputDirectory>${project.build.outputDirectory}/static/plugins/${pluginId}</outputDirectory>
              <resources>
                <resource>
                  <directory>${project.basedir}/../dist</directory>
                  <filtering>false</filtering>
                </resource>
              </resources>
            </configuration>
          </execution>
          <execution>
            <id>copy-plugin-manifest</id>
            <phase>process-resources</phase>
            <goals><goal>copy-resources</goal></goals>
            <configuration>
              <outputDirectory>${project.build.outputDirectory}/static/plugins/${pluginId}</outputDirectory>
              <resources>
                <resource>
                  <directory>${project.basedir}/..</directory>
                  <filtering>false</filtering>
                  <includes>
                    <include>plugin.json</include>
                  </includes>
                </resource>
              </resources>
            </configuration>
          </execution>
          <execution>
            <id>copy-locales</id>
            <phase>process-resources</phase>
            <goals><goal>copy-resources</goal></goals>
            <configuration>
              <outputDirectory>${project.build.outputDirectory}/static/plugins/${pluginId}/locales</outputDirectory>
              <resources>
                <resource>
                  <directory>${project.basedir}/../locales</directory>
                  <filtering>false</filtering>
                  <includes>
                    <include>**/*.json</include>
                  </includes>
                </resource>
              </resources>
            </configuration>
          </execution>
        </executions>
      </plugin>

      <!--
        3) Build the OSGi bundle with the headers Opencast's
        PluginBundleTracker reads.

        Required headers:
          - Management-Plugin    plugin id; the tracker uses this to
                                 locate the static/plugins/<id>/ tree.
          - Http-Alias           URL prefix Opencast serves the static
                                 assets at (matches what the shell
                                 fetches via plugins.json).
          - Http-Classpath       JAR-internal directory served at the
                                 alias above.
          - Include-Resource     embeds the static/ tree into the JAR.

        Optional headers (uncomment if your plugin needs them):
          - Management-Plugin-Css      explicit CSS stem if the file
                                       name doesn't match <pluginId>.css
          - Management-Plugin-I18n     comma-separated i18n namespaces
                                       (e.g. ${pluginId},${pluginId}-extra)
      -->
      <plugin>
        <groupId>org.apache.felix</groupId>
        <artifactId>maven-bundle-plugin</artifactId>
        <extensions>true</extensions>
        <configuration>
          <instructions>
            <Management-Plugin>${pluginId}</Management-Plugin>
            <Http-Alias>/management-ui/static/plugins/${pluginId}</Http-Alias>
            <Http-Classpath>/static/plugins/${pluginId}</Http-Classpath>
            <Include-Resource>static/=${project.build.outputDirectory}/static</Include-Resource>
          </instructions>
        </configuration>
      </plugin>

      <!--
        4) Optional convenience: copy the built JAR straight into
        $OPENCAST_HOME/deploy/ on `mvn install` when -DdeployTo is set.

            mvn install -DdeployTo=/opt/opencast

        Without -DdeployTo this step is a no-op.
      -->
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-antrun-plugin</artifactId>
        <executions>
          <execution>
            <id>copy-to-opencast-deploy-dir</id>
            <phase>install</phase>
            <configuration>
              <target if="deployTo">
                <delete dir="${deployTo}/deploy/${project.build.finalName}"/>
                <copy file="${project.build.directory}/${project.build.finalName}.jar"
                      todir="${deployTo}/deploy"
                      failonerror="false"/>
              </target>
            </configuration>
            <goals><goal>run</goal></goals>
          </execution>
        </executions>
      </plugin>
    </plugins>
  </build>

</project>
