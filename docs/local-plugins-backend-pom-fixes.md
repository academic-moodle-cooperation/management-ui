# Backend POM fixes when backend lives in .local-plugins/<plugin>/backend

When the backend module is at `.local-plugins/quiz-plugin/backend` or `.local-plugins/my-org-plugin/backend`, paths must be relative to that directory. Apply these edits if the build fails.

## Quiz plugin (`.local-plugins/quiz-plugin/backend/pom.xml`)

1. **Copy-resources directory**  
   Change:
   ```xml
   <directory>${basedir}/../../.local-plugins/quiz-plugin/dist</directory>
   ```
   to:
   ```xml
   <directory>${basedir}/../dist</directory>
   ```
   (Frontend dist is sibling of `backend/`.)

2. **Exec: use project.basedir so it works when built with -f**  
   Replace the exec `<configuration>` with:
   ```xml
   <configuration>
     <executable>${project.basedir}/../../../node/node</executable>
     <arguments>
       <argument>${project.basedir}/../../../node/node_modules/pnpm/bin/pnpm.cjs</argument>
       <argument>run</argument>
       <argument>build</argument>
     </arguments>
     <workingDirectory>${project.basedir}/..</workingDirectory>
     <environmentVariables>
       <PATH>${project.basedir}/../../../node:${env.PATH}</PATH>
     </environmentVariables>
   </configuration>
   ```
   (Repo root = `backend/../../..`, frontend root = `backend/..`.)

## My-org plugin (`.local-plugins/my-org-plugin/backend/pom.xml`)

1. **Copy-resources directory**  
   Change:
   ```xml
   <directory>${basedir}/../../.local-plugins/my-org-plugin/dist</directory>
   ```
   to:
   ```xml
   <directory>${basedir}/../dist</directory>
   ```

2. **Exec**  
   Same as quiz: use `${project.basedir}/../..` for frontend root and `${project.basedir}/../../../node` for repo node/pnpm.

## Checkstyle (my-org only)

From `.local-plugins/my-org-plugin/backend`, repo root is `../../..`, so docs path is `../../../docs`:
```xml
<checkstyle.suppressions.file>${project.basedir}/../../../docs/checkstyle/checkstyle-suppressions.xml</checkstyle.suppressions.file>
```
