# Backend (Optional)

This module packages the plugin frontend into a JAR so Opencast can serve it
under `/management-ui/static/plugins/<plugin-id>/`.

## Configure

Edit `backend/pom.xml`:
- `pluginId` → your plugin id (must match `pluginMetadata.id`)
- `pluginI18nNamespaces` → comma-separated namespaces (optional)

If you use translations, put locale files under:
```
locales/<namespace>/<lng>.json
```

## Build

From the plugin root:
```bash
pnpm build
```

From `backend/`:
```bash
mvn clean package -DskipTests
```

To skip the pnpm steps in Maven:
```bash
mvn clean package -DskipTests -Dexec.skip=true
```
