# Quiz Plugin - Deployment Guide

## Overview

The Quiz Plugin is a **fully encapsulated** plugin that can be installed as a JAR without modifying Opencast core. This guide explains how to build, package, and deploy it.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Opencast Core                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ GraphQL System                                      │ │
│  │ - Discovers GraphQLExtensionProvider               │ │
│  │ - Registers @GraphQLTypeExtension classes           │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
              ↑
              │ Extension (OSGi Bundle)
              │
┌─────────────────────────────────────────────────────────┐
│  Quiz Plugin Backend (JAR)                              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ QuizGraphQLProvider                                  │ │
│  │ - Implements GraphQLExtensionProvider               │ │
│  │ - Auto-discovered by Opencast                       │ │
│  │                                                       │ │
│  │ QuizEventExtension                                   │ │
│  │ - Extends GqlEvent with quizInfo                     │ │
│  │                                                       │ │
│  │ QuizMutationExtension                                │ │
│  │ - Extends Mutation with quiz()                       │ │
│  │                                                       │ │
│  │ QuizService                                          │ │
│  │ - Abstraction layer                                  │ │
│  │ - Uses ConvexQuizDataStore (or Opencast DB)         │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
              ↑
              │ HTTP API
              │
┌─────────────────────────────────────────────────────────┐
│  Convex (External DBaaS)                                 │
│  - Quiz Definitions                                      │
│  - Submissions                                           │
│  - Real-time Updates                                     │
└─────────────────────────────────────────────────────────┘
```

## Building the Plugin

### Prerequisites

- Maven 3.6+
- Java 21+
- Access to Opencast dependencies

### Build Steps

1. **Build the backend module** (plugin lives in `.local-plugins/`):
   ```bash
   cd .local-plugins/quiz-plugin/backend
   mvn clean install
   ```

2. **Verify the JAR was created**:
   ```bash
   ls -lh target/quiz-plugin-backend-1.0-SNAPSHOT.jar
   ```

3. **Check the JAR contents** (optional):
   ```bash
   jar -tf target/quiz-plugin-backend-1.0-SNAPSHOT.jar | head -20
   ```

   You should see:
   - `META-INF/MANIFEST.MF` (with OSGi headers)
   - `org/opencastproject/quiz/plugin/` (Java classes)
   - `Management-Plugin: quiz` (plugin identifier)

## Deployment

### Option 1: Direct JAR Deployment

1. **Copy JAR to Opencast deploy directory**:
   ```bash
   cp .local-plugins/quiz-plugin/backend/target/quiz-plugin-backend-1.0-SNAPSHOT.jar \
      $OPENCAST_HOME/deploy/
   ```

2. **Restart Opencast** (or wait for hot deployment):
   ```bash
   # Opencast will automatically detect and load the OSGi bundle
   ```

3. **Verify deployment**:
   - Check Opencast logs for: `"Quiz Plugin GraphQL Provider"`
   - Check OSGi console: `bundle:list | grep quiz`
   - Test GraphQL query: `query { eventById(id: "...") { quizInfo { hasQuiz } } }`

### Option 2: Maven Install (Development)

If you're building from the monorepo:

```bash
# From root directory
mvn clean install

# The JAR will be in:
# .local-plugins/quiz-plugin/backend/target/quiz-plugin-backend-1.0-SNAPSHOT.jar
```

### Option 3: Assembly (Distribution)

Create an assembly that includes both backend and frontend:

```xml
<!-- assemblies/quiz-plugin-assembly/pom.xml -->
<assembly>
  <id>quiz-plugin</id>
  <formats>
    <format>zip</format>
  </formats>
  <fileSets>
    <fileSet>
      <directory>.local-plugins/quiz-plugin/backend/target</directory>
      <outputDirectory>/</outputDirectory>
      <includes>
        <include>quiz-plugin-backend-*.jar</include>
      </includes>
    </fileSet>
    <fileSet>
      <directory>.local-plugins/quiz-plugin/dist</directory>
      <outputDirectory>/frontend</outputDirectory>
      <includes>
        <include>quiz-plugin.mjs</include>
      </includes>
    </fileSet>
  </fileSets>
</assembly>
```

## Configuration

### Environment Variables

Set Convex URL (if using Convex):

```bash
# In Opencast startup script or systemd service
export CONVEX_URL=https://your-deployment.convex.cloud
```

### OSGi Configuration (Optional)

Create a config file for advanced settings:

```bash
# $OPENCAST_HOME/etc/org.opencastproject.quiz.plugin.cfg
convex.url=https://your-deployment.convex.cloud
convex.api.key=your-api-key
```

Then update `QuizService` to read from OSGi config:

```java
@Component(service = QuizService.class)
@ConfigurationPolicy.REQUIRE
public class QuizService {
  
  @Reference
  private ConfigurationAdmin configAdmin;
  
  @Activate
  public void activate(ComponentContext context) {
    Dictionary<String, Object> props = context.getProperties();
    String convexUrl = (String) props.get("convex.url");
    // ...
  }
}
```

## Verification

### 1. Check OSGi Bundle Status

```bash
# Via Karaf console
bundle:list | grep quiz

# Should show:
# [ACTIVE] quiz-plugin-backend (1.0.0.SNAPSHOT)
```

### 2. Check GraphQL Schema

Query the GraphQL schema:

```graphql
query Introspection {
  __type(name: "Event") {
    fields {
      name
      type {
        name
      }
    }
  }
}
```

You should see `quizInfo` in the Event type fields.

### 3. Test GraphQL Query

```graphql
query TestQuizInfo($eventId: String!) {
  eventById(id: $eventId) {
    id
    title
    quizInfo {
      hasQuiz
      quizId
      isActive
      title
      questionCount
    }
  }
}
```

### 4. Test GraphQL Mutation

```graphql
mutation TestCreateQuiz($eventId: String!, $quiz: QuizInput!) {
  quiz {
    createQuiz(eventId: $eventId, quiz: $quiz) {
      id
      title
    }
  }
}
```

## Frontend Plugin Deployment

The frontend plugin can be deployed separately:

### Option 1: Marketplace (Developer Mode)

1. Build the plugin:
   ```bash
   cd plugins/quiz-plugin
   pnpm build
   ```

2. Serve the plugin:
   ```bash
   # Via any static file server
   python -m http.server 3001 --directory dist
   ```

3. Load in Marketplace:
   - Go to Marketplace → Developer Mode
   - Enter URL: `http://127.0.0.1:3001/quiz-plugin.mjs`

### Option 2: Bundle with Application

1. Copy plugin to assets:
   ```bash
   cp plugins/quiz-plugin/dist/quiz-plugin.mjs \
      apps/management-ui-core/public/plugins/
   ```

2. Register in `dynamic-modules.json`:
   ```json
   {
     "modules": [
       {
         "id": "quiz",
         "url": "/plugins/quiz-plugin.mjs"
       }
     ]
   }
   ```

### Option 3: Plugin Registry

1. Upload to registry:
   ```bash
   # Via registry API
   curl -X POST https://registry.example.com/plugins \
     -F "plugin=@plugins/quiz-plugin/dist/quiz-plugin.mjs" \
     -F "metadata=@plugins/quiz-plugin/package.json"
   ```

2. Install via Marketplace:
   - Go to Marketplace
   - Find "Quiz Plugin"
   - Click "Install"

## Troubleshooting

### JAR Not Loading

**Problem**: JAR is in `deploy/` but not loading.

**Solutions**:
1. Check OSGi logs: `tail -f $OPENCAST_HOME/data/log/opencast.log | grep quiz`
2. Verify JAR is valid: `jar -tf quiz-plugin-backend-*.jar | grep MANIFEST`
3. Check OSGi headers: `unzip -p quiz-plugin-backend-*.jar META-INF/MANIFEST.MF`
4. Ensure dependencies are available (opencast-graphql, etc.)

### GraphQL Extensions Not Appearing

**Problem**: `quizInfo` field not in GraphQL schema.

**Solutions**:
1. Verify `QuizGraphQLProvider` is registered:
   ```bash
   # Check logs for:
   # "Quiz Plugin GraphQL Provider" registered
   ```
2. Check `@GraphQLTypeExtension` annotations are correct
3. Verify Opencast GraphQL version compatibility
4. Restart Opencast to reload extensions

### Convex Connection Issues

**Problem**: Quiz data not loading from Convex.

**Solutions**:
1. Verify `CONVEX_URL` environment variable is set
2. Check Convex deployment is active: `npx convex status`
3. Test Convex API directly:
   ```bash
   curl -X POST https://your-deployment.convex.cloud/api/query \
     -H "Content-Type: application/json" \
     -d '{"path":"quiz:getQuiz","args":{"eventId":"test"}}'
   ```
4. Check backend logs for Convex errors

## Uninstallation

To remove the plugin:

1. **Stop Opencast** (recommended):
   ```bash
   systemctl stop opencast
   ```

2. **Remove JAR**:
   ```bash
   rm $OPENCAST_HOME/deploy/quiz-plugin-backend-*.jar
   ```

3. **Restart Opencast**:
   ```bash
   systemctl start opencast
   ```

4. **Verify removal**:
   ```bash
   bundle:list | grep quiz  # Should show nothing
   ```

## Best Practices

1. **Versioning**: Use semantic versioning for plugin JARs
2. **Dependencies**: Minimize dependencies on Opencast internals
3. **Configuration**: Use OSGi config for settings (not hardcoded)
4. **Logging**: Use SLF4J for logging (not System.out)
5. **Testing**: Test in isolated Opencast instance first
6. **Documentation**: Include README with installation instructions

## Summary

✅ **Fully Encapsulated**: No Opencast core changes required  
✅ **JAR Deployment**: Simple copy-to-deploy workflow  
✅ **OSGi Integration**: Automatic discovery and activation  
✅ **GraphQL Extensions**: Seamless schema extension  
✅ **Hybrid Database**: Flexible data storage (Convex or Opencast DB)  

The Quiz Plugin demonstrates how to create a production-ready, distributable plugin for Management UI! 🚀
